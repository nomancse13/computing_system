// vendor controller

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as randomToken from "rand-token";
import { ErrorMessage, StatusField } from "src/authentication/common/enum";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { DataSource, Not } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { AccountingGroupEntity, AccountsEntity, OrganizationEntity, TransactionHistoryEntity } from "../entities";
import { AccountService } from "./account.service";
import { ActivityLogService } from "./activity-log.service";
import { LedgersService } from "./ledgers.service";
import { VendorsEntity } from "../entities/vendors.entity";
import { CreateVendorsDto, UpdateVendorsDto } from "../dtos/payables/vendors";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";
let exceptionmessage = "failed";

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(VendorsEntity)
    private vendorsEntityRepository: BaseRepository<VendorsEntity>,
    @InjectRepository(TransactionHistoryEntity)
    private transactionHistoryRepository: BaseRepository<TransactionHistoryEntity>,
    private readonly ledgersService: LedgersService,
    private activityLogService: ActivityLogService,
    private readonly accountService: AccountService,
    private authservice: AuthService,
    private dataSource: DataSource
  ) {}

  //  create Vendors
  async createVendors(createVendorsDto: CreateVendorsDto, userPayload: UserInterface): Promise<any> {
    //Check Role
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }

    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      const findName = await queryRunner.manager.findOne(VendorsEntity, {
        where: {
          givenName: createVendorsDto.givenName,
          organizationId: userPayload.organizationId
        }
      });

      if (findName) {
        exceptionmessage = `Duplicate Venor Name Account found!! please create a new one.`;
        throw new BadRequestException(`duplicate name found. please insert a unique one.`);
      }

      let ledgerObj = new AccountsEntity();

      let logInfo = createVendorsDto?.ipPayload;

      ledgerObj.createdBy = logInfo.id;

      const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Accounts Payable" } });

      const org = await queryRunner.manager.findOne(OrganizationEntity, { where: { id: userPayload.organizationId } });

      ledgerObj.fullyQualifiedName = createVendorsDto.displayName;
      ledgerObj.name = createVendorsDto.displayName;
      ledgerObj.ledgerParent = accountGroup.id;
      ledgerObj.nature = accountGroup.nature;
      ledgerObj.accountType = accountGroup.groupHeadType;
      ledgerObj.accountSubType = accountGroup.groupName;
      ledgerObj.classification = accountGroup.groupName;
      ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Vendor", userPayload);
      ledgerObj.accountOpeningBalance = createVendorsDto.openingBalance;
      ledgerObj.openingBalance = 0;
      ledgerObj.closingBalance = createVendorsDto.openingBalance;
      ledgerObj.createdAt = new Date();
      ledgerObj.updatedAt = new Date();
      ledgerObj.createdBy = userPayload.id;
      ledgerObj.organizationId = userPayload.organizationId;
      ledgerObj.organization = org;
      ledgerObj.updatedBy = 0;
      ledgerObj.deletedBy = 0;

      const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

      let newsup = new VendorsEntity();
      newsup.givenName = createVendorsDto.givenName;
      newsup.displayName = createVendorsDto.displayName;
      newsup.printOnCheckName = createVendorsDto.displayName;
      newsup.familyName = createVendorsDto.familyName;
      newsup.companyName = createVendorsDto.companyName;
      //newsup.acctNum = createVendorsDto.acctNum;
      newsup.accountNo = createVendorsDto.accountNo;
      newsup.routingNo = createVendorsDto.routingNo;
      newsup.email = createVendorsDto.email;
      newsup.fax = createVendorsDto.fax;
      newsup.mobile = createVendorsDto.mobile;
      newsup.vendorCode = ledgerObj.ledgerCode;
      newsup.website = createVendorsDto.website;
      newsup.others = createVendorsDto.others;

      newsup.billAddr = createVendorsDto.billAddr;
      newsup.openingBalance = createVendorsDto.openingBalance;
      newsup.ledger = saveLedger;
      newsup.ledgerId = saveLedger.id;
      newsup.organizationId = userPayload.organizationId;

      newsup.organization = org;
      newsup.createdAt = new Date();
      newsup.updatedAt = new Date();
      newsup.createdBy = userPayload.id;
      newsup.organizationId = userPayload.organizationId;
      newsup.updatedBy = 0;
      newsup.deletedBy = 0;
      newsup.qbRefId = 0;

      const insertData = await queryRunner.manager.save(VendorsEntity, newsup);

      if (insertData) {
        let ledgerData = await queryRunner.manager.findOne(AccountsEntity, { where: { name: "Capital Account", organizationId: userPayload.organizationId } });

        if (ledgerData != null) {
          ledgerData["openingBalance"] = ledgerData.closingBalance;
          ledgerData["closingBalance"] = Number(ledgerData.closingBalance) - Number(createVendorsDto.openingBalance);

          // update ledger data
          await queryRunner.manager.update(AccountsEntity, { id: ledgerData.id }, ledgerData);
        }

        if (newsup.openingBalance > 0) {
          // body creation for creating opening balance transaction
          const body = {
            ledgerId: saveLedger.id,
            captialId: ledgerData.id,
            openingbalance: createVendorsDto.openingBalance,
            openingbalancecap: ledgerData.openingBalance,
            closingbalancecap: ledgerData.closingBalance,
            userId: userPayload.id,
            organizationId: userPayload.organizationId
          };

          // calling opening balance transaction function
          await this.accountService.openingBalanceTransaction(body, queryRunner);
        }
      }

      // Prepare Activity Log
      const log = {
        cLientIPAddress: logInfo.ip,
        browser: logInfo.browser,
        os: logInfo.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Vendors",
          message: `New Vendor created by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: newsup,
        organizationId: userPayload.organizationId
      };
      // Save Activity Log
      if (log) {
        await this.activityLogService.createLog(log, queryRunner);
      }
      const qbinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
        where: {
          id: userPayload.organizationId
        }
      });
      if (qbinforamtion.qbaccounts == 1) {
        if (await this.authservice.isauthenticated(userPayload, queryRunner)) {
          const qboobject = new QuickBooks(
            qbinforamtion.qbClientKey,
            qbinforamtion.qbClientSecret,
            qbinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            qbinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            qbinforamtion.refreshToken
          );

          await qboobject.createVendor(
            {
              PrimaryEmailAddr: {
                Address: newsup.email
              },
              WebAddr: {
                URI: newsup.website
              },
              PrimaryPhone: {
                FreeFormNumber: newsup.mobile
              },
              DisplayName: newsup.displayName,
              Suffix: "Sr.",
              Title: "Ms.",
              Mobile: {
                FreeFormNumber: newsup.mobile
              },
              FamilyName: newsup.familyName,
              TaxIdentifier: newsup.mobile,
              AcctNum: newsup.acctNum,
              CompanyName: newsup.companyName,
              BillAddr: {
                Line1: newsup.billAddr,
                CountrySubDivisionCode: "CA"
              },
              GivenName: newsup.givenName,
              PrintOnCheckName: newsup.printOnCheckName
            },
            async function (err, Customer) {
              if (err) {
                throw new BadRequestException(err);
              } else {
                newsup.qbRefId = Customer.Id;

                const insertData = await queryRunner.manager.update(VendorsEntity, { id: newsup.id }, newsup);

                await queryRunner.commitTransaction();

                return insertData;
              }
            }
          );
        }
      } else {
        await queryRunner.commitTransaction();

        return insertData;
      }
    } catch (err) {
      console.log(err);

      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      //   await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // update Vendors
  async updateVendors(updateVendorsDto: UpdateVendorsDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      const data = await this.vendorsEntityRepository.findOne({
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });

      if (!data) {
        exceptionmessage = `This data not exist in DB!!!`;
        throw new BadRequestException(`This data not exist in DB!!!`);
      }

      const findName = await queryRunner.manager.findOne(VendorsEntity, { where: { givenName: updateVendorsDto.givenName, id: Not(id), organizationId: userPayload.organizationId } });

      if (findName) {
        exceptionmessage = `duplicate name found. please insert a unique one.`;
        throw new BadRequestException(`duplicate name found. please insert a unique one.`);
      }
      const supplierinfo = await queryRunner.manager.findOne(VendorsEntity, { where: { id: id } });
      let previousopening = supplierinfo.openingBalance;

      supplierinfo.givenName = updateVendorsDto.givenName;
      supplierinfo.displayName = updateVendorsDto.displayName;
      supplierinfo.printOnCheckName = updateVendorsDto.displayName;
      supplierinfo.familyName = updateVendorsDto.familyName;
      supplierinfo.companyName = updateVendorsDto.companyName;
      //newsup.acctNum = createVendorsDto.acctNum;
      supplierinfo.accountNo = updateVendorsDto.accountNo;
      supplierinfo.routingNo = updateVendorsDto.routingNo;
      supplierinfo.email = updateVendorsDto.email;
      supplierinfo.fax = updateVendorsDto.fax;
      supplierinfo.mobile = updateVendorsDto.mobile;
      supplierinfo.website = updateVendorsDto.website;
      supplierinfo.others = updateVendorsDto.others;

      supplierinfo.billAddr = updateVendorsDto.billAddr;
      supplierinfo.openingBalance = updateVendorsDto.openingBalance;
      //   supplierinfo.ledger = saveLedger;
      //   supplierinfo.ledgerId = saveLedger.id;
      supplierinfo.organizationId = userPayload.organizationId;

      //   supplierinfo.organization = org;
      supplierinfo.updatedAt = new Date();
      supplierinfo.updatedBy = userPayload.id;

      const logInfo = updateVendorsDto?.ipPayload;

      // Prepare Activity Log
      const log = {
        cLientIPAddress: logInfo.ip,
        browser: logInfo.browser,
        os: logInfo.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Customers",
          message: `Customers updated by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: updateVendorsDto,
        organizationId: userPayload.organizationId
      };

      const supplierData = await queryRunner.manager.update(VendorsEntity, { id: id }, supplierinfo);

      if (previousopening != supplierinfo.openingBalance) {
        let capitalLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { name: "Capital Account", organizationId: userPayload.organizationId } });
        if (capitalLedger) {
          capitalLedger.openingBalance = capitalLedger.closingBalance;
          capitalLedger.closingBalance = Number(capitalLedger.closingBalance) - Number(supplierinfo.openingBalance) + Number(previousopening);

          // update ledger data
          await queryRunner.manager.update(AccountsEntity, { id: capitalLedger.id }, capitalLedger);
        }

        const openingBalanceTransactionHistory = await queryRunner.manager.find(TransactionHistoryEntity, {
          where: [
            { transactionSource: "Opening Balance", ledgerId: supplierinfo.ledgerId },
            { transactionSource: "Opening Balance", accountId: supplierinfo.ledgerId }
          ]
        });
        console.log(openingBalanceTransactionHistory, "opening");

        if (openingBalanceTransactionHistory.length > 0) {
          var findcapitalledgertran = openingBalanceTransactionHistory.find((a) => a.ledgerId == capitalLedger.id);

          // update opening balance transaction
          const body = {
            ledgerId: supplierinfo.ledgerId,
            balance: supplierinfo.openingBalance,
            userId: userPayload.id,
            capitalTranId: findcapitalledgertran.id
          };

          const transactionDetails = await this.accountService.UpdateOpeningBalanceTransactions(body, queryRunner);
          let ledgerData = await queryRunner.manager.findOne(AccountsEntity, { where: { id: supplierinfo.ledgerId } });
          console.log(ledgerData, "ledger");

          if (ledgerData) {
            ledgerData.fullyQualifiedName = supplierinfo.displayName;
            ledgerData.name = supplierinfo.displayName;
            ledgerData.accountOpeningBalance = supplierinfo.openingBalance;
            ledgerData.closingBalance = Number(transactionDetails);
            ledgerData.updatedAt = new Date();
            ledgerData.updatedBy = userPayload.id;

            // update ledger data
            await queryRunner.manager.update(AccountsEntity, { id: ledgerData.id }, ledgerData);
          }
        } else {
          const openingBalanceTran = {
            ledgerId: data.ledgerId,
            captialId: capitalLedger.id,
            openingbalance: supplierinfo.openingBalance,
            openingbalancecap: capitalLedger.openingBalance,
            closingbalancecap: capitalLedger.closingBalance,
            userId: userPayload.id,
            organizationId: userPayload.organizationId
          };

          await this.accountService.openingBalanceTransaction(openingBalanceTran, queryRunner);
        }
      }

      // Save Activity Log
      if (log) {
        await this.activityLogService.createLog(log, queryRunner);
      }
      const qbinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
        where: {
          id: userPayload.organizationId
        }
      });
      if (qbinforamtion.qbaccounts == 1) {
        if (await this.authservice.isauthenticated(userPayload, queryRunner)) {
          const qboobject = new QuickBooks(
            qbinforamtion.qbClientKey,
            qbinforamtion.qbClientSecret,
            qbinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            qbinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            qbinforamtion.refreshToken
          );

          //   await qboobject.updateVendor(
          //     {
          //       PrimaryEmailAddr: {
          //         Address: supplierinfo.email
          //       },
          //       Vendor1099: false,
          //       domain: "QBO",
          //       GivenName: supplierinfo.givenName,
          //       DisplayName: supplierinfo.displayName,
          //       BillAddr: {
          //         Line1: supplierinfo.billAddr,
          //         CountrySubDivisionCode: "CA"
          //       },
          //       SyncToken: "1",
          //       PrintOnCheckName: supplierinfo.printOnCheckName,
          //       FamilyName: supplierinfo.familyName,
          //       PrimaryPhone: {
          //         FreeFormNumber: supplierinfo.mobile
          //       },
          //       AcctNum: supplierinfo.acctNum,
          //       CompanyName: supplierinfo.companyName,
          //       WebAddr: {
          //         URI: supplierinfo.website
          //       },
          //       sparse: false,
          //       Active: true,
          //       Balance: 0,
          //       Id: supplierinfo.qbRefId,
          //       MetaData: {
          //         LastUpdatedTime: new Date()
          //       }
          //     },
          //     async function (err, Customer) {
          //       if (err) {
          //         throw new BadRequestException(err);
          //       } else {
          //         await queryRunner.commitTransaction();

          //         return `vendor data updated successfully!!!`;
          //       }
          //     }
          //   );
          await queryRunner.commitTransaction();

          return `vendor data updated successfully!!!`;
        }
      } else {
        await queryRunner.commitTransaction();

        return `vendor data updated successfully!!!`;
      }
    } catch (err) {
      console.log(err);

      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // find all Vendors data
  async findAllVendorsData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Vendor",
        message: `All Vendor fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: null,
      organizationId: userPayload.organizationId
    };

    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    try {
      const [results, total] = await queryRunner.manager.findAndCount(VendorsEntity, {
        where: { organizationId: userPayload.organizationId },
        order: { id: "DESC" },
        take: limit,
        skip: page > 0 ? page * limit - limit : page
      });

      return new Pagination<any>({
        results,
        total,
        currentPage: page === 0 ? 1 : page,
        limit
      });
    } catch (err) {
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion end Transaction
  }

  // delete vendor
  async deleteVendor(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
    } catch (err) {
      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`failed`);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction

    try {
      const vendorsData = await this.vendorsEntityRepository.findOne({
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });

      if (!vendorsData) {
        throw new NotFoundException("vendor not found");
      }

      let transcount = await this.transactionHistoryRepository.find({
        where: { ledgerId: vendorsData.ledgerId }
      });

      const data = transcount.map((a) => {
        if (a.transactionSource == "Opening Balance") {
          return a;
        }
      });

      // Prepare Activity Log
      const log = {
        cLientIPAddress: ipClientPayload.ip,
        browser: ipClientPayload.browser,
        os: ipClientPayload.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Vendor",
          message: `Vendor deleted by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: vendorsData,
        organizationId: userPayload.organizationId
      };
      // Save Activity Log

      await this.activityLogService.createLog(log, queryRunner);

      if (vendorsData) {
        if (data.length == 0) {
          const deleteOpening = await this.transactionHistoryRepository.findOne({
            where: { ledgerId: vendorsData.ledgerId }
          });

          if (deleteOpening) {
            await this.transactionHistoryRepository.remove(deleteOpening);
          }
          const ledgerInfo = await this.ledgersService.findOneLedger(vendorsData.ledgerId);

          await this.ledgersService.deleteSingleLedger(ledgerInfo);
          await this.vendorsEntityRepository.remove(vendorsData);
          return `Deleted Sucessfully!`;
        } else {
          throw new BadRequestException("Opening Balance found! so can not deleted!");
        }
      } else {
        throw new BadRequestException(ErrorMessage.DELETE_FAILED);
      }
    } catch (e) {
      throw new BadRequestException(`please delete invoice, purchaseReturn, paymentVoucher etc. first of this employee!!`);
    }
  }

  /**
   * Get One vendor data
   */
  async findSingleVendor(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.vendorsEntityRepository.findOne({
      where: {
        id: id,
        organizationId: userPayload.organizationId
      },
      relations: ["ledger"]
    });

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Vendor",
        message: `Single Vendor fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: data,
      organizationId: userPayload.organizationId
    };
    if (!data) {
      throw new NotFoundException(`vendor not exist in db!!`);
    }

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);
    return data;
  }

  /**
   * Get One vendor data
   */
  async findVendorAddressById(id: number, userPayload: UserInterface) {
    const data = await this.vendorsEntityRepository.findOne({
      where: {
        ledgerId: id,
        organizationId: userPayload.organizationId
      }
    });

    if (!data) {
      throw new NotFoundException(`vendor not exist in db!!`);
    }

    // Save Activity Log
    return data.billAddr;
  }
  /**
   * Get One vendor data
   */
  async findOneVendor(id: number) {
    const data = await this.vendorsEntityRepository.findOne({
      where: {
        id: id
      },
      relations: ["ledger"]
    });

    if (!data) {
      throw new NotFoundException(`vendor not exist in db!!`);
    }
    return data;
  }

  async findOneVendorByLedgerid(id: number) {
    const data = await this.vendorsEntityRepository.findOne({
      where: {
        ledgerId: id
      }
    });
    if (!data) {
      throw new NotFoundException(`banking not exist in db!!`);
    }
    return data;
  }
  /**
   * DROPDOWN -> vendor
   */
  async dropdown(userPayload: UserInterface) {
    return await this.vendorsEntityRepository
      .createQueryBuilder("vendor")
      .where(`vendor.status = '${StatusField.ACTIVE}'`)
      .andWhere(`vendor.organizationId = ${userPayload.organizationId}`)
      .select(["vendor.ledgerId as value", "vendor.displayName as label"])
      .getRawMany();
  }
}
