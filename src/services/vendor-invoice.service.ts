//Controller: PurchaseController
//Model: Purchase/Bills.cs
// View: Purchase/AllBills

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StatusField } from "src/authentication/common/enum";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { DataSource, Not } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";

import { AccountingGroupEntity, BillDetailsEntity, BillEntity, AccountsEntity, StockHistoryDetailsEntity, StockHistoryEntity, TransactionHistoryEntity, OrganizationEntity } from "../entities";
import { PurchaseOrderDetailsEntity } from "../entities/purchase-order-details.entity";
import { PurchaseOrderEntity } from "../entities/purchase-order.entity";
import { InvoicePaymentViewModelEntity } from "../viewentites/invoicepaymentViewModel.entity";
import { AccountService } from "./account.service";
import { ActivityLogService } from "./activity-log.service";
import { CreateVendorInvoiceDto } from "../dtos/payables/vendors-invoice/create-vendor-invoice.dto";
import { UpdateVendorInvoiceDto } from "../dtos/payables/vendors-invoice/update-vendor-invoice.dto";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";
let exceptionmessage = "Failed";

@Injectable()
export class VendorInvoiceService {
  constructor(
    @InjectRepository(BillEntity)
    private vendorInvoiceRepository: BaseRepository<BillEntity>,
    private readonly accountService: AccountService,
    private activityLogService: ActivityLogService,
    private dataSource: DataSource,
    private authservice: AuthService
  ) {}

  //  create supplier invoice
  async createVendorInvoice(createVendorInvoiceDto: CreateVendorInvoiceDto, userPayload: UserInterface): Promise<any> {
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }

    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (createVendorInvoiceDto.creditLedgerId != 0 && createVendorInvoiceDto.totalAmt > 0) {
        var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(createVendorInvoiceDto.txnDate), userPayload);

        const createentry = new BillEntity();
        var assetgroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Purchase" } });

        var salesledger = await queryRunner.manager.findOne(AccountsEntity, { where: { ledgerParent: assetgroup.id, organizationId: userPayload.organizationId } });

        createentry.debitLedgerId = salesledger.id;
        createentry.debitLedger = salesledger;

        createentry.creditLedgerId = createVendorInvoiceDto.creditLedgerId;
        var creditledger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createentry.creditLedgerId } });

        createentry.creditLedger = creditledger;

        createentry.txnDate = new Date(createVendorInvoiceDto.txnDate);
        createentry.billNo = await this.accountService.generateAllNumbersbasedonDate("PurchaseInvoice", new Date(createVendorInvoiceDto.txnDate), userPayload);
        createentry.reference = createVendorInvoiceDto.reference;
        createentry.comment = createVendorInvoiceDto.comment;
        createentry.totalAmt = createVendorInvoiceDto.totalAmt;
        createentry.totalDueAmount = createVendorInvoiceDto.totalAmt;
        createentry.billable = createVendorInvoiceDto.billable;
        createentry.paymentStatus = createVendorInvoiceDto.billable == true ? "Open" : "Non Billable";
        createentry.transactionId = TransactionID;
        createentry.vendorAddr = createVendorInvoiceDto.vendorAddr;
        createentry.createdAt = new Date();
        createentry.updatedAt = new Date();
        createentry.createdBy = userPayload.id;
        createentry.organizationId = userPayload.organizationId;
        createentry.updatedBy = 0;
        createentry.deletedBy = 0;
        if (createVendorInvoiceDto.file != null && createVendorInvoiceDto.file.ContentLength > 0) {
          createentry.refDoc = createVendorInvoiceDto.file;
        }

        //console.log(createentry, "transaction: ");
        await queryRunner.manager.save(BillEntity, createentry);
        //console.log("transaction: " + true);
        console.log(createentry, "create");

        if (createentry.id > 0) {
          let Line = [];

          //console.log("transaction: " + true);
          await Promise.all(
            createVendorInvoiceDto.items.map(async (e) => {
              if (e.productId != 0 && e.productId != null && e.productId != undefined) {
                let qdDetails = new BillDetailsEntity();
                qdDetails.billId = createentry.id;
                qdDetails.bill = createentry;
                qdDetails.productId = e.productId;

                let stockinfo = await queryRunner.manager.findOne(StockHistoryEntity, {
                  where: { productId: qdDetails.productId },
                  relations: ["product"]
                });

                qdDetails.product = stockinfo.product;
                qdDetails.unitPrice = e.unitPrice;
                qdDetails.qty = e.qty;
                if (e.taxRate > 0) {
                  let totalamount = e.unitPrice * e.qty;
                  let vat = totalamount * Number(0.16);
                  qdDetails.tax = vat;
                } else qdDetails.tax = 0;

                qdDetails.amount = Number(e.unitPrice) * Number(e.qty) + Number(qdDetails.tax);

                qdDetails.createdAt = new Date();
                qdDetails.updatedAt = new Date();
                qdDetails.createdBy = userPayload.id;
                qdDetails.organizationId = userPayload.organizationId;
                qdDetails.updatedBy = 0;
                qdDetails.deletedBy = 0;

                let details = await queryRunner.manager.save(BillDetailsEntity, qdDetails);
                const vendorRef = {
                  DetailType: "AccountBasedExpenseLineDetail",
                  Amount: qdDetails.amount,
                  Id: details.id,
                  AccountBasedExpenseLineDetail: {
                    AccountRef: {
                      value: "7"
                    }
                  }
                };
                console.log(vendorRef, "vendorRef");

                Line.push(vendorRef);

                //console.log(stockinfo, 'bill created');
                //#region Purchase History

                var previousqty = stockinfo.pqty;
                if (stockinfo != null) {
                  let actualunitPrice = Number(qdDetails.unitPrice) + Number(qdDetails.tax) / Number(qdDetails.qty);

                  stockinfo.avgPurchaseRate =
                    (Number(stockinfo.avgPurchaseRate) * Number(stockinfo.pqty) + Number(actualunitPrice) * Number(qdDetails.qty)) / (Number(stockinfo.pqty) + Number(qdDetails.qty));
                  stockinfo.pqty = Number(stockinfo.pqty) + Number(qdDetails.qty);
                  stockinfo.purchaseAmount = Number(stockinfo.pqty) * Number(stockinfo.avgPurchaseRate);
                  stockinfo.remaningqty = Number(stockinfo.remaningqty) + Number(qdDetails.qty);
                  stockinfo.updatedAt = new Date();
                  stockinfo.updatedBy = userPayload.id;

                  await queryRunner.manager.update(StockHistoryEntity, { id: stockinfo.id }, stockinfo);

                  let stockdetails = new StockHistoryDetailsEntity();
                  stockdetails.rate = actualunitPrice;
                  stockdetails.qty = qdDetails.qty;
                  stockdetails.totalAmount = Number(stockdetails.rate) * Number(stockdetails.qty);
                  stockdetails.productId = qdDetails.productId;
                  stockdetails.product = stockinfo.product;
                  stockdetails.stockinId = qdDetails.id;
                  stockdetails.stockType = 0;
                  stockdetails.remainingAmount = stockdetails.qty;
                  stockdetails.createdAt = new Date();
                  stockdetails.updatedAt = new Date();
                  stockdetails.createdBy = userPayload.id;
                  stockdetails.organizationId = userPayload.organizationId;
                  stockdetails.updatedBy = 0;
                  stockdetails.deletedBy = 0;

                  //stockdetails.status = status;
                  console.log("stockdetails: ", stockdetails);
                  await queryRunner.manager.save(StockHistoryDetailsEntity, stockdetails);
                }

                let stockBody = {
                  ledgerId: stockinfo.product.ledgerId,
                  transactionDate: new Date(),
                  amount: qdDetails.amount,
                  transactionId: createentry.transactionId,
                  transactionSource: "Purchase Stock",
                  referenceId: qdDetails.id,
                  userId: userPayload.id,
                  remarks: "Purchase- " + qdDetails.amount,
                  transactionReference: createentry.billNo
                };
                let creditcheck = await this.accountService.AddTransactionsStockDebit(stockBody, queryRunner);

                console.log("creditcheck: " + creditcheck);
                //#endregion
              }
            })
          );

          //console.log("transaction: " + true);

          if (createVendorInvoiceDto.items.length > 0) {
            //#region Accounts Transactions
            const body = {
              debitLedgerId: createentry.debitLedgerId,
              creditLedgerId: createentry.creditLedgerId,
              transactionDate: createentry.txnDate,
              debitAmount: createentry.totalAmt,
              creditAmount: createentry.totalAmt,
              referenceId: createentry.id,
              transactionId: createentry.transactionId,
              transactionSource: "Purchase",
              userId: userPayload.id,
              organizationId: userPayload.organizationId,
              remarks: "Purchase- " + createentry.totalAmt + "/" + createentry.totalAmt + "-" + createentry.reference,
              transactionReference: createentry.billNo
            };
            //lasttransactiononthisdata
            const transaction = await this.accountService.addTransaction(body, queryRunner);
            console.log(Line, "Line2");

            if (transaction) {
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

                  await qboobject.createBill(
                    {
                      Line,
                      VendorRef: {
                        value: "56"
                      }
                    },
                    async function (err, Bill) {
                      if (err) {
                        console.log(err, "err");

                        throw new BadRequestException(err);
                      } else {
                        createentry.qbRefId = Bill.Id;

                        const insertData = await queryRunner.manager.update(BillEntity, { id: createentry.id }, createentry);
                      }
                    }
                  );
                  await queryRunner.commitTransaction();

                  return createentry;
                }
              }
            }

            //#endregion
          }
        }
        exceptionmessage = `Transaction filed!!`;
        await queryRunner.rollbackTransaction();
        //return `insert filed!!`;
        throw new BadRequestException(`Transaction filed!!`);
      } else {
        exceptionmessage = `total amount is too low!!!please check it!!`;
        await queryRunner.rollbackTransaction();
        throw new BadRequestException(exceptionmessage);
      }
    } catch (err) {
      // if we have errors, rollback changes we made

      console.log(err);

      try {
        await queryRunner.rollbackTransaction();
      } catch {}

      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      // await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // update Vendor invoice
  async updateVendorInvoice(updateVendorInvoiceDto: UpdateVendorInvoiceDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (updateVendorInvoiceDto.creditLedgerId != 0 && updateVendorInvoiceDto.totalAmt > 0) {
        var inforamtion = await queryRunner.manager.findOne(BillEntity, {
          where: {
            id: id,
            organizationId: userPayload.organizationId
          }
        });
        if (inforamtion != null) {
          var createentry = await queryRunner.manager.findOne(BillEntity, {
            where: {
              id: id,
              organizationId: userPayload.organizationId
            }
          });
          if (createentry != null) {
            createentry.creditLedgerId = updateVendorInvoiceDto.creditLedgerId;
            var ledgerinfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: updateVendorInvoiceDto.creditLedgerId } });
            createentry.creditLedger = ledgerinfo;
            createentry.txnDate = new Date(updateVendorInvoiceDto.txnDate);
            createentry.reference = updateVendorInvoiceDto.reference;
            createentry.comment = updateVendorInvoiceDto.comment;
            createentry.vendorAddr = updateVendorInvoiceDto.vendorAddr;
            createentry.billable = updateVendorInvoiceDto.billable;
            createentry.paymentStatus = updateVendorInvoiceDto.billable == true ? "Open" : "Non Billable";

            createentry.totalAmt = updateVendorInvoiceDto.totalAmt;

            createentry.updatedAt = new Date();
            createentry.updatedBy = userPayload.id;
            await queryRunner.manager.update(BillEntity, { id: id }, createentry);

            let checkothers = false;

            await Promise.all(
              updateVendorInvoiceDto.items.map(async (e) => {
                let detailId = e.id;
                if (detailId > 0) {
                  let qdDetails = await queryRunner.manager.findOne(BillDetailsEntity, {
                    where: { id: detailId },
                    relations: ["product"]
                  });

                  let stockinfo = await queryRunner.manager.findOne(StockHistoryEntity, {
                    where: { productId: qdDetails.productId },
                    relations: ["product"]
                  });

                  var previoustotal = qdDetails.amount;

                  qdDetails.unitPrice = e.unitPrice;
                  qdDetails.qty = e.qty;
                  if (e.taxRate > 0) {
                    let totalamount = Number(e.unitPrice) * Number(e.qty);
                    let vat = totalamount * Number(0.16);
                    qdDetails.tax = vat;
                  } else qdDetails.tax = 0;

                  qdDetails.amount = Number(e.unitPrice) * Number(e.qty) + Number(qdDetails.tax);
                  qdDetails.updatedAt = new Date();
                  qdDetails.updatedBy = userPayload.id;
                  let details = await queryRunner.manager.update(BillDetailsEntity, { id: qdDetails.id }, qdDetails);

                  var removeoradd = qdDetails.amount - previoustotal;

                  if (stockinfo) {
                    var stockdetails = await queryRunner.manager.findOne(StockHistoryDetailsEntity, {
                      where: { stockinId: qdDetails.id, stockType: 0 }
                    });

                    let divisionbyzero = stockinfo.pqty - stockdetails.qty;
                    if (divisionbyzero != 0) stockinfo.avgPurchaseRate = (stockinfo.pqty * stockinfo.avgPurchaseRate - stockdetails.rate * stockdetails.qty) / divisionbyzero;

                    stockinfo.pqty = Number(stockinfo.pqty) - Number(stockdetails.qty);
                    stockinfo.purchaseAmount = stockinfo.pqty * stockinfo.avgPurchaseRate;
                    stockinfo.remaningqty = stockinfo.remaningqty - stockdetails.qty;

                    let actualunitPrice = Number(qdDetails.unitPrice) + Number(qdDetails.tax);

                    stockinfo.avgPurchaseRate =
                      (Number(stockinfo.avgPurchaseRate) * Number(stockinfo.pqty) + Number(actualunitPrice) * Number(qdDetails.qty)) / (Number(stockinfo.pqty) + Number(qdDetails.qty));
                    stockinfo.pqty = Number(stockinfo.pqty) + Number(qdDetails.qty);
                    stockinfo.purchaseAmount = stockinfo.pqty * stockinfo.avgPurchaseRate;
                    stockinfo.remaningqty = Number(stockinfo.remaningqty) + Number(qdDetails.qty);
                    stockinfo.updatedAt = new Date();
                    stockinfo.updatedBy = userPayload.id;

                    await queryRunner.manager.update(StockHistoryEntity, { id: stockinfo.id }, stockinfo);

                    stockdetails.rate = actualunitPrice;
                    stockdetails.qty = qdDetails.qty;
                    stockdetails.totalAmount = stockdetails.rate * stockdetails.qty;

                    stockdetails.updatedAt = new Date();
                    stockdetails.updatedBy = userPayload.id;
                    await queryRunner.manager.update(StockHistoryDetailsEntity, { id: stockdetails.id }, stockdetails);

                    const transactionStock = {
                      ledgerId: qdDetails.product.ledgerId,
                      transactionDate: new Date(),
                      amount: removeoradd,
                      transactionId: createentry.transactionId,
                      transactionSource: "Purchase Stock",
                      referenceID: qdDetails.id,
                      userId: userPayload.id,
                      remarks: "Purchase- " + removeoradd,
                      transactionReference: createentry.billNo,
                      organizationId: userPayload.organizationId
                    };
                    console.log("transactionStock: ", transactionStock);
                    let assstocktradn = await this.accountService.AddTransactionsStockDebit(transactionStock, queryRunner);

                    console.log("assstocktradn: " + assstocktradn);
                  }
                } else {
                  if (e.productId != 0 && e.productId != null && e.productId != undefined) {
                    let qdDetails = new BillDetailsEntity();
                    qdDetails.billId = createentry.id;
                    qdDetails.bill = createentry;
                    qdDetails.productId = e.productId;

                    let stockinfo = await queryRunner.manager.findOne(StockHistoryEntity, {
                      where: { productId: qdDetails.productId },
                      relations: ["product"]
                    });

                    qdDetails.product = stockinfo.product;
                    if (e.taxRate > 0) {
                      let totalamount = Number(e.unitPrice) * Number(e.qty);
                      let vat = totalamount * Number(0.16);
                      qdDetails.tax = vat;
                    } else qdDetails.tax = 0;

                    qdDetails.unitPrice = e.unitPrice;
                    qdDetails.qty = e.qty;
                    //qdDetails.totalAmount = qdDetails.unitPrice * e.qty;
                    qdDetails.amount = Number(e.unitPrice) * Number(e.qty) + Number(qdDetails.tax);

                    qdDetails.createdAt = new Date();
                    qdDetails.updatedAt = new Date();
                    qdDetails.createdBy = userPayload.id;
                    qdDetails.organizationId = userPayload.organizationId;
                    qdDetails.updatedBy = 0;
                    qdDetails.deletedBy = 0;

                    let details = await queryRunner.manager.save(BillDetailsEntity, qdDetails);
                    //console.log(stockinfo, 'bill created');
                    //#region Purchase History

                    var previousqty = stockinfo.pqty;
                    if (stockinfo != null) {
                      let actualunitPrice = Number(qdDetails.unitPrice) + Number(qdDetails.tax) / Number(qdDetails.qty);

                      stockinfo.avgPurchaseRate =
                        (Number(stockinfo.avgPurchaseRate) * Number(stockinfo.pqty) + Number(actualunitPrice) * Number(qdDetails.qty)) / (Number(stockinfo.pqty) + Number(qdDetails.qty));
                      stockinfo.pqty = Number(stockinfo.pqty) + Number(qdDetails.qty);
                      stockinfo.purchaseAmount = stockinfo.pqty * stockinfo.avgPurchaseRate;
                      stockinfo.remaningqty = Number(stockinfo.remaningqty) + Number(qdDetails.qty);
                      stockinfo.updatedAt = new Date();
                      stockinfo.updatedBy = userPayload.id;

                      await queryRunner.manager.update(StockHistoryEntity, { id: stockinfo.id }, stockinfo);

                      let stockdetails = new StockHistoryDetailsEntity();
                      stockdetails.rate = actualunitPrice;
                      stockdetails.qty = qdDetails.qty;
                      stockdetails.totalAmount = stockdetails.rate * stockdetails.qty;
                      stockdetails.productId = qdDetails.productId;
                      stockdetails.product = stockinfo.product;
                      stockdetails.stockinId = qdDetails.id;
                      stockdetails.stockType = 0;
                      stockdetails.remainingAmount = stockdetails.qty;
                      stockdetails.createdAt = new Date();
                      stockdetails.updatedAt = new Date();
                      stockdetails.createdBy = userPayload.id;
                      stockdetails.organizationId = userPayload.organizationId;
                      stockdetails.updatedBy = 0;
                      stockdetails.deletedBy = 0;

                      stockdetails.status = StatusField.ACTIVE;

                      await queryRunner.manager.save(StockHistoryDetailsEntity, stockdetails);
                    }

                    let stockBody = {
                      ledgerId: stockinfo.product.ledgerId,
                      transactionDate: new Date(),
                      amount: qdDetails.amount,
                      transactionId: createentry.transactionId,
                      transactionSource: "Purchase Stock",
                      referenceID: qdDetails.id,
                      userId: userPayload.id,
                      remarks: "Purchase- " + qdDetails.amount,
                      transactionReference: createentry.billNo
                    };
                    let creditcheck = await this.accountService.AddTransactionsStockDebit(stockBody, queryRunner);

                    console.log("creditcheck: " + creditcheck);
                    //#endregion
                  }
                }
              })
            );

            let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, { where: { transactionId: inforamtion.transactionId, referenceID: inforamtion.id } });

            console.log(transactioninforamtion, "transactioni");

            if (transactioninforamtion.length != 0) {
              let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");
              let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");
              console.log(inforamtion, "info");

              if (inforamtion.totalAmt != updateVendorInvoiceDto.totalAmt || inforamtion.comment != updateVendorInvoiceDto.comment || inforamtion.reference != createentry.reference) {
                //#region Accounts

                const body = {
                  debitTransactionId: debittransaction.id,
                  creditTransactionId: credittransaction.id,
                  transactionDate: updateVendorInvoiceDto.txnDate,
                  debitAmount: updateVendorInvoiceDto.totalAmt,
                  creditAmount: updateVendorInvoiceDto.totalAmt,
                  userId: userPayload.id,
                  remarks: "@ " + updateVendorInvoiceDto.comment + "-" + updateVendorInvoiceDto.reference,
                  transactionReference: inforamtion.billNo
                };

                let transaction = await this.accountService.UpdateTransactions(body, queryRunner);
                console.log(transaction, "transactionnnn");

                if (transaction) {
                  checkothers = true;
                }

                //#endregion
              }
              console.log("ddd");

              if (inforamtion.creditLedgerId != updateVendorInvoiceDto.creditLedgerId) {
                //#region Accounts Debit Ledger Transactions
                console.log("inforamtion");

                let bodydebit = {
                  trnasactionId: debittransaction.id,
                  trnasacitonDate: createentry.txnDate,
                  ledgerId: createentry.debitLedgerId,
                  newAmount: createentry.totalAmt,
                  userId: userPayload.id,
                  organizationId: userPayload.organizationId
                };
                let transaction = await this.accountService.UpdateDebitLedgerTransactions(bodydebit, queryRunner);
                console.log(transaction, "transaction2");

                if (transaction) {
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
                  console.log("inforamtion", transaction1);

                  if (transaction1) {
                    await queryRunner.commitTransaction();
                    return "Update";
                  }
                  checkothers = false;
                  //#endregion
                }

                //#endregion

                checkothers = false;
              }
              //{
              //    "DocNumber": "56789",
              //        "SyncToken": "1",
              //            "domain": "QBO",
              //                "APAccountRef": {
              //        "name": "Accounts Payable",
              //            "value": "49"
              //    },
              //    "VendorRef": {
              //        "name": "Bayshore CalOil Service",
              //            "value": "81"
              //    },
              //    "TxnDate": "2014-04-04",
              //        "TotalAmt": 200.0,
              //            "CurrencyRef": {
              //        "name": "United States Dollar",
              //            "value": "USD"
              //    },
              //    "PrivateNote": "This is a updated memo.",
              //        "SalesTermRef": {
              //        "value": "12"
              //    },
              //    "DepartmentRef": {
              //        "name": "Garden Services",
              //            "value": "1"
              //    },
              //    "DueDate": "2013-06-09",
              //        "sparse": false,
              //            "Line": [
              //                {
              //                    "Description": "Gasoline",
              //                    "DetailType": "AccountBasedExpenseLineDetail",
              //                    "ProjectRef": {
              //                        "value": "39298034"
              //                    },
              //                    "Amount": 200.0,
              //                    "Id": "1",
              //                    "AccountBasedExpenseLineDetail": {
              //                        "TaxCodeRef": {
              //                            "value": "TAX"
              //                        },
              //                        "AccountRef": {
              //                            "name": "Automobile",
              //                            "value": "75"
              //                        },
              //                        "BillableStatus": "Billable",
              //                        "CustomerRef": {
              //                            "name": "Blackwell, Edward",
              //                            "value": "20"
              //                        },
              //                        "MarkupInfo": {
              //                            "Percent": 10
              //                        }
              //                    }
              //                }
              //            ],
              //                "Balance": 200.0,
              //                    "Id": "890",
              //                        "MetaData": {
              //        "CreateTime": "2014-04-04T12:38:01-07:00",
              //            "LastUpdatedTime": "2014-04-04T12:48:56-07:00"
              //    }
              //}
              if (checkothers) {
                await queryRunner.commitTransaction();
                return "Update";
              }
            }
          }
        }

        await queryRunner.rollbackTransaction();
        return "Failed";
      } else {
        exceptionmessage = `total amount is too low!!!please check it!!`;
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

  // find all Vendor invoice data
  async findAllVendorUnPaidInvoiceData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Vendor Invoice",
        message: `All Vendor Invoice fetched by ${decrypt(userPayload.hashType)}`,
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
      const [results, total] = await queryRunner.manager.findAndCount(BillEntity, {
        where: [
          { organizationId: userPayload.organizationId, paymentStatus: "Open" },
          { organizationId: userPayload.organizationId, paymentStatus: "Partially Paid" }
        ],
        relations: ["creditLedger"],
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

  // find all Vendor invoice data
  async findAllVendorPaidInvoiceData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Vendor Invoice",
        message: `All Vendor Invoice fetched by ${decrypt(userPayload.hashType)}`,
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
      const [results, total] = await queryRunner.manager.findAndCount(BillEntity, {
        where: { organizationId: userPayload.organizationId, paymentStatus: "Paid", status: StatusField.ACTIVE },
        relations: ["creditLedger"],
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

  // delete Vendor invoice
  async deleteVendorInvoice(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      var inforamtion = await queryRunner.manager.findOne(BillEntity, {
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });
      console.log(inforamtion, "inforamtion: ");

      if (inforamtion != null) {
        let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, {
          where: { transactionId: inforamtion.transactionId, referenceID: inforamtion.id, transactionSource: "Purchase" }
        });
        if (transactioninforamtion.length > 0) {
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
              let invoicedetails = await queryRunner.manager.find(BillDetailsEntity, { where: { billId: id }, relations: ["product"] });
              console.log(invoicedetails, invoicedetails);

              await Promise.all(
                invoicedetails.map(async (e) => {
                  let purchaseinfo = await queryRunner.manager.findOne(StockHistoryEntity, { where: { productId: e.productId }, relations: ["product"] });

                  //#region Stock History
                  if (purchaseinfo != null) {
                    let stockdetails = await queryRunner.manager.findOne(StockHistoryDetailsEntity, { where: { stockinId: e.id }, relations: ["product"] });

                    let subtra = purchaseinfo.pqty - stockdetails.qty;
                    if (subtra != 0) purchaseinfo.avgPurchaseRate = (purchaseinfo.purchaseAmount - stockdetails.qty * stockdetails.rate) / subtra;

                    purchaseinfo.pqty = purchaseinfo.pqty - stockdetails.qty;
                    purchaseinfo.purchaseAmount = purchaseinfo.pqty * purchaseinfo.avgPurchaseRate;
                    purchaseinfo.remaningqty = purchaseinfo.remaningqty - stockdetails.qty;
                    purchaseinfo.updatedAt = new Date();
                    purchaseinfo.updatedBy = userPayload.id;

                    await queryRunner.manager.update(StockHistoryEntity, { id: purchaseinfo.id }, purchaseinfo);

                    let deletetransaction = await queryRunner.manager.remove(StockHistoryDetailsEntity, stockdetails);

                    let stockcreditBody = {
                      ledgerId: e.product.ledgerId,
                      transactionDate: new Date(),
                      amount: e.amount,
                      transactionId: inforamtion.transactionId,
                      transactionSource: "Purchase Stock",
                      referenceId: e.id,
                      userId: userPayload.id,
                      remarks: "Revert- " + e.amount,
                      transactionReference: inforamtion.billNo,
                      organizationId: userPayload.organizationId
                    };

                    let stockdata = await this.accountService.AddTransactionsStockCredit(stockcreditBody, queryRunner);

                    console.log(stockdata, "stockdata");
                  }

                  //#endregion
                })
              );

              await queryRunner.manager.remove(BillDetailsEntity, invoicedetails);
            } catch {}

            await queryRunner.manager.remove(BillEntity, inforamtion);
            console.log("deletetransaction: " + deletetransaction);
            const log = {
              cLientIPAddress: ipClientPayload.ip,
              browser: ipClientPayload.browser,
              os: ipClientPayload.os,
              userId: userPayload.id,
              messageDetails: {
                tag: "Vendor Invoice",
                message: `Vendor Invoice deleted by ${decrypt(userPayload.hashType)}`,
                date: new Date()
              },
              logData: inforamtion,
              organizationId: userPayload.organizationId
            };

            // Save Activity Log
            await this.activityLogService.createLog(log, queryRunner);
            //{
            //    "SyncToken": "0",
            //        "Id": "108"
            //}
            await queryRunner.commitTransaction();
            return inforamtion;
          }
        }
      }
      exceptionmessage = "invoice not found";
      throw new NotFoundException("invoice not found");
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
   * Get One Vendor invoice data
   */
  async findOneVendorInvoice(id: number, userPayload: UserInterface) {
    const data = await this.vendorInvoiceRepository.findOne({
      where: {
        id: id,
        organizationId: userPayload.organizationId
      },
      relations: ["billDetails"]
    });
    if (!data) {
      throw new NotFoundException(`Vendor invoice not exist in db!!`);
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
    try {
      const purchaseorderinformation = await queryRunner.manager.findOne(PurchaseOrderEntity, { where: { id: id, organizationId: userPayload.organizationId, poStatus: "Open" } });
      if (purchaseorderinformation) {
        if (purchaseorderinformation.creditLedgerId != 0 && purchaseorderinformation.totalAmt > 0) {
          var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(
            new Date((new Date().getFullYear() + new Date().getMonth() + new Date().getDate()).toString()),
            userPayload
          );

          const createentry = new BillEntity();
          var assetgroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Purchase" } });

          var salesledger = await queryRunner.manager.findOne(AccountsEntity, { where: { ledgerParent: assetgroup.id, organizationId: userPayload.organizationId } });

          createentry.debitLedgerId = salesledger.id;
          createentry.debitLedger = salesledger;

          createentry.creditLedgerId = purchaseorderinformation.creditLedgerId;
          var creditledger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createentry.creditLedgerId } });

          createentry.creditLedger = creditledger;

          createentry.txnDate = new Date();
          createentry.billNo = await this.accountService.generateAllNumbersbasedonDate("PurchaseInvoice", new Date(createentry.txnDate), userPayload);
          createentry.reference = purchaseorderinformation.reference;
          createentry.comment = purchaseorderinformation.comment;

          createentry.totalAmt = purchaseorderinformation.totalAmt;
          createentry.totalDueAmount = purchaseorderinformation.totalAmt;
          createentry.paymentStatus = "Open";
          createentry.transactionId = TransactionID;
          createentry.createdAt = new Date();
          createentry.updatedAt = new Date();
          createentry.createdBy = userPayload.id;
          createentry.organizationId = userPayload.organizationId;
          createentry.updatedBy = 0;
          createentry.deletedBy = 0;

          //console.log(createentry, "transaction: ");
          await queryRunner.manager.save(BillEntity, createentry);
          console.log("transaction: " + true);

          const estimatedProducts = await queryRunner.manager.find(PurchaseOrderDetailsEntity, { where: { orderId: id, organizationId: userPayload.organizationId } });
          console.log("estimatedProducts: " + estimatedProducts);
          if (createentry.id > 0) {
            //console.log("transaction: " + true);
            await Promise.all(
              estimatedProducts.map(async (e) => {
                if (e.productId != 0 && e.productId != null && e.productId != undefined) {
                  let qdDetails = new BillDetailsEntity();
                  qdDetails.billId = createentry.id;
                  qdDetails.bill = createentry;
                  qdDetails.productId = e.productId;

                  let stockinfo = await queryRunner.manager.findOne(StockHistoryEntity, {
                    where: { productId: qdDetails.productId },
                    relations: ["product"]
                  });
                  console.log("transaction: " + stockinfo);
                  qdDetails.product = stockinfo.product;
                  qdDetails.unitPrice = e.unitPrice;
                  qdDetails.qty = e.qty;
                  if (e.taxPercent > 0) {
                    qdDetails.taxCodeRef = "TAX";
                    let totalamount = e.unitPrice * e.qty;
                    let vat = totalamount * Number(e.taxPercent / 100);
                    qdDetails.tax = vat;
                  } else {
                    qdDetails.taxCodeRef = "NON";
                    qdDetails.tax = 0;
                  }

                  qdDetails.amount = Number(e.unitPrice) * Number(e.qty) + Number(qdDetails.tax);

                  qdDetails.createdAt = new Date();
                  qdDetails.updatedAt = new Date();
                  qdDetails.createdBy = userPayload.id;
                  qdDetails.organizationId = userPayload.organizationId;
                  qdDetails.updatedBy = 0;
                  qdDetails.deletedBy = 0;

                  let details = await queryRunner.manager.save(BillDetailsEntity, qdDetails);
                  console.log(stockinfo, "bill created");
                  //#region Purchase History
                  var previousqty = stockinfo.pqty;
                  if (stockinfo != null) {
                    let actualunitPrice = Number(qdDetails.unitPrice) + Number(qdDetails.tax) / Number(qdDetails.qty);

                    stockinfo.avgPurchaseRate =
                      (Number(stockinfo.avgPurchaseRate) * Number(stockinfo.pqty) + Number(actualunitPrice) * Number(qdDetails.qty)) / (Number(stockinfo.pqty) + Number(qdDetails.qty));
                    stockinfo.pqty = Number(stockinfo.pqty) + Number(qdDetails.qty);
                    stockinfo.purchaseAmount = Number(stockinfo.pqty) * Number(stockinfo.avgPurchaseRate);
                    stockinfo.remaningqty = Number(stockinfo.remaningqty) + Number(qdDetails.qty);
                    stockinfo.updatedAt = new Date();
                    stockinfo.updatedBy = userPayload.id;

                    await queryRunner.manager.update(StockHistoryEntity, { id: stockinfo.id }, stockinfo);

                    let stockdetails = new StockHistoryDetailsEntity();
                    stockdetails.rate = actualunitPrice;
                    stockdetails.qty = qdDetails.qty;
                    stockdetails.totalAmount = Number(stockdetails.rate) * Number(stockdetails.qty);
                    stockdetails.productId = qdDetails.productId;
                    stockdetails.product = stockinfo.product;
                    stockdetails.stockinId = qdDetails.id;
                    stockdetails.stockType = 0;
                    stockdetails.remainingAmount = stockdetails.qty;
                    stockdetails.createdAt = new Date();
                    stockdetails.updatedAt = new Date();
                    stockdetails.createdBy = userPayload.id;
                    stockdetails.organizationId = userPayload.organizationId;
                    stockdetails.updatedBy = 0;
                    stockdetails.deletedBy = 0;

                    stockdetails.status = StatusField.ACTIVE;

                    await queryRunner.manager.save(StockHistoryDetailsEntity, stockdetails);
                  }

                  let stockBody = {
                    ledgerId: stockinfo.product.ledgerId,
                    transactionDate: new Date(),
                    amount: qdDetails.amount,
                    transactionId: createentry.transactionId,
                    transactionSource: "Purchase Stock",
                    referenceId: qdDetails.id,
                    userId: userPayload.id,
                    remarks: "Purchase- " + qdDetails.amount,
                    transactionReference: createentry.billNo
                  };
                  let creditcheck = await this.accountService.AddTransactionsStockDebit(stockBody, queryRunner);

                  console.log("creditcheck: " + creditcheck);
                  //#endregion
                }
              })
            );

            console.log("transaction: " + true);

            if (estimatedProducts.length > 0) {
              //#region Accounts Transactions
              const body = {
                debitLedgerId: createentry.debitLedgerId,
                creditLedgerId: createentry.creditLedgerId,
                transactionDate: createentry.txnDate,
                debitAmount: createentry.totalAmt,
                creditAmount: createentry.totalAmt,
                referenceId: createentry.id,
                transactionId: createentry.transactionId,
                transactionSource: "Purchase",
                userId: userPayload.id,
                organizationId: userPayload.organizationId,
                remarks: "Purchase- " + createentry.totalAmt + "-" + createentry.reference,
                transactionReference: createentry.billNo
              };
              //lasttransactiononthisdata
              const transaction = await this.accountService.addTransaction(body, queryRunner);
              console.log("transactionzzzz: ", transaction);
              if (transaction) {
                purchaseorderinformation.poStatus = "Invoiced";
                await queryRunner.manager.update(PurchaseOrderEntity, { id: id }, purchaseorderinformation);

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

                    await qboobject.createBill(
                      {
                        Line: [
                          {
                            DetailType: "AccountBasedExpenseLineDetail",
                            Amount: 200.0,
                            Id: "1",
                            AccountBasedExpenseLineDetail: {
                              AccountRef: {
                                value: "7"
                              }
                            }
                          }
                        ],
                        VendorRef: {
                          value: "56"
                        }
                      },
                      async function (err, Bill) {
                        if (err) {
                          throw new BadRequestException(err);
                        } else {
                          createentry.qbRefId = Bill.Id;

                          const insertData = await queryRunner.manager.update(BillEntity, { id: createentry.id }, createentry);

                          await queryRunner.commitTransaction();

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
          }
          exceptionmessage = `Transaction filed!!`;
          await queryRunner.rollbackTransaction();
          //return `insert filed!!`;
          throw new BadRequestException(`Transaction filed!!`);
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
      const invoiceinformation = await queryRunner.manager.findOne(BillEntity, { where: { id: id, organizationId: userPayload.organizationId, paymentStatus: Not("Paid") } });
      if (invoiceinformation) {
        const invoiceviewmodel = new InvoicePaymentViewModelEntity();
        invoiceviewmodel.id = invoiceinformation.id;
        invoiceviewmodel.invoiceNo = invoiceinformation.billNo;
        invoiceviewmodel.txnDate = invoiceinformation.txnDate;
        invoiceviewmodel.bankreference = null;
        invoiceviewmodel.totalAmount = invoiceinformation.totalAmt;
        invoiceviewmodel.totalDueAmount = invoiceinformation.totalDueAmount;
        invoiceviewmodel.totalPaymentAmount = 0;
        invoiceviewmodel.LedgerId = invoiceinformation.creditLedgerId;
        invoiceviewmodel.file = null;
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
          let invoiceinformation = await queryRunner.manager.findOne(BillEntity, { where: { id: invoiceid, organizationId: userPayload.organizationId, paymentStatus: Not("Paid") } });
          if (invoiceinformation) {
            let invoiceviewmodel = new InvoicePaymentViewModelEntity();
            invoiceviewmodel.id = invoiceinformation.id;
            invoiceviewmodel.invoiceNo = invoiceinformation.billNo;
            invoiceviewmodel.txnDate = invoiceinformation.txnDate;
            invoiceviewmodel.bankreference = null;
            invoiceviewmodel.totalAmount = invoiceinformation.totalAmt;
            invoiceviewmodel.totalDueAmount = invoiceinformation.totalDueAmount;
            invoiceviewmodel.totalPaymentAmount = 0;
            invoiceviewmodel.file = null;
            invoiceviewmodel.LedgerId = invoiceinformation.creditLedgerId;
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
