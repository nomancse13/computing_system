//purchase controller

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as randToken from "rand-token";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { PaymentDetailsEntity } from "src/entities/payment-details.entity";
import { PaymentMadeDetailsEntity } from "src/entities/paymentmade-details.entity";
import { decrypt } from "src/helper/crypto.helper";
import { DataSource } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { CreatePaymentVoucherDto, UpdatePaymentVoucherDto } from "../dtos/payables/payment-voucher";
import { BillEntity, InvoiceEntity, AccountsEntity, PaymentMadeEntity, TransactionHistoryEntity, OrganizationEntity, VendorsEntity, BankAccountEntity } from "../entities";
import { AccountService } from "./account.service";
import { ActivityLogService } from "./activity-log.service";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";
let exceptionmessage = "failed";
@Injectable()
export class PaymentMadeService {
  constructor(
    @InjectRepository(PaymentMadeEntity)
    private paymentVoucherRepository: BaseRepository<PaymentMadeEntity>,
    private readonly accountService: AccountService,
    private activityLogService: ActivityLogService,
    private dataSource: DataSource,
    private authservice: AuthService
  ) {}

  //  create payment voucher
  async createPaymentVoucher(createpaymentVoucherDto: CreatePaymentVoucherDto, userPayload: UserInterface): Promise<any> {
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (createpaymentVoucherDto.debitLedgerId != 0 && createpaymentVoucherDto.creditLedgerId != 0 && createpaymentVoucherDto.totalAmt != 0) {
        var TransactionID = randToken.generate(10, "abcdefghijklnmopqrstuvwxyz0123456789");

        const createentry = new PaymentMadeEntity();
        createentry.debitLedgerId = createpaymentVoucherDto.debitLedgerId;
        createentry.creditLedgerId = createpaymentVoucherDto.creditLedgerId;
        createentry.txnDate = new Date(createpaymentVoucherDto.txnDate);
        createentry.paymentsNo = await this.accountService.generateAllNumbersbasedonDate("PaymentPaid", new Date(createpaymentVoucherDto.txnDate), userPayload);
        createentry.reference = createpaymentVoucherDto.reference;

        if (createpaymentVoucherDto.comment != null) {
          createentry.comment = createpaymentVoucherDto.comment;
        } else {
        }

        createentry.totalAmt = createpaymentVoucherDto.totalAmt;
        createentry.payType = createpaymentVoucherDto.payType;
        let ledgerinfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createpaymentVoucherDto.creditLedgerId } });

        createentry.transactionId = TransactionID;

        // createentry.createdAt = System.DateTime.Now.AddHours(11);
        createentry.updatedAt = new Date();
        createentry.createdBy = userPayload.id;
        createentry.organizationId = userPayload.organizationId;
        createentry.updatedBy = 0;
        createentry.deletedBy = 0;
        createentry.debitLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createpaymentVoucherDto.debitLedgerId } });
        createentry.creditLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createpaymentVoucherDto.creditLedgerId } });
        await queryRunner.manager.save(PaymentMadeEntity, createentry);

        if (createentry.id > 0) {
          var dueinvoices = await queryRunner.manager.find(BillEntity, { where: { debitLedgerId: createentry.creditLedgerId, paymentStatus: "Open" || "Partially Paid" } });

          var totalpayment = createentry.totalAmt;

          if (dueinvoices.length > 0) {
            await Promise.all(
              dueinvoices.map(async (due) => {
                var newtotalpayment = totalpayment - due.totalDueAmount;
                if (newtotalpayment >= 0) {
                  let single = new PaymentDetailsEntity();
                  single.invoiceId = due.id;
                  single.paymentsId = createentry.id;
                  //single.payment = createentry;
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
                  let single = new PaymentMadeDetailsEntity();
                  single.billId = due.id;
                  single.bill = due;
                  single.paymentsId = createentry.id;

                  single.amountDue = due.totalDueAmount;

                  due.totalDueAmount = due.totalDueAmount - totalpayment;

                  single.amount = totalpayment;
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
          // if (createpaymentVoucherDto.file != null && createpaymentVoucherDto.file.ContentLength > 0)
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
            debitLedgerId: createpaymentVoucherDto.debitLedgerId,
            creditLedgerId: createpaymentVoucherDto.creditLedgerId,
            transactionDate: new Date(),
            debitAmount: createpaymentVoucherDto.totalAmt,
            creditAmount: createpaymentVoucherDto.totalAmt,
            referenceId: createentry.id,
            transactionId: createentry.transactionId,
            transactionSource: "Payment Paid",
            userId: userPayload.id,
            organizationId: userPayload.organizationId,
            remarks: "@" + createentry.comment + "-" + createentry.reference,
            transactionReference: createentry.paymentsNo
          };

          var transaction = await this.accountService.addTransaction(body, queryRunner);

          if (transaction) {
            //{
            //    "PrivateNote": "Acct. 1JK90",
            //        "VendorRef": {
            //        "name": "Bob's Burger Joint",
            //            "value": "56"
            //    },
            //    "TotalAmt": 200.0,
            //        "PayType": "Check",
            //            "Line": [
            //                {
            //                    "Amount": 200.0,
            //                    "LinkedTxn": [
            //                        {
            //                            "TxnId": "234",
            //                            "TxnType": "Bill"
            //                        }
            //                    ]
            //                }
            //            ],
            //                "CheckPayment": {
            //        "BankAccountRef": {
            //            "name": "Checking",
            //                "value": "35"
            //        }
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

  // update payment Voucher
  async updatepaymentVoucher(updatePaymentVoucherDto: UpdatePaymentVoucherDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (updatePaymentVoucherDto.debitLedgerId != 0 && updatePaymentVoucherDto.creditLedgerId != 0 && updatePaymentVoucherDto.totalAmt != 0) {
        var inforamtion = await queryRunner.manager.findOne(PaymentMadeEntity, { where: { id: id, organizationId: userPayload.organizationId } });

        var createentry = await queryRunner.manager.findOne(PaymentMadeEntity, { where: { id: id, organizationId: userPayload.organizationId } });
        if (createentry != null) {
          createentry.debitLedgerId = updatePaymentVoucherDto.debitLedgerId;
          createentry.creditLedgerId = updatePaymentVoucherDto.creditLedgerId;
          createentry.txnDate = new Date(updatePaymentVoucherDto.txnDate);
          createentry.reference = updatePaymentVoucherDto.reference;
          createentry.payType = updatePaymentVoucherDto.payType;
          createentry.comment = updatePaymentVoucherDto.comment;
          createentry.totalAmt = Number(updatePaymentVoucherDto.totalAmt);
          createentry.updatedAt = new Date();
          createentry.updatedBy = userPayload.id;
          await queryRunner.manager.update(PaymentMadeEntity, { id: id }, createentry);
          console.log("createentry.paymentAmount: ", createentry.totalAmt);

          let checkothers = false;

          var paymentdetails = await queryRunner.manager.find(PaymentMadeDetailsEntity, { where: { paymentsId: createentry.id, organizationId: userPayload.organizationId } });
          if (paymentdetails.length > 0) {
            await Promise.all(
              paymentdetails.map(async (payment) => {
                let invoiceinfo = await queryRunner.manager.findOne(BillEntity, { where: { id: payment.billId } });

                invoiceinfo.totalDueAmount += payment.amount;

                if (invoiceinfo.totalAmt == payment.amount) invoiceinfo.paymentStatus = "Open";
                else if (payment.amountDue == payment.amount && invoiceinfo.totalAmt - payment.amountDue == 0) {
                  invoiceinfo.paymentStatus = "Open";
                } else invoiceinfo.paymentStatus = "Partially Paid";

                await queryRunner.manager.update(BillEntity, { id: invoiceinfo.id }, invoiceinfo);
              })
            );

            await queryRunner.manager.remove(PaymentMadeDetailsEntity, paymentdetails);

            let dueinvoices = await queryRunner.manager.find(BillEntity, { where: { creditLedgerId: createentry.debitLedgerId, paymentStatus: "Open" || "Partially Paid" } });

            let totalpayment = createentry.totalAmt;

            if (dueinvoices.length > 0) {
              await Promise.all(
                dueinvoices.map(async (due) => {
                  let newtotalpayment = totalpayment - due.totalDueAmount;
                  if (newtotalpayment >= 0) {
                    let single = new PaymentMadeDetailsEntity();
                    single.billId = due.id;
                    single.paymentsId = createentry.id;
                    single.payment = createentry;
                    single.amountDue = Number(due.totalDueAmount);
                    single.amount = Number(due.totalDueAmount);
                    single.createdAt = new Date();
                    single.updatedAt = new Date();
                    single.createdBy = userPayload.id;
                    single.organizationId = userPayload.organizationId;
                    single.updatedBy = 0;
                    single.deletedBy = 0;

                    await queryRunner.manager.save(PaymentMadeDetailsEntity, single);

                    due.paymentStatus = "Paid";
                    due.totalDueAmount = 0;
                    await queryRunner.manager.update(BillEntity, { id: due.id }, due);

                    if (newtotalpayment == 0) {
                      return;
                    }
                  } else {
                    let single = new PaymentMadeDetailsEntity();
                    single.billId = due.id;
                    single.bill = due;
                    single.paymentsId = createentry.id;

                    single.amountDue = Number(due.totalDueAmount);

                    due.totalDueAmount = Number(due.totalDueAmount) - Number(totalpayment);

                    single.amount = Number(totalpayment);
                    single.createdAt = new Date();
                    single.updatedAt = new Date();
                    single.createdBy = userPayload.id;
                    single.organizationId = userPayload.organizationId;
                    single.updatedBy = 0;
                    single.deletedBy = 0;
                    await queryRunner.manager.save(PaymentMadeDetailsEntity, single);

                    due.paymentStatus = "Partially Paid";

                    await queryRunner.manager.update(BillEntity, { id: due.id }, due);

                    return;
                  }
                  totalpayment = Number(totalpayment);
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

          if (inforamtion.totalAmt != createentry.totalAmt || inforamtion.comment != createentry.comment || inforamtion.reference != createentry.reference) {
            let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");
            let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");

            //#region Accounts

            const body = {
              debitTransactionId: debittransaction.id,
              creditTransactionId: credittransaction.id,
              transactionDate: createentry.txnDate,
              debitAmount: createentry.totalAmt,
              creditAmount: createentry.totalAmt,
              userId: userPayload.id,
              remarks: "@ " + createentry.comment + "-" + createentry.reference,
              transactionReference: inforamtion.paymentsNo
            };
            console.log(body, "body");

            let transaction = await this.accountService.UpdateTransactions(body, queryRunner);
            console.log(transaction, "transaction");
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

          console.log("checkothers: " + checkothers);
          //{
          //    "SyncToken": "2",
          //        "domain": "QBO",
          //            "VendorRef": {
          //        "name": "Bob's Burger Joint",
          //            "value": "56"
          //    },
          //    "TxnDate": "2015-07-14",
          //        "TotalAmt": 200.0,
          //            "PayType": "Check",
          //                "PrivateNote": "A new private note",
          //                    "sparse": false,
          //                        "Line": [
          //                            {
          //                                "Amount": 200.0,
          //                                "LinkedTxn": [
          //                                    {
          //                                        "TxnId": "234",
          //                                        "TxnType": "Bill"
          //                                    }
          //                                ]
          //                            }
          //                        ],
          //                            "Id": "236",
          //                                "CheckPayment": {
          //        "PrintStatus": "NeedToPrint",
          //            "BankAccountRef": {
          //            "name": "Checking",
          //                "value": "35"
          //        }
          //    },
          //    "MetaData": {
          //        "CreateTime": "2015-07-14T12:34:04-07:00",
          //            "LastUpdatedTime": "2015-07-14T13:17:22-07:00"
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
      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // find all payment Voucher Data
  async findAllpaymentVoucherData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Payment Voucher",
        message: `All Payment Voucher fetched by ${decrypt(userPayload.hashType)}`,
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
      const [results, total] = await queryRunner.manager.findAndCount(PaymentMadeEntity, {
        where: { organizationId: userPayload.organizationId },
        relations: ["creditLedger", "debitLedger"],
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

  // delete payment voucher
  async deletepaymentVoucher(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      let inforamtion = await queryRunner.manager.findOne(PaymentMadeEntity, { where: { id: id, organizationId: userPayload.organizationId } });
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

              var paymentdetails = await queryRunner.manager.find(PaymentMadeDetailsEntity, { where: { paymentsId: id } });
              if (paymentdetails.length > 0) {
                await Promise.all(
                  paymentdetails.map(async (payment) => {
                    var invoiceinfo = await queryRunner.manager.findOne(BillEntity, { where: { id: payment.billId } });

                    invoiceinfo.totalDueAmount += payment.amount;

                    if (invoiceinfo.totalAmt == payment.amount) invoiceinfo.paymentStatus = "Open";
                    else if (payment.amountDue == payment.amount && invoiceinfo.totalAmt - payment.amountDue == 0) {
                      invoiceinfo.paymentStatus = "Open";
                    } else invoiceinfo.paymentStatus = "Partially Paid";

                    await queryRunner.manager.update(BillEntity, { id: payment.id }, payment);
                  })
                );
              }

              await queryRunner.manager.remove(PaymentMadeDetailsEntity, paymentdetails);
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
            await queryRunner.manager.remove(PaymentMadeEntity, inforamtion);
            //{
            //    "SyncToken": "0",
            //        "Id": "117"
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
  }

  /**
   * Get One payment voucher
   */
  async findSinglepaymentVoucherData(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.paymentVoucherRepository.findOne({
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
        tag: "Payment Voucher",
        message: `Single Payment Voucher fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: data,
      organizationId: userPayload.organizationId
    };

    if (!data) {
      throw new NotFoundException(`Payment voucher not exist in db!!`);
    }

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }
  /**
   * Get One payment voucher
   */
  async findOnepaymentVoucherData(id: number) {
    const data = await this.paymentVoucherRepository.findOne({
      where: {
        id: id
      },
      relations: ["creditLedger", "debitLedger"]
    });
    if (!data) {
      throw new NotFoundException(`payment voucher not exist in db!!`);
    }
    return data;
  }

  //#region Create Payment Made
  //  create payment voucher
  async createPaymentmade(createpaymentVoucherDto: CreatePaymentVoucherDto, userPayload: UserInterface): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    const queryRunner1 = this.dataSource.createQueryRunner();
    try {
      if (createpaymentVoucherDto.debitLedgerId != 0 && createpaymentVoucherDto.creditLedgerId != 0 && createpaymentVoucherDto.totalAmt != 0) {
        var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(createpaymentVoucherDto.txnDate), userPayload);
        const createentry = new PaymentMadeEntity();

        let dledgerinfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createpaymentVoucherDto.debitLedgerId } });

        let cledgerinfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createpaymentVoucherDto.creditLedgerId } });

        createentry.debitLedgerId = createpaymentVoucherDto.debitLedgerId;
        createentry.creditLedgerId = createpaymentVoucherDto.creditLedgerId;
        createentry.debitLedger = dledgerinfo;
        createentry.creditLedger = cledgerinfo;

        createentry.txnDate = new Date(createpaymentVoucherDto.txnDate);
        createentry.paymentsNo = await this.accountService.generateAllNumbersbasedonDate("PaymentPaid", new Date(createpaymentVoucherDto.txnDate), userPayload);
        createentry.reference = createpaymentVoucherDto.reference;

        if (createpaymentVoucherDto.comment != null) {
          createentry.comment = createpaymentVoucherDto.comment;
        } else {
        }

        createentry.totalAmt = createpaymentVoucherDto.totalAmt;
        createentry.transactionId = TransactionID;
        // createentry.payType = cledgerinfo.accountType;
        createentry.payType = "Check";
        // createentry.createdAt = System.DateTime.Now.AddHours(11);
        createentry.updatedAt = new Date();
        createentry.createdBy = userPayload.id;
        createentry.organizationId = userPayload.organizationId;
        createentry.updatedBy = 0;
        createentry.deletedBy = 0;

        await queryRunner.manager.save(PaymentMadeEntity, createentry);
        let detailsarray = [];
        let iteamcounter = 1;

        if (createentry.id > 0) {
          if (createpaymentVoucherDto.invoices.length > 0) {
            await Promise.all(
              createpaymentVoucherDto.invoices.map(async (due) => {
                if (due.totalPaymentAmount >= 0) {
                  let single = new PaymentMadeDetailsEntity();
                  single.billId = due.id;
                  single.paymentsId = createentry.id;
                  single.amountDue = due.totalDueAmount;
                  single.amount = due.totalPaymentAmount;
                  single.bankreference = due.bankreference;
                  if (due.file != null && due.file.ContentLength > 0) {
                    single.refDoc = due.file;
                  }

                  single.createdAt = new Date();
                  single.updatedAt = new Date();
                  single.createdBy = userPayload.id;
                  single.organizationId = userPayload.organizationId;
                  single.updatedBy = 0;
                  single.deletedBy = 0;
                  await queryRunner.manager.save(PaymentMadeDetailsEntity, single);

                  let invoiceinforamtion = await queryRunner.manager.findOne(BillEntity, { where: { id: due.id } });
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

                    var linearry = {
                      Amount: single.amount,
                      LinkedTxn: [
                        {
                          TxnId: invoiceinforamtion.qbRefId,
                          TxnType: "Bill"
                        }
                      ]
                    };

                    detailsarray.push(linearry);

                    await queryRunner.manager.update(BillEntity, { id: due.id }, invoiceinforamtion);
                  }
                }
              })
            );
          }
          // #region Accounts
          const body = {
            debitLedgerId: createpaymentVoucherDto.debitLedgerId,
            creditLedgerId: createpaymentVoucherDto.creditLedgerId,
            transactionDate: new Date(),
            debitAmount: createpaymentVoucherDto.totalAmt,
            creditAmount: createpaymentVoucherDto.totalAmt,
            referenceId: createentry.id,
            transactionId: createentry.transactionId,
            transactionSource: "Payment Paid",
            userId: userPayload.id,
            organizationId: userPayload.organizationId,
            remarks: "@" + createentry.comment + "-" + createentry.reference,
            transactionReference: createentry.paymentsNo
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
                let bankinfo = await queryRunner1.manager.findOne(BankAccountEntity, { where: { ledgerId: createentry.creditLedgerId } });

                await qboobject.createBillPayment(
                  {
                    PrivateNote: createentry.comment,
                    VendorRef: {
                      name: vendorinfo.displayName,
                      value: vendorinfo.qbRefId
                    },
                    TotalAmt: createentry.totalAmt,
                    PayType: createentry.payType,
                    Line: detailsarray,
                    CheckPayment: {
                      BankAccountRef: {
                        name: bankinfo.bankAccountName,
                        value: bankinfo.qbRefId
                      }
                    }
                  },
                  async function (err, Bill) {
                    if (err) {
                      throw new BadRequestException(err);
                    } else {
                      createentry.qbRefId = Bill.Id;

                      const insertData = await queryRunner1.manager.update(PaymentMadeEntity, { id: createentry.id }, createentry);

                      await queryRunner1.commitTransaction();

                      return insertData;
                    }
                  }
                );
              }
            } else {
              await queryRunner.commitTransaction();

              return createentry;
            }
          }

          //#endregion
        }
        //await queryRunner.rollbackTransaction();
        exceptionmessage = `failed`;
        return "Successful";

        var billdta = {
          Bill: {
            DueDate: "2024-01-29",
            VendorAddr: {
              Id: "33",
              Line1: "10 Main St.",
              City: "Palo Alto",
              CountrySubDivisionCode: "CA",
              PostalCode: "94303",
              Lat: "37.445013",
              Long: "-122.1391443"
            },
            Balance: 50,
            domain: "QBO",
            sparse: false,
            Id: "213",
            SyncToken: "0",
            MetaData: {
              CreateTime: "2024-01-29T07:42:24-08:00",
              LastModifiedByRef: {
                value: "9130357603929086"
              },
              LastUpdatedTime: "2024-01-29T07:42:24-08:00"
            },
            TxnDate: "2024-01-29",
            CurrencyRef: {
              value: "USD",
              name: "United States Dollar"
            },
            Line: [
              {
                Id: "1",
                LineNum: 1,
                Amount: 50,
                LinkedTxn: [],
                DetailType: "AccountBasedExpenseLineDetail",
                AccountBasedExpenseLineDetail: {
                  AccountRef: {
                    value: "63",
                    name: "Job Expenses:Job Materials"
                  },
                  BillableStatus: "NotBillable",
                  TaxCodeRef: {
                    value: "NON"
                  }
                }
              }
            ],
            VendorRef: {
              value: "32",
              name: "Cal Telephone"
            },
            APAccountRef: {
              value: "33",
              name: "Accounts Payable (A/P)"
            },
            TotalAmt: 50
          },
          time: "2024-01-29T07:42:24.588-08:00"
        };

        //throw new BadRequestException(`duplicate invoice found.please insert a unique one.`);
      }
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
  //#endregion
}
