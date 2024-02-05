// payroll controller

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as randToken from "rand-token";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { Brackets } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { CreateSalaryDto, UpdateSalaryDto } from "../dtos/human-resource/salary";
import { AccountsEntity, SalaryEntity, TransactionHistoryEntity } from "../entities";
import { AccountService } from "./account.service";
import { ActivityLogService } from "./activity-log.service";
import { LedgersService } from "./ledgers.service";
import { DataSource } from "typeorm";

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(SalaryEntity)
    private salaryRepository: BaseRepository<SalaryEntity>,
    private activityLogService: ActivityLogService,
    private accountService: AccountService,
    private dataSource: DataSource
  ) {}

  //  create salary
  async createSalary(createSalaryDto: CreateSalaryDto, userPayload: UserInterface): Promise<any> {
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      const sameInvoice = await this.salaryRepository
        .createQueryBuilder("history")
        .where(`history.debitLedgerId = ${createSalaryDto.debitLedgerId}`)
        .andWhere(`history.month = '${createSalaryDto.month}'`)
        .andWhere(`history.organizationId = ${userPayload.organizationId}`)
        .getOne();

      if (!sameInvoice) {
        var TransactionID = randToken.generate(10, "abcdefghijklnmopqrstuvwxyz0123456789");
        const createentry = new SalaryEntity();
        createentry.paymentNo = randToken.generate(5, "abcdefghijklnmopqrstuvwxyz0123456789");
        createentry.debitLedgerId = createSalaryDto.debitLedgerId;
        createentry.creditLedgerId = createSalaryDto.creditLedgerId;
        //createentry.FiscalYearID =createSalaryDto.FiscalYearID;
        createentry.transactionId = TransactionID;
        createentry.txnDate = new Date();
        createentry.month = createSalaryDto.month;
        createentry.note = createSalaryDto.note;
        createentry.totalAmount = createSalaryDto.totalAmount;
        createentry.createdAt = new Date();
        createentry.updatedAt = new Date();
        createentry.createdBy = userPayload.id;
        createentry.organizationId = userPayload.organizationId;
        createentry.updatedBy = 0;
        createentry.deletedBy = 0;
        createentry.debitLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createSalaryDto.debitLedgerId, organizationId: userPayload.organizationId } });
        createentry.creditLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createSalaryDto.creditLedgerId, organizationId: userPayload.organizationId } });
        // save salary
        const saveSalary = await queryRunner.manager.save(SalaryEntity, createentry);

        const logInfo = createSalaryDto?.ipPayload;

        // Prepare Activity Log
        const log = {
          cLientIPAddress: logInfo.ip,
          browser: logInfo.browser,
          os: logInfo.os,
          userId: userPayload.id,
          messageDetails: {
            tag: "Salary",
            message: `New Salary created by ${decrypt(userPayload.hashType)}`,
            date: new Date()
          },
          logData: createSalaryDto,
          organizationId: userPayload.organizationId
        };

        if (saveSalary) {
          const body = {
            debitLedgerId: saveSalary.debitLedgerId,
            creditLedgerId: saveSalary.creditLedgerId,
            transactionDate: new Date(),
            debitAmount: saveSalary.totalAmount,
            creditAmount: saveSalary.totalAmount,
            referenceId: saveSalary.id,
            transactionId: saveSalary.transactionId,
            transactionSource: "Salary Payment",
            userId: userPayload.id,
            organizationId: userPayload.organizationId,
            remarks: saveSalary.note,
            transactionReference: saveSalary.paymentNo
          };

          let transaction = await this.accountService.addTransaction(body, queryRunner);
          console.log(transaction, "transaction");

          if (transaction) {
            // Save Activity Log
            if (log) {
              await this.activityLogService.createLog(log, queryRunner);
            }

            await queryRunner.commitTransaction();
            return saveSalary;
          }

          await queryRunner.rollbackTransaction();
          return saveSalary;
        }
      }
    } catch (err) {
      // if we have errors, rollback changes we made
      console.log(err);

      try {
        await queryRunner.rollbackTransaction();
      } catch {}
      throw new BadRequestException(`failed`);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // update salary
  async updateSalary(updateSalaryDto: UpdateSalaryDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (updateSalaryDto.debitLedgerId != 0 && updateSalaryDto.totalAmount > 0) {
        var inforamtion = await queryRunner.manager.findOne(SalaryEntity, { where: { id: id } });
        if (inforamtion != null) {
          var previoussalary = inforamtion.totalAmount;
          var createentry = await queryRunner.manager.findOne(SalaryEntity, { where: { id: id } });

          if (createentry != null) {
            createentry.debitLedgerId = updateSalaryDto.debitLedgerId;
            createentry.month = updateSalaryDto.month;
            createentry.note = updateSalaryDto.note;
            createentry.totalAmount = updateSalaryDto.totalAmount;

            createentry.updatedAt = new Date();
            createentry.updatedBy = userPayload.id;

            await queryRunner.manager.update(SalaryEntity, { id: id }, createentry);

            let checkothers = false;

            let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, { where: { transactionId: inforamtion.transactionId, referenceID: inforamtion.id } });

            if (transactioninforamtion.length != 0) {
              let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");
              let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");

              //#region Accounts
              if (previoussalary != updateSalaryDto.totalAmount || inforamtion.note != updateSalaryDto.note) {
                //#region Accounts
                const body = {
                  debitTransactionId: debittransaction.id,
                  creditTransactionId: credittransaction.id,
                  transactionDate: inforamtion.txnDate,
                  debitAmount: updateSalaryDto.totalAmount,
                  creditAmount: updateSalaryDto.totalAmount,
                  userId: userPayload.id,
                  remarks: "@ " + updateSalaryDto.note,
                  transactionReference: inforamtion.paymentNo
                };

                let transaction = await this.accountService.UpdateTransactions(body, queryRunner);

                if (transaction) {
                  checkothers = true;
                }
                //#endregion
              }
              if (inforamtion.debitLedgerId != createentry.debitLedgerId && inforamtion.creditLedgerId != createentry.creditLedgerId) {
                let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");

                //#region Accounts Debit Ledger Transactions

                let bodydebit = {
                  trnasactionId: debittransaction.id,
                  trnasacitonDate: createentry.txnDate,
                  ledgerId: createentry.debitLedgerId,
                  newAmount: createentry.totalAmount,
                  userId: userPayload.id,
                  organizationId: userPayload.organizationId
                };

                let transaction = await this.accountService.UpdateDebitLedgerTransactions(bodydebit, queryRunner);

                if (transaction) {
                  let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");

                  //#region Accounts Credit Ledger Transactions
                  let bodycredit = {
                    trnasactionId: credittransaction.id,
                    trnasacitonDate: createentry.txnDate,
                    ledgerId: createentry.creditLedgerId,
                    newAmount: createentry.totalAmount,
                    userId: userPayload.id,
                    organizationId: userPayload.organizationId
                  };

                  let transaction1 = await this.accountService.UpdateCreditLedgerTransactions(bodycredit, queryRunner);

                  if (transaction1) {
                    await queryRunner.commitTransaction();
                    return "Update";
                  }
                  checkothers = false;
                  //#endregion
                }

                //#endregion
              } else if (inforamtion.debitLedgerId != createentry.debitLedgerId && inforamtion.creditLedgerId == createentry.creditLedgerId) {
                let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");

                //#region Accounts Debit Ledger Transactions
                let bodydebit = {
                  trnasactionId: debittransaction.id,
                  trnasacitonDate: createentry.txnDate,
                  ledgerId: createentry.debitLedgerId,
                  newAmount: createentry.totalAmount,
                  userId: userPayload.id,
                  organizationId: userPayload.organizationId
                };

                let transaction = await this.accountService.UpdateDebitLedgerTransactions(bodydebit, queryRunner);
                if (transaction) {
                  await queryRunner.commitTransaction();
                  return "Update";
                }
                checkothers = false;
                //#endregion
              } else if (inforamtion.debitLedgerId == createentry.debitLedgerId && inforamtion.creditLedgerId != createentry.creditLedgerId) {
                let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");

                //#region Accounts Credit Ledger Transactions
                let bodycredit = {
                  trnasactionId: credittransaction.id,
                  trnasacitonDate: createentry.txnDate,
                  ledgerId: createentry.creditLedgerId,
                  newAmount: createentry.totalAmount,
                  userId: userPayload.id,
                  organizationId: userPayload.organizationId
                };

                let transaction = await this.accountService.UpdateCreditLedgerTransactions(bodycredit, queryRunner);

                if (transaction) {
                  await queryRunner.commitTransaction();
                  return "Update";
                }
                checkothers = false;
                //#endregion
              }

              if (checkothers) {
                await queryRunner.commitTransaction();
                return "Update";
              }
              //#endregion
            }

            await queryRunner.rollbackTransaction();
            return "Failed";
          }
        }
        await queryRunner.rollbackTransaction();
        return "Failed";
      }
    } catch (err) {
      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`failed`);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // find all salary data
  async findAllSalaryData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Employee Salary",
        message: `All Employee Salary fetched by ${decrypt(userPayload.hashType)}`
      },
      logData: null,
      organizationId: userPayload.organizationId
    };

    const [results, total] = await this.salaryRepository
      .createQueryBuilder("salary")
      .leftJoinAndSelect("salary.debitLedger", "employee")
      .leftJoinAndSelect("salary.creditLedger", "bankAccount")
      .where(`salary.organizationId = ${userPayload.organizationId}`)
      .andWhere(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`salary.note LIKE ('%${filter}%')`);
          }
        })
      )
      .select([`salary.id`, `employee.fullyQualifiedName`, `employee.id`, `bankAccount.id`, `bankAccount.fullyQualifiedName`, `salary.totalAmount`, `salary.month`])
      .orderBy("salary.id", "DESC")
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    await this.activityLogService.createLogWithoutTransaction(log);

    return new Pagination<any>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit
    });
  }

  // delete salary
  async deleteSalary(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
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
      const salaryData = await this.salaryRepository.findOne({
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
          tag: "Employee",
          message: `Employee deleted by ${decrypt(userPayload.hashType)}`
        },
        logData: salaryData,
        organizationId: userPayload.organizationId
      };

      if (!salaryData) {
        throw new NotFoundException("salaryData not found");
      }

      await this.activityLogService.createLogWithoutTransaction(log);

      return await this.salaryRepository.remove(salaryData);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  /**
   * Get One salaryData
   */
  async findOneSalaryData(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.salaryRepository
      .createQueryBuilder("salary")
      .leftJoinAndSelect("salary.debitLedger", "employee")
      .leftJoinAndSelect("salary.creditLedger", "bankAccount")
      .select([
        `employee.id as employeeId`,
        `employee.Name as fullName`,
        `bankAccount.id as bankId`,
        `bankAccount.Name as bankName`,
        `salary.id as id`,
        `salary.totalAmount as totalAmount`,
        `salary.month as month`,
        `salary.note as note`
      ])
      .where(`salary.id = ${id}`)
      .andWhere(`salary.organizationId = ${userPayload.organizationId}`)
      .getRawOne();

    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Employee",
        message: `Single Employee fetched by ${decrypt(userPayload.hashType)}`
      },
      logData: data,
      organizationId: userPayload.organizationId
    };
    if (!data) {
      throw new NotFoundException(`salaryData not exist in db!!`);
    }

    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }
}
