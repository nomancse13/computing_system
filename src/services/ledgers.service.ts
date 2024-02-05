// account controller
import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ErrorMessage, StatusField } from "src/authentication/common/enum";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { Brackets, DataSource } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { AuthService } from "../authentication/auth/auth.service";
import { CreateLedgersDto, UpdateLedgersDto } from "../dtos/account/account";
import { AccountsEntity, OrganizationEntity } from "../entities";
import { AccountService } from "./account.service";
import { AccountingGroupService } from "./accounting-group.service";
import { ActivityLogService } from "./activity-log.service";

@Injectable()
export class LedgersService {
  constructor(
    @InjectRepository(AccountsEntity)
    private ledgersRepository: BaseRepository<AccountsEntity>,
    private readonly accountingGroupService: AccountingGroupService,
    private activityLogService: ActivityLogService,
    private accountService: AccountService,
    private dataSource: DataSource,
    @Inject(forwardRef(() => AuthService))
    private authservice: AuthService
  ) {}

  //  create ledger
  async createLedger(createLedgersDto: CreateLedgersDto, userPayload: UserInterface): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      const accountGroup = await this.accountingGroupService.findOneGroup(createLedgersDto.ledgerParent);

      let ledgerinfo = new AccountsEntity();
      ledgerinfo.createdAt = new Date();
      ledgerinfo.updatedAt = new Date();
      ledgerinfo.createdBy = userPayload.id;
      ledgerinfo.organizationId = userPayload.organizationId;
      ledgerinfo.updatedBy = 0;
      ledgerinfo.nature = accountGroup.nature;
      ledgerinfo.accountOpeningBalance = createLedgersDto.openingBalance;
      ledgerinfo.openingBalance = 0;
      ledgerinfo.closingBalance = createLedgersDto.openingBalance;
      ledgerinfo.ledgerCode = await this.accountService.generateBaseNumbers("Ledger", userPayload);
      ledgerinfo.name = createLedgersDto.name;
      ledgerinfo.fullyQualifiedName = createLedgersDto.fullyQualifiedName;
      ledgerinfo.classification = createLedgersDto.classification;
      ledgerinfo.accountType = createLedgersDto.ledgerType;
      ledgerinfo.accountSubType = createLedgersDto.accountSubType;
      ledgerinfo.ledgerParent = createLedgersDto.ledgerParent;

      const logInfo = createLedgersDto?.ipPayload;

      const insertData = await this.ledgersRepository.save(ledgerinfo);

      // Prepare Activity Log
      const log = {
        cLientIPAddress: logInfo.ip,
        browser: logInfo.browser,
        os: logInfo.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Ledger",
          message: `New Ledger created by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: ledgerinfo,
        organizationId: userPayload.organizationId
      };
      // Save Activity Log
      if (log) {
        await this.activityLogService.createLogWithoutTransaction(log);
      }

      const qbinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
        where: {
          id: userPayload.organizationId
        }
      });
      if (qbinforamtion.qbaccounts == 1) {
        // if (await this.authservice.isauthenticated(userPayload, queryRunner)) {
        //   const qboobject = new QuickBooks(
        //     qbinforamtion.qbClientKey,
        //     qbinforamtion.qbClientSecret,
        //     qbinforamtion.accessToken,
        //     false, // no token secret for oAuth 2.0
        //     qbinforamtion.realmeID,
        //     true, // use the sandbox?
        //     true, // enable debugging?
        //     null, // set minorversion, or null for the latest version
        //     "2.0", //oAuth version
        //     qbinforamtion.refreshToken
        //   );

        //   await qboobject.createLedger(
        //     {
        //       Name: ledgerinfo.name,
        //       AccountType: ledgerinfo.accountType
        //     },
        //     async function (err, Bill) {
        //       if (err) {
        //         //throw new BadRequestException(err);
        //       } else {
        //         ledgerinfo.qbRefId = Bill.Id;

        //         const insertData = await queryRunner.manager.update(AccountsEntity, { id: ledgerinfo.id }, ledgerinfo);

        //         await queryRunner.commitTransaction();

        //         return insertData;
        //       }
        //     }
        //   );
        // }
        await queryRunner.commitTransaction();
        return "Insert";
      } else {
        await queryRunner.commitTransaction();

        return "Insert";
      }
    } catch (err) {
      console.log(err);
      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`failed`);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // update ledger
  async updateLedger(updateLedgersDto: UpdateLedgersDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    // const queryRunner = this.dataSource.createQueryRunner();
    // // a new transaction:
    // await queryRunner.startTransaction();

    // try {
    // } catch (err) {
    //   // if we have errors, rollback changes we made
    //   await queryRunner.rollbackTransaction();
    //   throw new BadRequestException(`failed`);
    // } finally {
    //   // release query runner which is manually created:
    //   await queryRunner.release();
    // }
    //#endregion End Transaction

    try {
      const ledger = await this.ledgersRepository.findOne({
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });

      if (!ledger) {
        throw new BadRequestException(`This data not exist in DB!!!`);
      }
      const accountGroup = await this.accountingGroupService.findOneGroup(updateLedgersDto.ledgerParent);

      ledger.updatedBy = 0;
      ledger.updatedAt = new Date();
      ledger.nature = accountGroup.nature;
      ledger.accountOpeningBalance = updateLedgersDto.openingBalance;
      ledger.openingBalance = 0;
      ledger.closingBalance = updateLedgersDto.openingBalance;
      ledger.ledgerCode = await this.accountService.generateBaseNumbers("Ledger", userPayload);
      ledger.name = updateLedgersDto.name;
      ledger.fullyQualifiedName = updateLedgersDto.fullyQualifiedName;
      ledger.classification = updateLedgersDto.classification;
      ledger.accountType = updateLedgersDto.ledgerType;
      ledger.accountSubType = updateLedgersDto.accountSubType;
      ledger.ledgerParent = updateLedgersDto.ledgerParent;

      const logInfo = updateLedgersDto?.ipPayload;

      // Prepare Activity Log
      const log = {
        cLientIPAddress: logInfo.ip,
        browser: logInfo.browser,
        os: logInfo.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Ledger",
          message: `Ledger updated by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: updateLedgersDto,
        organizationId: userPayload.organizationId
      };
      //{
      //    "FullyQualifiedName": "Accounts Payable (A/P)",
      //        "domain": "QBO",
      //            "SubAccount": false,
      //                "Description": "Description added during update.",
      //                    "Classification": "Liability",
      //                        "AccountSubType": "AccountsPayable",
      //                            "CurrentBalanceWithSubAccounts": -1091.23,
      //                                "sparse": false,
      //                                    "MetaData": {
      //        "CreateTime": "2014-09-12T10:12:02-07:00",
      //            "LastUpdatedTime": "2015-06-30T15:09:07-07:00"
      //    },
      //    "AccountType": "Accounts Payable",
      //        "CurrentBalance": -1091.23,
      //            "Active": true,
      //                "SyncToken": "0",
      //                    "Id": "33",
      //                        "Name": "Accounts Payable (A/P)"
      //}
      const data = await this.ledgersRepository.createQueryBuilder().update(AccountsEntity, ledger).where(`id = '${id}'`).execute();

      // Save Activity Log
      if (log) {
        await this.activityLogService.createLogWithoutTransaction(log);
      }
      return `Account updated successfully!!!`;
    } catch (e) {
      console.log("ledger: " + e);
      throw new BadRequestException(ErrorMessage.UPDATE_FAILED);
    }

    // if (data.affected === 0) {
    //   throw new BadRequestException(ErrorMessage.UPDATE_FAILED);
    // }
  }

  // find all ledger
  async findAllLedger(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Ledger",
        message: `All Ledger fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: null,
      organizationId: userPayload.organizationId
    };

    const [results, total] = await this.ledgersRepository
      .createQueryBuilder("ledger")
      .leftJoinAndMapOne("ledger.parent", AccountsEntity, "parent", "ledger.ledgerParent = parent.id")
      .where(`ledger.organizationId = ${userPayload.organizationId}`)
      .andWhere(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`ledger.Name LIKE ('%${filter}%')`);
          }
        })
      )
      .orderBy("ledger.id", "DESC")
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);

    return new Pagination<any>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit
    });
  }

  async getallLedgers() {
    const results = await this.ledgersRepository.find({
      where: { status: StatusField.ACTIVE }
    });
    return results;
  }

  // delete ledger
  async deleteLedger(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
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
      const ledger = await this.ledgersRepository.findOne({
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
          tag: "Ledger",
          message: `Ledger deleted by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: ledger,
        organizationId: userPayload.organizationId
      };

      if (!ledger) {
        throw new NotFoundException("ledger not found");
      }

      // Save Activity Log
      await this.activityLogService.createLogWithoutTransaction(log);

      return await this.ledgersRepository.remove(ledger);
    } catch (e) {
      throw new BadRequestException(`this ledger related as a foreign member. can not deleted`);
    }
  }

  // delete single ledger
  async deleteSingleLedger(ledgerInfo: any) {
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

    // const ledgerData = await this.ledgersRepository.findOne({
    //     where: {
    //         id: id,
    //         organizationId: userPayload.organizationId,
    //     }
    // });

    // if (!ledgerData) {
    //     throw new NotFoundException("ledger not found");
    // }

    const data = await this.ledgersRepository.remove(ledgerInfo);

    return `deleted success!!`;
  }

  /**
   * Get Single ledger
   */
  async findSingleLedger(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.ledgersRepository.findOne({
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
        tag: "Ledger",
        message: `Single Ledger fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: data,
      organizationId: userPayload.organizationId
    };

    if (!data) {
      throw new NotFoundException(`Ledger not exist in db!!`);
    }

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }
  /**
   * Get One ledger
   */
  async findOneLedger(id: number) {
    const data = await this.ledgersRepository.findOne({
      where: {
        id: id
      }
    });

    if (!data) {
      throw new NotFoundException(`Ledger not exist in db!!`);
    }

    return data;
  }

  async findOneLedgerByLedgerid(id: number) {
    const data = await this.ledgersRepository.findOne({
      where: {
        id: id
      }
    });
    if (!data) {
      throw new NotFoundException(`banking not exist in db!!`);
    }
    return data;
  }

  /**
   * Get One ledger by parent id
   */
  async findOneLedgerByParentId(id: number) {
    const data = await this.ledgersRepository.findOne({
      where: {
        ledgerParent: id
      }
    });

    if (!data) {
      throw new NotFoundException(`Ledger not exist in db!!`);
    }

    return data;
  }

  /**
   * DROPDOWN -> ledger debit
   */
  async drDropdown(userPayload: UserInterface) {
    return await this.ledgersRepository
      .createQueryBuilder("ledger")
      .where(`ledger.status = '${StatusField.ACTIVE}'`)
      .andWhere(`ledger.nature = 'Dr'`)
      .andWhere(`ledger.organizationId = ${userPayload.organizationId}`)
      .select(["ledger.id as value", "ledger.Name as label"])
      .getRawMany();
  }

  /**
   * DROPDOWN -> ledger credit
   */
  async crDropdown(userPayload: UserInterface) {
    return await this.ledgersRepository
      .createQueryBuilder("ledger")
      .where(`ledger.status = '${StatusField.ACTIVE}'`)
      .andWhere(`ledger.nature = 'Cr'`)
      .andWhere(`ledger.organizationId = ${userPayload.organizationId}`)
      .select(["ledger.id as value", "ledger.Name as label"])
      .getRawMany();
  }

  /**
   * DROPDOWN -> ledger for payment voucher
   */
  async dropdown(userPayload: UserInterface) {
    return await this.ledgersRepository
      .createQueryBuilder("ledger")
      .where(`ledger.status = '${StatusField.ACTIVE}'`)
      .andWhere(`ledger.ledgerCode LIKE ('S-%')`)
      .andWhere(`ledger.organizationId = ${userPayload.organizationId}`)
      .select(["ledger.id as value", "ledger.Name as label"])
      .getRawMany();
  }

  // get all ledger

  async getAllLedgerByParentId(parentId: number) {
    const allLedgerData = await this.ledgersRepository.find({
      where: { ledgerParent: parentId }
    });

    return allLedgerData ? allLedgerData : null;
  }
  /**
   * DROPDOWN -> ledger
   */
  async ledgerDropdown(userPayload: UserInterface) {
    return await this.ledgersRepository
      .createQueryBuilder("ledger")
      .where(`ledger.status = '${StatusField.ACTIVE}'`)
      .andWhere(`ledger.organizationId = ${userPayload.organizationId}`)
      .select(["ledger.id as value", "ledger.Name as label"])
      .getRawMany();
  }

  // get all ledger

  async getLedgerByParentId(parentId: number) {
    const allLedgerData = await this.ledgersRepository.findOne({
      where: { ledgerParent: parentId }
    });

    if (!allLedgerData) {
      throw new NotFoundException(`this ledgerData not exist in db!!`);
    }
    return allLedgerData;
  }

  // existing group check
  async findLedgerByName(name: string) {
    const ledgerData = await this.ledgersRepository.createQueryBuilder("ledger").where(`ledger.Name LIKE ('%${name}%')`).getOne();

    if (!ledgerData) {
      throw new NotFoundException(`this ledgerData not exist in db!!`);
    }
    return ledgerData;
  }

  // save ledger

  // async saveLedger(
  //   createLedgersDto: any,
  //   userPayload: UserInterface,
  // ): Promise<any> {
  //   const currency = await this.currencyRepository.findOne({
  //     where: {
  //       id: createLedgersDto.currencyId,
  //     },
  //     relations: ['ledgers'],
  //   });

  //   if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
  //     throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
  //   }

  //   createLedgersDto['createdBy'] = userPayload.id;

  //   delete createLedgersDto.currencyId;
  //   const insertData = await this.ledgersRepository.save(createLedgersDto);

  //   insertData.currency = currency;

  //   const savedLedger = await this.ledgersRepository.save(insertData);

  //   return savedLedger;
  // }

  // update single ledger

  async updateSingleLedger(id: number, body: any) {
    try {
      const bankAcc = await this.ledgersRepository.findOne({
        where: { id: id }
      });

      const data = await this.ledgersRepository.save(body);

      console.log("data: " + data);
      return `updated success`;
    } catch (e) {
      console.log("eeeeeeeeeee: " + e);
    }
  }
}
