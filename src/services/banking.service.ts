// banking controller

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ErrorMessage, StatusField } from "src/authentication/common/enum";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { DataSource, Not } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { CreateBankingDto, UpdateBankingDto } from "../dtos/banking";
import { AccountingGroupEntity, BankAccountEntity, AccountsEntity, TransactionHistoryEntity } from "../entities";
import { AccountService } from "./account.service";
import { ActivityLogService } from "./activity-log.service";
import { LedgersService } from "./ledgers.service";

@Injectable()
export class BankingService {
  constructor(
    @InjectRepository(BankAccountEntity)
    private bankingRepository: BaseRepository<BankAccountEntity>,
    @InjectRepository(TransactionHistoryEntity)
    private transactionHistoryRepository: BaseRepository<TransactionHistoryEntity>,
    private readonly ledgersService: LedgersService,
    private activityLogService: ActivityLogService,
    private readonly accountService: AccountService,
    private dataSource: DataSource
  ) {}

  //  create Bank account
  async createBankAcc(createBankingDto: CreateBankingDto, userPayload: UserInterface): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    let exceptionmessage = "fialed";
    try {
      // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
      //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
      // }

      // existence check
      const bankAcc = await queryRunner.manager.findOne(BankAccountEntity, {
        where: {
          bankName: createBankingDto.bankName,
          accountNumber: createBankingDto.accountNumber,
          organizationId: userPayload.organizationId
        }
      });
      if (bankAcc) {
        exceptionmessage = `Duplicate Bank Account found!! please create a new one.`;
        throw new BadRequestException(`Duplicate Bank Account found!! please create a new one.`);
      }

      // ledger data creation
      const ledgerObj = new AccountsEntity();

      const logInfo = createBankingDto?.ipPayload;

      ledgerObj.name = createBankingDto.bankAccountName;
      ledgerObj.fullyQualifiedName = createBankingDto.bankAccountName;

      if (createBankingDto.accountType == 3) {
        const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Mobile Banking" } });

        ledgerObj.accountType = accountGroup.groupHeadType;
        ledgerObj.accountSubType = accountGroup.groupName;
        ledgerObj.classification = accountGroup.groupName;
        ledgerObj.ledgerParent = accountGroup.id;
        // ledgerObj.accountType = accountGroup.groupHeadType;
        ledgerObj.nature = accountGroup.nature;
      } else if (createBankingDto.accountType == 2) {
        const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Credit Cards" } });
        ledgerObj.accountType = accountGroup.groupHeadType;
        ledgerObj.accountSubType = accountGroup.groupName;
        ledgerObj.classification = accountGroup.groupName;
        ledgerObj.ledgerParent = accountGroup.id;
        // ledgerObj.ledgerType = accountGroup.groupHeadType;
        ledgerObj.nature = accountGroup.nature;
      } else if (createBankingDto.accountType == 4) {
        const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Cash In Hand" } });

        ledgerObj.accountType = accountGroup.groupHeadType;
        ledgerObj.accountSubType = accountGroup.groupName;
        ledgerObj.classification = accountGroup.groupName;
        ledgerObj.ledgerParent = accountGroup.id;
        // ledgerObj.ledgerType = accountGroup.groupHeadType;
        ledgerObj.nature = accountGroup.nature;
      } else if (createBankingDto.accountType == 5) {
        const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Agent Banking" } });

        ledgerObj.accountType = accountGroup.groupHeadType;
        ledgerObj.accountSubType = accountGroup.groupName;
        ledgerObj.classification = accountGroup.groupName;
        ledgerObj.ledgerParent = accountGroup.id;
        // ledgerObj.ledgerType = accountGroup.groupHeadType;
        ledgerObj.nature = accountGroup.nature;
      } else {
        const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Bank Accounts" } });

        ledgerObj.accountType = accountGroup.groupHeadType;
        ledgerObj.accountSubType = accountGroup.groupName;
        ledgerObj.classification = accountGroup.groupName;
        ledgerObj.ledgerParent = accountGroup.id;
        // ledgerObj.ledgerType = accountGroup.groupHeadType;
        ledgerObj.nature = accountGroup.nature;
      }

      ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Bank", userPayload);
      ledgerObj.accountOpeningBalance = createBankingDto.openingBalance;
      ledgerObj.openingBalance = 0;
      ledgerObj.closingBalance = createBankingDto.openingBalance;

      ledgerObj.createdAt = new Date();
      ledgerObj.updatedAt = new Date();
      ledgerObj.createdBy = userPayload.id;
      ledgerObj.organizationId = userPayload.organizationId;
      ledgerObj.updatedBy = 0;
      ledgerObj.deletedBy = 0;

      // save ledger
      const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

      //const currencyInfo = await this.ledgersService.findOneCurrency(1);

      let newbank = new BankAccountEntity();
      newbank.createdAt = new Date();
      newbank.updatedAt = new Date();
      newbank.createdBy = userPayload.id;
      newbank.organizationId = userPayload.organizationId;
      newbank.updatedBy = 0;
      newbank.deletedBy = 0;
      newbank.bankAccountName = createBankingDto.bankAccountName;
      newbank.accountType = createBankingDto.accountType;
      newbank.accountCode = ledgerObj.ledgerCode;
      newbank.openingBalance = createBankingDto.openingBalance;
      newbank.accountNumber = createBankingDto.accountNumber;
      newbank.bankName = createBankingDto.bankName;
      newbank.description = createBankingDto.description;
      newbank.ledgerId = saveLedger.id;
      newbank.ledger = saveLedger;
      const insertData = await queryRunner.manager.save(BankAccountEntity, newbank);

      // log data creation
      const log = {
        cLientIPAddress: logInfo.ip,
        browser: logInfo.browser,
        os: logInfo.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Bank Account",
          message: `New Bank Account created by ${decrypt(userPayload.hashType)}`
        },
        logData: newbank,
        organizationId: userPayload.organizationId
      };

      if (log) {
        await this.activityLogService.createLog(log, queryRunner);
      }

      if (insertData) {
        let ledgerData = await queryRunner.manager.findOne(AccountsEntity, { where: { name: "Capital Account", organizationId: userPayload.organizationId } });

        if (ledgerData) {
          ledgerData.openingBalance = ledgerData.closingBalance;
          ledgerData.closingBalance = Number(ledgerData.closingBalance) + Number(createBankingDto.openingBalance);

          // update ledger data
          await queryRunner.manager.update(AccountsEntity, { id: ledgerData.id }, ledgerData);
        }

        // body creation for creating opening balance transaction
        const body = {
          ledgerId: saveLedger.id,
          captialId: ledgerData.id,
          openingbalance: createBankingDto.openingBalance,
          openingbalancecap: ledgerData.openingBalance,
          closingbalancecap: ledgerData.closingBalance,
          userId: userPayload.id,
          organizationId: userPayload.organizationId
        };

        // calling opening balance transaction function
        await this.accountService.openingBalanceTransaction(body, queryRunner);
      }
      await queryRunner.commitTransaction();

      console.log("newbank: ", newbank);

      return newbank;
    } catch (err) {
      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // update bank account
  async updateBankAccount(updateBankingDto: UpdateBankingDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    let exceptionmessage = "fialed";
    try {
      const findName = await queryRunner.manager.findOne(BankAccountEntity, {
        where: { bankAccountName: updateBankingDto.bankAccountName.trim(), id: Not(id), organizationId: userPayload.organizationId }
      });

      if (findName) {
        exceptionmessage = `duplicate bank found. please insert a unique one.`;
        throw new BadRequestException(`duplicate bank found. please insert a unique one.`);
      }
      const bankData = await queryRunner.manager.findOne(BankAccountEntity, {
        where: { id: id, organizationId: userPayload.organizationId }
      });
      let previousopening = bankData.openingBalance;
      if (!bankData) {
        exceptionmessage = `This data not exist in DB!!!`;
        throw new BadRequestException(`This data not exist in DB!!!`);
      }

      bankData.accountNumber = updateBankingDto.accountNumber;
      bankData.accountType = updateBankingDto.accountType;
      bankData.description = updateBankingDto.description;
      bankData.bankAccountName = updateBankingDto.bankAccountName;
      bankData.openingBalance = updateBankingDto.openingBalance;
      bankData.bankName = updateBankingDto.bankName;
      bankData.updatedBy = userPayload.id;
      bankData.updatedAt = new Date();
      bankData.updatedBy = userPayload.id;

      const logInfo = updateBankingDto?.ipPayload;

      const bankingData = await queryRunner.manager.update(
        BankAccountEntity,
        {
          id: id
        },
        bankData
      );
      // ledger value update
      if (bankData.bankAccountName != updateBankingDto.bankAccountName) {
        const ledgerInfo = await this.ledgersService.findOneLedger(bankData.ledgerId);

        if (ledgerInfo) {
          ledgerInfo.fullyQualifiedName = updateBankingDto.bankAccountName;
          ledgerInfo.name = updateBankingDto.bankAccountName;
          ledgerInfo.updatedAt = new Date();
          ledgerInfo.updatedBy = userPayload.id;
          await queryRunner.manager.update(
            AccountsEntity,
            {
              id: ledgerInfo.id
            },
            ledgerInfo
          );
        }
      }

      if (previousopening != updateBankingDto.openingBalance) {
        let capitalLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { name: "Capital Account", organizationId: userPayload.organizationId } });
        if (capitalLedger) {
          capitalLedger.openingBalance = Number(capitalLedger.closingBalance);
          capitalLedger.closingBalance = Number(capitalLedger.closingBalance) - Number(previousopening) + Number(bankData.openingBalance);

          // update ledger data
          await queryRunner.manager.update(
            AccountsEntity,
            {
              id: capitalLedger.id
            },
            capitalLedger
          );
        }
        // const result = await this.transactionHistoryRepository.find({
        //   where: { transactionSource: "Opening Balance" },
        //   [
        //     { ledgerId: bankData.ledger.id },
        //     { accountId: bankData.ledger.id }
        //   ],
        // })

        const openingBalanceTransactionHistory = await queryRunner.manager.find(TransactionHistoryEntity, {
          where: [
            { transactionSource: "Opening Balance", ledgerId: bankData.ledgerId },
            { transactionSource: "Opening Balance", accountId: bankData.ledgerId }
          ]
        });

        if (openingBalanceTransactionHistory.length > 0) {
          const capitalTran = openingBalanceTransactionHistory.find((a) => a.ledgerId == capitalLedger.id);

          // update opening balance transaction
          const body = {
            ledgerId: bankData.ledgerId,
            balance: bankData.openingBalance,
            userId: userPayload.id,
            capitalTranId: capitalTran.id
          };
          console.log("body: ", body);

          //console.log('openingBalanceTransactionHistory: ', openingBalanceTransactionHistory);

          const transactionDetails = await this.accountService.UpdateOpeningBalanceTransactions(body, queryRunner);

          let ledgerData = await this.ledgersService.findOneLedger(bankData.ledgerId);
          if (ledgerData) {
            ledgerData.accountOpeningBalance = updateBankingDto.openingBalance;
            ledgerData.fullyQualifiedName = bankData.bankAccountName;
            ledgerData.name = bankData.bankAccountName;
            ledgerData.closingBalance = Number(transactionDetails);
            ledgerData.updatedAt = new Date();
            ledgerData.updatedBy = userPayload.id;

            // update ledger data
            await queryRunner.manager.update(AccountsEntity, { id: ledgerData.id }, ledgerData);
          }
        } else {
          const openingBalanceTran = {
            ledgerId: bankData.ledgerId,
            captialId: capitalLedger.id,
            openingbalance: updateBankingDto.openingBalance,
            openingbalancecap: capitalLedger.openingBalance,
            closingbalancecap: capitalLedger.closingBalance,
            userId: userPayload.id,
            organizationId: userPayload.organizationId
          };

          await this.accountService.openingBalanceTransaction(openingBalanceTran, queryRunner);
        }
      }

      const log = {
        cLientIPAddress: logInfo.ip,
        browser: logInfo.browser,
        os: logInfo.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Bank Account",
          message: `Bank Account updated by ${decrypt(userPayload.hashType)}`
        },
        logData: updateBankingDto,
        organizationId: userPayload.organizationId
      };

      if (log) {
        await this.activityLogService.createLog(log, queryRunner);
      }
      await queryRunner.commitTransaction();
      return `bankingData updated successfully!!!`;
    } catch (err) {
      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // find all banking data
  async findAllBankingData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Bank Account",
        message: `All Bank Account fetched by ${decrypt(userPayload.hashType)}`
      },
      logData: null,
      organizationId: userPayload.organizationId
    };
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    try {
      const [results, total] = await queryRunner.manager.findAndCount(BankAccountEntity, {
        where: { organizationId: userPayload.organizationId },
        relations: ["ledger"],
        take: limit,
        skip: page > 0 ? page * limit - limit : page
      });

      await this.activityLogService.createLogWithoutTransaction(log);

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
  }

  // delete banking
  async deleteBanking(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
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
      const bankingData = await this.bankingRepository.findOne({
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });

      if (!bankingData) {
        throw new NotFoundException("Bank Account not found");
      }

      let transcount = await this.transactionHistoryRepository.find({
        where: { ledgerId: bankingData.ledgerId }
      });

      const data = transcount.map((a) => {
        if (a.transactionSource == "Opening Balance") {
          return a;
        }
      });

      // log data prepare
      const log = {
        cLientIPAddress: ipClientPayload.ip,
        browser: ipClientPayload.browser,
        os: ipClientPayload.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Banking",
          message: `Bank Account deleted by ${decrypt(userPayload.hashType)}`
        },
        logData: bankingData,
        organizationId: userPayload.organizationId
      };

      if (bankingData) {
        if (data.length == 0) {
          const deleteOpening = await this.transactionHistoryRepository.findOne({ where: { ledgerId: bankingData.ledgerId } });

          if (deleteOpening) {
            await this.transactionHistoryRepository.remove(deleteOpening);
          }
          const ledgerInfo = await this.ledgersService.findOneLedger(bankingData.ledgerId);

          await this.ledgersService.deleteSingleLedger(ledgerInfo);
          await this.bankingRepository.remove(bankingData);
        }
      } else {
        throw new BadRequestException(ErrorMessage.DELETE_FAILED);
      }

      // save log data
      await this.activityLogService.createLog(log, queryRunner);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  /**
   * Get Single banking
   */
  async findSingleBanking(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.bankingRepository.findOne({
      where: {
        id: id,
        organizationId: userPayload.organizationId
      }
    });

    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Bank Account",
        message: `Single Bank Account fetched by ${decrypt(userPayload.hashType)}`
      },
      logData: data,
      organizationId: userPayload.organizationId
    };

    if (!data) {
      throw new NotFoundException(`organizations not exist in db!!`);
    }

    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }
  /**
   * Get One banking
   */
  async findOneBanking(id: number) {
    const data = await this.bankingRepository.findOne({
      where: {
        id: id
      }
    });
    if (!data) {
      throw new NotFoundException(`banking not exist in db!!`);
    }
    return data;
  }
  async findOneBankingByLedgerid(id: number) {
    const data = await this.bankingRepository.findOne({
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
   * DROPDOWN -> banking
   */
  async dropdown(userPayload: UserInterface) {
    const allbanks = await this.bankingRepository.find({
      where: { status: StatusField.ACTIVE, organizationId: userPayload.organizationId },
      select: {
        ledgerId: true,
        bankAccountName: true
      }
    });
    let bankdata = [];

    allbanks.map((ledger) => {
      bankdata.push({ label: ledger.bankAccountName, value: ledger.ledgerId });
    });

    return bankdata;
  }
  /**
   * DROPDOWN -> banking
   */
  async dropdownForPaymentVoucher(userPayload: UserInterface) {
    return await this.bankingRepository
      .createQueryBuilder("banking")
      .where(`banking.status = '${StatusField.ACTIVE}'`)
      .andWhere(`banking.organizationId = ${userPayload.organizationId}`)
      .select("banking.ledgerId as value", "banking.bankAccountName as label")
      .getRawMany();
  }

  /**
   * Get One banking
   */
  async findOneBankByLedgerId(id: number) {
    const data = await this.bankingRepository.findOne({
      where: {
        ledgerId: id
      }
    });
    if (!data) {
      throw new NotFoundException(`banking not exist in db!!`);
    }
    return data;
  }
}
