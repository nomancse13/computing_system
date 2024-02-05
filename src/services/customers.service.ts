//Controller: Customer
//Model: Customers/Customer.cs
// View: Customer/Index

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as randomToken from "rand-token";
import { StatusField } from "src/authentication/common/enum";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { QuickBookService } from "src/modules/quickbooks/quickbook.service";
import { DataSource, Not } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { CreateCustormersDto, UpdateCustomersDto } from "../dtos/receivables/customers";
import { AccountingGroupEntity, CustomersEntity, AccountsEntity, OrganizationEntity, TransactionHistoryEntity } from "../entities";
import { AccountService } from "./account.service";
import { AccountingGroupService } from "./accounting-group.service";
import { ActivityLogService } from "./activity-log.service";
import { LedgersService } from "./ledgers.service";
import { AuthService } from "../authentication/auth/auth.service";
import * as QuickBooks from "node-quickbooks";
let exceptionmessage = "failed";

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomersEntity)
    private customersRepository: BaseRepository<CustomersEntity>,
    @InjectRepository(AccountsEntity)
    private ledgersRepository: BaseRepository<AccountsEntity>,
    @InjectRepository(TransactionHistoryEntity)
    private transactionHistoryRepository: BaseRepository<TransactionHistoryEntity>,
    private readonly ledgersService: LedgersService,
    private readonly accountingGroupService: AccountingGroupService,
    private activityLogService: ActivityLogService,
    private quickBookService: QuickBookService,
    private accountService: AccountService,
    private authservice: AuthService,
    private dataSource: DataSource
  ) {}

  //  create customers
  async createCustomers(createCustormersDto: CreateCustormersDto, userPayload: UserInterface): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }

    try {
      const findName = await queryRunner.manager.findOne(CustomersEntity, {
        where: {
          fullyQualifiedName: createCustormersDto.displayName,
          organizationId: userPayload.organizationId
        }
      });

      if (findName) {
        exceptionmessage = `Duplicate Customer Name Account found!! please create a new one.`;
        throw new BadRequestException(`duplicate name found. please insert a unique one.`);
      }

      const ledgerObj = new AccountsEntity();

      const logInfo = createCustormersDto?.ipPayload;

      ledgerObj.createdBy = logInfo.id;

      const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Accounts Receivable" } });

      const randomTokenString = randomToken.generate(7);
      ledgerObj.name = createCustormersDto.fullyQualifiedName;
      ledgerObj.fullyQualifiedName = createCustormersDto.fullyQualifiedName;
      ledgerObj.ledgerParent = accountGroup.id;
      ledgerObj.nature = accountGroup.nature;
      ledgerObj.accountType = accountGroup.groupHeadType;
      ledgerObj.accountSubType = accountGroup.groupName;
      ledgerObj.classification = accountGroup.groupHeadType;
      ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Customer", userPayload);
      ledgerObj.accountOpeningBalance = createCustormersDto.openingBalance;
      ledgerObj.openingBalance = 0;
      ledgerObj.closingBalance = createCustormersDto.openingBalance;
      ledgerObj.createdAt = new Date();
      ledgerObj.updatedAt = new Date();
      ledgerObj.createdBy = userPayload.id;
      const org = await queryRunner.manager.findOne(OrganizationEntity, { where: { id: userPayload.organizationId } });

      ledgerObj.organization = org;
      ledgerObj.organizationId = userPayload.organizationId;
      ledgerObj.updatedBy = 0;
      ledgerObj.deletedBy = 0;
      const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

      //createCustormersDto.qbRefId = quickBookid.Id;
      let newsup = new CustomersEntity();
      newsup.fullyQualifiedName = createCustormersDto.fullyQualifiedName;
      newsup.givenName = createCustormersDto.givenName;
      newsup.displayName = createCustormersDto.displayName;
      newsup.companyName = createCustormersDto.companyName;
      newsup.familyName = createCustormersDto.familyName;
      if (createCustormersDto.taxable == true) newsup.taxable = true;
      else newsup.taxable = false;

      newsup.contactPersons = createCustormersDto.contactPersons;
      newsup.printOnCheckName = createCustormersDto.fullyQualifiedName;
      newsup.shippingAddress = createCustormersDto.shippingAddress;

      newsup.customerCode = ledgerObj.ledgerCode;
      newsup.mobile = createCustormersDto.mobile;
      newsup.email = createCustormersDto.email;
      newsup.printOnCheckName = createCustormersDto.printOnCheckName;
      newsup.billAddr = createCustormersDto.billAddr;
      newsup.openingBalance = createCustormersDto.openingBalance;
      newsup.creditLimit = createCustormersDto.creditLimit;
      newsup.ledger = saveLedger;
      newsup.ledgerId = saveLedger.id;
      newsup.createdBy = userPayload.id;
      newsup.organizationId = userPayload.organizationId;
      newsup.createdAt = new Date();
      newsup.updatedAt = new Date();
      newsup.createdBy = userPayload.id;
      newsup.organizationId = userPayload.organizationId;
      newsup.updatedBy = 0;
      newsup.deletedBy = 0;
      newsup.qbRefId = 0;

      newsup.organization = org;

      const insertData = await queryRunner.manager.save(CustomersEntity, newsup);

      if (insertData) {
        let ledgerData = await queryRunner.manager.findOne(AccountsEntity, { where: { name: "Capital Account", organizationId: userPayload.organizationId } });

        if (ledgerData != null) {
          ledgerData["openingBalance"] = ledgerData.closingBalance;
          ledgerData["closingBalance"] = Number(ledgerData.closingBalance) + Number(createCustormersDto.openingBalance);

          // update ledger data
          await queryRunner.manager.update(AccountsEntity, { id: ledgerData.id }, ledgerData);
        }

        if (createCustormersDto.openingBalance > 0) {
          // body creation for creating opening balance transaction
          const body = {
            ledgerId: saveLedger.id,
            captialId: ledgerData.id,
            openingbalance: createCustormersDto.openingBalance,
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
          tag: "Customers",
          message: `New Customers created by ${decrypt(userPayload.hashType)}`,
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

          await qboobject.createCustomer(
            {
              FullyQualifiedName: newsup.fullyQualifiedName,
              PrimaryEmailAddr: {
                Address: newsup.email
              },
              DisplayName: newsup.displayName,
              Suffix: "Jr",
              Title: "Mr",
              MiddleName: "",
              Notes: "Not Available",
              FamilyName: newsup.familyName,
              PrimaryPhone: {
                FreeFormNumber: newsup.mobile
              },
              CompanyName: newsup.companyName,
              BillAddr: {
                Line1: newsup.billAddr
              },
              GivenName: newsup.givenName
            },
            async function (err, Customer) {
              if (err) {
                throw new BadRequestException(err);
              } else {
                newsup.qbRefId = Customer.Id;

                const insertData = await queryRunner.manager.update(CustomersEntity, { id: newsup.id }, newsup);

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
      //await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // update customers
  async updateCustomers(updateCustomersDto: UpdateCustomersDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      const data = await this.customersRepository.findOne({
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });

      if (!data) {
        exceptionmessage = `This data not exist in DB!!!`;
        throw new BadRequestException(`This data not exist in DB!!!`);
      }

      const findName = await queryRunner.manager.findOne(CustomersEntity, { where: { fullyQualifiedName: updateCustomersDto.displayName, id: Not(id), organizationId: userPayload.organizationId } });

      if (findName) {
        exceptionmessage = `duplicate name found. please insert a unique one.`;
        throw new BadRequestException(`duplicate name found. please insert a unique one.`);
      }
      const customerinfo = await queryRunner.manager.findOne(CustomersEntity, { where: { id: id }, relations: ["ledger"] });
      let previousopening = customerinfo.openingBalance;

      customerinfo.fullyQualifiedName = updateCustomersDto.fullyQualifiedName;
      customerinfo.displayName = updateCustomersDto.displayName;
      customerinfo.companyName = updateCustomersDto.companyName;
      customerinfo.givenName = updateCustomersDto.givenName;
      customerinfo.familyName = updateCustomersDto.familyName;
      customerinfo.mobile = updateCustomersDto.mobile;
      customerinfo.billAddr = updateCustomersDto.billAddr;
      customerinfo.email = updateCustomersDto.email;
      customerinfo.shippingAddress = updateCustomersDto.shippingAddress;
      customerinfo.taxable = updateCustomersDto.taxable;
      customerinfo.creditLimit = updateCustomersDto.creditLimit;
      customerinfo.printOnCheckName = updateCustomersDto.printOnCheckName;
      customerinfo.openingBalance = updateCustomersDto.openingBalance;
      customerinfo.updatedAt = new Date();
      customerinfo.updatedBy = userPayload.id;

      const logInfo = updateCustomersDto?.ipPayload;

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
        logData: updateCustomersDto,
        organizationId: userPayload.organizationId
      };

      const customerData = await queryRunner.manager.update(CustomersEntity, { id: id }, customerinfo);

      if (previousopening != updateCustomersDto.openingBalance) {
        let capitalLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { name: "Capital Account", organizationId: userPayload.organizationId } });
        if (capitalLedger) {
          capitalLedger.openingBalance = capitalLedger.closingBalance;
          capitalLedger.closingBalance = Number(capitalLedger.closingBalance) + Number(customerinfo.openingBalance) - Number(previousopening);

          // update ledger data
          await queryRunner.manager.update(AccountsEntity, { id: capitalLedger.id }, capitalLedger);
        }

        const openingBalanceTransactionHistory = await queryRunner.manager.find(TransactionHistoryEntity, {
          where: [
            { transactionSource: "Opening Balance", ledgerId: customerinfo.ledgerId },
            { transactionSource: "Opening Balance", accountId: customerinfo.ledgerId }
          ]
        });

        if (openingBalanceTransactionHistory.length > 0) {
          var findcapitalledgertran = openingBalanceTransactionHistory.find((a) => a.ledgerId == capitalLedger.id);

          // update opening balance transaction
          const body = {
            ledgerId: customerinfo.ledgerId,
            balance: customerinfo.openingBalance,
            userId: userPayload.id,
            capitalTranId: findcapitalledgertran.id
          };

          const transactionDetails = await this.accountService.UpdateOpeningBalanceTransactions(body, queryRunner);
          let ledgerData = await queryRunner.manager.findOne(AccountsEntity, { where: { id: customerinfo.ledgerId } });

          if (ledgerData) {
            ledgerData.name = customerinfo.fullyQualifiedName;
            ledgerData.fullyQualifiedName = customerinfo.fullyQualifiedName;
            ledgerData.accountOpeningBalance = customerinfo.openingBalance;
            ledgerData.closingBalance = Number(transactionDetails);
            ledgerData.updatedAt = new Date();
            ledgerData.updatedBy = userPayload.id;
            // update ledger data
            await queryRunner.manager.update(AccountsEntity, { id: ledgerData.id }, ledgerData);
          }
        } else {
          const openingBalanceTran = {
            ledgerId: customerinfo.ledgerId,
            captialId: capitalLedger.id,
            openingbalance: customerinfo.openingBalance,
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

          // await qboobject.updateCustomer(
          //     {
          //         "domain": "QBO",
          //         "PrimaryEmailAddr": {
          //             "Address": customerinfo.email
          //         },
          //         "DisplayName": customerinfo.displayName,
          //         "PreferredDeliveryMethod": "Print",
          //         "GivenName": customerinfo.givenName,
          //         "FullyQualifiedName": customerinfo.fullyQualifiedName,
          //         "BillWithParent": false,
          //         "Job": false,
          //         "BalanceWithJobs": 0,
          //         "PrimaryPhone": {
          //             "FreeFormNumber": customerinfo.mobile
          //         },
          //         "Active": true,
          //         "MetaData": {
          //             "LastUpdatedTime": "2015-07-23T11:07:55-07:00"
          //         },
          //         "BillAddr": {

          //             "Line1": customerinfo.billAddr,

          //         },
          //         "MiddleName": "",
          //         "Taxable": customerinfo.taxable,
          //         "Balance": customerinfo.ledger.closingBalance,
          //         "SyncToken": "3",
          //         "CompanyName": customerinfo.companyName,
          //         "FamilyName": customerinfo.familyName,
          //         "PrintOnCheckName": customerinfo.printOnCheckName,
          //         "sparse": false,
          //         "Id": customerinfo.qbRefId
          //     },
          //     async function (err, Customer) {
          //         if (err) {
          //             throw new BadRequestException(err);
          //         } else {

          //             await queryRunner.commitTransaction();

          //             return `customers data updated successfully!!!`;

          //         }
          //     }
          // );
          await queryRunner.commitTransaction();
        }
      } else {
        await queryRunner.commitTransaction();

        return `customers data updated successfully!!!`;
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

  // find all customers data
  async findAllCustomersData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    try {
      const [results, total] = await queryRunner.manager.findAndCount(CustomersEntity, {
        where: { organizationId: userPayload.organizationId, status: StatusField.ACTIVE },
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

  // delete customers
  async deleteCustomer(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
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
      const customersData = await this.customersRepository.findOne({
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });

      if (!customersData) {
        throw new NotFoundException("customer not found");
      }

      const transactionHistory = await this.transactionHistoryRepository.createQueryBuilder("history").where(`history.ledgerId = ${customersData.ledgerId}`).getMany();

      if (transactionHistory.length == 1) {
        const deleteopening = await this.transactionHistoryRepository
          .createQueryBuilder("history")
          .where(`history.ledgerId = ${customersData.ledgerId}`)
          .andWhere(`history.accountId = ${customersData.ledgerId}`)
          .getMany();
        if (deleteopening) {
          await this.transactionHistoryRepository.remove(deleteopening);
          await this.customersRepository.remove(customersData);

          // Prepare Activity Log
          const log = {
            cLientIPAddress: ipClientPayload.ip,
            browser: ipClientPayload.browser,
            os: ipClientPayload.os,
            userId: userPayload.id,
            messageDetails: {
              tag: "Customers",
              message: `Customers deleted by ${decrypt(userPayload.hashType)}`,
              date: new Date()
            },
            logData: customersData,
            organizationId: userPayload.organizationId
          };

          // Save Activity Log
          await this.activityLogService.createLog(log, queryRunner);

          const ledgerInfo = await this.ledgersService.findOneLedger(customersData.ledgerId);

          if (ledgerInfo.accountOpeningBalance > 0) {
            let capitalledgerinfo = await this.ledgersRepository.findOne({
              where: { name: "Capital Account" }
            });

            if (capitalledgerinfo) {
              capitalledgerinfo.openingBalance = capitalledgerinfo.closingBalance;
              capitalledgerinfo.closingBalance = capitalledgerinfo.closingBalance - ledgerInfo.accountOpeningBalance;

              await this.ledgersRepository.update({ id: ledgerInfo.id }, ledgerInfo);
            }
          }
        }
      }
    } catch (e) {
      throw new BadRequestException(`please delete sales, receipts, invoice etc. first of this employee!!`);
    }
  }

  /**
   * Get single customersData
   */
  async findSingleCustomer(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.customersRepository.findOne({
      where: {
        id: id,
        organizationId: userPayload.organizationId
      }
    });

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Customers",
        message: `Single Customers fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: data,
      organizationId: userPayload.organizationId
    };
    if (!data) {
      throw new NotFoundException(`customers not exist in db!!`);
    }

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }

  /**
   * Get One customersData
   */
  async findOneCustomer(id: number) {
    const data = await this.customersRepository.findOne({
      where: {
        id: id
      }
    });
    if (!data) {
      throw new NotFoundException(`customers not exist in db!!`);
    }
    return data;
  }
  async findOneCustomerByLedgerid(id: number) {
    const data = await this.customersRepository.findOne({
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
   * DROPDOWN -> customer
   */
  async dropdown(userPayload: UserInterface) {
    return await this.customersRepository
      .createQueryBuilder("customer")
      .where(`customer.status = '${StatusField.ACTIVE}'`)
      .andWhere(`customer.organizationId = ${userPayload.organizationId}`)
      .select(["customer.ledgerId as value", "customer.displayName as label"])
      .getRawMany();
  }

  /**
   * DROPDOWN -> customer for invoice
   */
  async dropdownCustomerInvoice(userPayload: UserInterface) {
    return await this.customersRepository
      .createQueryBuilder("customer")
      .leftJoinAndMapOne("customer.ledger", AccountsEntity, "ledger", "customer.ledgerId = ledger.id")
      .where(`customer.status = '${StatusField.ACTIVE}'`)
      .andWhere(`customer.organizationId = ${userPayload.organizationId}`)
      .select(["customer.ledgerId as value", "ledger.Name as label"])
      .getRawMany();
  }

  /**
   * Get One customer data
   */
  async findCustomerAddressById(id: number, userPayload: UserInterface) {
    const data = await this.customersRepository.findOne({
      where: {
        ledgerId: id,
        organizationId: userPayload.organizationId
      }
    });

    if (!data) {
      throw new NotFoundException(`vendor not exist in db!!`);
    }

    // Save Activity Log
    return { billAddr: data.billAddr, shippingAddress: data.shippingAddress };
  }
}
