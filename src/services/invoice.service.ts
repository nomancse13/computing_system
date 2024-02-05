//Controller: InvoiceController
//Model: Invoice/Invoice.cs
// View: Invoice/Index

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { DataSource, Not } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { StatusField } from "../authentication/common/enum";
import { CreateInvoiceDto, UpdateInvoiceDto } from "../dtos/receivables/invoice";
import {
  AccountingGroupEntity,
  InvoiceDetailsEntity,
  InvoiceEntity,
  AccountsEntity,
  StockHistoryDetailsEntity,
  StockHistoryEntity,
  TransactionHistoryEntity,
  OrganizationEntity,
  CustomersEntity
} from "../entities";
import { EstimationDetailsEntity } from "../entities/estiamtion-details.entity";
import { EstimationEntity } from "../entities/estimation.entity";
import { InvoicePaymentViewModelEntity } from "../viewentites/invoicepaymentViewModel.entity";
import { AccountService } from "./account.service";
import { ActivityLogService } from "./activity-log.service";
import { LedgersService } from "./ledgers.service";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";
let exceptionmessage = "failed";

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private invoiceRepository: BaseRepository<InvoiceEntity>,
    private readonly ledgersService: LedgersService,
    private activityLogService: ActivityLogService,
    private accountService: AccountService,
    private dataSource: DataSource,
    private authservice: AuthService
  ) {}

  //  create invoice
  async createInvoice(createInvoiceDto: CreateInvoiceDto, userPayload: UserInterface): Promise<any> {
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    // using a QueryRunner:
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:

    let exceptionmessage = "failed";

    await queryRunner.startTransaction();
    const queryRunner1 = this.dataSource.createQueryRunner();
    try {
      if (createInvoiceDto.debitLedgerId != 0 && createInvoiceDto.totalAmt > 0) {
        var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(createInvoiceDto.txnDate), userPayload);

        //#region Invoice Creation
        const createentry = new InvoiceEntity();
        createentry.debitLedgerId = createInvoiceDto.debitLedgerId;
        var assetgroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Sales" } });

        var salesledger = await queryRunner.manager.findOne(AccountsEntity, { where: { ledgerParent: assetgroup.id, organizationId: userPayload.organizationId } });

        createentry.creditLedgerId = salesledger.id;
        createentry.txnDate = new Date(createInvoiceDto.txnDate);
        createentry.invoiceNo = await this.accountService.generateAllNumbersbasedonDate("Invoice", new Date(createInvoiceDto.txnDate), userPayload);

        createentry.reference = createInvoiceDto.comment;
        createentry.comment = createInvoiceDto.comment;
        if (createInvoiceDto.comment != null) createentry.comment = createInvoiceDto.comment;
        else createentry.comment = "";

        createentry.totalTax = createInvoiceDto.totalTax;
        createentry.totalAmt = createInvoiceDto.totalAmt;
        createentry.docNumber = createInvoiceDto.docNumber;
        createentry.subtotalAmount = createInvoiceDto.subtotalAmount;
        createentry.billEmail = createInvoiceDto.billEmail;
        createentry.totalDueAmount = createInvoiceDto.totalAmt;
        createentry.terms = createInvoiceDto.terms;
        createentry.txnType = createInvoiceDto.txnType;
        createentry.billAddr = createInvoiceDto.billAddr;
        createentry.shipAddr = createInvoiceDto.shipAddr;
        createentry.applyTaxAfterDiscount = createInvoiceDto.applyTaxAfterDiscount;
        createentry.paymentStatus = "Open";
        createentry.transactionId = TransactionID;
        createentry.netAmountTaxable = createInvoiceDto.netAmountTaxable;

        createentry.createdAt = new Date();
        createentry.updatedAt = new Date();
        createentry.createdBy = userPayload.id;
        createentry.organizationId = userPayload.organizationId;
        console.log("userPayload: ", userPayload);

        createentry.updatedBy = 0;
        createentry.deletedBy = 0;

        await queryRunner.manager.save(InvoiceEntity, createentry);

        const logInfo = createInvoiceDto?.ipPayload;
        delete createInvoiceDto?.ipPayload;
        // prepare log data
        const log = {
          cLientIPAddress: logInfo.ip,
          browser: logInfo.browser,
          os: logInfo.os,
          userId: userPayload.id,
          messageDetails: {
            tag: "Invoice",
            message: `New Invoice created by ${decrypt(userPayload.hashType)}`
          },
          logData: createInvoiceDto,
          organizationId: userPayload.organizationId
        };
        // save log
        if (log) {
          await this.activityLogService.createLog(log, queryRunner);
        }

        var quotationid = createentry.id;
        let detailsarray = [];
        let iteamcounter = 1;
        if (quotationid > 0) {
          await Promise.all(
            createInvoiceDto.items.map(async (e) => {
              if (e.productId != 0 && e.productId != null && e.productId != undefined) {
                let qdetails = new InvoiceDetailsEntity();
                qdetails.invoiceId = createentry.id;
                qdetails.productId = e.productId;
                qdetails.unitPrice = e.sellingPrice;
                qdetails.qty = e.qty;

                var purchaseinfo = await queryRunner.manager.findOne(StockHistoryEntity, {
                  where: { productId: qdetails.productId },
                  relations: ["product"]
                });
                console.log("purchaseinfo: ", purchaseinfo);

                qdetails.purchaseRate = purchaseinfo.avgPurchaseRate;

                qdetails.description = e.description;
                qdetails.detailType = "SalesItemLineDetail";
                // qdetails.taxCodeRef = e.taxCodeRef;
                //qdetails.discount = e.discount;
                qdetails.totalAmount = e.amount;
                qdetails.createdAt = new Date();
                qdetails.updatedAt = new Date();
                qdetails.createdBy = userPayload.id;
                qdetails.organizationId = userPayload.organizationId;
                qdetails.updatedBy = 0;
                qdetails.deletedBy = 0;

                if (purchaseinfo.product.itemType == "Inventory") {
                  var linearry = {
                    DetailType: qdetails.detailType,
                    SalesItemLineDetail: {
                      TaxCodeRef: {
                        value: "NON"
                      },
                      Qty: qdetails.qty,
                      UnitPrice: qdetails.unitPrice,
                      ItemRef: {
                        name: purchaseinfo.product.itemName,
                        value: purchaseinfo.product.qbRefId
                      }
                    },
                    LineNum: iteamcounter,
                    Amount: qdetails.totalAmount,
                    Id: qdetails.id
                  };
                  detailsarray.push(linearry);
                } else {
                  var linsearry = {
                    DetailType: qdetails.detailType,
                    Amount: qdetails.totalAmount,
                    SalesItemLineDetail: {
                      ItemRef: {
                        name: purchaseinfo.product.itemName,
                        value: purchaseinfo.product.qbRefId
                      }
                    }
                  };
                  detailsarray.push(linsearry);
                }
                let details = await queryRunner.manager.save(InvoiceDetailsEntity, qdetails);

                console.log(purchaseinfo.product.itemType, "purchaseinfo.product.itemType");
                if (purchaseinfo.product.itemType == "Inventory") {
                  if (purchaseinfo.remaningqty > 0 && Number(purchaseinfo.remaningqty) - Number(qdetails.qty) > 0) {
                    let stockout = new StockHistoryDetailsEntity();
                    stockout.qty = qdetails.qty;
                    stockout.rate = qdetails.unitPrice;
                    stockout.totalAmount = qdetails.totalAmount;
                    stockout.remainingAmount = 0;
                    stockout.stockType = 1;
                    stockout.productId = qdetails.productId;
                    stockout.stockoutId = qdetails.id;
                    stockout.status = StatusField.ACTIVE;
                    stockout.createdAt = new Date();
                    stockout.updatedAt = new Date();
                    stockout.createdBy = userPayload.id;
                    stockout.organizationId = userPayload.organizationId;
                    stockout.updatedBy = 0;
                    stockout.deletedBy = 0;

                    await queryRunner.manager.save(StockHistoryDetailsEntity, stockout);

                    purchaseinfo.avgSalesRate =
                      (Number(purchaseinfo.sqty) * Number(purchaseinfo.avgSalesRate) + Number(qdetails.qty) * Number(qdetails.unitPrice)) / (Number(purchaseinfo.sqty) + Number(qdetails.qty));
                    purchaseinfo.sqty = Number(purchaseinfo.sqty) + Number(qdetails.qty);
                    purchaseinfo.soldAmount = Number(purchaseinfo.soldAmount) + Number(stockout.totalAmount);
                    purchaseinfo.remaningqty = purchaseinfo.remaningqty - qdetails.qty;

                    await queryRunner.manager.update(StockHistoryEntity, { id: purchaseinfo.id }, purchaseinfo);
                    //#region Stock History
                    let stockBody = {
                      ledgerId: purchaseinfo.product.ledgerId,
                      transactionDate: new Date(),
                      amount: qdetails.purchaseRate * details.qty,
                      transactionId: createentry.transactionId,
                      transactionSource: "Invoice Stock",
                      referenceId: details.id,
                      userId: userPayload.id,
                      remarks: "Stockout- " + details.qty + "Products",
                      transactionReference: createentry.invoiceNo,
                      organizationId: userPayload.organizationId
                    };

                    let creditcheck = await this.accountService.AddTransactionsStockCredit(stockBody, queryRunner);
                    //#endregion
                  } else {
                    //await queryRunner.rollbackTransaction()
                    exceptionmessage = `Insufficient Stock, Please purchase first.`;

                    // await queryRunner.rollbackTransaction()
                    throw new BadRequestException(`Insufficient Stock, Please purchase first.`);
                  }
                }

                iteamcounter++;
              }
            })
          );

          if (createInvoiceDto.items.length > 0) {
            //#region Accounts
            const body = {
              debitLedgerId: createentry.debitLedgerId,
              creditLedgerId: createentry.creditLedgerId,
              transactionDate: createentry.txnDate,
              debitAmount: createentry.totalAmt,
              creditAmount: createentry.totalAmt,
              referenceId: createentry.id,
              transactionId: createentry.transactionId,
              transactionSource: "Invoice",
              userId: userPayload.id,
              remarks: "Invoice- " + createentry.totalAmt + "/" + createentry.totalAmt + "-" + createentry.reference,
              transactionReference: createentry.invoiceNo,
              organizationId: userPayload.organizationId
            };

            const transaction = await this.accountService.addTransaction(body, queryRunner);
            console.log("transaction: " + transaction);

            if (transaction) {
              if (createentry.totalTax > 0) {
                let vataccount = await queryRunner.manager.findOne(AccountsEntity, { where: { name: "VAT Current Account", organizationId: userPayload.organizationId } });
                const bodyvat = {
                  debitLedgerId: createentry.creditLedgerId,
                  creditLedgerId: vataccount.id,
                  transactionDate: createentry.txnDate,
                  debitAmount: createentry.totalTax,
                  creditAmount: createentry.totalTax,
                  referenceId: createentry.id,
                  transactionId: createentry.transactionId,
                  transactionSource: "Invoice TAX",
                  userId: userPayload.id,
                  remarks: "VAT- " + createentry.totalTax + "/" + createentry.totalTax + "-" + createentry.reference,
                  transactionReference: createentry.invoiceNo,
                  organizationId: userPayload.organizationId
                };

                const transactionvat = await this.accountService.addTransaction(bodyvat, queryRunner);
              }

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
                  let customerinfo = await queryRunner1.manager.findOne(CustomersEntity, { where: { ledgerId: createentry.debitLedgerId } });
                  await qboobject.createInvoice(
                    {
                      Line: detailsarray,
                      CustomerRef: {
                        value: customerinfo.qbRefId
                      }
                    },
                    async function (err, Bill) {
                      if (err) {
                        throw new BadRequestException(err);
                      } else {
                        createentry.qbRefId = Bill.Id;

                        const insertData = await queryRunner1.manager.update(InvoiceEntity, { id: createentry.id }, createentry);

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
            } else {
              exceptionmessage = `Transaction filed!!`;

              await queryRunner.rollbackTransaction();
              //return `insert filed!!`;
              throw new BadRequestException(`Transaction filed!!`);
            }
            //#endregion
          }
        }
        exceptionmessage = `failed.`;
        return "Successful";
        throw new BadRequestException(`duplicate invoice found. please insert a unique one.`);
        //#endregion
      } else {
        exceptionmessage = `total amount is too low!!!please check it!!`;
        await queryRunner.rollbackTransaction();
        throw new BadRequestException(exceptionmessage);
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
  }

  // update invoice
  async updateInvoice(updateInvoiceDto: UpdateInvoiceDto, userPayload: UserInterface, id: number) {
    // using a QueryRunner:
    console.log("noman");

    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (updateInvoiceDto.debitLedgerId != 0 && updateInvoiceDto.totalAmt > 0) {
        const information = await queryRunner.manager.findOne(InvoiceEntity, { where: { id: id, organizationId: userPayload.organizationId } });
        const invoice = await queryRunner.manager.findOne(InvoiceEntity, { where: { id: id, organizationId: userPayload.organizationId } });
        console.log(invoice, "innn");

        let prevtotal = invoice.totalAmt;
        let prevvat = invoice.totalTax;
        let prevdue = invoice.totalDueAmount;
        let prevdebit = invoice.debitLedgerId;

        if (!invoice) {
          exceptionmessage = `This data not exist in DB!!!`;

          throw new BadRequestException(`This data not exist in DB!!!`);
        }
        const customerInfo = await this.ledgersService.findOneLedger(updateInvoiceDto.debitLedgerId);

        invoice.debitLedger = customerInfo;

        invoice.debitLedgerId = updateInvoiceDto.debitLedgerId;
        invoice.txnDate = new Date(updateInvoiceDto.txnDate);
        invoice.reference = updateInvoiceDto.reference;
        if (updateInvoiceDto.comment != null) invoice.comment = updateInvoiceDto.comment;
        else invoice.comment = "";
        invoice.totalAmt = updateInvoiceDto.totalAmt;
        invoice.totalTax = updateInvoiceDto.totalTax;
        invoice.docNumber = updateInvoiceDto.docNumber;
        invoice.billEmail = updateInvoiceDto.billEmail;
        invoice.totalDueAmount = Number(updateInvoiceDto.totalAmt) - Number(prevtotal) + Number(prevdue);
        invoice.terms = updateInvoiceDto.terms;
        invoice.txnType = updateInvoiceDto.txnType;
        invoice.billAddr = updateInvoiceDto.billAddr;
        invoice.shipAddr = updateInvoiceDto.shipAddr;
        invoice.applyTaxAfterDiscount = updateInvoiceDto.applyTaxAfterDiscount;
        invoice.netAmountTaxable = updateInvoiceDto.netAmountTaxable;
        invoice.txnId = updateInvoiceDto.txnId;
        invoice.subtotalAmount = updateInvoiceDto.subtotalAmount;
        invoice.updatedAt = new Date();
        invoice.updatedBy = userPayload.id;

        const logInfo = updateInvoiceDto?.ipPayload;

        let vatchangeamount = invoice.totalTax - prevvat;

        // Prepare Activity Log
        const log = {
          cLientIPAddress: logInfo.ip,
          browser: logInfo.browser,
          os: logInfo.os,
          userId: userPayload.id,
          messageDetails: {
            tag: "Customer Invoice",
            message: `Customer Invoice updated by ${decrypt(userPayload.hashType)}`,
            date: new Date()
          },
          logData: updateInvoiceDto,
          organizationId: userPayload.organizationId
        };
        console.log(invoice, "invoice");

        // update customer invoice data
        const invoiceData = await queryRunner.manager.update(InvoiceEntity, { id: id }, invoice);

        // Invoice Stock data
        let checkothers = false;
        await Promise.all(
          updateInvoiceDto.items.map(async (e) => {
            let detailId = e.id;
            if (detailId > 0) {
              let qdDetails = await queryRunner.manager.findOne(InvoiceDetailsEntity, {
                where: { id: detailId },
                relations: ["product"]
              });
              let previoustotal = qdDetails.qty * qdDetails.purchaseRate;

              qdDetails.invoiceId = invoice.id;

              qdDetails.productId = e.productId;
              qdDetails.description = e.description;

              qdDetails.unitPrice = e.sellingPrice;

              qdDetails.qty = e.qty;

              let purchaseinfo = await queryRunner.manager.findOne(StockHistoryEntity, {
                where: { productId: qdDetails.productId },
                relations: ["product"]
              });
              qdDetails.totalAmount = e.amount;
              // qdDetails.discount = e.discount;
              qdDetails.purchaseRate = purchaseinfo.avgPurchaseRate;

              let details = await queryRunner.manager.update(InvoiceDetailsEntity, { id: qdDetails.id }, qdDetails);
              console.log(purchaseinfo.product, "pppp");

              if (purchaseinfo.product.itemType == "Inventory") {
                let totalstockneeded = qdDetails.qty * qdDetails.purchaseRate - previoustotal;

                // stock history details
                let stockHistDetails = await queryRunner.manager.findOne(StockHistoryDetailsEntity, {
                  where: { stockoutId: qdDetails.id, stockType: 1 }
                });

                console.log(stockHistDetails, "stockHist");
                console.log("qdDetails.id: " + qdDetails.id);

                let currentprice = Number(purchaseinfo.sqty) + Number(qdDetails.qty) - Number(stockHistDetails.qty);

                if (currentprice != 0)
                  purchaseinfo.avgSalesRate =
                    Number(purchaseinfo.sqty) * Number(purchaseinfo.avgSalesRate) -
                    Number(stockHistDetails.qty) * Number(stockHistDetails.rate) +
                    (Number(qdDetails.qty) * Number(qdDetails.unitPrice)) / currentprice;

                purchaseinfo.sqty = purchaseinfo.sqty - Number(stockHistDetails.qty) + Number(qdDetails.qty);
                purchaseinfo.soldAmount = purchaseinfo.soldAmount - Number(stockHistDetails.qty) + Number(qdDetails.qty);
                purchaseinfo.remaningqty = Number(purchaseinfo.remaningqty) + Number(stockHistDetails.qty) - Number(qdDetails.qty);

                stockHistDetails.rate = qdDetails.unitPrice;

                stockHistDetails.totalAmount = qdDetails.totalAmount;
                console.log(stockHistDetails, "stockHist");

                await queryRunner.manager.update(StockHistoryDetailsEntity, { id: stockHistDetails.id }, stockHistDetails);

                await queryRunner.manager.update(StockHistoryEntity, { id: purchaseinfo.id }, purchaseinfo);

                const transactionStock = {
                  ledgerId: qdDetails.product.ledgerId,
                  transactionDate: new Date(),
                  amount: totalstockneeded,
                  transactionId: information.transactionId,
                  transactionSource: "Invoice Stock",
                  referenceId: qdDetails.id,
                  userId: userPayload.id,
                  remarks: "Stockout- " + totalstockneeded,
                  transactionReference: invoice.invoiceNo,
                  organizationId: userPayload.organizationId
                };
                console.log(transactionStock, "transactionStock");

                let assstocktradn = await this.accountService.AddTransactionsStockCredit(transactionStock, queryRunner);

                console.log("assstocktradn: " + assstocktradn);
              }
            } else {
              let invoiceDetails = new InvoiceDetailsEntity();

              invoiceDetails.invoiceId = invoice.id;
              invoiceDetails.productId = e.productId;
              invoiceDetails.description = e.description;
              invoiceDetails.unitPrice = e.sellingPrice;
              invoiceDetails.qty = e.qty;
              let purchaseinfo = await queryRunner.manager.findOne(StockHistoryEntity, {
                where: { productId: e.productId },
                relations: ["product"]
              });

              invoiceDetails.purchaseRate = purchaseinfo.avgPurchaseRate;

              invoiceDetails.totalAmount = e.salesRate * e.qty;
              invoiceDetails.createdAt = new Date();
              invoiceDetails.updatedAt = new Date();
              invoiceDetails.createdBy = userPayload.id;
              invoiceDetails.organizationId = userPayload.organizationId;
              invoiceDetails.updatedBy = 0;
              invoiceDetails.deletedBy = 0;

              invoiceDetails.totalAmount = e.amount;
              // qdDetails.discount = e.discount;
              invoiceDetails.purchaseRate = purchaseinfo.avgPurchaseRate;

              const details = queryRunner.manager.save(InvoiceDetailsEntity, invoiceDetails);

              if (purchaseinfo.remaningqty > 0 && purchaseinfo.remaningqty - e.qty > 0) {
                let stockout = new StockHistoryDetailsEntity();
                stockout.qty = e.qty;
                stockout.rate = e.sellingPrice;
                stockout.totalAmount = invoiceDetails.totalAmount;
                stockout.stockType = 1;
                stockout.productId = e.productId;
                stockout.stockoutId = (await details).id;
                stockout.createdAt = new Date();
                stockout.updatedAt = new Date();
                stockout.createdBy = userPayload.id;
                stockout.organizationId = userPayload.organizationId;
                stockout.updatedBy = 0;
                stockout.deletedBy = 0;
                await queryRunner.manager.save(StockHistoryDetailsEntity, stockout);

                purchaseinfo.avgSalesRate = (Number(purchaseinfo.sqty) * Number(purchaseinfo.avgSalesRate) + Number(e.qty) * Number(e.salesRate)) / (Number(purchaseinfo.sqty) + Number(e.qty));

                purchaseinfo.sqty = Number(purchaseinfo.sqty) + Number(e.qty);
                purchaseinfo.soldAmount = Number(purchaseinfo.soldAmount) + Number(stockout.totalAmount);
                purchaseinfo.remaningqty = purchaseinfo.remaningqty - stockout.qty;

                await queryRunner.manager.update(StockHistoryEntity, { id: purchaseinfo.id }, purchaseinfo);

                let totalstockneeded = e.qty * invoiceDetails.purchaseRate;
                let purchaseratetotal = 0.0;

                let stockBody = {
                  ledgerId: purchaseinfo.product.ledgerId,
                  transactionDate: new Date(),
                  amount: totalstockneeded,
                  transactionId: invoice.transactionId,
                  transactionSource: "Invoice Stock",
                  referenceId: (await details).id,
                  userId: userPayload.id,
                  remarks: "Stockout- " + 0.0,
                  transactionReference: invoice.invoiceNo,
                  organizationId: userPayload.organizationId
                };

                await this.accountService.AddTransactionsStockCredit(stockBody, queryRunner);
              }
            }
          })
        );

        let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, {
          where: { transactionId: information.transactionId, referenceID: information.id, transactionSource: "Invoice" }
        });

        if (transactioninforamtion.length != 0) {
          let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");
          let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");

          //#region Accounts
          if (information.totalAmt != updateInvoiceDto.totalAmt || information.comment != updateInvoiceDto.comment || information.reference != information.reference) {
            //#region Accounts

            const body = {
              debitTransactionId: debittransaction.id,
              creditTransactionId: credittransaction.id,
              transactionDate: updateInvoiceDto.txnDate,
              debitAmount: updateInvoiceDto.totalAmt,
              creditAmount: updateInvoiceDto.totalAmt,
              userId: userPayload.id,
              remarks: "@ " + updateInvoiceDto.comment + "-" + invoice.reference,
              transactionReference: information.invoiceNo
            };

            let transaction = await this.accountService.UpdateTransactions(body, queryRunner);

            if (transaction) {
              if (vatchangeamount != 0) {
                let transactioninforamtionvat = await queryRunner.manager.find(TransactionHistoryEntity, {
                  where: { transactionId: information.transactionId, referenceID: information.id, transactionSource: "Invoice VAT" }
                });
                let debittransactionvat = transactioninforamtionvat.find((a) => a.transactionType == "Dr");
                let credittransactionvat = transactioninforamtionvat.find((a) => a.transactionType == "Cr");

                const bodyvat = {
                  debitTransactionId: debittransactionvat.id,
                  creditTransactionId: credittransactionvat.id,
                  transactionDate: updateInvoiceDto.txnDate,
                  debitAmount: updateInvoiceDto.totalTax,
                  creditAmount: updateInvoiceDto.totalTax,
                  userId: userPayload.id,
                  remarks: "@ " + updateInvoiceDto.comment + "-" + invoice.reference,
                  transactionReference: information.invoiceNo
                };

                const transactionvat = await this.accountService.UpdateTransactions(bodyvat, queryRunner);
              }

              checkothers = true;
            }

            //#endregion
          }

          if (information.debitLedgerId != updateInvoiceDto.debitLedgerId) {
            //#region Accounts Debit Ledger Transactions
            let bodydebit = {
              trnasactionId: debittransaction.id,
              trnasacitonDate: invoice.txnDate,
              ledgerId: invoice.debitLedgerId,
              newAmount: invoice.totalAmt,
              userId: userPayload.id,
              organizationId: userPayload.organizationId
            };
            let transaction = await this.accountService.UpdateDebitLedgerTransactions(bodydebit, queryRunner);

            //#endregion

            if (transaction) {
              //#region Accounts Credit Ledger Transactions

              let bodycredit = {
                trnasactionId: credittransaction.id,
                trnasacitonDate: invoice.txnDate,
                ledgerId: invoice.creditLedgerId,
                newAmount: invoice.totalAmt,
                userId: userPayload.id,
                organizationId: userPayload.organizationId
              };

              let transaction1 = await this.accountService.UpdateCreditLedgerTransactions(bodycredit, queryRunner);

              if (transaction1) {
                //{
                //    "TxnDate": "2015-07-24",
                //        "domain": "QBO",
                //            "PrintStatus": "NeedToPrint",
                //                "TotalAmt": 150.0,
                //                    "Line": [
                //                        {
                //                            "LineNum": 1,
                //                            "Amount": 150.0,
                //                            "SalesItemLineDetail": {
                //                                "TaxCodeRef": {
                //                                    "value": "NON"
                //                                },
                //                                "ItemRef": {
                //                                    "name": "Services",
                //                                    "value": "1"
                //                                }
                //                            },
                //                            "Id": "1",
                //                            "DetailType": "SalesItemLineDetail"
                //                        },
                //                        {
                //                            "DetailType": "SubTotalLineDetail",
                //                            "Amount": 150.0,
                //                            "SubTotalLineDetail": {}
                //                        }
                //                    ],
                //                        "DueDate": "2015-08-23",
                //                            "ApplyTaxAfterDiscount": false,
                //                                "DocNumber": "1070",
                //                                    "sparse": false,
                //                                        "CustomerMemo": {
                //        "value": "Added customer memo."
                //    },
                //    "ProjectRef": {
                //        "value": "39298045"
                //    },
                //    "Balance": 150.0,
                //        "CustomerRef": {
                //        "name": "Amy's Bird Sanctuary",
                //            "value": "1"
                //    },
                //    "TxnTaxDetail": {
                //        "TotalTax": 0
                //    },
                //    "SyncToken": "0",
                //        "LinkedTxn": [],
                //            "ShipAddr": {
                //        "City": "Bayshore",
                //            "Line1": "4581 Finch St.",
                //                "PostalCode": "94326",
                //                    "Lat": "INVALID",
                //                        "Long": "INVALID",
                //                            "CountrySubDivisionCode": "CA",
                //                                "Id": "109"
                //    },
                //    "EmailStatus": "NotSet",
                //        "BillAddr": {
                //        "City": "Bayshore",
                //            "Line1": "4581 Finch St.",
                //                "PostalCode": "94326",
                //                    "Lat": "INVALID",
                //                        "Long": "INVALID",
                //                            "CountrySubDivisionCode": "CA",
                //                                "Id": "2"
                //    },
                //    "MetaData": {
                //        "CreateTime": "2015-07-24T10:35:08-07:00",
                //            "LastUpdatedTime": "2015-07-24T10:35:08-07:00"
                //    },
                //    "CustomField": [
                //        {
                //            "DefinitionId": "1",
                //            "Type": "StringType",
                //            "Name": "Crew #"
                //        }
                //    ],
                //        "Id": "239"
                //}

                await queryRunner.commitTransaction();
                return "Update";
              }
              checkothers = false;

              //#endregion
            }
            checkothers = false;
          }

          if (checkothers) {
            await queryRunner.commitTransaction();
            return "Update";
          }
          //#endregion
        }
        // Save Activity Log
        if (log) {
          await this.activityLogService.createLog(log, queryRunner);
        }
        await queryRunner.commitTransaction();
        return `invoice data updated successfully!!!`;
      } else {
        exceptionmessage = `total amount is too low!!!please check it!!`;
        await queryRunner.rollbackTransaction();
        throw new BadRequestException(exceptionmessage);
      }
    } catch (err) {
      // if we have errors, rollback changes we made
      console.log("eerrrr: " + err);

      try {
        await queryRunner.rollbackTransaction();
      } catch {}
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
  }

  // find all invoice data
  async findAllInvoiceDataUnpaid(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Customer Invoice",
        message: `All Customer Invoice fetched by ${decrypt(userPayload.hashType)}`,
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
      const [results, total] = await queryRunner.manager.findAndCount(InvoiceEntity, {
        where: [
          { organizationId: userPayload.organizationId, paymentStatus: "Open" },
          { organizationId: userPayload.organizationId, paymentStatus: "Partially Paid" }
        ],
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

  // find all invoice data
  async findAllInvoiceDataPaid(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Customer Invoice",
        message: `All Customer Invoice fetched by ${decrypt(userPayload.hashType)}`,
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
      const [results, total] = await queryRunner.manager.findAndCount(InvoiceEntity, {
        where: { organizationId: userPayload.organizationId, paymentStatus: "Paid", status: StatusField.ACTIVE },
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

  // delete invoice
  async deleteInvoice(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    // using a QueryRunner:
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    let exceptionmessage = "failed";

    try {
      const invoiceData = await queryRunner.manager.findOne(InvoiceEntity, {
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });

      if (!invoiceData) {
        exceptionmessage = "invoice not found";
        throw new NotFoundException("invoice not found");
      }

      let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, {
        where: { transactionId: invoiceData.transactionId, referenceID: invoiceData.id, transactionSource: "Invoice" }
      });

      if (transactioninforamtion.length != 0) {
        console.log("transactioninforamtion.length: " + transactioninforamtion);

        if (invoiceData.totalTax > 0) {
          let transactioninforamtionvat = await queryRunner.manager.find(TransactionHistoryEntity, {
            where: { transactionId: invoiceData.transactionId, referenceID: invoiceData.id, transactionSource: "Invoice VAT" }
          });
          let debittransactionvat = transactioninforamtionvat.find((a) => a.transactionType == "Dr");
          let credittransactionvat = transactioninforamtionvat.find((a) => a.transactionType == "Cr");

          let stockBodyvat = {
            debitTransactionId: debittransactionvat.id,
            creditTransactionId: credittransactionvat.id,
            userId: userPayload.id
          };

          const transactionvat = await this.accountService.DeleteTransactions(stockBodyvat, queryRunner);
        }

        let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");
        let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");

        let stockBody = {
          debitTransactionId: debittransaction.id,
          creditTransactionId: credittransaction.id,
          userId: userPayload.id
        };

        let deletetransaction = await this.accountService.DeleteTransactions(stockBody, queryRunner);
        console.log("deletetransaction: " + deletetransaction);

        if (deletetransaction) {
          try {
            var invoicedetails = await queryRunner.manager.find(InvoiceDetailsEntity, { where: { invoiceId: id }, relations: ["stockDetails", "product"] });
            await Promise.all(
              invoicedetails.map(async (e) => {
                var purchaseinfo = await queryRunner.manager.findOne(StockHistoryEntity, { where: { productId: e.productId }, relations: ["product"] });

                //#region Stock History
                let stockcreditBody = {
                  ledgerId: purchaseinfo.product.ledgerId,
                  transactionDate: new Date(),
                  amount: e.qty * e.purchaseRate,
                  transactionId: invoiceData.transactionId,
                  transactionSource: "Invoice Stock",
                  referenceId: e.id,
                  userId: userPayload.id,
                  remarks: "Revert- " + e.qty + "Products",
                  transactionReference: invoiceData.invoiceNo,
                  organizationId: userPayload.organizationId
                };

                let transactionstockrevert = await this.accountService.AddTransactionsStockDebit(stockcreditBody, queryRunner);

                //#endregion

                let stockhistorydetails = await queryRunner.manager.findOne(StockHistoryDetailsEntity, { where: { stockoutId: e.id } });

                let divisionbyzero = purchaseinfo.sqty - stockhistorydetails.qty;
                if (divisionbyzero > 0) purchaseinfo.avgSalesRate = (purchaseinfo.sqty * purchaseinfo.avgSalesRate - stockhistorydetails.qty * stockhistorydetails.rate) / divisionbyzero;

                purchaseinfo.sqty = purchaseinfo.sqty - stockhistorydetails.qty;
                purchaseinfo.soldAmount = purchaseinfo.sqty * purchaseinfo.avgSalesRate;
                purchaseinfo.remaningqty = Number(purchaseinfo.remaningqty) + Number(stockhistorydetails.qty);

                await queryRunner.manager.update(StockHistoryEntity, { id: purchaseinfo.id }, purchaseinfo);

                let deletetransaction = await queryRunner.manager.remove(StockHistoryDetailsEntity, stockhistorydetails);
              })
            );

            let deletetransaction = await queryRunner.manager.remove(InvoiceDetailsEntity, invoicedetails);

            console.log("deletetransaction: " + deletetransaction);
          } catch (ex) {
            console.log(ex);
            exceptionmessage = `Failed`;
          }
          let deletetransaction = await queryRunner.manager.remove(InvoiceEntity, invoiceData);
          console.log("deletetransaction: " + deletetransaction);
          // Prepare Activity Log
          const log = {
            cLientIPAddress: ipClientPayload.ip,
            browser: ipClientPayload.browser,
            os: ipClientPayload.os,
            userId: userPayload.id,
            messageDetails: {
              tag: "Customer Invoice",
              message: `Customer Invoice deleted by ${decrypt(userPayload.hashType)}`,
              date: new Date()
            },
            logData: invoiceData,
            organizationId: userPayload.organizationId
          };

          // Save Activity Log
          await this.activityLogService.createLog(log, queryRunner);
          //{
          //    "SyncToken": "3",
          //        "Id": "33"
          //}
          await queryRunner.commitTransaction();
          return invoiceData;
        } else {
          exceptionmessage = `Failed`;
          await queryRunner.rollbackTransaction();
          throw new BadRequestException(`Failed`);
        }
      }

      throw new BadRequestException(exceptionmessage);
      //return invoiceData;
    } catch (err) {
      // if we have errors, rollback changes we made
      console.log(err);

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
   * Get Single invoice data
   */
  async findSingleInvoice(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.invoiceRepository.findOne({
      where: {
        id: id,
        organizationId: userPayload.organizationId
      },
      relations: ["invoiceDetails"]
    });

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Customer Invoice",
        message: `Single Customer Invoice fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: data,
      organizationId: userPayload.organizationId
    };
    if (!data) {
      throw new NotFoundException(`invoice not exist in db!!`);
    }

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }

  /**
   * Get One invoice data
   */
  async findOneInvoice(id: number) {
    const data = await this.invoiceRepository.findOne({
      where: {
        id: id
      }
    });
    if (!data) {
      throw new NotFoundException(`invoice not exist in db!!`);
    }
    return data;
  }

  //  create invoice
  async ConverttoInvoice(id: number, userPayload: UserInterface): Promise<any> {
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    // using a QueryRunner:
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:

    let exceptionmessage = "failed";

    await queryRunner.startTransaction();
    const queryRunner1 = this.dataSource.createQueryRunner();
    try {
      const estimationinformation = await queryRunner.manager.findOne(EstimationEntity, { where: { id: id, organizationId: userPayload.organizationId, estimationStatus: "Open" } });

      if (estimationinformation) {
        if (estimationinformation.debitLedgerId != 0 && estimationinformation.totalAmt > 0) {
          var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(
            new Date((new Date().getFullYear() + new Date().getMonth() + new Date().getDate()).toString()),
            userPayload
          );
          //#region Invoice Creation
          const createentry = new InvoiceEntity();
          createentry.debitLedgerId = estimationinformation.debitLedgerId;
          var assetgroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Sales" } });

          var salesledger = await queryRunner.manager.findOne(AccountsEntity, { where: { ledgerParent: assetgroup.id, organizationId: userPayload.organizationId } });

          createentry.creditLedgerId = salesledger.id;
          createentry.txnDate = new Date();
          createentry.invoiceNo = await this.accountService.generateAllNumbersbasedonDate("Invoice", new Date(createentry.txnDate), userPayload);

          createentry.reference = estimationinformation.comment;
          createentry.comment = estimationinformation.comment;
          if (estimationinformation.comment != null) createentry.comment = estimationinformation.comment;
          else createentry.comment = "";

          createentry.applyTaxAfterDiscount = estimationinformation.applyTaxAfterDiscount;
          createentry.txnType = estimationinformation.txnType;
          createentry.totalTax = estimationinformation.totalTax;
          createentry.netAmountTaxable = estimationinformation.netAmountTaxable;
          createentry.totalAmt = estimationinformation.totalAmt;
          createentry.totalDueAmount = estimationinformation.totalAmt;
          createentry.paymentStatus = "Open";
          createentry.transactionId = TransactionID;

          createentry.createdAt = new Date();
          createentry.updatedAt = new Date();
          createentry.createdBy = userPayload.id;
          createentry.organizationId = userPayload.organizationId;

          createentry.updatedBy = 0;
          createentry.deletedBy = 0;

          await queryRunner.manager.save(InvoiceEntity, createentry);
          console.log("createentry: ", createentry);
          var quotationid = createentry.id;

          const estimatedProducts = await queryRunner.manager.find(EstimationDetailsEntity, { where: { estimationId: id, organizationId: userPayload.organizationId } });
          console.log("estimatedProducts: ", estimatedProducts);
          let detailsarray = [];
          let iteamcounter = 1;
          if (quotationid > 0) {
            await Promise.all(
              estimatedProducts.map(async (e) => {
                if (e.productId != 0 && e.productId != null && e.productId != undefined) {
                  let qdetails = new InvoiceDetailsEntity();
                  qdetails.invoiceId = createentry.id;
                  qdetails.productId = e.productId;
                  qdetails.unitPrice = e.unitPrice;
                  qdetails.qty = e.qty;

                  var purchaseinfo = await queryRunner.manager.findOne(StockHistoryEntity, {
                    where: { productId: qdetails.productId },
                    relations: ["product"]
                  });

                  qdetails.purchaseRate = purchaseinfo.avgPurchaseRate;
                  qdetails.detailType = "SalesItemLineDetail";
                  qdetails.totalAmount = Number(e.unitPrice * e.qty);
                  qdetails.createdAt = new Date();
                  qdetails.updatedAt = new Date();
                  qdetails.createdBy = userPayload.id;
                  qdetails.organizationId = userPayload.organizationId;
                  qdetails.updatedBy = 0;
                  qdetails.deletedBy = 0;

                  let details = await queryRunner.manager.save(InvoiceDetailsEntity, qdetails);
                  if (purchaseinfo.product.itemType == "Inventory") {
                    var linearry = {
                      DetailType: qdetails.detailType,
                      SalesItemLineDetail: {
                        TaxCodeRef: {
                          value: "NON"
                        },
                        Qty: qdetails.qty,
                        UnitPrice: qdetails.unitPrice,
                        ItemRef: {
                          name: purchaseinfo.product.itemName,
                          value: purchaseinfo.product.qbRefId
                        }
                      },
                      LineNum: iteamcounter,
                      Amount: qdetails.totalAmount,
                      Id: qdetails.id
                    };
                    detailsarray.push(linearry);
                  } else {
                    var linsearry = {
                      DetailType: qdetails.detailType,
                      Amount: qdetails.totalAmount,
                      SalesItemLineDetail: {
                        ItemRef: {
                          name: purchaseinfo.product.itemName,
                          value: purchaseinfo.product.qbRefId
                        }
                      }
                    };
                    detailsarray.push(linsearry);
                  }
                  if (purchaseinfo.product.itemType == "Inventory") {
                    if (purchaseinfo.remaningqty > 0 && purchaseinfo.remaningqty - qdetails.qty > 0) {
                      let stockout = new StockHistoryDetailsEntity();
                      stockout.qty = qdetails.qty;
                      stockout.rate = qdetails.unitPrice;
                      stockout.totalAmount = qdetails.totalAmount;
                      stockout.remainingAmount = purchaseinfo.remaningqty - qdetails.qty;
                      stockout.stockType = 1;
                      stockout.productId = qdetails.productId;
                      stockout.stockoutId = qdetails.id;
                      stockout.status = StatusField.ACTIVE;
                      stockout.createdAt = new Date();
                      stockout.updatedAt = new Date();
                      stockout.createdBy = userPayload.id;
                      stockout.organizationId = userPayload.organizationId;
                      stockout.updatedBy = 0;
                      stockout.deletedBy = 0;

                      await queryRunner.manager.save(StockHistoryDetailsEntity, stockout);

                      purchaseinfo.avgSalesRate =
                        (Number(purchaseinfo.sqty) * Number(purchaseinfo.avgSalesRate) + Number(qdetails.qty) * Number(qdetails.unitPrice)) / (Number(purchaseinfo.sqty) + Number(qdetails.qty));
                      purchaseinfo.sqty = Number(purchaseinfo.sqty) + Number(qdetails.qty);
                      purchaseinfo.soldAmount = Number(purchaseinfo.soldAmount) + Number(stockout.totalAmount);
                      purchaseinfo.remaningqty = purchaseinfo.remaningqty - qdetails.qty;

                      await queryRunner.manager.update(StockHistoryEntity, { id: purchaseinfo.id }, purchaseinfo);
                    }

                    //#region Stock History
                    let stockBody = {
                      ledgerId: purchaseinfo.product.ledgerId,
                      transactionDate: new Date(),
                      amount: qdetails.purchaseRate * details.qty,
                      transactionId: createentry.transactionId,
                      transactionSource: "Invoice Stock",
                      referenceId: details.id,
                      userId: userPayload.id,
                      remarks: "Stockout- " + details.qty + "Products",
                      transactionReference: createentry.invoiceNo,
                      organizationId: userPayload.organizationId
                    };

                    let creditcheck = await this.accountService.AddTransactionsStockCredit(stockBody, queryRunner);

                    //#endregion
                  } else {
                    //await queryRunner.rollbackTransaction()
                    exceptionmessage = `Insufficient Stock, Please purchase first.`;

                    // await queryRunner.rollbackTransaction()
                    throw new BadRequestException(`Insufficient Stock, Please purchase first.`);
                  }

                  iteamcounter++;
                }
              })
            );

            if (estimatedProducts.length > 0) {
              //#region Accounts
              const body = {
                debitLedgerId: createentry.debitLedgerId,
                creditLedgerId: createentry.creditLedgerId,
                transactionDate: createentry.txnDate,
                debitAmount: createentry.totalAmt,
                creditAmount: createentry.totalAmt,
                referenceId: createentry.id,
                transactionId: createentry.transactionId,
                transactionSource: "Invoice",
                userId: userPayload.id,
                remarks: "Invoice- " + createentry.totalAmt + "/" + createentry.totalAmt + "-" + createentry.reference,
                transactionReference: createentry.invoiceNo,
                organizationId: userPayload.organizationId
              };

              const transaction = await this.accountService.addTransaction(body, queryRunner);
              console.log("transaction: " + transaction);

              if (transaction) {
                if (createentry.totalTax > 0) {
                  let vataccount = await queryRunner.manager.findOne(AccountsEntity, { where: { name: "VAT Current Account", organizationId: userPayload.organizationId } });
                  const bodyvat = {
                    debitLedgerId: createentry.creditLedgerId,
                    creditLedgerId: vataccount.id,
                    transactionDate: createentry.txnDate,
                    debitAmount: createentry.totalTax,
                    creditAmount: createentry.totalTax,
                    referenceId: createentry.id,
                    transactionId: createentry.transactionId,
                    transactionSource: "Invoice VAT",
                    userId: userPayload.id,
                    remarks: "VAT- " + createentry.totalTax + "/" + createentry.totalTax + "-" + createentry.reference,
                    transactionReference: createentry.invoiceNo,
                    organizationId: userPayload.organizationId
                  };

                  const transactionvat = await this.accountService.addTransaction(bodyvat, queryRunner);
                }

                estimationinformation.estimationStatus = "Invoiced";
                await queryRunner.manager.update(EstimationEntity, { id: id }, estimationinformation);

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
                    let customerinfo = await queryRunner1.manager.findOne(CustomersEntity, { where: { ledgerId: createentry.debitLedgerId } });
                    await qboobject.createInvoice(
                      {
                        Line: detailsarray,
                        CustomerRef: {
                          value: customerinfo.qbRefId
                        }
                      },
                      async function (err, Bill) {
                        if (err) {
                          throw new BadRequestException(err);
                        } else {
                          createentry.qbRefId = Bill.Id;

                          const insertData = await queryRunner1.manager.update(InvoiceEntity, { id: createentry.id }, createentry);

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
              } else {
                exceptionmessage = `Transaction filed!!`;

                await queryRunner.rollbackTransaction();
                //return `insert filed!!`;
                throw new BadRequestException(`Transaction filed!!`);
              }
              //#endregion
            }
          }
          exceptionmessage = `failed.`;
          return "Successful";
          throw new BadRequestException(`duplicate invoice found. please insert a unique one.`);
          //#endregion
        }
      } else {
        exceptionmessage = "Already Invoiced";
        throw new BadRequestException(`Already Invoiced`);
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
      await queryRunner.release();
    }
  }

  //  create invoice
  async PayNowInvoice(id: number, userPayload: UserInterface): Promise<any> {
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    // using a QueryRunner:
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:

    let exceptionmessage = "failed";

    await queryRunner.startTransaction();
    try {
      const invoiceinformation = await queryRunner.manager.findOne(InvoiceEntity, { where: { id: id, organizationId: userPayload.organizationId, paymentStatus: Not("Paid") } });
      if (invoiceinformation) {
        const invoiceviewmodel = new InvoicePaymentViewModelEntity();
        invoiceviewmodel.id = invoiceinformation.id;
        invoiceviewmodel.invoiceNo = invoiceinformation.invoiceNo;
        invoiceviewmodel.txnDate = new Date(invoiceinformation.txnDate);
        invoiceviewmodel.bankreference = null;
        invoiceviewmodel.totalAmount = invoiceinformation.totalAmt;
        invoiceviewmodel.totalDueAmount = invoiceinformation.totalDueAmount;
        invoiceviewmodel.totalPaymentAmount = 0;
        invoiceviewmodel.file = null;
        invoiceviewmodel.LedgerId = invoiceinformation.debitLedgerId;
        return invoiceviewmodel;
      } else {
        exceptionmessage = "Already Paid";
        throw new BadRequestException(`Already Paid`);
      }
    } catch (err) {
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
  }

  //  create invoice
  async PayNowInvoiceMultiple(ids: number[], userPayload: UserInterface): Promise<any> {
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    // using a QueryRunner:
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:

    let exceptionmessage = "failed";

    await queryRunner.startTransaction();

    let allinvoiceinforamtion = [];
    try {
      if (ids.length > 0) {
        ids.forEach(async (invoiceid) => {
          let invoiceinformation = await queryRunner.manager.findOne(InvoiceEntity, { where: { id: invoiceid, organizationId: userPayload.organizationId, paymentStatus: Not("Paid") } });
          if (invoiceinformation) {
            const invoiceviewmodel = new InvoicePaymentViewModelEntity();
            invoiceviewmodel.id = invoiceinformation.id;
            invoiceviewmodel.invoiceNo = invoiceinformation.invoiceNo;
            invoiceviewmodel.txnDate = invoiceinformation.txnDate;
            invoiceviewmodel.bankreference = null;
            invoiceviewmodel.totalAmount = invoiceinformation.totalAmt;
            invoiceviewmodel.totalDueAmount = invoiceinformation.totalDueAmount;
            invoiceviewmodel.totalPaymentAmount = 0;
            invoiceviewmodel.file = null;
            invoiceviewmodel.LedgerId = invoiceinformation.debitLedgerId;
            allinvoiceinforamtion.push(invoiceviewmodel);
          }
        });
      }
      if (allinvoiceinforamtion.length > 0) return allinvoiceinforamtion;
      else {
        exceptionmessage = "Already Paid";
        throw new BadRequestException(`Already Paid`);
      }
    } catch (err) {
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
  }
}
