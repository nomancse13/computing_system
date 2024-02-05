//Controller: InvoiceController
//Model: Invoice/Invoice.cs
// View: Invoice/Index

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as randomToken from "rand-token";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { Brackets, DataSource } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { StatusField } from "../authentication/common/enum";
import { CreateEstimationDto, UpdateEstiamtionDto } from "../dtos/receivables/estiamtion";
import { EstimationDetailsEntity } from "../entities/estiamtion-details.entity";
import { EstimationEntity } from "../entities/estimation.entity";
import { AccountService } from "./account.service";
import { ActivityLogService } from "./activity-log.service";
import { LedgersService } from "./ledgers.service";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";
import { CustomersEntity, OrganizationEntity, ProductsEntity } from "src/entities";
let exceptionmessage = "failed";

@Injectable()
export class EstimationService {
  constructor(
    @InjectRepository(EstimationEntity)
    private estiamtionRepository: BaseRepository<EstimationEntity>,
    @InjectRepository(EstimationDetailsEntity)
    private estiamtionDetailsRepository: BaseRepository<EstimationDetailsEntity>,
    private readonly ledgersService: LedgersService,
    private activityLogService: ActivityLogService,
    private accountService: AccountService,
    private dataSource: DataSource,
    private authservice: AuthService
  ) {}

  //  create estimation
  async createEstimation(createEstiamtionDto: CreateEstimationDto, userPayload: UserInterface): Promise<any> {
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    // using a QueryRunner:
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:

    let exceptionmessage = "failed";

    await queryRunner.startTransaction();
    try {
      if (createEstiamtionDto.debitLedgerId != 0 && createEstiamtionDto.totalAmt > 0) {
        //#region Estimation Creation
        const createentry = new EstimationEntity();
        createentry.debitLedgerId = createEstiamtionDto.debitLedgerId;
        createentry.txnDate = new Date(createEstiamtionDto.txnDate);
        createentry.estimationNo = await this.accountService.generateAllNumbersbasedonDate("Estiamtion", new Date(createEstiamtionDto.txnDate), userPayload);
        createentry.reference = createEstiamtionDto.reference;
        createentry.comment = createEstiamtionDto.comment;
        createentry.taxid = createEstiamtionDto.taxid;
        createentry.expirationDate = new Date(createEstiamtionDto.expirationDate);
        createentry.txnType = createEstiamtionDto.txnType;
        createentry.reference = createEstiamtionDto.reference;
        createentry.customerMemo = createEstiamtionDto.comment;
        createentry.applyTaxAfterDiscount = createEstiamtionDto.applyTaxAfterDiscount;
        createentry.billAddr = createEstiamtionDto.billAddr;
        createentry.shipAddr = createEstiamtionDto.shipAddr;
        createentry.billEmail = createEstiamtionDto.billEmail;
        createentry.docNumber = createEstiamtionDto.docNumber;
        createentry.txnId = createEstiamtionDto.txnId;
        createentry.totalTax = createEstiamtionDto.totalTax;
        //createentry.taxPercent = createEstiamtionDto.taxPercent;
        createentry.taxPercent = 21;
        createentry.estimationStatus = "Open";
        if (createEstiamtionDto.comment != null) createentry.comment = createEstiamtionDto.comment;
        else createentry.comment = "";
        createentry.subtotalAmount = createEstiamtionDto.subtotalAmount;
        createentry.netAmountTaxable = createEstiamtionDto.netAmountTaxable;
        createentry.totalAmt = createEstiamtionDto.totalAmt;

        createentry.createdAt = new Date();
        createentry.updatedAt = new Date();
        createentry.createdBy = userPayload.id;
        createentry.organizationId = userPayload.organizationId;
        createentry.updatedBy = 0;
        createentry.deletedBy = 0;
        const logInfo = createEstiamtionDto?.ipPayload;

        await queryRunner.manager.save(EstimationEntity, createentry);
        // prepare log data
        const log = {
          cLientIPAddress: logInfo.ip,
          browser: logInfo.browser,
          os: logInfo.os,
          userId: userPayload.id,
          messageDetails: {
            tag: "Estimation",
            message: `New Estimation created by ${decrypt(userPayload.hashType)}`
          },
          logData: createEstiamtionDto,
          organizationId: userPayload.organizationId
        };
        // save log
        if (log) {
          await this.activityLogService.createLog(log, queryRunner);
        }

        var quotationid = createentry.id;
        let detailsarray = [];
        let iteamcounter = 1;
        let totaldiscount = 0;
        if (quotationid > 0) {
          await Promise.all(
            createEstiamtionDto.items.map(async (detailsinfo: any) => {
              let qdDetails = new EstimationDetailsEntity();
              qdDetails.estimationId = createentry.id;
              qdDetails.estiamtion = createentry;

              let productinfo = await queryRunner.manager.findOne(ProductsEntity, {
                where: { id: detailsinfo.productId }
              });
              qdDetails.productId = detailsinfo.productId;
              qdDetails.product = productinfo;
              qdDetails.description = detailsinfo?.description;
              qdDetails.detailType = "SalesItemLineDetail";

              qdDetails.unitPrice = detailsinfo.sellingPrice;
              qdDetails.qty = detailsinfo.qty;
              qdDetails.discount = detailsinfo.discount;
              qdDetails.taxCodeRef = detailsinfo.taxCodeRef;
              qdDetails.totalAmount = detailsinfo.amount;
              totaldiscount = totaldiscount + Number(qdDetails.discount);

              qdDetails.createdAt = new Date();
              qdDetails.updatedAt = new Date();
              qdDetails.createdBy = userPayload.id;
              qdDetails.organizationId = userPayload.organizationId;
              qdDetails.updatedBy = 0;
              qdDetails.deletedBy = 0;

              var linearry = {
                Description: productinfo.itemName,
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

              let details = await queryRunner.manager.save(EstimationDetailsEntity, qdDetails);
              iteamcounter++;
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
            //   detailsarray.push({
            //     DetailType: "SubTotalLineDetail",
            //     Amount: createentry.subtotalAmount,
            //     SubTotalLineDetail: {}
            //   });
            //   detailsarray.push({
            //     DetailType: "DiscountLineDetail",
            //     Amount: totaldiscount,
            //     DiscountLineDetail: {
            //       DiscountAccountRef: {
            //         name: "Discounts given",
            //         value: "86"
            //       },
            //       PercentBased: false
            //       //DiscountPercent: 10
            //     }
            //   });
            //   let customerinfo = await queryRunner.manager.findOne(CustomersEntity, { where: { ledgerId: createentry.debitLedgerId } });
            //   await qboobject.createEstimate(
            //     {
            //       TotalAmt: createentry.totalAmt,
            //       BillEmail: {
            //         Address: createentry.billEmail
            //       },
            //       CustomerMemo: {
            //         value: createentry.customerMemo
            //       },
            //       ShipAddr: {
            //         Line1: createentry.shipAddr,
            //         PostalCode: "94213",
            //         Lat: "37.4300318",
            //         Long: "-122.4336537",
            //         CountrySubDivisionCode: "CA"
            //       },
            //       PrintStatus: "NeedToPrint",
            //       EmailStatus: "NotSet",
            //       BillAddr: {
            //         City: "Half Moon Bay",
            //         Line1: createentry.billAddr,
            //         PostalCode: "94213",
            //         Lat: "37.4300318",
            //         Long: "-122.4336537",
            //         CountrySubDivisionCode: "CA"
            //       },
            //       Line: detailsarray,
            //       CustomerRef: {
            //         name: customerinfo.fullyQualifiedName,
            //         value: customerinfo.qbRefId
            //       },
            //       TxnTaxDetail: {
            //         TotalTax: createentry.totalTax
            //       },
            //       ApplyTaxAfterDiscount: createentry.applyTaxAfterDiscount
            //     },
            //     async function (err, Estimation) {
            //       if (err) {
            //         throw new BadRequestException(err);
            //       } else {
            //         createentry.qbRefId = Estimation.Id;
            //         const insertData = await queryRunner.manager.update(EstimationEntity, { id: createentry.id }, createentry);
            //         await queryRunner.commitTransaction();
            //         return insertData;
            //       }
            //     }
            //   );
            // }
            await queryRunner.commitTransaction();
          } else {
            await queryRunner.commitTransaction();

            return createentry;
          }
        } else {
          exceptionmessage = `failed.`;
          await queryRunner.rollbackTransaction();
          throw new BadRequestException(`duplicate invoice found. please insert a unique one.`);
        }

        //#endregion
      } else {
        exceptionmessage = `total amount is too low!!!please check it!!`;
        await queryRunner.rollbackTransaction();
        throw new BadRequestException(exceptionmessage);
      }
    } catch (err) {
      console.log("ereertwerwerwerw: ", err);

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
  async updateEstimation(updateEstiamtionDto: UpdateEstiamtionDto, userPayload: UserInterface, id: number) {
    // using a QueryRunner:
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      if (updateEstiamtionDto.debitLedgerId != 0 && updateEstiamtionDto.totalAmt > 0) {
        const invoice = await queryRunner.manager.findOne(EstimationEntity, { where: { id: id } });
        let prevtotal = invoice.totalAmt;
        let prevdebit = invoice.debitLedgerId;

        if (!invoice) {
          exceptionmessage = `This data not exist in DB!!!`;

          throw new BadRequestException(`This data not exist in DB!!!`);
        }
        const customerInfo = await this.ledgersService.findOneLedger(updateEstiamtionDto.debitLedgerId);

        invoice.debitLedger = customerInfo;

        invoice.debitLedgerId = updateEstiamtionDto.debitLedgerId;
        invoice.txnDate = new Date(updateEstiamtionDto.txnDate);
        if (updateEstiamtionDto.comment != null) invoice.comment = updateEstiamtionDto.comment;
        else invoice.comment = "";
        invoice.totalAmt = updateEstiamtionDto.totalAmt;
        invoice.taxid = updateEstiamtionDto.taxid;

        invoice.expirationDate = new Date(updateEstiamtionDto.expirationDate);
        invoice.txnType = updateEstiamtionDto.txnType;
        invoice.reference = updateEstiamtionDto.reference;
        invoice.customerMemo = updateEstiamtionDto.comment;
        invoice.billAddr = updateEstiamtionDto.billAddr;
        invoice.shipAddr = updateEstiamtionDto.shipAddr;
        invoice.billEmail = updateEstiamtionDto.billEmail;
        invoice.docNumber = updateEstiamtionDto.docNumber;
        invoice.txnId = updateEstiamtionDto.txnId;
        invoice.totalTax = updateEstiamtionDto.totalTax;

        invoice.updatedAt = new Date();
        invoice.updatedBy = userPayload.id;

        let variants: any;

        const logInfo = updateEstiamtionDto?.ipPayload;

        // Prepare Activity Log
        const log = {
          cLientIPAddress: logInfo.ip,
          browser: logInfo.browser,
          os: logInfo.os,
          userId: userPayload.id,
          messageDetails: {
            tag: "Estimation",
            message: `Estimation updated by ${decrypt(userPayload.hashType)}`,
            date: new Date()
          },
          logData: updateEstiamtionDto,
          organizationId: userPayload.organizationId
        };

        // update Estimation data
        const invoiceData = await queryRunner.manager.update(EstimationEntity, { id: id }, invoice);
        if (log) {
          await this.activityLogService.createLog(log, queryRunner);
        }

        // Invoice Stock data
        await Promise.all(
          updateEstiamtionDto.items.map(async (e) => {
            let detailId = e.id;
            if (detailId > 0) {
              let qdDetails = await queryRunner.manager.findOne(EstimationDetailsEntity, {
                where: { id: detailId },
                relations: ["product"]
              });
              let previoustotal = qdDetails.totalAmount;

              qdDetails.estimationId = invoice.id;

              qdDetails.productId = e.productId;

              let productinfo = await queryRunner.manager.findOne(ProductsEntity, {
                where: { id: qdDetails.productId }
              });
              qdDetails.product = productinfo;

              qdDetails.unitPrice = e.sellingPrice;

              qdDetails.qty = e.qty;

              qdDetails.totalAmount = e.amount;
              qdDetails.discount = e.discount;

              let details = await queryRunner.manager.update(EstimationDetailsEntity, { id: qdDetails.id }, qdDetails);
            } else {
              let estimationDetails = new EstimationDetailsEntity();

              estimationDetails.estimationId = invoice.id;
              estimationDetails.estiamtion = invoice;
              estimationDetails.productId = e.productId;
              estimationDetails.unitPrice = e.sellingPrice;
              estimationDetails.qty = e.qty;

              estimationDetails.totalAmount = e.amount;
              estimationDetails.discount = e.discount;
              estimationDetails.createdAt = new Date();
              estimationDetails.updatedAt = new Date();
              estimationDetails.createdBy = userPayload.id;
              estimationDetails.organizationId = userPayload.organizationId;
              estimationDetails.updatedBy = 0;
              estimationDetails.deletedBy = 0;
              const details = queryRunner.manager.save(EstimationDetailsEntity, estimationDetails);
            }
          })
        );

        // Save Activity Log
        if (log) {
          await this.activityLogService.createLog(log, queryRunner);
        }

        //{
        //    "TotalAmt": 31.5,
        //        "BillEmail": {
        //        "Address": "Cool_Cars@intuit.com"
        //    },
        //    "CustomerMemo": {
        //        "value": "Thank you for your business and have a great day!"
        //    },
        //    "ShipAddr": {
        //        "City": "Half Moon Bay",
        //            "Line1": "65 Ocean Dr.",
        //                "PostalCode": "94213",
        //                    "Lat": "37.4300318",
        //                        "Long": "-122.4336537",
        //                            "CountrySubDivisionCode": "CA",
        //                                "Id": "4"
        //    },
        //    "PrintStatus": "NeedToPrint",
        //        "EmailStatus": "NotSet",
        //            "BillAddr": {
        //        "City": "Half Moon Bay",
        //            "Line1": "65 Ocean Dr.",
        //                "PostalCode": "94213",
        //                    "Lat": "37.4300318",
        //                        "Long": "-122.4336537",
        //                            "CountrySubDivisionCode": "CA",
        //                                "Id": "4"
        //    },
        //    "Line": [
        //        {
        //            "Description": "Pest Control Services",
        //            "DetailType": "SalesItemLineDetail",
        //            "SalesItemLineDetail": {
        //                "TaxCodeRef": {
        //                    "value": "NON"
        //                },
        //                "Qty": 1,
        //                "UnitPrice": 35,
        //                "ItemRef": {
        //                    "name": "Pest Control",
        //                    "value": "10"
        //                }
        //            },
        //            "LineNum": 1,
        //            "Amount": 35.0,
        //            "Id": "1"
        //        },
        //        {
        //            "DetailType": "SubTotalLineDetail",
        //            "Amount": 35.0,
        //            "SubTotalLineDetail": {}
        //        },
        //        {
        //            "DetailType": "DiscountLineDetail",
        //            "Amount": 3.5,
        //            "DiscountLineDetail": {
        //                "DiscountAccountRef": {
        //                    "name": "Discounts given",
        //                    "value": "86"
        //                },
        //                "PercentBased": true,
        //                "DiscountPercent": 10
        //            }
        //        }
        //    ],
        //        "CustomerRef": {
        //        "name": "Cool Cars",
        //            "value": "3"
        //    },
        //    "TxnTaxDetail": {
        //        "TotalTax": 0
        //    },
        //    "ApplyTaxAfterDiscount": false
        //}
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
  async findAllEstimationData(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Customer Estimation",
        message: `All Estimation fetched by ${decrypt(userPayload.hashType)}`,
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
      const [results, total] = await queryRunner.manager.findAndCount(EstimationEntity, {
        where: { organizationId: userPayload.organizationId, status: StatusField.ACTIVE },
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
  async deleteEstimation(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    // using a QueryRunner:
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    let exceptionmessage = "failed";

    try {
      const invoiceData = await queryRunner.manager.findOne(EstimationEntity, {
        where: {
          id: id
        }
      });
      console.log("deletetransaction: ");

      if (!invoiceData) {
        exceptionmessage = "invoice not found";
        throw new NotFoundException("invoice not found");
      }

      try {
        var estimationDetails = await queryRunner.manager.find(EstimationDetailsEntity, { where: { estimationId: id }, relations: ["product"] });

        let deletetransaction = await queryRunner.manager.remove(EstimationDetailsEntity, estimationDetails);

        console.log("deletetransaction: " + deletetransaction);
      } catch (ex) {
        console.log(ex);
        exceptionmessage = `Failed`;
      }
      let deletetransaction = await queryRunner.manager.remove(EstimationEntity, invoiceData);
      console.log("deletetransaction: " + deletetransaction);
      // Prepare Activity Log
      const log = {
        cLientIPAddress: ipClientPayload.ip,
        browser: ipClientPayload.browser,
        os: ipClientPayload.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Estimation",
          message: `Estimation deleted by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: invoiceData,
        organizationId: userPayload.organizationId
      };

      // Save Activity Log
      await this.activityLogService.createLog(log, queryRunner);
      //{
      //    "SyncToken": "3",
      //        "Id": "96"
      //}
      await queryRunner.commitTransaction();
      return invoiceData;

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
  async findSingleEstimation(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.estiamtionRepository.findOne({
      where: {
        id: id,
        organizationId: userPayload.organizationId
      },
      relations: ["estimationDetails"]
    });

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Estiamtion",
        message: `Estiamtion fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: data,
      organizationId: userPayload.organizationId
    };
    if (!data) {
      throw new NotFoundException(`Estiamtion not exist in db!!`);
    }

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }

  /**
   * Get One invoice data
   */
  async findOneEstimation(id: number) {
    const data = await this.estiamtionRepository.findOne({
      where: {
        id: id
      }
    });
    if (!data) {
      throw new NotFoundException(`Estiamtion not exist in db!!`);
    }
    return data;
  }
}
