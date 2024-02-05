// configuration controller

import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as randomToken from "rand-token";
import { StatusField } from "src/authentication/common/enum";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { Brackets, DataSource, Not } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { AccountingGroupEntity, AccountsEntity, OrganizationEntity, ProductCategoryEntity } from "../entities";
import { StockHistoryDetailsEntity } from "../entities/stock-history-details.entity";
import { StockHistoryEntity } from "../entities/stock-history.entity";
import { AccountService } from "./account.service";
import * as QuickBooks from "node-quickbooks";
import { CreateProductsDto, UpdateProductsDto } from "../dtos/products";
import { ProductsEntity } from "../entities/products.entity";
import { ActivityLogService } from "./activity-log.service";
import { AuthService } from "../authentication/auth/auth.service";

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductsEntity)
    private ProductRepository: BaseRepository<ProductsEntity>,
    @InjectRepository(StockHistoryEntity)
    private stockHistoryRepository: BaseRepository<StockHistoryEntity>,
    private activityLogService: ActivityLogService,
    private dataSource: DataSource,
    @Inject(forwardRef(() => AccountService))
    private accountService: AccountService,
    private authservice: AuthService
  ) {}

  //  create Product
  async createProduct(createProductsDto: CreateProductsDto, userPayload: UserInterface): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    let exceptionmessage = "fialed";
    try {
      // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
      //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
      // }

      const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Stock In Hand" } });
      const findName = await queryRunner.manager.findOne(ProductsEntity, { where: { itemName: createProductsDto.itemName.trim(), organizationId: userPayload.organizationId } });

      if (findName) {
        exceptionmessage = `duplicate name found. please insert a unique one.`;
        throw new BadRequestException(`duplicate name found. please insert a unique one.`);
      }

      // prepare ledger data
      if (createProductsDto.itemType == "Inventory") {
        const ledgerObj = new AccountsEntity();
        ledgerObj.name = "Stock " + createProductsDto.itemName;
        ledgerObj.fullyQualifiedName = "Stock " + createProductsDto.itemName;
        ledgerObj.ledgerParent = accountGroup.id;
        ledgerObj.accountType = accountGroup.groupHeadType;
        ledgerObj.accountSubType = accountGroup.groupName;
        ledgerObj.classification = accountGroup.groupName;
        //   ledgerObj.ledgerType = accountGroup.groupHeadType;
        ledgerObj.nature = accountGroup.nature;
        ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Stock", userPayload);
        ledgerObj.accountOpeningBalance = 0;
        ledgerObj.openingBalance = 0;
        ledgerObj.closingBalance = Number(createProductsDto.openingStock) * Number(createProductsDto.unitPrice);
        ledgerObj.createdAt = new Date();
        ledgerObj.updatedAt = new Date();
        ledgerObj.createdBy = userPayload.id;
        ledgerObj.organizationId = userPayload.organizationId;
        ledgerObj.updatedBy = 0;
        ledgerObj.deletedBy = 0;

        const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);
        if (saveLedger) {
          let serviceinfo = new ProductsEntity();
          serviceinfo.createdAt = new Date();
          serviceinfo.updatedAt = new Date();
          serviceinfo.createdBy = userPayload.id;
          serviceinfo.organizationId = userPayload.organizationId;
          serviceinfo.updatedBy = 0;
          serviceinfo.deletedBy = 0;
          serviceinfo.taxable = createProductsDto.taxable;
          serviceinfo.ledger = saveLedger;
          serviceinfo.ledgerId = saveLedger.id;
          serviceinfo.supplierLedgerId = createProductsDto.vendorLedgerId;
          serviceinfo.unitPrice = createProductsDto.unitPrice;
          serviceinfo.openingStock = createProductsDto.openingStock;
          serviceinfo.itemType = createProductsDto.itemType;
          serviceinfo.itemName = createProductsDto.itemName;
          serviceinfo.sellingPrice = createProductsDto.sellingPrice;
          serviceinfo.productsCode = ledgerObj.ledgerCode;

          serviceinfo.sku = createProductsDto.sku;
          serviceinfo.description = createProductsDto.description;
          serviceinfo.categoryId = createProductsDto.categoryId;

          const category = await queryRunner.manager.findOne(ProductCategoryEntity, {
            where: {
              id: createProductsDto.categoryId,
              organizationId: userPayload.organizationId
            }
          });
          serviceinfo.productcategory = category;

          const logInfo = createProductsDto?.ipPayload;

          const log = {
            cLientIPAddress: logInfo.ip,
            browser: logInfo.browser,
            os: logInfo.os,
            userId: userPayload.id,
            messageDetails: {
              tag: "Service/Product",
              message: `New Service/Product created by ${decrypt(userPayload.hashType)}`
            },
            logData: serviceinfo,
            organizationId: userPayload.organizationId
          };

          // save Product data
          const insertData = await queryRunner.manager.save(ProductsEntity, serviceinfo);

          let capitalledger = await queryRunner.manager.findOne(AccountsEntity, {
            where: {
              name: "Capital Account",
              organizationId: userPayload.organizationId
            }
          });
          if (log) {
            await this.activityLogService.createLog(log, queryRunner);
          }

          if (insertData) {
            // stock data creation
            const stockinfo = new StockHistoryEntity();
            stockinfo.avgPurchaseRate = insertData.unitPrice;
            stockinfo.pqty = insertData.openingStock;
            stockinfo.purchaseAmount = insertData.openingStock * insertData.unitPrice;
            stockinfo.avgSalesRate = 1;
            stockinfo.productId = insertData.id;
            stockinfo.product = insertData;
            stockinfo.sqty = 0;
            stockinfo.soldAmount = 0;
            stockinfo.remaningqty = insertData.openingStock;
            stockinfo.createdAt = new Date();
            stockinfo.updatedAt = new Date();
            stockinfo.createdBy = userPayload.id;
            stockinfo.organizationId = userPayload.organizationId;
            stockinfo.updatedBy = 0;
            stockinfo.deletedBy = 0;
            // save stock data
            const stock = await queryRunner.manager.save(StockHistoryEntity, stockinfo);
            if (insertData.openingStock > 0) {
              // stock details data creation

              const stockDetails = new StockHistoryDetailsEntity();
              stockDetails.rate = insertData.unitPrice;
              stockDetails.qty = insertData.openingStock;
              stockDetails.totalAmount = Number(insertData.unitPrice) * Number(insertData.openingStock);
              stockDetails.remainingAmount = insertData.openingStock;
              stockDetails.stockType = insertData.unitPrice;
              stockDetails.productId = insertData.id;
              stockDetails.product = insertData;
              stockDetails.createdAt = new Date();
              stockDetails.updatedAt = new Date();
              stockDetails.createdBy = userPayload.id;
              stockDetails.organizationId = userPayload.organizationId;
              stockDetails.updatedBy = 0;
              stockDetails.deletedBy = 0;
              // save stock details data
              const details = await queryRunner.manager.save(StockHistoryDetailsEntity, stockDetails);

              if (details) {
                // body creation for creating opening balance transaction
                capitalledger.openingBalance = capitalledger.closingBalance;
                capitalledger.closingBalance = Number(capitalledger.closingBalance) + Number(details.totalAmount);
                // update ledger data
                let ledferinf = await queryRunner.manager.update(AccountsEntity, { id: capitalledger.id }, capitalledger);

                const body = {
                  ledgerId: details.id,
                  captialId: capitalledger.id,
                  openingbalance: ledgerObj.closingBalance,
                  openingbalancecap: capitalledger.openingBalance,
                  closingbalancecap: capitalledger.closingBalance,
                  userId: userPayload.id,
                  organizationId: userPayload.organizationId
                };

                // calling opening balance transaction function
                let transinformation = await this.accountService.openingBalanceTransaction(body, queryRunner);
                //console.log('transinformation: ' + transinformation);
              }
            }

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

                await qboobject.createItem(
                  {
                    TrackQtyOnHand: true,
                    Name: serviceinfo.itemName,
                    QtyOnHand: serviceinfo.openingStock,
                    PurchaseCost: serviceinfo.unitPrice,
                    IncomeAccountRef: {
                      name: "Sales of Product Income",
                      value: "79"
                    },
                    AssetAccountRef: {
                      name: "Inventory Asset",
                      value: "81"
                    },
                    InvStartDate: new Date(),
                    Type: "Inventory",
                    ExpenseAccountRef: {
                      name: "Cost of Goods Sold",
                      value: "80"
                    }
                  },
                  async function (err, Product) {
                    if (err) {
                      throw new BadRequestException(err);
                    } else {
                      serviceinfo.qbRefId = Product.Id;

                      const insertData = await queryRunner.manager.update(ProductsEntity, { id: serviceinfo.id }, serviceinfo);

                      // prepare log data
                      const log = {
                        cLientIPAddress: logInfo.ip,
                        browser: logInfo.browser,
                        os: logInfo.os,
                        userId: userPayload.id,
                        messageDetails: {
                          tag: "Employee",
                          message: `New Employee created by ${decrypt(userPayload.hashType)}`
                        },
                        logData: insertData,
                        organizationId: userPayload.organizationId
                      };
                      // save log
                      //if (log) {
                      //    await this.activityLogService.createLog(log, queryRunner);
                      //}

                      await queryRunner.commitTransaction();

                      return insertData;
                    }
                  }
                );
              }
            } else {
              // prepare log data
              const log = {
                cLientIPAddress: logInfo.ip,
                browser: logInfo.browser,
                os: logInfo.os,
                userId: userPayload.id,
                messageDetails: {
                  tag: "Employee",
                  message: `New Employee created by ${decrypt(userPayload.hashType)}`
                },
                logData: insertData,
                organizationId: userPayload.organizationId
              };
              // save log
              //if (log) {
              //    await this.activityLogService.createLog(log, queryRunner);
              //}

              await queryRunner.commitTransaction();

              return insertData;
            }
          }
        }
      } else {
        let serviceinfo = new ProductsEntity();
        serviceinfo.createdAt = new Date();
        serviceinfo.updatedAt = new Date();
        serviceinfo.createdBy = userPayload.id;
        serviceinfo.organizationId = userPayload.organizationId;
        serviceinfo.updatedBy = 0;
        serviceinfo.deletedBy = 0;
        serviceinfo.taxable = createProductsDto.taxable;
        serviceinfo.categoryId = createProductsDto.categoryId;
        serviceinfo.unitPrice = createProductsDto.unitPrice;
        serviceinfo.itemType = createProductsDto.itemType;
        serviceinfo.itemName = createProductsDto.itemName;
        serviceinfo.itemName = createProductsDto.itemName;
        serviceinfo.sellingPrice = createProductsDto.sellingPrice;

        serviceinfo.productsCode = await this.accountService.generateBaseNumbers("Stock", userPayload);

        serviceinfo.sku = createProductsDto.sku;
        serviceinfo.description = createProductsDto.description;
        serviceinfo.categoryId = createProductsDto.categoryId;

        const logInfo = createProductsDto?.ipPayload;

        const log = {
          cLientIPAddress: logInfo.ip,
          browser: logInfo.browser,
          os: logInfo.os,
          userId: userPayload.id,
          messageDetails: {
            tag: "Service/Product",
            message: `New Service/Product created by ${decrypt(userPayload.hashType)}`
          },
          logData: serviceinfo,
          organizationId: userPayload.organizationId
        };

        // save Product data
        const insertData = await queryRunner.manager.save(ProductsEntity, serviceinfo);
        if (insertData) {
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

              await qboobject.createItem(
                {
                  TrackQtyOnHand: false,
                  Name: serviceinfo.itemName,
                  IncomeAccountRef: {
                    name: "Sales of Product Income",
                    value: "79"
                  },
                  PurchaseCost: serviceinfo.unitPrice,
                  InvStartDate: new Date(),
                  Type: "Service"
                },
                async function (err, Product) {
                  if (err) {
                    throw new BadRequestException(err);
                  } else {
                    serviceinfo.qbRefId = Product.Id;

                    const insertData = await queryRunner.manager.update(ProductsEntity, { id: serviceinfo.id }, serviceinfo);

                    // prepare log data
                    const log = {
                      cLientIPAddress: logInfo.ip,
                      browser: logInfo.browser,
                      os: logInfo.os,
                      userId: userPayload.id,
                      messageDetails: {
                        tag: "Employee",
                        message: `New Employee created by ${decrypt(userPayload.hashType)}`
                      },
                      logData: insertData,
                      organizationId: userPayload.organizationId
                    };
                    // save log
                    //if (log) {
                    //    await this.activityLogService.createLog(log, queryRunner);
                    //}

                    await queryRunner.commitTransaction();

                    return insertData;
                  }
                }
              );
            }
          } else {
            // prepare log data
            const log = {
              cLientIPAddress: logInfo.ip,
              browser: logInfo.browser,
              os: logInfo.os,
              userId: userPayload.id,
              messageDetails: {
                tag: "Employee",
                message: `New Employee created by ${decrypt(userPayload.hashType)}`
              },
              logData: insertData,
              organizationId: userPayload.organizationId
            };
            // save log
            //if (log) {
            //    await this.activityLogService.createLog(log, queryRunner);
            //}

            await queryRunner.commitTransaction();

            return insertData;
          }
        }
      }
    } catch (err) {
      console.log(err);
      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      //await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // update Product
  async updateProduct(updateServiceDto: UpdateProductsDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    let exceptionmessage = "failed";

    try {
      const Product = await queryRunner.manager.findOne(ProductsEntity, {
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });

      if (!Product) {
        exceptionmessage = `This data not exist in DB!!!`;
        throw new BadRequestException(`This data not exist in DB!!!`);
      }
      const findName = await queryRunner.manager.findOne(ProductsEntity, {
        where: {
          itemName: updateServiceDto.itemName.trim(),
          id: Not(id),
          organizationId: userPayload.organizationId
        }
      });

      if (findName) {
        exceptionmessage = `duplicate name found. please insert a unique one.`;

        throw new BadRequestException(`duplicate name found. please insert a unique one.`);
      }

      Product.itemName = updateServiceDto.itemName;
      Product.unitPrice = updateServiceDto.unitPrice;
      Product.sellingPrice = updateServiceDto.sellingPrice;
      Product.sku = updateServiceDto.sku;
      Product.taxable = updateServiceDto.taxable;
      Product.description = updateServiceDto.description;
      Product.supplierLedgerId = updateServiceDto.vendorLedgerId;
      Product.updatedAt = new Date();
      Product.updatedBy = userPayload.id;
      Product.categoryId = updateServiceDto.categoryId;
      const category = await queryRunner.manager.findOne(ProductCategoryEntity, {
        where: {
          id: updateServiceDto.categoryId,
          organizationId: userPayload.organizationId
        }
      });
      Product.productcategory = category;
      const data = await queryRunner.manager.update(ProductsEntity, { id: id }, Product);

      const logInfo = updateServiceDto?.ipPayload;

      // Prepare Activity Log
      const log = {
        cLientIPAddress: logInfo.ip,
        browser: logInfo.browser,
        os: logInfo.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Service/Product",
          message: `Service/Product updated by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: data,
        organizationId: userPayload.organizationId
      };

      if (data) {
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

            if (Product.itemType == "Inventory") {
              // await qboobject.updateItem(
              //     {
              //         FullyQualifiedName: Product.itemName,
              //         Id: Product.qbRefId,
              //         Name: Product.itemName,
              //         TrackQtyOnHand: true,
              //         ItemType: "Inventory",
              //         PurchaseCost: Product.unitPrice,
              //         IncomeAccountRef: {
              //             "name": "Sales of Product Income",
              //             "value": "79"
              //         },
              //         AssetAccountRef: {
              //             "name": "Inventory Asset",
              //             "value": "81"
              //         },
              //         Taxable: Product.taxable,
              //         MetaData: {
              //             "LastUpdatedTime": new Date()
              //         },
              //         SyncToken: "2",
              //         UnitPrice: Product.unitPrice,
              //         ExpenseAccountRef: {
              //             "name": "Cost of Goods Sold",
              //             "value": "80"
              //         },
              //         PurchaseDesc: Product.description,
              //         Description: "New, updated description for " + Product.itemName
              //     },
              //     async function (err, Product) {
              //         if (err) {
              //             throw new BadRequestException(err);
              //         } else {
              //             await queryRunner.commitTransaction();
              //             return data;
              //         }
              //     }
              // );
            } else {
              // await qboobject.updateItem(
              //     {
              //         FullyQualifiedName: Product.itemName,
              //         Id: Product.qbRefId,
              //         Name: Product.itemName,
              //         TrackQtyOnHand: false,
              //         ItemType: "Service",
              //         PurchaseCost: Product.unitPrice,
              //         IncomeAccountRef: {
              //             "name": "Sales of Product Income",
              //             "value": "79"
              //         },
              //         //Taxable: Product.taxable,
              //         MetaData: {
              //             "LastUpdatedTime": new Date()
              //         },
              //         SyncToken: "2",
              //         UnitPrice: Product.unitPrice,
              //         PurchaseDesc: Product.description,
              //         Description: "New, updated description for " + Product.itemName
              //     },
              //     async function (err, Product) {
              //         if (err) {
              //             throw new BadRequestException(err);
              //         } else {
              //             await queryRunner.commitTransaction();
              //             return data;
              //         }
              //     }
              // );
            }
          }
        } else {
          // prepare log data
          const log = {
            cLientIPAddress: logInfo.ip,
            browser: logInfo.browser,
            os: logInfo.os,
            userId: userPayload.id,
            messageDetails: {
              tag: "Employee",
              message: `New Employee created by ${decrypt(userPayload.hashType)}`
            },
            logData: data,
            organizationId: userPayload.organizationId
          };

          await queryRunner.commitTransaction();

          return data;
        }
      }
      // Save Activity Log
      if (log) {
        await this.activityLogService.createLog(log, queryRunner);
      }
      await queryRunner.commitTransaction();
      return `Product updated successfully!!!`;
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

  // find all Product
  async findAllProduct(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Service/Product",
        message: `All Service/Product fetched by ${decrypt(userPayload.hashType)}`,
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
      const [results, total] = await queryRunner.manager.findAndCount(ProductsEntity, {
        where: { organizationId: userPayload.organizationId },
        take: limit,
        skip: page > 0 ? page * limit - limit : page
      });

      await this.activityLogService.createLogWithoutTransaction(log);

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

  // delete Product
  async deleteProduct(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    let message = "failed";

    try {
      const Product = await queryRunner.manager.findOne(ProductsEntity, {
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
          tag: "Service/Product",
          message: `Service/Product deleted by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: Product,
        organizationId: userPayload.organizationId
      };

      if (!Product) {
        message = "Product not found";
        throw new NotFoundException("Product not found");
      }
      // Save Activity Log
      await this.activityLogService.createLog(log, queryRunner);
      let data = await queryRunner.manager.remove(ProductsEntity, Product);
      await queryRunner.commitTransaction();

      return data;
    } catch (err) {
      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(message);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  /**
   * Get Single Product
   */
  async findSingleProduct(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.ProductRepository.findOne({
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
        tag: "Service/Product",
        message: `Single Service/Product fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: data,
      organizationId: userPayload.organizationId
    };

    if (!data) {
      throw new NotFoundException(`this Product not exist in db!!`);
    }

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }

  /**
   * Get One Product
   */
  async findOneProduct(id: number) {
    const data = await this.ProductRepository.findOne({
      where: {
        id: id
      }
    });
    if (!data) {
      throw new NotFoundException(`this Product not exist in db!!`);
    }
    return data;
  }

  /**
   * DROPDOWN -> Product
   */
  async dropdown(userPayload: UserInterface) {
    //const results = await this.ProductRepository.find({
    //    where: { organizationId: userPayload.organizationId, status: StatusField.ACTIVE },
    //    select: { id: true, Name: true },
    //})

    //return results;
    const dropdown = await this.ProductRepository.createQueryBuilder("Product")
      .where(`Product.status = '${StatusField.ACTIVE}'`)
      .andWhere(`Product.organizationId = ${userPayload.organizationId}`)
      .andWhere(`Product.itemType = 'Inventory'`)
      .select(["Product.id as value", "Product.itemName as label"])
      .getRawMany();

    return dropdown;
  }

  async dropdownCategory(id: number, userPayload: UserInterface) {
    //const results = await this.ProductRepository.find({
    //    where: { organizationId: userPayload.organizationId, status: StatusField.ACTIVE },
    //    select: { id: true, Name: true },
    //})

    console.log(id);

    //return results;
    return await this.ProductRepository.createQueryBuilder("Product")
      .where(`Product.status = '${StatusField.ACTIVE}'`)
      .andWhere(`Product.organizationId = ${userPayload.organizationId}`)
      .andWhere(`Product.itemType = 'Inventory'`)
      .andWhere(
        new Brackets((qb) => {
          if (id != 0) {
            qb.where(`Product.categoryId = ${id}`);
          }
        })
      )
      //   .andWhere(`Product.categoryId = ${id}`)
      .select(["Product.id as value", "Product.itemName as label"])
      .getRawMany();
  }

  /**
   * Get One Product
   */
  async findProductunitPrice(id: number, userPayload: UserInterface) {
    const data = await this.stockHistoryRepository.findOne({
      where: {
        productId: id,
        organizationId: userPayload.organizationId
      },
      relations: ["product"]
    });
    if (!data) {
      throw new NotFoundException(`this Product not exist in db!!`);
    }
    if (data.product.taxable == true) {
      let returndta = {
        PurchaseRate: data.avgPurchaseRate,
        Taxable: data.product.taxable,
        Taxrate: 9
      };
      return returndta;
    } else {
      let returndta = {
        PurchaseRate: data.avgPurchaseRate,
        Taxable: data.product.taxable,
        Taxrate: 0
      };
      return returndta;
    }
  }

  async findProductSellingPrice(id: number, userPayload: UserInterface) {
    const data = await this.ProductRepository.findOne({
      where: {
        id: id,
        organizationId: userPayload.organizationId
      }
    });
    if (!data) {
      throw new NotFoundException(`this Product not exist in db!!`);
    }
    return data.sellingPrice;
  }
}
