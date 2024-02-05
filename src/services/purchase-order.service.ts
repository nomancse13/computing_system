//Controller: PurchaseController
//Model: Purchase/Bills.cs
// View: Purchase/AllBills

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { DataSource } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from "../dtos/payables/purchase-order";

import { AccountsEntity, OrganizationEntity, StockHistoryEntity } from "../entities";
import { PurchaseOrderDetailsEntity } from "../entities/purchase-order-details.entity";
import { PurchaseOrderEntity } from "../entities/purchase-order.entity";
import { AccountService } from "./account.service";
import { ActivityLogService } from "./activity-log.service";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";
let exceptionmessage = "Failed";

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private purchaseOrderRepository: BaseRepository<PurchaseOrderEntity>,
    private readonly accountService: AccountService,
    private activityLogService: ActivityLogService,
    private authservice: AuthService,
    private dataSource: DataSource
  ) {}

  //  create Purchase order
  async createPurchaseOrder(createPurchaseOrderDto: CreatePurchaseOrderDto, userPayload: UserInterface): Promise<any> {
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (createPurchaseOrderDto.creditLedgerId != 0 && createPurchaseOrderDto.totalAmt > 0) {
        const createentry = new PurchaseOrderEntity();

        createentry.creditLedgerId = createPurchaseOrderDto.creditLedgerId;
        var creditledger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createentry.creditLedgerId } });

        createentry.creditLedger = creditledger;

        createentry.txnDate = new Date(createPurchaseOrderDto.txnDate);
        createentry.docNumber = await this.accountService.generateAllNumbersbasedonDate("PurchaseOrder", new Date(createPurchaseOrderDto.txnDate), userPayload);

        createentry.reference = createPurchaseOrderDto.reference;
        createentry.comment = createPurchaseOrderDto.comment;
        createentry.vendorAddr = createPurchaseOrderDto.vendorAddr;
        createentry.comment = createPurchaseOrderDto.comment;
        createentry.totalAmt = createPurchaseOrderDto.totalAmt;
        createentry.billable = createPurchaseOrderDto.billable;

        if (createPurchaseOrderDto.billable == true) {
          createentry.poStatus = "Open";
        } else {
          createentry.poStatus = "Non-Billable";
        }

        createentry.createdAt = new Date();
        createentry.updatedAt = new Date();
        createentry.createdBy = userPayload.id;
        createentry.organizationId = userPayload.organizationId;
        createentry.updatedBy = 0;
        createentry.deletedBy = 0;

        await queryRunner.manager.save(PurchaseOrderEntity, createentry);
        let Line = [];
        if (createentry.id > 0) {
          await Promise.all(
            createPurchaseOrderDto.items.map(async (e) => {
              if (e.productId != 0 && e.productId != null && e.productId != undefined) {
                let qdDetails = new PurchaseOrderDetailsEntity();
                qdDetails.orderId = createentry.id;
                qdDetails.order = createentry;
                qdDetails.productId = e.productId;

                let stockinfo = await queryRunner.manager.findOne(StockHistoryEntity, {
                  where: { productId: qdDetails.productId },
                  relations: ["product"]
                });

                qdDetails.product = stockinfo.product;
                qdDetails.unitPrice = e.unitPrice;
                qdDetails.qty = e.qty;

                if (e.taxable == 0) {
                  qdDetails.taxCodeRef = "NON";
                  qdDetails.taxCodeId = 0;
                  qdDetails.taxPercent = e.taxRate;
                  qdDetails.totalAmount = e.unitPrice * e.qty;
                } else if (e.taxable == 1) {
                  qdDetails.taxCodeRef = "TAX";
                  qdDetails.taxCodeId = 1;
                  qdDetails.taxPercent = e.taxRate;
                  qdDetails.totalAmount = Number(e.unitPrice * e.qty) + Number(e.unitPrice * e.qty) * (e.taxRate / 100);
                }

                qdDetails.createdAt = new Date();
                qdDetails.updatedAt = new Date();
                qdDetails.createdBy = userPayload.id;
                qdDetails.organizationId = userPayload.organizationId;
                qdDetails.updatedBy = 0;
                qdDetails.deletedBy = 0;

                let details = await queryRunner.manager.save(PurchaseOrderDetailsEntity, qdDetails);
                const vendorRef = {
                  DetailType: "ItemBasedExpenseLineDetail",
                  Amount: qdDetails.totalAmount,
                  ProjectRef: {
                    value: "39298034"
                  },
                  Id: qdDetails.id,
                  ItemBasedExpenseLineDetail: {
                    ItemRef: {
                      name: stockinfo.product.itemName,
                      value: "11"
                    },
                    CustomerRef: {
                      name: "Cool Cars",
                      value: "3"
                    },
                    Qty: 1,
                    TaxCodeRef: {
                      value: "NON"
                    },
                    BillableStatus: "NotBillable",
                    UnitPrice: qdDetails.unitPrice
                  }
                };

                Line.push(vendorRef);
              }
            })
          );

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

              await qboobject.createPurchaseOrder(
                {
                  Line,
                  APAccountRef: {
                    name: "Accounts Payable (A/P)",
                    value: "33"
                  },
                  VendorRef: {
                    name: creditledger.fullyQualifiedName,
                    value: "41"
                  },
                  ShipTo: {
                    name: "Jeff's Jalopies",
                    value: "12"
                  }
                },
                async function (err, PurchaseOrder) {
                  if (err) {
                    console.log(err, "err");

                    throw new BadRequestException(err);
                  } else {
                    createentry.qbRefId = PurchaseOrder.Id;

                    const insertData = await queryRunner.manager.update(PurchaseOrderEntity, { id: createentry.id }, createentry);
                  }
                }
              );
              await queryRunner.commitTransaction();

              return createentry;
            }
          } else {
            await queryRunner.commitTransaction();

            return createentry;
          }
        } else {
          exceptionmessage = `Transaction Failed!!`;
          await queryRunner.rollbackTransaction();
          //return `insert filed!!`;
          throw new BadRequestException(exceptionmessage);
        }
      } else {
        throw new BadRequestException("total amount must be more than zero");
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

  // update Purchase order
  async updatePurchaseOrder(updatePurchaseOrderDto: UpdatePurchaseOrderDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (updatePurchaseOrderDto.creditLedgerId != 0 && updatePurchaseOrderDto.totalAmt > 0) {
        var inforamtion = await queryRunner.manager.findOne(PurchaseOrderEntity, {
          where: {
            id: id,
            organizationId: userPayload.organizationId
          }
        });
        if (inforamtion != null) {
          var createentry = await queryRunner.manager.findOne(PurchaseOrderEntity, {
            where: {
              id: id,
              organizationId: userPayload.organizationId
            }
          });
          if (createentry != null) {
            createentry.creditLedgerId = updatePurchaseOrderDto.creditLedgerId;
            var ledgerinfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: updatePurchaseOrderDto.creditLedgerId } });
            createentry.creditLedger = ledgerinfo;
            createentry.txnDate = new Date(updatePurchaseOrderDto.txnDate);
            createentry.reference = updatePurchaseOrderDto.reference;
            createentry.vendorAddr = updatePurchaseOrderDto.vendorAddr;
            createentry.comment = updatePurchaseOrderDto.comment;
            createentry.totalAmt = updatePurchaseOrderDto.totalAmt;
            createentry.billable = updatePurchaseOrderDto.billable;

            if (updatePurchaseOrderDto.billable == true) {
              createentry.poStatus = "Open";
            } else {
              createentry.poStatus = "Non-Billable";
            }

            createentry.updatedAt = new Date();
            createentry.updatedBy = userPayload.id;
            await queryRunner.manager.update(PurchaseOrderEntity, { id: id }, createentry);

            let checkothers = false;

            await Promise.all(
              updatePurchaseOrderDto.items.map(async (e) => {
                let detailId = e.id;
                if (detailId > 0) {
                  let qdDetails = await queryRunner.manager.findOne(PurchaseOrderDetailsEntity, {
                    where: {
                      id: detailId,
                      organizationId: userPayload.organizationId
                    },
                    relations: ["product"]
                  });

                  if (e.taxable == 0) {
                    qdDetails.taxCodeRef = "NON";
                    qdDetails.taxCodeId = 0;
                    qdDetails.taxPercent = e.taxRate;
                    qdDetails.totalAmount = e.unitPrice * e.qty;
                  } else if (e.taxable == 1) {
                    qdDetails.taxCodeRef = "TAX";
                    qdDetails.taxCodeId = 1;
                    qdDetails.taxPercent = e.taxRate;
                    qdDetails.totalAmount = Number(e.unitPrice * e.qty) + Number(e.unitPrice * e.qty) * (e.taxRate / 100);
                  }

                  qdDetails.unitPrice = e.unitPrice;
                  qdDetails.qty = e.qty;
                  qdDetails.totalAmount = e.amount;
                  qdDetails.updatedAt = new Date();
                  qdDetails.updatedBy = userPayload.id;

                  console.log(qdDetails, "qddddd");

                  let details = await queryRunner.manager.update(PurchaseOrderDetailsEntity, { id: qdDetails.id }, qdDetails);
                } else {
                  if (e.productId != 0 && e.productId != null && e.productId != undefined) {
                    let qdDetails = new PurchaseOrderDetailsEntity();
                    qdDetails.orderId = createentry.id;
                    qdDetails.order = createentry;
                    qdDetails.productId = e.productId;

                    let stockinfo = await queryRunner.manager.findOne(StockHistoryEntity, {
                      where: { productId: qdDetails.productId },
                      relations: ["product"]
                    });

                    qdDetails.product = stockinfo.product;
                    qdDetails.unitPrice = e.unitPrice;
                    qdDetails.qty = e.qty;
                    qdDetails.totalAmount = e.unitPrice * e.qty;
                    if (e.taxable == 0) {
                      qdDetails.taxCodeRef = "NON";
                      qdDetails.taxCodeId = 0;
                      qdDetails.taxPercent = e.taxRate;
                      qdDetails.totalAmount = e.unitPrice * e.qty;
                    } else if (e.taxable == 1) {
                      qdDetails.taxCodeRef = "TAX";
                      qdDetails.taxCodeId = 1;
                      qdDetails.taxPercent = e.taxRate;
                      qdDetails.totalAmount = Number(e.unitPrice * e.qty) + Number(e.unitPrice * e.qty) * (e.taxRate / 100);
                    }
                    qdDetails.createdAt = new Date();
                    qdDetails.updatedAt = new Date();
                    qdDetails.createdBy = userPayload.id;
                    qdDetails.organizationId = userPayload.organizationId;
                    qdDetails.updatedBy = 0;
                    qdDetails.deletedBy = 0;
                    console.log(qdDetails, "rrrr");

                    let details = await queryRunner.manager.save(PurchaseOrderDetailsEntity, qdDetails);
                  }
                }
              })
            );
            //{
            //    "DocNumber": "1005",
            //        "SyncToken": "0",
            //            "POEmail": {
            //        "Address": "send_email@intuit.com"
            //    },
            //    "APAccountRef": {
            //        "name": "Accounts Payable (A/P)",
            //            "value": "33"
            //    },
            //    "CurrencyRef": {
            //        "name": "United States Dollar",
            //            "value": "USD"
            //    },
            //    "sparse": false,
            //        "TxnDate": "2015-07-28",
            //            "TotalAmt": 25.0,
            //                "ShipAddr": {
            //        "Line4": "Half Moon Bay, CA  94213",
            //            "Line3": "65 Ocean Dr.",
            //                "Id": "121",
            //                    "Line1": "Grace Pariente",
            //                        "Line2": "Cool Cars"
            //    },
            //    "PrivateNote": "This is a private note added during update.",
            //        "Id": "257",
            //            "POStatus": "Open",
            //                "domain": "QBO",
            //                    "VendorRef": {
            //        "name": "Hicks Hardware",
            //            "value": "41"
            //    },
            //    "Line": [
            //        {
            //            "DetailType": "ItemBasedExpenseLineDetail",
            //            "Amount": 25.0,
            //            "ProjectRef": {
            //                "value": "39298034"
            //            },
            //            "Id": "1",
            //            "ItemBasedExpenseLineDetail": {
            //                "ItemRef": {
            //                    "name": "Garden Supplies",
            //                    "value": "38"
            //                },
            //                "CustomerRef": {
            //                    "name": "Cool Cars",
            //                    "value": "3"
            //                },
            //                "Qty": 1,
            //                "TaxCodeRef": {
            //                    "value": "NON"
            //                },
            //                "BillableStatus": "NotBillable",
            //                "UnitPrice": 25
            //            }
            //        }
            //    ],
            //        "CustomField": [
            //            {
            //                "DefinitionId": "1",
            //                "Type": "StringType",
            //                "Name": "Crew #"
            //            },
            //            {
            //                "DefinitionId": "2",
            //                "Type": "StringType",
            //                "Name": "Sales Rep"
            //            }
            //        ],
            //            "VendorAddr": {
            //        "Line4": "Middlefield, CA  94303",
            //            "Line3": "42 Main St.",
            //                "Id": "120",
            //                    "Line1": "Geoff Hicks",
            //                        "Line2": "Hicks Hardware"
            //    },
            //    "MetaData": {
            //        "CreateTime": "2015-07-28T16:01:47-07:00",
            //            "LastUpdatedTime": "2015-07-28T16:01:47-07:00"
            //    }
            //}
            await queryRunner.commitTransaction();
            return "Update";
          }
        }

        await queryRunner.rollbackTransaction();
        return "Failed";
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

  // find all Purchase order data
  async findAllPurchaseOrderData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Purchase order",
        message: `All Purchase order fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      organizationId: userPayload.organizationId,
      logData: null
    };

    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    try {
      const [results, total] = await queryRunner.manager.findAndCount(PurchaseOrderEntity, {
        where: { organizationId: userPayload.organizationId },
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

  // delete Purchase order
  async deletePurchaseOrder(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      var inforamtion = await queryRunner.manager.findOne(PurchaseOrderEntity, {
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });

      if (inforamtion != null) {
        try {
          let invoicedetails = await queryRunner.manager.find(PurchaseOrderDetailsEntity, { where: { orderId: id }, relations: ["product"] });

          await queryRunner.manager.remove(PurchaseOrderDetailsEntity, invoicedetails);
        } catch {}

        await queryRunner.manager.remove(PurchaseOrderEntity, inforamtion);

        const log = {
          cLientIPAddress: ipClientPayload.ip,
          browser: ipClientPayload.browser,
          os: ipClientPayload.os,
          userId: userPayload.id,
          messageDetails: {
            tag: "Purchase order",
            message: `Purchase order deleted by ${decrypt(userPayload.hashType)}`,
            date: new Date()
          },
          logData: inforamtion,
          organizationId: userPayload.organizationId
        };

        // Save Activity Log
        await this.activityLogService.createLogWithoutTransaction(log);
        //{
        //    "SyncToken": "0",
        //        "Id": "125"
        //}
        await queryRunner.commitTransaction();
        return inforamtion;
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
   * Get One Purchase order data
   */
  async findOnePurchaseOrder(id: number, userPayload: UserInterface) {
    const data = await this.purchaseOrderRepository.findOne({
      where: {
        id: id,
        organizationId: userPayload.organizationId
      },
      relations: ["orderdetails"]
    });
    if (!data) {
      throw new NotFoundException(`Purchase order not exist in db!!`);
    }
    return data;
  }
}
