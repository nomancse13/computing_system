// Contrller: InvoiceController
//Function: AllCreditMemo
// Model: CreditNote/CreditNotes
// View: Invoice/AllCreditMemo

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { CreateCreditMemoDto, UpdateCreditMemoDto } from "src/dtos/receivables/sales-return";
import { AccountingGroupEntity, CreditNotesEntity, AccountsEntity, TransactionHistoryEntity, ProductsEntity, OrganizationEntity, CustomersEntity } from "src/entities";
import { decrypt } from "src/helper/crypto.helper";
import { Brackets, DataSource } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { AccountService } from "./account.service";
import { ActivityLogService } from "./activity-log.service";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";
import { CreditNoteDetailsEntity } from "src/entities/credit-note-details.entity";
let exceptionmessage = "failed";

@Injectable()
export class SaleReturnService {
  constructor(
    @InjectRepository(CreditNotesEntity)
    private CreditMemoRepository: BaseRepository<CreditNotesEntity>,
    private activityLogService: ActivityLogService,
    private readonly accountService: AccountService,
    private dataSource: DataSource,
    private authservice: AuthService
  ) {}

  //  create sale Voucher
  async createSaleVoucher(createSaleVoucherDto: CreateCreditMemoDto, userPayload: UserInterface): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    const queryRunner1 = this.dataSource.createQueryRunner();
    try {
      if (createSaleVoucherDto.creditLedgerId != 0 && createSaleVoucherDto.totalAmt != 0) {
        var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(createSaleVoucherDto.txnDate), userPayload);

        const createentry = new CreditNotesEntity();
        let assetgroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Sales Return" } });

        let salesledger = await queryRunner.manager.findOne(AccountsEntity, { where: { ledgerParent: assetgroup.id, organizationId: userPayload.organizationId } });

        createentry.debitLedgerId = salesledger.id;
        createentry.debitLedger = salesledger;
        createentry.creditLedgerId = createSaleVoucherDto.creditLedgerId;
        let creditLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createentry.creditLedgerId } });

        createentry.creditLedger = creditLedger;
        createentry.txnDate = new Date(createSaleVoucherDto.txnDate);
        createentry.creditNoteNo = await this.accountService.generateAllNumbersbasedonDate("CreditMemo", new Date(createSaleVoucherDto.txnDate), userPayload);
        createentry.reference = createSaleVoucherDto.reference;
        createentry.customerMemo = createSaleVoucherDto.comment;
        createentry.totalAmt = createSaleVoucherDto.totalAmt;
        createentry.billAddr = createSaleVoucherDto.billAddr;
        createentry.shipAddr = createSaleVoucherDto.shipAddr;
        createentry.txnType = createSaleVoucherDto.txnType;
        createentry.docNumber = createSaleVoucherDto.docNumber;
        createentry.netAmountTaxable = createSaleVoucherDto.subtotalAmount;
        createentry.totalTax = createSaleVoucherDto.totalTax;
        createentry.applyTaxAfterDiscount = createSaleVoucherDto.applyTaxAfterDiscount;
        createentry.freeFormAddress = false;
        createentry.transactionId = TransactionID;
        createentry.createdAt = new Date();
        createentry.updatedAt = new Date();
        createentry.createdBy = userPayload.id;
        createentry.organizationId = userPayload.organizationId;
        createentry.updatedBy = 0;
        createentry.deletedBy = 0;

        await queryRunner.manager.save(CreditNotesEntity, createentry);
        let detailsarray = [];
        let iteamcounter = 1;
        if (createentry.id > 0) {
          //#region Accounts Ledger Transactions
          createSaleVoucherDto.creditDetails?.map(async (detailsinfo) => {
            let qdDetails = new CreditNoteDetailsEntity();
            qdDetails.creditNoteId = createentry.id;
            qdDetails.creditnoteDetails = createentry;

            let productinfo = await queryRunner.manager.findOne(ProductsEntity, {
              where: { id: detailsinfo.productId }
            });

            qdDetails.productId = productinfo.id;
            qdDetails.product = productinfo;

            qdDetails.description = detailsinfo?.description;
            qdDetails.detailType = detailsinfo?.detailType;

            qdDetails.unitPrice = detailsinfo.sellingPrice;
            qdDetails.qty = detailsinfo.qty;
            qdDetails.taxCodeRef = detailsinfo.taxCodeRef;
            qdDetails.totalAmount = detailsinfo.amount;
            qdDetails.detailType = "SalesItemLineDetail";
            qdDetails.createdAt = new Date();
            qdDetails.updatedAt = new Date();
            qdDetails.createdBy = userPayload.id;
            qdDetails.organizationId = userPayload.organizationId;
            qdDetails.updatedBy = 0;
            qdDetails.deletedBy = 0;

            if (productinfo.itemType == "Inventory") {
              var linearry = {
                DetailType: qdDetails.detailType,
                SalesItemLineDetail: {
                  TaxCodeRef: {
                    value: "NON"
                  },
                  Qty: qdDetails.qty,
                  UnitPrice: qdDetails.unitPrice,
                  ItemRef: {
                    name: productinfo.itemName,
                    value: productinfo.qbRefId
                  }
                },
                LineNum: iteamcounter,
                Amount: qdDetails.totalAmount,
                Id: qdDetails.id
              };
              detailsarray.push(linearry);
            } else {
              var linsearry = {
                DetailType: qdDetails.detailType,
                Amount: qdDetails.totalAmount,
                SalesItemLineDetail: {
                  ItemRef: {
                    name: productinfo.itemName,
                    value: productinfo.qbRefId
                  }
                }
              };
              detailsarray.push(linsearry);
            }

            let details = await queryRunner.manager.save(CreditNoteDetailsEntity, qdDetails);
          });

          const body = {
            debitLedgerId: createentry.debitLedgerId,
            creditLedgerId: createentry.creditLedgerId,
            transactionDate: new Date(),
            debitAmount: createentry.totalAmt,
            creditAmount: createentry.totalAmt,
            referenceId: createentry.id,
            transactionId: createentry.transactionId,
            transactionSource: "Sales Return",
            userId: userPayload.id,
            organizationId: userPayload.organizationId,
            remarks: "@" + createentry.reference,
            transactionReference: createentry.creditNoteNo
          };

          let customertran = await this.accountService.addTransaction(body, queryRunner);
          console.log(customertran, "curstomser");

          if (customertran) {
            const qbinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
              where: {
                id: userPayload.organizationId
              }
            });

            console.log(qbinforamtion, "qbinforamtion");

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
                let customerinfo = await queryRunner1.manager.findOne(CustomersEntity, { where: { ledgerId: createentry.creditLedgerId } });

                await qboobject.createCreditMemo(
                  {
                    Line: detailsarray,
                    CustomerRef: {
                      name: customerinfo.fullyQualifiedName,
                      value: customerinfo.qbRefId
                    }
                  },
                  async function (err, Employee) {
                    if (err) {
                      //throw new BadRequestException(err);
                    } else {
                      createentry.qbRefId = Employee.Id;

                      const insertData = await queryRunner1.manager.update(CreditNotesEntity, { id: createentry.id }, createentry);
                      console.log(insertData, "insert");

                      if (insertData.affected == 1) {
                        await queryRunner1.commitTransaction();

                        return `Insert Succussful!!`;
                      } else {
                        await queryRunner.rollbackTransaction();
                        exceptionmessage = "Failed";
                      }
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

        return `Insert Succussful!!`;

        //throw new BadRequestException(exceptionmessage);
      }
      return "Successfull";
    } catch (err) {
      console.log(err, "err");

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

  // update sale Voucher
  async updateSaleVoucher(updateCreditMemoDto: UpdateCreditMemoDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (updateCreditMemoDto.creditLedgerId != 0 && updateCreditMemoDto.totalAmt != 0) {
        const inforamtion = await queryRunner.manager.findOne(CreditNotesEntity, {
          where: {
            id: id,
            organizationId: userPayload.organizationId
          }
        });

        let createentry = await queryRunner.manager.findOne(CreditNotesEntity, {
          where: {
            id: id,
            organizationId: userPayload.organizationId
          }
        });

        if (createentry != null) {
          createentry.debitLedgerId = createentry.debitLedgerId;
          createentry.creditLedgerId = updateCreditMemoDto.creditLedgerId;
          createentry.txnDate = new Date(updateCreditMemoDto.txnDate);
          createentry.reference = updateCreditMemoDto.reference;
          createentry.customerMemo = updateCreditMemoDto.customerMemo;
          createentry.customerMemo = updateCreditMemoDto.comment;
          createentry.billAddr = updateCreditMemoDto.billAddr;
          createentry.shipAddr = updateCreditMemoDto.shipAddr;
          createentry.docNumber = updateCreditMemoDto.docNumber;
          createentry.netAmountTaxable = updateCreditMemoDto.netAmountTaxable;
          createentry.totalTax = updateCreditMemoDto.totalTax;
          createentry.txnType = updateCreditMemoDto.txnType;
          createentry.applyTaxAfterDiscount = updateCreditMemoDto.applyTaxAfterDiscount;
          createentry.freeFormAddress = updateCreditMemoDto.freeFormAddress;

          createentry.totalAmt = updateCreditMemoDto.totalAmt;
          createentry.updatedAt = new Date();
          createentry.updatedBy = userPayload.id;
          await queryRunner.manager.update(CreditNotesEntity, { id: id }, createentry);

          let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, { where: { transactionId: inforamtion.transactionId, referenceID: inforamtion.id } });

          let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");
          let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");
          let checkothers = false;

          if (inforamtion.totalAmt != createentry.totalAmt || inforamtion.customerMemo != createentry.customerMemo || inforamtion.reference != createentry.reference) {
            //#region Accounts
            let detailsarray = [];
            let iteamcounter = 1;

            //#region Accounts Ledger Transactions
            updateCreditMemoDto.creditDetails?.map(async (detailsinfo) => {
              let detailId = detailsinfo.id;
              if (detailId > 0) {
                let qdDetails = await queryRunner.manager.findOne(CreditNoteDetailsEntity, {
                  where: { id: detailId },
                  relations: ["product", "creditnoteDetails"]
                });
                qdDetails.creditNoteId = createentry.id;
                qdDetails.creditnoteDetails = createentry;

                let productinfo = await queryRunner.manager.findOne(ProductsEntity, {
                  where: { id: detailsinfo.productId }
                });

                qdDetails.productId = productinfo.id;
                qdDetails.product = productinfo;

                qdDetails.description = detailsinfo?.description;
                qdDetails.detailType = detailsinfo?.detailType;

                qdDetails.unitPrice = detailsinfo.sellingPrice;
                qdDetails.qty = detailsinfo.qty;
                qdDetails.taxCodeRef = detailsinfo.taxCodeRef;
                qdDetails.totalAmount = detailsinfo.amount;
                qdDetails.detailType = "SalesItemLineDetail";
                qdDetails.createdAt = new Date();
                qdDetails.updatedAt = new Date();
                qdDetails.createdBy = userPayload.id;
                qdDetails.organizationId = userPayload.organizationId;
                qdDetails.updatedBy = 0;
                qdDetails.deletedBy = 0;

                if (productinfo.itemType == "Inventory") {
                  var linearry = {
                    DetailType: qdDetails.detailType,
                    SalesItemLineDetail: {
                      TaxCodeRef: {
                        value: "NON"
                      },
                      Qty: qdDetails.qty,
                      UnitPrice: qdDetails.unitPrice,
                      ItemRef: {
                        name: productinfo.itemName,
                        value: productinfo.qbRefId
                      }
                    },
                    LineNum: iteamcounter,
                    Amount: qdDetails.totalAmount,
                    Id: qdDetails.id
                  };
                  detailsarray.push(linearry);
                } else {
                  var linsearry = {
                    DetailType: qdDetails.detailType,
                    Amount: qdDetails.totalAmount,
                    SalesItemLineDetail: {
                      ItemRef: {
                        name: productinfo.itemName,
                        value: productinfo.qbRefId
                      }
                    }
                  };
                  detailsarray.push(linsearry);
                }

                let details = await queryRunner.manager.update(CreditNoteDetailsEntity, { id: qdDetails.id }, qdDetails);
              } else {
                let qdDetails = new CreditNoteDetailsEntity();
                qdDetails.creditNoteId = createentry.id;
                qdDetails.creditnoteDetails = createentry;

                let productinfo = await queryRunner.manager.findOne(ProductsEntity, {
                  where: { id: detailsinfo.productId }
                });

                qdDetails.productId = productinfo.id;
                qdDetails.product = productinfo;

                qdDetails.description = detailsinfo?.description;
                qdDetails.detailType = detailsinfo?.detailType;

                qdDetails.unitPrice = detailsinfo.sellingPrice;
                qdDetails.qty = detailsinfo.qty;
                qdDetails.taxCodeRef = detailsinfo.taxCodeRef;
                qdDetails.totalAmount = detailsinfo.amount;
                qdDetails.detailType = "SalesItemLineDetail";
                qdDetails.createdAt = new Date();
                qdDetails.updatedAt = new Date();
                qdDetails.createdBy = userPayload.id;
                qdDetails.organizationId = userPayload.organizationId;
                qdDetails.updatedBy = 0;
                qdDetails.deletedBy = 0;

                if (productinfo.itemType == "Inventory") {
                  var linearry = {
                    DetailType: qdDetails.detailType,
                    SalesItemLineDetail: {
                      TaxCodeRef: {
                        value: "NON"
                      },
                      Qty: qdDetails.qty,
                      UnitPrice: qdDetails.unitPrice,
                      ItemRef: {
                        name: productinfo.itemName,
                        value: productinfo.qbRefId
                      }
                    },
                    LineNum: iteamcounter,
                    Amount: qdDetails.totalAmount,
                    Id: qdDetails.id
                  };
                  detailsarray.push(linearry);
                } else {
                  var linsearry = {
                    DetailType: qdDetails.detailType,
                    Amount: qdDetails.totalAmount,
                    SalesItemLineDetail: {
                      ItemRef: {
                        name: productinfo.itemName,
                        value: productinfo.qbRefId
                      }
                    }
                  };
                  detailsarray.push(linsearry);
                }

                let details = await queryRunner.manager.save(CreditNoteDetailsEntity, qdDetails);
              }
            });

            const body = {
              debitTransactionId: debittransaction.id,
              creditTransactionId: credittransaction.id,
              transactionDate: createentry.txnDate,
              debitAmount: createentry.totalAmt,
              creditAmount: createentry.totalAmt,
              userId: userPayload.id,
              remarks: "@ " + createentry.customerMemo + "-" + createentry.reference,
              transactionReference: createentry.creditNoteNo
            };

            let transaction = await this.accountService.UpdateTransactions(body, queryRunner);

            //#endregion

            if (transaction) {
              checkothers = true;
            }
          }
          if (inforamtion.creditLedgerId != createentry.creditLedgerId) {
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
          //    "TxnDate": "2014-09-02",
          //        "domain": "QBO",
          //            "PrintStatus": "NeedToPrint",
          //                "TotalAmt": 100.0,
          //                    "RemainingCredit": 0,
          //                        "Line": [
          //                            {
          //                                "Description": "Pest Control Services",
          //                                "DetailType": "SalesItemLineDetail",
          //                                "SalesItemLineDetail": {
          //                                    "TaxCodeRef": {
          //                                        "value": "NON"
          //                                    },
          //                                    "Qty": 1,
          //                                    "UnitPrice": 100,
          //                                    "ItemRef": {
          //                                        "name": "Pest Control",
          //                                        "value": "10"
          //                                    }
          //                                },
          //                                "LineNum": 1,
          //                                "Amount": 100.0,
          //                                "Id": "1"
          //                            },
          //                            {
          //                                "DetailType": "SubTotalLineDetail",
          //                                "Amount": 100.0,
          //                                "SubTotalLineDetail": {}
          //                            }
          //                        ],
          //                            "ApplyTaxAfterDiscount": false,
          //                                "DocNumber": "1026",
          //                                    "sparse": false,
          //                                        "CustomerMemo": {
          //        "value": "Another memo update."
          //    },
          //    "ProjectRef": {
          //        "value": "39298045"
          //    },
          //    "Balance": 0,
          //        "CustomerRef": {
          //        "name": "Amy's Bird Sanctuary",
          //            "value": "1"
          //    },
          //    "TxnTaxDetail": {
          //        "TotalTax": 0
          //    },
          //    "SyncToken": "4",
          //        "CustomField": [
          //            {
          //                "DefinitionId": "1",
          //                "Type": "StringType",
          //                "Name": "Crew #"
          //            }
          //        ],
          //            "ShipAddr": {
          //        "CountrySubDivisionCode": "CA",
          //            "City": "Bayshore",
          //                "PostalCode": "94326",
          //                    "Id": "108",
          //                        "Line1": "4581 Finch St."
          //    },
          //    "EmailStatus": "NotSet",
          //        "BillAddr": {
          //        "Line4": "Bayshore, CA  94326",
          //            "Line3": "4581 Finch St.",
          //                "Id": "79",
          //                    "Line1": "Amy Lauterbach",
          //                        "Line2": "Amy's Bird Sanctuary"
          //    },
          //    "MetaData": {
          //        "CreateTime": "2014-09-18T12:51:27-07:00",
          //            "LastUpdatedTime": "2015-07-01T09:16:28-07:00"
          //    },
          //    "BillEmail": {
          //        "Address": "Birds@Intuit.com"
          //    },
          //    "Id": "73"
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

  // find all sale Voucher Data
  async findAllVoucherData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Sales Voucher",
        message: `Sales Voucher fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: null,
      organizationId: userPayload.organizationId
    };
    const [results, total] = await this.CreditMemoRepository.createQueryBuilder("sale")
      .leftJoinAndSelect("sale.creditLedger", "customer")
      .where(`sale.organizationId = ${userPayload.organizationId}`)
      .andWhere(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`sale.voucher LIKE ('%${filter}%')`);
          }
        })
      )

      .orderBy("sale.id", "DESC")
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

  // delete sale
  async deleteSale(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      var inforamtion = await queryRunner.manager.findOne(CreditNotesEntity, {
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
            let deletetransaction = await queryRunner.manager.remove(CreditNotesEntity, inforamtion);
            //{
            //    "SyncToken": "0",
            //        "Id": "73"
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
   * Get Single voucherData
   */
  async findSingleVoucherData(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.CreditMemoRepository.findOne({
      where: {
        id: id,
        organizationId: userPayload.organizationId
      },
      relations: ["creditnoteDetails"]
    });

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Sales Voucher",
        message: `Single Sales Voucher fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: data,
      organizationId: userPayload.organizationId
    };

    if (!data) {
      throw new NotFoundException(`voucher not exist in db!!`);
    }

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }
  /**
   * Get One voucherData
   */
  async findOneVoucherData(id: number) {
    const data = await this.CreditMemoRepository.findOne({
      where: {
        id: id
      }
    });

    if (!data) {
      throw new NotFoundException(`voucher not exist in db!!`);
    }

    return data;
  }
}
