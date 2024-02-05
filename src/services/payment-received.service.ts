//Controller: InvoiceController
//Function: PaymentReceived
//Model: Invoice/Payment.cs
// View: Invoice/PaymentReceived

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as randToken from "rand-token";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { InvoiceEntity, AccountsEntity, PaymentReceivedEntity, TransactionHistoryEntity, OrganizationEntity, CustomersEntity } from "src/entities";
import { decrypt } from "src/helper/crypto.helper";
import { Brackets, DataSource } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { ActivityLogService } from "./activity-log.service";

import { CreatePaymentReceivedDto, UpdatePaymentReceivedDto } from "src/dtos/receivables/payment-received";
import { PaymentDetailsEntity } from "src/entities/payment-details.entity";
import { AccountService } from "./account.service";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";
let exceptionmessage = "failed";

@Injectable()
export class PaymentReceivedService {
  constructor(
    @InjectRepository(PaymentReceivedEntity)
    private receiptRepository: BaseRepository<PaymentReceivedEntity>,
    private activityLogService: ActivityLogService,
    private accountService: AccountService,
    private dataSource: DataSource,
    private authservice: AuthService
  ) {}

  //  create Receipt
  async createReceipt(createReceiptDto: CreatePaymentReceivedDto, userPayload: UserInterface): Promise<any> {
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (createReceiptDto.debitLedgerId != 0 && createReceiptDto.creditLedgerId != 0 && createReceiptDto.totalAmt != 0) {
        var TransactionID = randToken.generate(10, "abcdefghijklnmopqrstuvwxyz0123456789");

        const createentry = new PaymentReceivedEntity();
        createentry.debitLedgerId = createReceiptDto.debitLedgerId;
        createentry.creditLedgerId = createReceiptDto.creditLedgerId;
        createentry.txnDate = new Date(createReceiptDto.txnDate);
        createentry.paymentNumber = await this.accountService.generateAllNumbersbasedonDate("PaymentReceived", new Date(createReceiptDto.txnDate), userPayload);
        createentry.paymentMethodRef = createReceiptDto.paymentMethodRef;
        createentry.paymentRefNum = createReceiptDto.paymentRefNum;
        createentry.unappliedAmt = createReceiptDto.unappliedAmt;
        createentry.depositToAccountRef = createReceiptDto.depositToAccountRef;
        createentry.txnId = createReceiptDto.txnId;
        createentry.txnType = createReceiptDto.txnType;

        if (createReceiptDto.comment != null) {
          createentry.comment = createReceiptDto.comment;
        } else {
        }

        createentry.totalAmt = createReceiptDto.totalAmt;

        createentry.transactionId = TransactionID;

        // createentry.createdAt = System.DateTime.Now.AddHours(11);
        createentry.updatedAt = new Date();
        createentry.createdBy = userPayload.id;
        createentry.organizationId = userPayload.organizationId;
        createentry.updatedBy = 0;
        createentry.deletedBy = 0;
        createentry.debitLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createReceiptDto.debitLedgerId } });
        createentry.creditLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createReceiptDto.creditLedgerId } });
        await queryRunner.manager.save(PaymentReceivedEntity, createentry);

        if (createentry.id > 0) {
          var dueinvoices = await queryRunner.manager.find(InvoiceEntity, { where: { debitLedgerId: createentry.creditLedgerId, paymentStatus: "Open" || "Partially Paid" } });

          var totalpayment = createentry.totalAmt;

          if (dueinvoices.length > 0) {
            await Promise.all(
              dueinvoices.map(async (due) => {
                var newtotalpayment = totalpayment - due.totalDueAmount;
                if (newtotalpayment >= 0) {
                  let single = new PaymentDetailsEntity();
                  single.invoiceId = due.id;
                  single.paymentsId = createentry.id;
                  single.payment = createentry;
                  single.amountDue = due.totalDueAmount;
                  single.amountPaid = due.totalDueAmount;
                  single.createdAt = new Date();
                  single.updatedAt = new Date();
                  single.createdBy = userPayload.id;
                  single.organizationId = userPayload.organizationId;
                  single.updatedBy = 0;
                  single.deletedBy = 0;

                  await queryRunner.manager.save(PaymentDetailsEntity, single);

                  due.paymentStatus = "Paid";
                  due.totalDueAmount = 0;
                  await queryRunner.manager.update(InvoiceEntity, { id: due.id }, due);

                  if (newtotalpayment == 0) {
                    return;
                  }
                } else {
                  let single = new PaymentDetailsEntity();
                  single.invoiceId = due.id;
                  single.invoice = due;
                  single.paymentsId = createentry.id;

                  single.amountDue = due.totalDueAmount;

                  due.totalDueAmount = due.totalDueAmount - totalpayment;

                  single.amountPaid = totalpayment;
                  single.createdAt = new Date();
                  single.updatedAt = new Date();
                  single.createdBy = userPayload.id;
                  single.organizationId = userPayload.organizationId;
                  single.updatedBy = 0;
                  single.deletedBy = 0;
                  await queryRunner.manager.save(PaymentDetailsEntity, single);

                  due.paymentStatus = "Partially Paid";

                  await queryRunner.manager.update(InvoiceEntity, { id: due.id }, due);

                  return;
                }
                totalpayment = newtotalpayment;
              })
            );
          }
          // if (createReceiptDto.file != null && createReceiptDto.file.ContentLength > 0)
          // {

          //     let i = 1;
          //     let location = "/Resources/PaymentReceipts/";
          //     let exists = Directory.Exists(Server.MapPath("~/Resources/PaymentReceipts/"));

          //     if (!exists)
          //         Directory.CreateDirectory(Server.MapPath("~/Resources/PaymentReceipts/"));

          //     let ext = Path.GetExtension(AttachedDocuments.FileName);
          //     let attachdetails = new PaymentAttachmentDetails();
          //     attachdetails.PaymentsID = createentry.PkPaymentsId;
          //     attachdetails.FileNo = i;

          //     var replacednam = ReplaceSpeacialCharacters(AttachedDocuments.FileName);
          //     string DBPath = location + createentry.PkPaymentsId + "_" + i + ext;
          //     var path = Path.Combine(Server.MapPath("~" + location), createentry.PkPaymentsId + "_" + i + ext);
          //     AttachedDocuments.SaveAs(path);
          //     attachdetails.AttachmentLocation = DBPath;

          //     attachdetails.CreatedAt = System.DateTime.Now;
          //     attachdetails.UpdatedAt = System.DateTime.Now;
          //     attachdetails.DeletedBy = "";
          //     attachdetails.UpdatedBy = "";
          //     attachdetails.CreatedBy = Session["Email"].ToString();
          //     await queryRunner.manager.paymentattachments.Add(attachdetails);
          //     await queryRunner.manager.SaveChanges();

          // }
          //var bankinformation = OrganizationManagementAccountingDBAccess.GetBanksInformationByLedgerId(createentry.DebitLedgerID);
          // #region Accounts
          const body = {
            debitLedgerId: createReceiptDto.debitLedgerId,
            creditLedgerId: createReceiptDto.creditLedgerId,
            transactionDate: new Date(),
            debitAmount: createReceiptDto.totalAmt,
            creditAmount: createReceiptDto.totalAmt,
            referenceId: createentry.id,
            transactionId: createentry.transactionId,
            transactionSource: "Payment Received",
            userId: userPayload.id,
            organizationId: userPayload.organizationId,
            remarks: "@" + createentry.comment + "-" + createentry.paymentRefNum,
            transactionReference: createentry.paymentNumber
          };

          var transaction = await this.accountService.addTransaction(body, queryRunner);

          if (transaction) {
            //{
            //    "TotalAmt": 25.0,
            //        "CustomerRef": {
            //        "value": "20"
            //    }
            //}

            await queryRunner.commitTransaction();

            return `Insert Success`;
          }

          //#endregion
        }
        await queryRunner.rollbackTransaction();
        exceptionmessage = `failed`;

        throw new BadRequestException(`duplicate invoice found.please insert a unique one.`);
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

  // update Receipt
  async updateReceipt(updateReceiptDto: UpdatePaymentReceivedDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (updateReceiptDto.debitLedgerId != 0 && updateReceiptDto.creditLedgerId != 0 && updateReceiptDto.totalAmt != 0) {
        var inforamtion = await queryRunner.manager.findOne(PaymentReceivedEntity, { where: { id: id, organizationId: userPayload.organizationId } });

        var createentry = await queryRunner.manager.findOne(PaymentReceivedEntity, { where: { id: id, organizationId: userPayload.organizationId } });
        if (createentry != null) {
          createentry.debitLedgerId = updateReceiptDto.debitLedgerId;
          createentry.creditLedgerId = updateReceiptDto.creditLedgerId;
          createentry.txnDate = new Date(updateReceiptDto.txnDate);
          createentry.paymentRefNum = updateReceiptDto.paymentRefNum;
          createentry.comment = updateReceiptDto.comment;
          createentry.totalAmt = updateReceiptDto.totalAmt;
          createentry.unappliedAmt = updateReceiptDto.unappliedAmt;
          createentry.depositToAccountRef = updateReceiptDto.depositToAccountRef;
          createentry.txnId = updateReceiptDto.txnId;
          createentry.txnType = updateReceiptDto.txnType;
          //createentry.PaymentMethod = updateReceiptDto.PaymentMethod;

          var ledgerinfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: updateReceiptDto.creditLedgerId, organizationId: userPayload.organizationId } });
          createentry.updatedAt = new Date();
          createentry.updatedBy = userPayload.id;
          await queryRunner.manager.update(PaymentReceivedEntity, { id: id }, createentry);

          let checkothers = false;

          var paymentdetails = await queryRunner.manager.find(PaymentDetailsEntity, { where: { paymentsId: createentry.id } });
          if (paymentdetails.length > 0) {
            await Promise.all(
              paymentdetails.map(async (payment) => {
                let invoiceinfo = await queryRunner.manager.findOne(InvoiceEntity, { where: { id: payment.invoiceId } });

                invoiceinfo.totalDueAmount += payment.amountPaid;

                if (invoiceinfo.totalAmt == payment.amountPaid) invoiceinfo.paymentStatus = "Open";
                else if (payment.amountDue == payment.amountPaid && invoiceinfo.totalAmt - payment.amountDue == 0) {
                  invoiceinfo.paymentStatus = "Open";
                } else invoiceinfo.paymentStatus = "Partially Paid";

                await queryRunner.manager.update(InvoiceEntity, { id: invoiceinfo.id }, invoiceinfo);
              })
            );

            await queryRunner.manager.remove(PaymentDetailsEntity, paymentdetails);

            let dueinvoices = await queryRunner.manager.find(InvoiceEntity, { where: { debitLedgerId: createentry.creditLedgerId, paymentStatus: "Open" || "Partially Paid" } });

            let totalpayment = createentry.totalAmt;

            if (dueinvoices.length > 0) {
              await Promise.all(
                dueinvoices.map(async (due) => {
                  let newtotalpayment = totalpayment - due.totalDueAmount;
                  if (newtotalpayment >= 0) {
                    let single = new PaymentDetailsEntity();
                    single.invoiceId = due.id;
                    single.paymentsId = createentry.id;
                    single.payment = createentry;
                    single.amountDue = due.totalDueAmount;
                    single.amountPaid = due.totalDueAmount;
                    single.createdAt = new Date();
                    single.updatedAt = new Date();
                    single.createdBy = userPayload.id;
                    single.organizationId = userPayload.organizationId;
                    single.updatedBy = 0;
                    single.deletedBy = 0;

                    await queryRunner.manager.save(PaymentDetailsEntity, single);

                    due.paymentStatus = "Paid";
                    due.totalDueAmount = 0;
                    await queryRunner.manager.update(InvoiceEntity, { id: due.id }, due);

                    if (newtotalpayment == 0) {
                      return;
                    }
                  } else {
                    let single = new PaymentDetailsEntity();
                    single.invoiceId = due.id;
                    single.invoice = due;
                    single.paymentsId = createentry.id;

                    single.amountDue = due.totalDueAmount;

                    due.totalDueAmount = due.totalDueAmount - totalpayment;

                    single.amountPaid = totalpayment;
                    single.createdAt = new Date();
                    single.updatedAt = new Date();
                    single.createdBy = userPayload.id;
                    single.organizationId = userPayload.organizationId;
                    single.updatedBy = 0;
                    single.deletedBy = 0;
                    await queryRunner.manager.save(PaymentDetailsEntity, single);

                    due.paymentStatus = "Partially Paid";

                    await queryRunner.manager.update(InvoiceEntity, { id: due.id }, due);

                    return;
                  }
                  totalpayment = newtotalpayment;
                })
              );
            }
          }

          // var attachemnts = await queryRunner.manager.paymentattachments.Where(a => a.PaymentsID == createentry.PkPaymentsId).FirstOrDefault();
          // if (attachemnts == null)
          // {
          //     if (AttachedDocumentUpdate != null && AttachedDocumentUpdate.ContentLength > 0)
          //     {

          //         int i = 1;
          //         string location = "/Resources/PaymentReceipts/";
          //         bool exists = Directory.Exists(Server.MapPath("~/Resources/PaymentReceipts/"));

          //         if (!exists)
          //             Directory.CreateDirectory(Server.MapPath("~/Resources/PaymentReceipts/"));

          //         string ext = Path.GetExtension(AttachedDocumentUpdate.FileName);
          //         PaymentAttachmentDetails attachdetails = new PaymentAttachmentDetails();
          //         attachdetails.PaymentsID = createentry.PkPaymentsId;
          //         attachdetails.FileNo = i;

          //         var replacednam = ReplaceSpeacialCharacters(AttachedDocumentUpdate.FileName);
          //         string DBPath = location + createentry.PkPaymentsId + "_" + i + ext;
          //         var path = Path.Combine(Server.MapPath("~" + location), createentry.PkPaymentsId + "_" + i + ext);
          //         AttachedDocumentUpdate.SaveAs(path);
          //         attachdetails.AttachmentLocation = DBPath;

          //         attachdetails.CreatedAt = System.DateTime.Now;
          //         attachdetails.UpdatedAt = System.DateTime.Now;
          //         attachdetails.DeletedBy = "";
          //         attachdetails.UpdatedBy = "";
          //         attachdetails.CreatedBy = Session["Email"].ToString();
          //         await queryRunner.manager.paymentattachments.Add(attachdetails);
          //         await queryRunner.manager.SaveChanges();
          //         checkothers = true;
          //     }
          // }
          // else
          // {
          //     if (AttachedDocumentUpdate != null && AttachedDocumentUpdate.ContentLength > 0)
          //     {

          //         int i = 1;
          //         string location = "/Resources/PaymentReceipts/";
          //         bool exists = Directory.Exists(Server.MapPath("~/Resources/PaymentReceipts/"));

          //         if (!exists)
          //             Directory.CreateDirectory(Server.MapPath("~/Resources/PaymentReceipts/"));

          //         string ext = Path.GetExtension(AttachedDocumentUpdate.FileName);

          //         var replacednam = ReplaceSpeacialCharacters(AttachedDocumentUpdate.FileName);
          //         string DBPath = location + createentry.PkPaymentsId + "_" + i + ext;
          //         var path = Path.Combine(Server.MapPath("~" + location), createentry.PkPaymentsId + "_" + i + ext);
          //         AttachedDocumentUpdate.SaveAs(path);
          //         attachemnts.AttachmentLocation = DBPath;

          //         attachemnts.UpdatedAt = System.DateTime.Now;
          //         attachemnts.UpdatedBy = Session["Email"].ToString();
          //         await queryRunner.manager.SaveChanges();

          //         checkothers = true;
          //     }
          // }

          let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, { where: { transactionId: inforamtion.transactionId, referenceID: inforamtion.id } });
          console.log("transactioninforamtion: ", transactioninforamtion);

          if (inforamtion.totalAmt != createentry.totalAmt || inforamtion.comment != createentry.comment || inforamtion.paymentRefNum != createentry.paymentRefNum) {
            let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");
            let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");

            //#region Accounts

            const body = {
              debitTransactionId: debittransaction.id,
              creditTransactionId: credittransaction.id,
              transactionDate: updateReceiptDto.txnDate,
              debitAmount: updateReceiptDto.totalAmt,
              creditAmount: updateReceiptDto.totalAmt,
              userId: userPayload.id,
              remarks: "@ " + updateReceiptDto.comment + "-" + updateReceiptDto.paymentRefNum,
              transactionReference: inforamtion.paymentNumber
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
              newAmount: createentry.totalAmt,
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
                newAmount: createentry.totalAmt,
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
              newAmount: createentry.totalAmt,
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
              newAmount: createentry.totalAmt,
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

          //{
          //    "SyncToken": "0",
          //        "PaymentMethodRef": {
          //        "value": "16"
          //    },
          //    "ProjectRef": {
          //        "value": "39298045"
          //    },
          //    "PaymentRefNum": "123456",
          //        "sparse": false,
          //            "Line": [
          //                {
          //                    "Amount": 300,
          //                    "LinkedTxn": [
          //                        {
          //                            "TxnId": "67",
          //                            "TxnType": "Invoice"
          //                        }
          //                    ]
          //                },
          //                {
          //                    "Amount": 300,
          //                    "LinkedTxn": [
          //                        {
          //                            "TxnId": "68",
          //                            "TxnType": "CreditMemo"
          //                        }
          //                    ]
          //                }
          //            ],
          //                "CustomerRef": {
          //        "value": "16"
          //    },
          //    "Id": "69",
          //        "MetaData": {
          //        "CreateTime": "2013-03-13T14:49:21-07:00",
          //            "LastUpdatedTime": "2013-03-13T14:49:21-07:00"
          //    }
          //}
          if (checkothers) {
            await queryRunner.commitTransaction();
            return "Update";
          }
        }
        await queryRunner.rollbackTransaction();
        return "Failed";
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

  // find all receipt Data
  async findAllReceiptData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Money Receipt",
        message: `All Money Receipt fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: null,
      organizationId: userPayload.organizationId
    };

    const [results, total] = await this.receiptRepository
      .createQueryBuilder("receipt")
      .leftJoinAndSelect("receipt.debitLedger", "customer")
      .leftJoinAndSelect("receipt.creditLedger", "account")
      .where(`receipt.organizationId = ${userPayload.organizationId}`)
      .andWhere(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`receipt.voucher LIKE ('%${filter}%')`);
          }
        })
      )
      .orderBy("receipt.id", "DESC")
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

  // delete receipt
  async deleteReceipt(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      let inforamtion = await queryRunner.manager.findOne(PaymentReceivedEntity, { where: { id: id, organizationId: userPayload.organizationId } });
      if (inforamtion != null) {
        let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, { where: { transactionId: inforamtion.transactionId, referenceID: inforamtion.id } });
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
            try {
              // var findattachments = await queryRunner.manager.paymentattachments.Where(a => a.PaymentsID == id).FirstOrDefault();
              // if (findattachments != null)
              // {
              //     await queryRunner.manager.paymentattachments.Remove(findattachments);
              //     await queryRunner.manager.SaveChanges();

              //     if (System.IO.File.Exists(findattachments.AttachmentLocation))
              //     {
              //         System.IO.File.Delete(findattachments.AttachmentLocation);
              //     }
              // }

              var paymentdetails = await queryRunner.manager.find(PaymentDetailsEntity, { where: { paymentsId: id } });
              if (paymentdetails.length > 0) {
                await Promise.all(
                  paymentdetails.map(async (payment) => {
                    var invoiceinfo = await queryRunner.manager.findOne(InvoiceEntity, { where: { id: payment.invoiceId } });

                    invoiceinfo.totalDueAmount += payment.amountPaid;

                    if (invoiceinfo.totalAmt == payment.amountPaid) invoiceinfo.paymentStatus = "Open";
                    else if (payment.amountDue == payment.amountPaid && invoiceinfo.totalAmt - payment.amountDue == 0) {
                      invoiceinfo.paymentStatus = "Open";
                    } else invoiceinfo.paymentStatus = "Partially Paid";

                    await queryRunner.manager.update(InvoiceEntity, { id: payment.id }, payment);
                  })
                );
              }

              await queryRunner.manager.remove(PaymentDetailsEntity, paymentdetails);
            } catch (ex) {}

            // try
            // {

            //     var findattachments = await queryRunner.manager.paymentattachments.Where(a => a.PaymentsID == id).FirstOrDefault();
            //     if (findattachments != null)
            //     {
            //         await queryRunner.manager.paymentattachments.Remove(findattachments);
            //         await queryRunner.manager.SaveChanges();

            //         if (System.IO.File.Exists(findattachments.AttachmentLocation))
            //         {
            //             System.IO.File.Delete(findattachments.AttachmentLocation);
            //         }
            //     }
            // }
            // catch
            // {

            // }
            await queryRunner.manager.remove(PaymentReceivedEntity, inforamtion);
            //{
            //    "SyncToken": "2",
            //        "Id": "73"
            //}
            await queryRunner.commitTransaction();
            return "Deleted";
          }
        }
      }

      exceptionmessage = "invoice not found";
      throw new NotFoundException("invoice not found");
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
   * Get Single receipt
   */
  async findSingleReceiptData(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.receiptRepository.findOne({
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
        tag: "Money Receipt",
        message: `Single Money Receipt fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: null,
      organizationId: userPayload.organizationId
    };

    if (!data) {
      throw new NotFoundException(`receipt not exist in db!!`);
    }

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }
  /**
   * Get One receipt
   */
  async findOneReceiptData(id: number) {
    const data = await this.receiptRepository.findOne({
      where: {
        id: id
      },
      relations: ["customer"]
    });
    if (!data) {
      throw new NotFoundException(`receipt not exist in db!!`);
    }
    return data;
  }

  //  create Receipt
  async createPaymentReceipt(createReceiptDto: CreatePaymentReceivedDto, userPayload: UserInterface): Promise<any> {
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    const queryRunner1 = this.dataSource.createQueryRunner();
    try {
      if (createReceiptDto.debitLedgerId != 0 && createReceiptDto.creditLedgerId != 0 && createReceiptDto.totalAmt != 0) {
        var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(createReceiptDto.txnDate), userPayload);

        const createentry = new PaymentReceivedEntity();
        createentry.debitLedgerId = createReceiptDto.debitLedgerId;
        createentry.creditLedgerId = createReceiptDto.creditLedgerId;
        createentry.txnDate = new Date(createReceiptDto.txnDate);
        createentry.paymentNumber = await this.accountService.generateAllNumbersbasedonDate("PaymentReceived", new Date(createReceiptDto.txnDate), userPayload);
        createentry.paymentMethodRef = 1;
        createentry.paymentRefNum = createReceiptDto.paymentRefNum;
        //createentry.unappliedAmt = createReceiptDto.unappliedAmt;
        createentry.unappliedAmt = 0;
        if (createReceiptDto.comment != null) {
          createentry.comment = createReceiptDto.comment;
        } else {
        }

        createentry.totalAmt = createReceiptDto.totalAmt;

        createentry.transactionId = TransactionID;

        // createentry.createdAt = System.DateTime.Now.AddHours(11);
        createentry.updatedAt = new Date();
        createentry.createdBy = userPayload.id;
        createentry.organizationId = userPayload.organizationId;
        createentry.updatedBy = 0;
        createentry.deletedBy = 0;
        createentry.debitLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createReceiptDto.debitLedgerId } });
        createentry.creditLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createReceiptDto.creditLedgerId } });
        await queryRunner.manager.save(PaymentReceivedEntity, createentry);

        if (createentry.id > 0) {
          if (createReceiptDto.invoices.length > 0) {
            await Promise.all(
              createReceiptDto.invoices.map(async (due) => {
                if (due.totalPaymentAmount >= 0) {
                  let single = new PaymentDetailsEntity();
                  single.invoiceId = due.id;
                  single.paymentsId = createentry.id;
                  single.payment = createentry;
                  if (due.file != null && due.file.ContentLength > 0) {
                    single.refDoc = due.file;
                  }
                  single.amountDue = due.totalDueAmount;
                  single.amountPaid = due.totalPaymentAmount;
                  single.bankreference = due.bankreference;
                  single.createdAt = new Date();
                  single.updatedAt = new Date();
                  single.createdBy = userPayload.id;
                  single.organizationId = userPayload.organizationId;
                  single.updatedBy = 0;
                  single.deletedBy = 0;

                  await queryRunner.manager.save(PaymentDetailsEntity, single);

                  let invoiceinforamtion = await queryRunner.manager.findOne(InvoiceEntity, { where: { id: due.id } });
                  if (invoiceinforamtion) {
                    if (due.totalDueAmount == due.totalPaymentAmount) {
                      invoiceinforamtion.paymentStatus = "Paid";
                      invoiceinforamtion.totalDueAmount = 0;
                    } else if (due.totalPaymentAmount > 0 && due.totalPaymentAmount < due.totalDueAmount) {
                      invoiceinforamtion.paymentStatus = "Partially Paid";
                      invoiceinforamtion.totalDueAmount = due.totalDueAmount - due.totalPaymentAmount;
                    } else {
                      invoiceinforamtion.paymentStatus = "Open";
                    }

                    await queryRunner.manager.update(InvoiceEntity, { id: due.id }, invoiceinforamtion);
                  }
                }
              })
            );
          }

          // #region Accounts
          const body = {
            debitLedgerId: createReceiptDto.debitLedgerId,
            creditLedgerId: createReceiptDto.creditLedgerId,
            transactionDate: new Date(),
            debitAmount: createentry.totalAmt,
            creditAmount: createentry.totalAmt,
            referenceId: createentry.id,
            transactionId: createentry.transactionId,
            transactionSource: "Payment Received",
            userId: userPayload.id,
            organizationId: userPayload.organizationId,
            remarks: "@" + createentry.comment + "-" + createentry.paymentRefNum,
            transactionReference: createentry.paymentNumber
          };

          var transaction = await this.accountService.addTransaction(body, queryRunner);

          if (transaction) {
            const qbinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
              where: {
                id: userPayload.organizationId
              }
            });
            if (qbinforamtion.qbaccounts == 1) {
              if (await this.authservice.isauthenticated(userPayload, queryRunner)) {
                await queryRunner.commitTransaction();
                await queryRunner1.startTransaction();
                let customerinfo = await queryRunner1.manager.findOne(CustomersEntity, { where: { ledgerId: createentry.creditLedgerId } });

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

                await qboobject.createPayment(
                  {
                    TotalAmt: createentry.totalAmt,
                    CustomerRef: {
                      value: customerinfo.qbRefId
                    }
                  },
                  async function (err, Bill) {
                    if (err) {
                      throw new BadRequestException(err);
                    } else {
                      createentry.qbRefId = Bill.Id;

                      const insertData = await queryRunner1.manager.update(PaymentReceivedEntity, { id: createentry.id }, createentry);

                      await queryRunner1.commitTransaction();

                      return "Successful";
                    }
                  }
                );
              }
            } else {
              await queryRunner.commitTransaction();

              return "Successful";
            }
          }

          //#endregion
        }

        exceptionmessage = `failed`;
        return "`duplicate invoice found.please insert a unique one.`";
        throw new BadRequestException(`duplicate invoice found.please insert a unique one.`);
      }
      exceptionmessage = `failed, check the data again`;
      return "Successful";

      throw new BadRequestException(`duplicate invoice found.please insert a unique one.`);
    } catch (err) {
      console.log(err);
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
}
