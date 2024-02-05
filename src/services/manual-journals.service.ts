import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import path from "node:path/win32";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { DataSource } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { StatusField } from "../authentication/common/enum";
import { CreateManualJounalsDto, UpdateManualJounalsDto } from "../dtos/account/manual-journal";
import { AccountsEntity, ManualJournalsEntity, OrganizationEntity, TransactionHistoryEntity } from "../entities";
import { AccountService } from "./account.service";
import { ActivityLogService } from "./activity-log.service";
import { LedgersService } from "./ledgers.service";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";
import { ManualJournalDetailsEntity } from "src/entities/manual-journals-details.entity";
let exceptionmessage = "Failed";

@Injectable()
export class ManualJournalsService {
  constructor(
    @InjectRepository(ManualJournalsEntity)
    private manualJournalsRepository: BaseRepository<ManualJournalsEntity>,
    @InjectRepository(TransactionHistoryEntity)
    private transactionHistoryRepository: BaseRepository<TransactionHistoryEntity>,
    private readonly ledgersService: LedgersService,
    private activityLogService: ActivityLogService,
    private accountService: AccountService,
    private dataSource: DataSource,
    private authservice: AuthService
  ) {}

  //  create manual journals
  async createManualJournals(createManualJounalsDto: CreateManualJounalsDto, userPayload: UserInterface): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(createManualJounalsDto.txnDate), userPayload);

      const createentry = new ManualJournalsEntity();

      createentry.journalNo = await this.accountService.generateAllNumbersbasedonDate("ManualJournal", new Date(createManualJounalsDto.txnDate), userPayload);

      createentry.adjustment = createManualJounalsDto.adjustment;
      createentry.privateNote = createManualJounalsDto.privateNote;
      createentry.transactionId = TransactionID;
      createentry.txnDate = new Date(createManualJounalsDto.txnDate);
      createentry.status = StatusField.ACTIVE;
      createentry.totalAmt = createManualJounalsDto.creditAmount;
      let fileNameData;

      if (createManualJounalsDto.file) {
        fileNameData = path.basename(createManualJounalsDto.file.originalname, path.extname(createManualJounalsDto.file.originalname));
      }

      createentry.createdAt = new Date();
      createentry.updatedAt = new Date();
      createentry.createdBy = userPayload.id;
      createentry.organizationId = userPayload.organizationId;
      createentry.updatedBy = 0;
      createentry.deletedBy = 0;
      await queryRunner.manager.save(ManualJournalsEntity, createentry);
      let detailsarray = [];

      if (createentry.id > 0) {
        await Promise.all(
          createManualJounalsDto.journalDetails?.map(async (detailsinfo: any) => {
            if (detailsinfo.accountId != 0 && detailsinfo.accountId != null && detailsinfo.accountId != undefined) {
              let qdDetails = new ManualJournalDetailsEntity();

              qdDetails.transactionId = createentry.transactionId;
              qdDetails.description = detailsinfo.description;
              qdDetails.detailType = detailsinfo.detailType;
              qdDetails.postingType = detailsinfo.postingType;
              var accountinfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: detailsinfo.accountId } });
              qdDetails.accountId = accountinfo.id;
              qdDetails.accountInfo = accountinfo;

              qdDetails.journalId = createentry.id;
              qdDetails.journal = createentry;

              qdDetails.amount = detailsinfo.amount;

              qdDetails.createdAt = new Date();
              qdDetails.updatedAt = new Date();
              qdDetails.createdBy = userPayload.id;
              qdDetails.organizationId = userPayload.organizationId;
              qdDetails.updatedBy = 0;
              qdDetails.deletedBy = 0;

              let details = await queryRunner.manager.save(ManualJournalDetailsEntity, qdDetails);

              var linearry = {
                JournalEntryLineDetail: {
                  PostingType: qdDetails.postingType,
                  AccountRef: {
                    name: qdDetails.accountInfo.name,
                    value: "39"
                  }
                },
                DetailType: "JournalEntryLineDetail",
                Amount: qdDetails.amount,
                Id: details.id,
                Description: qdDetails.description
              };
              detailsarray.push(linearry);

              let assstocktradn: any;
              if (qdDetails.postingType == "Debit") {
                const transactionStock = {
                  ledgerId: qdDetails.accountId,
                  transactionDate: new Date(createentry.txnDate),
                  amount: qdDetails.amount,
                  transactionId: qdDetails.transactionId,
                  transactionSource: "Journal Entry",
                  referenceID: qdDetails.id,
                  userId: userPayload.id,
                  remarks: "",
                  transactionReference: createentry.journalNo,
                  organizationId: userPayload.organizationId
                };

                assstocktradn = await this.accountService.AddTransactionsStockDebit(transactionStock, queryRunner);
              } else {
                const transactionStock = {
                  ledgerId: qdDetails.accountId,
                  transactionDate: new Date(createentry.txnDate),
                  amount: qdDetails.amount,
                  transactionId: qdDetails.transactionId,
                  transactionSource: "Journal Entry",
                  referenceId: qdDetails.id,
                  userId: userPayload.id,
                  remarks: "",
                  transactionReference: createentry.journalNo,
                  organizationId: userPayload.organizationId
                };

                assstocktradn = await this.accountService.AddTransactionsStockCredit(transactionStock, queryRunner);
              }
            }
          })
        );
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
          //   await qboobject.createJournalEntry(
          //     {
          //       Line: detailsarray
          //     },
          //     async function (err, Bill) {
          //       if (err) {
          //         throw new BadRequestException(err);
          //       } else {
          //         createentry.qbRefId = Bill.Id;
          //         const insertData = await queryRunner.manager.update(ManualJournalsEntity, { id: createentry.id }, createentry);
          //         await queryRunner.commitTransaction();
          //         return insertData;
          //       }
          //     }
          //   );
          // }
          await queryRunner.commitTransaction();
          return `Insert Successfully!!`;
        } else {
          await queryRunner.commitTransaction();

          return createentry;
        }

        //#endregion
      } else {
        exceptionmessage = `Transaction filed!!`;

        await queryRunner.rollbackTransaction();
        //return `insert filed!!`;
        throw new BadRequestException(`Transaction filed!!`);
      }
      //   exceptionmessage = `failed.`;

      //   throw new BadRequestException(`duplicate Journal found. please insert a unique one.`);
    } catch (err) {
      // if we have errors, rollback changes we made
      try {
        await queryRunner.rollbackTransaction();
      } catch {}
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // update manual journals
  // update manual journals
  async updateManualJournals(updateManualJounalsDto: UpdateManualJounalsDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    try {
      var inforamtion = await queryRunner.manager.findOne(ManualJournalsEntity, { where: { id: id, organizationId: userPayload.organizationId } });
      if (inforamtion != null) {
        var createentry = await queryRunner.manager.findOne(ManualJournalsEntity, { where: { id: id, organizationId: userPayload.organizationId } });

        if (createentry != null) {
          createentry.txnDate = new Date(updateManualJounalsDto.txnDate);
          createentry.adjustment = updateManualJounalsDto.adjustment;
          createentry.privateNote = updateManualJounalsDto.privateNote;
          createentry.totalAmt = updateManualJounalsDto.creditAmount;
          createentry.updatedAt = new Date();
          createentry.updatedBy = userPayload.id;
          createentry.organizationId = userPayload.organizationId;

          await queryRunner.manager.update(ManualJournalsEntity, { id: id }, createentry);

          // let checkothers = false;

          // let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, {
          //   where: { transactionId: inforamtion.transactionId, referenceID: inforamtion.id, organizationId: userPayload.organizationId }
          // });

          await Promise.all(
            updateManualJounalsDto.journalDetails.map(async (e) => {
              let detailId = e.id;

              console.log(detailId, "detaila");
              if (detailId > 0) {
                let qdDetails = await queryRunner.manager.findOne(ManualJournalDetailsEntity, {
                  where: { id: detailId }
                });

                qdDetails.detailType = e.detailType;
                qdDetails.accountId = e.accountId;
                qdDetails.description = e.description;
                qdDetails.postingType = e.postingType;

                qdDetails.amount = e.amount;

                let details = await queryRunner.manager.update(ManualJournalDetailsEntity, { id: qdDetails.id }, qdDetails);

                let assstocktradn: any;
                if (qdDetails.postingType == "Debit") {
                  const transactionStock = {
                    ledgerId: qdDetails.accountId,
                    transactionDate: new Date(createentry.txnDate),
                    amount: qdDetails.amount,
                    transactionId: qdDetails.transactionId,
                    transactionSource: "Journal Entry",
                    referenceID: qdDetails.id,
                    userId: userPayload.id,
                    remarks: "",
                    transactionReference: createentry.journalNo,
                    organizationId: userPayload.organizationId
                  };

                  assstocktradn = await this.accountService.AddTransactionsStockDebit(transactionStock, queryRunner);
                } else {
                  const transactionStock = {
                    ledgerId: qdDetails.accountId,
                    transactionDate: new Date(createentry.txnDate),
                    amount: qdDetails.amount,
                    transactionId: qdDetails.transactionId,
                    transactionSource: "Journal Entry",
                    referenceId: qdDetails.id,
                    userId: userPayload.id,
                    remarks: "",
                    transactionReference: createentry.journalNo,
                    organizationId: userPayload.organizationId
                  };

                  assstocktradn = await this.accountService.AddTransactionsStockCredit(transactionStock, queryRunner);
                }
              } else {
                if (e.accountId != 0 && e.accountId != null && e.accountId != undefined) {
                  let qdDetails = new ManualJournalDetailsEntity();

                  qdDetails.transactionId = createentry.transactionId;
                  qdDetails.description = e.description;
                  qdDetails.detailType = e.detailType;
                  qdDetails.postingType = e.postingType;
                  var accountinfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: e.accountId } });
                  qdDetails.accountId = accountinfo.id;
                  qdDetails.accountInfo = accountinfo;

                  qdDetails.journalId = createentry.id;
                  qdDetails.journal = createentry;

                  qdDetails.amount = e.amount;

                  qdDetails.createdAt = new Date();
                  qdDetails.updatedAt = new Date();
                  qdDetails.createdBy = userPayload.id;
                  qdDetails.organizationId = userPayload.organizationId;
                  qdDetails.updatedBy = 0;
                  qdDetails.deletedBy = 0;

                  let details = await queryRunner.manager.save(ManualJournalDetailsEntity, qdDetails);
                  let assstocktradn: any;
                  if (qdDetails.postingType == "Debit") {
                    const transactionStock = {
                      ledgerId: qdDetails.accountId,
                      transactionDate: new Date(createentry.txnDate),
                      amount: qdDetails.amount,
                      transactionId: qdDetails.transactionId,
                      transactionSource: "Journal Entry",
                      referenceID: qdDetails.id,
                      userId: userPayload.id,
                      remarks: "",
                      transactionReference: createentry.journalNo,
                      organizationId: userPayload.organizationId
                    };

                    assstocktradn = await this.accountService.AddTransactionsStockDebit(transactionStock, queryRunner);
                  } else {
                    const transactionStock = {
                      ledgerId: qdDetails.accountId,
                      transactionDate: new Date(createentry.txnDate),
                      amount: qdDetails.amount,
                      transactionId: qdDetails.transactionId,
                      transactionSource: "Journal Entry",
                      referenceId: qdDetails.id,
                      userId: userPayload.id,
                      remarks: "",
                      transactionReference: createentry.journalNo,
                      organizationId: userPayload.organizationId
                    };

                    assstocktradn = await this.accountService.AddTransactionsStockCredit(transactionStock, queryRunner);
                  }
                }
              }
            })
          );
          //  if (transactioninforamtion.length != 0 && (inforamtion.debitAmount != createentry.debitAmount || inforamtion.creditAmount != createentry.creditAmount )) {

          //      let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");
          //      let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");

          //      //#region Accounts

          //      const body = {
          //          debitTransactionId: debittransaction.id,
          //          creditTransactionId: credittransaction.id,
          //          transactionDate: createentry.txnDate,
          //          debitAmount: createentry.debitAmount,
          //          creditAmount: createentry.creditAmount,
          //          userId: userPayload.id,
          //          remarks:
          //              "@ " +
          //              createentry.privateNote,
          //          transactionReference: inforamtion.journalNo
          //      };

          //      let transaction = await this.accountService.UpdateTransactions(body, queryRunner);

          //      console.log(transaction, 'transaction');
          //      if (transaction) {
          //          checkothers = true;

          //      }

          //      //#endregion
          //  }
        }

        await queryRunner.commitTransaction();
        return "Update";
        // {
        //    "SyncToken": "1",
        //        "domain": "QBO",
        //            "TxnDate": "2015-06-29",
        //                "sparse": false,
        //                    "Line": [
        //                        {
        //                            "JournalEntryLineDetail": {
        //                                "PostingType": "Debit",
        //                                "AccountRef": {
        //                                    "name": "Job Expenses:Job Materials:Fountain and Garden Lighting",
        //                                    "value": "65"
        //                                }
        //                            },
        //                            "DetailType": "JournalEntryLineDetail",
        //                            "Amount": 25.54,
        //                            "Id": "0",
        //                            "Description": "Updated description"
        //                        },
        //                        {
        //                            "JournalEntryLineDetail": {
        //                                "PostingType": "Credit",
        //                                "AccountRef": {
        //                                    "name": "Notes Payable",
        //                                    "value": "44"
        //                                }
        //                            },
        //                            "DetailType": "JournalEntryLineDetail",
        //                            "Amount": 25.54,
        //                            "Id": "1",
        //                            "Description": "Sprinkler Hds - Sprinkler Hds Inventory Adjustment"
        //                        }
        //                    ],
        //                        "Adjustment": false,
        //                            "Id": "227",
        //                                "TxnTaxDetail": { },
        //    "MetaData": {
        //        "CreateTime": "2015-06-29T12:33:57-07:00",
        //            "LastUpdatedTime": "2015-06-29T12:33:57-07:00"
        //    }
        // }
      } else {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException(exceptionmessage);
      }
    } catch (err) {
      // if we have errors, rollback changes we made
      try {
        await queryRunner.rollbackTransaction();
      } catch {}
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // find all manual journal data
  async findAllManualjournalData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Manual Journal",
        message: `All Manual Journal fetched by ${decrypt(userPayload.hashType)}`,
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
      const [results, total] = await queryRunner.manager.findAndCount(ManualJournalsEntity, {
        where: { organizationId: userPayload.organizationId },
        //relations: ["debit", "credit"],
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

  // delete manual journal
  async deleteManuaJournal(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      let inforamtion = await queryRunner.manager.findOne(ManualJournalsEntity, {
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });
      if (inforamtion != null) {
        let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, {
          where: { transactionId: inforamtion.transactionId, referenceID: inforamtion.id, organizationId: userPayload.organizationId }
        });
        if (transactioninforamtion.length != 0) {
          let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");
          let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");

          let stockBody = {
            debitTransactionId: debittransaction.id,
            creditTransactionId: credittransaction.id,
            userId: userPayload.id
          };
          let deletetransaction = await this.accountService.DeleteTransactions(stockBody, queryRunner);
          if (deletetransaction) {
            await queryRunner.manager.remove(ManualJournalsEntity, inforamtion);

            //{
            //    "SyncToken": "0",
            //        "Id": "228"
            //}
            await queryRunner.commitTransaction();
            return "Deleted";
          }
        }
      }
      exceptionmessage = "Transaction not found";
      throw new NotFoundException("Transaction not found");
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

  /**
   * Get One manual Journal Data
   */
  async findOneManualJournalData(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.manualJournalsRepository.findOne({
      where: {
        id: id,
        organizationId: userPayload.organizationId
      },
      relations: ["journalDetails"]
    });

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Manual Journal",
        message: `Single Manual Journal fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: data,
      organizationId: userPayload.organizationId
    };

    if (!data) {
      throw new NotFoundException(`manual journal not exist in db!!`);
    }

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }

  /**
   * Get One manual Journal Data
   */
  async findOneManualJournalDetailData(id: number, userPayload: UserInterface, ipClientPayload: any) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    try {
      const data = await queryRunner.manager.find(ManualJournalDetailsEntity, {
        where: {
          journalId: id,
          organizationId: userPayload.organizationId
        },
        relations: ["accountInfo"]
      });

      return data;
    } catch (err) {
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion end Transaction

    return "Failed";
  }
}
