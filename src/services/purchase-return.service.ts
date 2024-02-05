// purchase controller
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { DataSource } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { CreatePurchaseReturnDto, UpdatePurchaseReturnDto } from "../dtos/payables/purchase-return";
import { AccountingGroupEntity, AccountsEntity, OrganizationEntity, ProductsEntity, TransactionHistoryEntity, VendorsEntity } from "../entities";
import { VendorDebitsEntity } from "../entities/vendor-debits.entity";
import { AccountService } from "./account.service";
import { ActivityLogService } from "./activity-log.service";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";
import { VendorCreditDetailsEntity } from "src/entities/vendorcredit-details.entity";
let exceptionmessage = "failed";

@Injectable()
export class PurchaseReturnService {
  constructor(
    @InjectRepository(VendorDebitsEntity)
    private vendorDebitRepository: BaseRepository<VendorDebitsEntity>,
    private activityLogService: ActivityLogService,
    private accountService: AccountService,
    private authservice: AuthService,
    private dataSource: DataSource
  ) {}

  //  create purchase return
  async createPurchaseReturn(createPurchaseReturnDto: CreatePurchaseReturnDto, userPayload: UserInterface): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    const queryRunner1 = this.dataSource.createQueryRunner();

    try {
      if (createPurchaseReturnDto.debitLedgerId != 0 && createPurchaseReturnDto.totalAmt != 0) {
        var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(createPurchaseReturnDto.txnDate), userPayload);

        const createentry = new VendorDebitsEntity();
        let assetgroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Purchase Return" } });

        let salesledger = await queryRunner.manager.findOne(AccountsEntity, { where: { ledgerParent: assetgroup.id, organizationId: userPayload.organizationId } });

        createentry.creditLedgerId = salesledger.id;
        createentry.creditLedger = salesledger;

        createentry.debitLedgerId = createPurchaseReturnDto.debitLedgerId;
        let debitLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createentry.debitLedgerId } });

        createentry.debitLedger = debitLedger;
        createentry.txnDate = new Date(createPurchaseReturnDto.txnDate);
        createentry.debitNoteNo = await this.accountService.generateAllNumbersbasedonDate("PurchaseReturn", new Date(createPurchaseReturnDto.txnDate), userPayload);
        createentry.reference = createPurchaseReturnDto.reference;
        createentry.comment = createPurchaseReturnDto.comment;
        createentry.subTotalAmount = createPurchaseReturnDto.totalAmt;
        createentry.taxAmount = 0;
        createentry.vendorAddr = createPurchaseReturnDto.vendorAddr;
        createentry.linkedTnx = createPurchaseReturnDto.linkedTnx;
        createentry.linkedTnxType = createPurchaseReturnDto.linkedTnxType;
        createentry.totalAmt = createPurchaseReturnDto.totalAmt;
        createentry.transactionId = TransactionID;
        createentry.createdAt = new Date();
        createentry.updatedAt = new Date();
        createentry.createdBy = userPayload.id;
        createentry.organizationId = userPayload.organizationId;
        createentry.updatedBy = 0;
        createentry.deletedBy = 0;

        await queryRunner.manager.save(VendorDebitsEntity, createentry);
        let detailsarray = [];
        let iteamcounter = 1;

        if (createentry.id > 0) {
          await Promise.all(
            createPurchaseReturnDto.purchaserRetDetails.map(async (e) => {
              if (e.productId != 0 && e.productId != null && e.productId != undefined) {
                let qdetails = new VendorCreditDetailsEntity();
                qdetails.purchaseRetId = createentry.id;
                qdetails.purchaseRet = createentry;
                qdetails.unitPrice = e.unitPrice;
                qdetails.productId = e.productId;
                qdetails.qty = e.qty;
                qdetails.detailType = e.detailType;
                qdetails.amount = e.amount;
                qdetails.projectRef = e.projectRef;
                qdetails.taxCodeRef = e.taxCodeRef;
                qdetails.linkedTnx = createentry.linkedTnx;
                qdetails.linkedTnxType = createentry.linkedTnxType;
                qdetails.organizationId = userPayload.organizationId;
                qdetails.accountRef = e.accountRef;
                qdetails.accountRefName = e.accountRefName;
                qdetails.billableStatus = e.billableStatus;
                qdetails.customerRef = e.customerRef;

                var productInfo = await queryRunner.manager.findOne(ProductsEntity, {
                  where: { id: qdetails.productId }
                });

                qdetails.product = productInfo;
                qdetails.createdAt = new Date();
                qdetails.updatedAt = new Date();
                qdetails.createdBy = userPayload.id;
                qdetails.updatedBy = 0;
                qdetails.deletedBy = 0;

                await queryRunner.manager.save(VendorCreditDetailsEntity, qdetails);

                var linearry = {
                  DetailType: "AccountBasedExpenseLineDetail",
                  Amount: qdetails.amount,
                  // ProjectRef: {
                  //   value: "39298034"
                  // },
                  Id: qdetails.id,
                  AccountBasedExpenseLineDetail: {
                    AccountRef: {
                      name: productInfo.itemName,
                      value: productInfo.ledgerId
                    },
                    BillableStatus: "Billable",
                    CustomerRef: {
                      name: "Amy's Bird Sanctuary",
                      value: "1"
                    }
                  }
                };

                detailsarray.push(linearry);
              }
            })
          );
          //#region Accounts Ledger Transactions
          const body = {
            debitLedgerId: createentry.debitLedgerId,
            creditLedgerId: createentry.creditLedgerId,
            transactionDate: new Date(),
            debitAmount: createentry.totalAmt,
            creditAmount: createentry.totalAmt,
            referenceId: createentry.id,
            transactionId: createentry.transactionId,
            transactionSource: "Purchase Return",
            userId: userPayload.id,
            organizationId: userPayload.organizationId,
            remarks: "@" + createentry.comment + "-" + createentry.reference,
            transactionReference: createentry.debitNoteNo
          };

          let customertran = await this.accountService.addTransaction(body, queryRunner);

          if (customertran) {
            //{
            //    "TotalAmt": 90.0,
            //        "TxnDate": "2014-12-23",
            //            "Line": [
            //                {
            //                    "DetailType": "AccountBasedExpenseLineDetail",
            //                    "Amount": 90.0,
            //                    "ProjectRef": {
            //                        "value": "39298045"
            //                    },
            //                    "Id": "1",
            //                    "AccountBasedExpenseLineDetail": {
            //                        "TaxCodeRef": {
            //                            "value": "TAX"
            //                        },
            //                        "AccountRef": {
            //                            "name": "Bank Charges",
            //                            "value": "8"
            //                        },
            //                        "BillableStatus": "Billable",
            //                        "CustomerRef": {
            //                            "name": "Amy's Bird Sanctuary",
            //                            "value": "1"
            //                        }
            //                    }
            //                }
            //            ],
            //                "APAccountRef": {
            //        "name": "Accounts Payable (A/P)",
            //            "value": "33"
            //    },
            //    "VendorRef": {
            //        "name": "Books by Bessie",
            //            "value": "30"
            //    }
            //}
            const qbinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
              where: {
                id: userPayload.organizationId
              }
            });
            if (qbinforamtion.qbaccounts == 1) {
              if (await this.authservice.isauthenticated(userPayload, queryRunner)) {
                await queryRunner.commitTransaction();
                await queryRunner1.startTransaction();

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

                let vendorinfo = await queryRunner1.manager.findOne(VendorsEntity, { where: { ledgerId: createentry.debitLedgerId } });
                await qboobject.createVendorCredit(
                  {
                    TotalAmt: createentry.totalAmt,
                    TxnDate: createentry.txnDate,
                    Line: detailsarray,
                    VendorRef: {
                      value: vendorinfo.qbRefId
                    },
                    APAccountRef: {
                      name: "Accounts Payable (A/P)",
                      value: "33"
                    }
                  },
                  async function (err, Bill) {
                    if (err) {
                      //throw new BadRequestException(err);
                    } else {
                      createentry.qbRefId = Bill.Id;

                      const insertData = await queryRunner1.manager.update(VendorDebitsEntity, { id: createentry.id }, createentry);

                      await queryRunner1.commitTransaction();

                      return insertData;
                    }
                  }
                );
              }
            } else {
              await queryRunner.commitTransaction();

              return "Insert";
            }
          }

          //#endregion
        }

        exceptionmessage = "Failed";
        return "Success";

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
      //await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // update purchase return
  async updatePurchaseReturn(updatePurchaseReturnDto: UpdatePurchaseReturnDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (updatePurchaseReturnDto.debitLedgerId != 0 && updatePurchaseReturnDto.totalAmt != 0) {
        const inforamtion = await queryRunner.manager.findOne(VendorDebitsEntity, {
          where: {
            id: id,
            organizationId: userPayload.organizationId
          }
        });

        let createentry = await queryRunner.manager.findOne(VendorDebitsEntity, {
          where: {
            id: id,
            organizationId: userPayload.organizationId
          }
        });
        if (createentry != null) {
          createentry.creditLedgerId = createentry.creditLedgerId;
          createentry.debitLedgerId = updatePurchaseReturnDto.debitLedgerId;
          createentry.txnDate = new Date(updatePurchaseReturnDto.txnDate);
          createentry.reference = updatePurchaseReturnDto.reference;
          createentry.comment = updatePurchaseReturnDto.comment;
          createentry.totalAmt = updatePurchaseReturnDto.totalAmt;
          createentry.subTotalAmount = updatePurchaseReturnDto.totalAmt;
          createentry.taxAmount = updatePurchaseReturnDto.taxAmount;
          createentry.vendorAddr = updatePurchaseReturnDto.vendorAddr;
          createentry.linkedTnx = updatePurchaseReturnDto.linkedTnx;
          createentry.linkedTnxType = updatePurchaseReturnDto.linkedTnxType;
          createentry.updatedAt = new Date();
          createentry.updatedBy = userPayload.id;
          await queryRunner.manager.update(VendorDebitsEntity, { id: id }, createentry);

          let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, { where: { transactionId: inforamtion.transactionId, referenceID: inforamtion.id } });

          let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");
          let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");
          let checkothers = false;

          if (inforamtion.totalAmt != createentry.totalAmt || inforamtion.comment != createentry.comment || inforamtion.reference != createentry.reference) {
            //#region Accounts

            await Promise.all(
              updatePurchaseReturnDto.purchaserRetDetails.map(async (e) => {
                let detailId = e.id;

                if (detailId > 0) {
                  let qdetails = await queryRunner.manager.findOne(VendorCreditDetailsEntity, {
                    where: { id: detailId },
                    relations: ["purchaseRet"]
                  });
                  qdetails.purchaseRetId = createentry.id;
                  qdetails.purchaseRet = createentry;
                  qdetails.unitPrice = e.unitPrice;
                  qdetails.productId = e.productId;
                  qdetails.qty = e.qty;
                  qdetails.detailType = e.detailType;
                  qdetails.amount = e.amount;
                  qdetails.projectRef = e.projectRef;
                  qdetails.taxCodeRef = e.taxCodeRef;
                  qdetails.linkedTnx = createentry.linkedTnx;
                  qdetails.linkedTnxType = createentry.linkedTnxType;
                  qdetails.organizationId = userPayload.organizationId;
                  qdetails.accountRef = e.accountRef;
                  qdetails.accountRefName = e.accountRefName;
                  qdetails.billableStatus = e.billableStatus;
                  qdetails.customerRef = e.customerRef;

                  var productInfo = await queryRunner.manager.findOne(ProductsEntity, {
                    where: { id: qdetails.productId }
                  });

                  qdetails.product = productInfo;
                  qdetails.createdAt = new Date();
                  qdetails.updatedAt = new Date();
                  qdetails.createdBy = userPayload.id;
                  qdetails.updatedBy = 0;
                  qdetails.deletedBy = 0;

                  await queryRunner.manager.update(VendorCreditDetailsEntity, { id: qdetails.id }, qdetails);
                } else {
                  if (e.productId != 0 && e.productId != null && e.productId != undefined) {
                    let qdetails = new VendorCreditDetailsEntity();
                    qdetails.purchaseRetId = createentry.id;
                    qdetails.purchaseRet = createentry;
                    qdetails.unitPrice = e.unitPrice;
                    qdetails.productId = e.productId;
                    qdetails.qty = e.qty;
                    qdetails.detailType = e.detailType;
                    qdetails.amount = e.amount;
                    qdetails.projectRef = e.projectRef;
                    qdetails.taxCodeRef = e.taxCodeRef;
                    qdetails.linkedTnx = createentry.linkedTnx;
                    qdetails.linkedTnxType = createentry.linkedTnxType;
                    qdetails.organizationId = userPayload.organizationId;
                    qdetails.accountRef = e.accountRef;
                    qdetails.accountRefName = e.accountRefName;
                    qdetails.billableStatus = e.billableStatus;
                    qdetails.customerRef = e.customerRef;

                    var productInfo = await queryRunner.manager.findOne(ProductsEntity, {
                      where: { id: qdetails.productId }
                    });

                    qdetails.product = productInfo;
                    qdetails.createdAt = new Date();
                    qdetails.updatedAt = new Date();
                    qdetails.createdBy = userPayload.id;
                    qdetails.updatedBy = 0;
                    qdetails.deletedBy = 0;

                    await queryRunner.manager.save(VendorCreditDetailsEntity, qdetails);
                  }
                }
              })
            );

            const body = {
              debitTransactionId: debittransaction.id,
              creditTransactionId: credittransaction.id,
              transactionDate: updatePurchaseReturnDto.txnDate,
              debitAmount: updatePurchaseReturnDto.totalAmt,
              creditAmount: updatePurchaseReturnDto.totalAmt,
              userId: userPayload.id,
              remarks: "@ " + updatePurchaseReturnDto.comment + "-" + updatePurchaseReturnDto.reference,
              transactionReference: inforamtion.debitNoteNo
            };

            let transaction = await this.accountService.UpdateTransactions(body, queryRunner);
            //#endregion

            if (transaction) {
              checkothers = true;
            }
          }
          if (inforamtion.debitLedgerId != createentry.debitLedgerId) {
            //#region Accounts Debit Ledger Transactions
            let bodydebit = {
              trnasactionId: debittransaction.id,
              trnasacitonDate: createentry.txnDate,
              ledgerId: createentry.debitLedgerId,
              newAmount: createentry.totalAmt,
              userId: userPayload.id,
              organizationId: userPayload.organizationId
            };

            let transaction = await this.accountService.UpdateDebitLedgerTransactions(bodydebit, queryRunner);
            console.log(transaction, "transaction23");

            if (transaction) {
              //#region Accounts Credit Ledger Transactions
              let bodycredit = {
                trnasactionId: debittransaction.id,
                trnasacitonDate: createentry.txnDate,
                ledgerId: createentry.creditLedgerId,
                newAmount: createentry.totalAmt,
                userId: userPayload.id,
                organizationId: userPayload.organizationId
              };

              let customertran1 = await this.accountService.UpdateCreditLedgerTransactions(bodycredit, queryRunner);
              if (customertran1) {
                await queryRunner.commitTransaction();
                return "Update";
              }
              //#endregion
            }
            checkothers = false;
            //#endregion
          }
          //{
          //    "SyncToken": "1",
          //        "domain": "QBO",
          //            "VendorRef": {
          //        "name": "Books by Bessie",
          //            "value": "30"
          //    },
          //    "TxnDate": "2014-12-23",
          //        "TotalAmt": 140.0,
          //            "APAccountRef": {
          //        "name": "Accounts Payable (A/P)",
          //            "value": "33"
          //    },
          //    "sparse": false,
          //        "Line": [
          //            {
          //                "DetailType": "AccountBasedExpenseLineDetail",
          //                "Amount": 140.0,
          //                "ProjectRef": {
          //                    "value": "39298045"
          //                },
          //                "Id": "1",
          //                "AccountBasedExpenseLineDetail": {
          //                    "TaxCodeRef": {
          //                        "value": "TAX"
          //                    },
          //                    "AccountRef": {
          //                        "name": "Bank Charges",
          //                        "value": "8"
          //                    },
          //                    "BillableStatus": "Billable",
          //                    "CustomerRef": {
          //                        "name": "Amy's Bird Sanctuary",
          //                        "value": "1"
          //                    }
          //                }
          //            }
          //        ],
          //            "Id": "255",
          //                "MetaData": {
          //        "CreateTime": "2015-07-28T14:13:30-07:00",
          //            "LastUpdatedTime": "2015-07-28T14:22:05-07:00"
          //    }
          //}
          if (checkothers) {
            await queryRunner.commitTransaction();
            return "Update";
          }
        }
        await queryRunner.rollbackTransaction();
        exceptionmessage = "Failed";
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

  // find all purchase return Data
  async findAllPurchaseReturnData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Purchase Return",
        message: `All Purchase Ruturn fetched by ${decrypt(userPayload.hashType)}`,
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
      const [results, total] = await queryRunner.manager.findAndCount(VendorDebitsEntity, {
        where: { organizationId: userPayload.organizationId },
        relations: ["debitLedger"],
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

  // delete purchase return
  async deletePurchaseReturn(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    console.log("return id: " + id);

    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    try {
      var inforamtion = await queryRunner.manager.findOne(VendorDebitsEntity, {
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });
      if (inforamtion != null) {
        var transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, { where: { transactionId: inforamtion.transactionId, referenceID: inforamtion.id } });
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
            let deletetransaction = await queryRunner.manager.remove(VendorDebitsEntity, inforamtion);
            //{
            //    "SyncToken": "0",
            //        "Id": "13"
            //}
            await queryRunner.commitTransaction();
            return "Deleted";
          }
        }
      }
      await queryRunner.rollbackTransaction();
      exceptionmessage = "Failed";
      throw new BadRequestException(exceptionmessage);
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

  /**
   * Get One purchase return
   */
  async findPurchaseReturnData(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.vendorDebitRepository.findOne({
      where: {
        id: id,
        organizationId: userPayload.organizationId
      },
      relations: ["purchaseRetDetails"]
    });

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Purchase Return",
        message: `Single Purchaser Return fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: null,
      organizationId: userPayload.organizationId
    };
    if (!data) {
      throw new NotFoundException(`purchase return id not exist in db!!`);
    }

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);
    return data;
  }
}
