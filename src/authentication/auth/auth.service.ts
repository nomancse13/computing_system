import { BadRequestException, Injectable } from "@nestjs/common";
import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common/exceptions";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { GoogleRecaptchaValidator } from "@nestlab/google-recaptcha";
import * as bcrypt from "bcrypt";
import * as OAuthClient from "intuit-oauth";
import * as QuickBooks from "node-quickbooks";
import * as path from "path";
import * as randToken from "rand-token";
import * as randomToken from "rand-token";
import {
  AccountingGroupEntity,
  CustomersEntity,
  DepartmentEntity,
  EmployeesEntity,
  AccountsEntity,
  OrganizationEntity,
  ProductCategoryEntity,
  ProductsEntity,
  StockHistoryDetailsEntity,
  StockHistoryEntity,
  UserEntity,
  UserTypeEntity,
  VendorsEntity,
  BillEntity,
  BillDetailsEntity,
  PaymentMadeEntity,
  BankAccountEntity,
  VendorDebitsEntity,
  ManualJournalsEntity,
  InvoiceEntity,
  InvoiceDetailsEntity,
  PaymentReceivedEntity,
  CreditNotesEntity
} from "src/entities";
import { encrypt } from "src/helper/crypto.helper";
import { QueueMailDto } from "src/modules/queue-mail/queue-mail.dto";
import { AccountService } from "src/services/account.service";
import { ActivityLogService } from "src/services/activity-log.service";
import { LedgersService } from "src/services/ledgers.service";
import { Brackets, DataSource, QueryRunner } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { v4 as uuidv4 } from "uuid";
import { QueueMailService } from "../../modules/queue-mail/queue-mail.service";
import { AccountingGroupService } from "../../services/accounting-group.service";
import { UserTypeService } from "../../services/user-type.service";
import { ErrorMessage, StatusField, UserTypesEnum } from "../common/enum";
import { Pagination, PaginationOptionsInterface, UserInterface } from "../common/interfaces";
import { ChangeForgotPassDto, ForgotPassDto } from "./dto";
import { AuthDto } from "./dto/auth.dto";
import { LoginDto } from "./dto/login.dto";
import { PurchaseOrderEntity } from "src/entities/purchase-order.entity";
import { TaxRate } from "src/entities/taxRate.entity";
import { PurchaseOrderDetailsEntity } from "../../entities/purchase-order-details.entity";
import { PaymentMadeDetailsEntity } from "../../entities/paymentmade-details.entity";
import { PaymentMethodEntity } from "../../entities/paymentMethod.entity";
import { VendorCreditDetailsEntity } from "../../entities/vendorcredit-details.entity";
import { ManualJournalDetailsEntity } from "../../entities/manual-journals-details.entity";
import { EstimationDetailsEntity } from "../../entities/estiamtion-details.entity";
import { PaymentDetailsEntity } from "../../entities/payment-details.entity";
import { CreditNoteDetailsEntity } from "../../entities/credit-note-details.entity";
import { async } from "rxjs";
import { Token } from "aws-sdk";
import { EstimationEntity } from "src/entities/estimation.entity";
let exceptionmessage = "Failed";

let clientkey = "ABJ1OolGzbp9uYL16HO4oYoW061MsQx0OD54NVtpjxSnDE5fLg";
let clientsecret = "EeRADJ2JJt2H9RnHFIcXGiRJGgkoPRrgflpboIOm";
let isauthenticated = false;
let qbtoken: any;
let oauthClient = null;
let qboobject = null;
let organizationid: number;
let realmeID: string;
let accessToken: string;
let refreshToken: string;
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: BaseRepository<UserEntity>,
    @InjectRepository(OrganizationEntity)
    private organizationEntityRepository: BaseRepository<OrganizationEntity>,

    private jwtService: JwtService,
    private readonly queueMailService: QueueMailService,
    private readonly configService: ConfigService,
    private readonly userTypeService: UserTypeService,
    private accountService: AccountService,
    private readonly ledgersService: LedgersService,
    private readonly activityLogService: ActivityLogService,
    private readonly accountingGroupService: AccountingGroupService,
    private readonly recaptchaValidator: GoogleRecaptchaValidator,
    private dataSource: DataSource
  ) {}

  //#region Quickbooks
  async intuitAuthentication(userPayload: UserInterface) {
    try {
      let organizationinforamtion = await this.organizationEntityRepository.findOne({
        where: { id: userPayload.organizationId }
      });
      organizationid = userPayload.organizationId;
      clientkey = organizationinforamtion.qbClientKey;
      clientsecret = organizationinforamtion.qbClientSecret;

      oauthClient = new OAuthClient({
        clientId: clientkey,
        clientSecret: clientsecret,
        environment: "sandbox" || "production",
        redirectUri: "http://localhost:4000/api/v1/auth/callback"
      });

      //await this.refreshtoken(userPayload, oauthClient);
      if (organizationinforamtion.accessToken == null || organizationinforamtion.accessToken == undefined || organizationinforamtion.accessToken == "") {
        // AuthorizationUri
        const authUri = await oauthClient.authorizeUri({
          scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
          state: "testState"
        }); // can be an array of multiple scopes ex : {scope:[OAuthClient.scopes.Accounting,OAuthClient.scopes.OpenId]}

        return authUri;
      } else {
        console.log("oauthClient.isAccessTokenValid(): ", oauthClient.isAccessTokenValid());

        // if (!oauthClient.isAccessTokenValid()) {
        //    await this.refreshtoken(userPayload)
        //    return "Authenticated";

        // }
        // else
        {
          //#region Start Transaction
          const queryRunner = this.dataSource.createQueryRunner();
          // a new transaction:
          await queryRunner.startTransaction();

          try {
            const qboobject = new QuickBooks(
              clientkey,
              clientsecret,
              organizationinforamtion.accessToken,
              false, // no token secret for oAuth 2.0
              organizationinforamtion.realmeID,
              true, // use the sandbox?
              true, // enable debugging?
              null, // set minorversion, or null for the latest version
              "2.0", //oAuth version
              organizationinforamtion.refreshToken
            );
            //#region Complted Code
            //#region Category
            qboobject.findItems(
              [
                { field: "fetchAll", value: true },
                { field: "Type", value: "Category" }
              ],
              async (err: any, results: any) => {
                if (err) {
                  console.log(err);
                } else {
                  await Promise.all(
                    results?.QueryResponse?.Item?.map(async (a: any) => {
                      console.log("name: ", a.Name);
                      const findName = await queryRunner.manager.findOne(ProductCategoryEntity, {
                        where: {
                          organizationId: organizationinforamtion.id,
                          qbRefId: a.Id
                        }
                      });
                      if (findName == null) {
                        let serviceinfo = new ProductCategoryEntity();
                        serviceinfo.createdAt = new Date();
                        serviceinfo.updatedAt = new Date();
                        serviceinfo.createdBy = 0;
                        serviceinfo.organizationId = organizationinforamtion.id;
                        serviceinfo.organization = organizationinforamtion;
                        serviceinfo.updatedBy = 0;
                        serviceinfo.deletedBy = 0;
                        serviceinfo.Name = a.Name;
                        serviceinfo.qbRefId = a.Id;

                        const insertData = await queryRunner.manager.save(ProductCategoryEntity, serviceinfo);
                      }
                    })
                  );
                }
              }
            );
            //#endregion

            //#region Items

            qboobject.findItems(
              {
                fetchAll: true
              },
              async (err: any, results: any) => {
                if (err) {
                } else {
                  await Promise.all(
                    results?.QueryResponse?.Item.map(async (a: any) => {
                      const findName = await queryRunner.manager.findOne(ProductsEntity, {
                        where: {
                          organizationId: organizationinforamtion.id,
                          qbRefId: a.Id
                        }
                      });
                      if (findName == null) {
                        const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Stock In Hand" } });

                        const findName = await queryRunner.manager.findOne(ProductsEntity, { where: { itemName: a.Name, organizationId: organizationinforamtion.id, qbRefId: a.Id } });
                        let userpayload = {
                          id: 0,
                          email: "dsfdf",
                          uniqueId: "dsfsdfdsf",
                          hashType: "dfdsfsdf",
                          organizationId: organizationinforamtion.id
                        };
                        if (findName == null) {
                          if (a.Type == "Inventory") {
                            const ledgerObj = new AccountsEntity();
                            ledgerObj.name = "Stock " + a.FullyQualifiedName;
                            ledgerObj.fullyQualifiedName = a.FullyQualifiedName;
                            ledgerObj.ledgerParent = accountGroup.id;
                            ledgerObj.accountType = accountGroup.groupHeadType;
                            ledgerObj.accountSubType = accountGroup.groupName;
                            ledgerObj.classification = accountGroup.groupHeadType;
                            ledgerObj.nature = accountGroup.nature;

                            ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Stock", userpayload);
                            ledgerObj.accountOpeningBalance = 0;
                            ledgerObj.openingBalance = 0;
                            ledgerObj.qbRefId = a.Id;
                            ledgerObj.closingBalance = Number(a.QtyOnHand ? a.QtyOnHand : 0) * Number(a.UnitPrice);
                            ledgerObj.createdAt = new Date();
                            ledgerObj.updatedAt = new Date();
                            ledgerObj.createdBy = 0;
                            ledgerObj.organizationId = organizationinforamtion.id;
                            ledgerObj.updatedBy = 0;
                            ledgerObj.deletedBy = 0;

                            const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

                            if (saveLedger) {
                              let serviceinfo = new ProductsEntity();
                              serviceinfo.createdAt = new Date();
                              serviceinfo.updatedAt = new Date();
                              serviceinfo.itemType = a.Type;
                              serviceinfo.createdBy = 0;
                              serviceinfo.organizationId = organizationinforamtion.id;
                              serviceinfo.updatedBy = 0;
                              serviceinfo.deletedBy = 0;
                              serviceinfo.ledger = saveLedger;
                              serviceinfo.ledgerId = saveLedger.id;
                              serviceinfo.qbRefId = a.Id;
                              if (a.Taxable != undefined) serviceinfo.taxable = a.Taxable;
                              else serviceinfo.taxable = false;
                              serviceinfo.itemName = a.FullyQualifiedName;
                              serviceinfo.unitPrice = a.PurchaseCost;
                              if (a.UnitPrice != undefined) serviceinfo.sellingPrice = a.UnitPrice;
                              else serviceinfo.sellingPrice = 0;

                              serviceinfo.productsCode = ledgerObj.ledgerCode;
                              serviceinfo.openingStock = Number(a.QtyOnHand ? a.QtyOnHand : 0);
                              serviceinfo.sku = "quickbook";
                              serviceinfo.description = a.Description;
                              serviceinfo.categoryId = 0;
                              serviceinfo.supplierLedgerId = serviceinfo.supplierLedgerId;
                              serviceinfo.unitPrice = a.PurchaseCost;

                              const insertData = await queryRunner.manager.save(ProductsEntity, serviceinfo);

                              let capitalledger = await queryRunner.manager.findOne(AccountsEntity, {
                                where: {
                                  name: "Capital Account",
                                  organizationId: userpayload.organizationId
                                }
                              });

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
                                stockinfo.createdBy = 0;
                                stockinfo.organizationId = organizationinforamtion.id;
                                stockinfo.updatedBy = 0;
                                stockinfo.deletedBy = 0;
                                // save stock data
                                const stock = await queryRunner.manager.save(StockHistoryEntity, stockinfo);
                                if (insertData.id > 0) {
                                  // stock details data creation
                                  if (insertData.openingStock > 0) {
                                    const stockDetails = new StockHistoryDetailsEntity();
                                    stockDetails.rate = insertData.unitPrice;
                                    stockDetails.qty = insertData.openingStock;
                                    stockDetails.totalAmount = Number(insertData.unitPrice) * Number(insertData.openingStock);
                                    stockDetails.remainingAmount = insertData.openingStock;
                                    stockDetails.stockType = insertData.unitPrice;
                                    stockDetails.productId = insertData.id;
                                    stockDetails.product = insertData;
                                    stockDetails.qbRefId = a.Id;
                                    stockDetails.createdAt = new Date();
                                    stockDetails.updatedAt = new Date();
                                    stockDetails.createdBy = 0;
                                    stockDetails.organizationId = organizationinforamtion.id;
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
                                        userId: 0,
                                        organizationId: organizationinforamtion.id
                                      };

                                      // calling opening balance transaction function
                                      let transinformation = await this.accountService.openingBalanceTransaction(body, queryRunner);
                                      //console.log('transinformation: ' + transinformation);
                                    }
                                  }
                                }
                              }
                            }
                          } else if (a.Type == "Service") {
                            let serviceinfo = new ProductsEntity();
                            serviceinfo.createdAt = new Date();
                            serviceinfo.updatedAt = new Date();
                            serviceinfo.itemType = a.Type;
                            serviceinfo.createdBy = 0;
                            serviceinfo.organizationId = organizationinforamtion.id;
                            serviceinfo.updatedBy = 0;
                            serviceinfo.deletedBy = 0;
                            serviceinfo.qbRefId = a.Id;
                            if (a.Taxable != undefined) serviceinfo.taxable = a.Taxable;
                            else serviceinfo.taxable = false;

                            serviceinfo.itemName = a.FullyQualifiedName;
                            serviceinfo.unitPrice = a.PurchaseCost;
                            if (a.UnitPrice != undefined) serviceinfo.sellingPrice = a.UnitPrice;
                            else serviceinfo.sellingPrice = 0;

                            serviceinfo.productsCode = await this.accountService.generateBaseNumbers("Stock", userpayload);
                            serviceinfo.openingStock = Number(a.QtyOnHand ? a.QtyOnHand : 0);
                            serviceinfo.sku = "quickbook";
                            serviceinfo.description = a.Description;
                            serviceinfo.categoryId = 0;
                            serviceinfo.supplierLedgerId = serviceinfo.supplierLedgerId;
                            serviceinfo.unitPrice = a.UnitPrice;

                            const insertData = await queryRunner.manager.save(ProductsEntity, serviceinfo);
                          }
                          // prepare ledger data
                        }
                      }
                    })
                  );
                }
              }
            );

            //#endregion

            // #region Customers
            qboobject.findCustomers(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  //console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };
                  //console.log(results?.QueryResponse?.Customer);

                  await Promise.all(
                    results?.QueryResponse?.Customer.map(async (a) => {
                      const findName = await queryRunner.manager.findOne(CustomersEntity, {
                        where: {
                          organizationId: organizationinforamtion.id,
                          qbRefId: a.Id
                        }
                      });

                      if (findName == null) {
                        const ledgerObj = new AccountsEntity();

                        const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Accounts Receivable" } });

                        ledgerObj.name = a.FullyQualifiedName;
                        ledgerObj.fullyQualifiedName = a.FullyQualifiedName;
                        ledgerObj.ledgerParent = accountGroup.id;
                        ledgerObj.nature = accountGroup.nature;
                        ledgerObj.accountType = accountGroup.groupHeadType;
                        ledgerObj.accountSubType = accountGroup.groupName;
                        ledgerObj.classification = accountGroup.groupHeadType;
                        ledgerObj.qbRefId = a.Id;
                        ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Customer", userPayload);
                        ledgerObj.accountOpeningBalance = a.Balance;
                        ledgerObj.openingBalance = 0;
                        ledgerObj.closingBalance = a.Balance;
                        ledgerObj.createdAt = new Date();
                        ledgerObj.updatedAt = new Date();
                        ledgerObj.createdBy = a.id;
                        ledgerObj.organization = organizationinforamtion;
                        ledgerObj.organizationId = organizationinforamtion.id;
                        ledgerObj.updatedBy = 0;
                        ledgerObj.deletedBy = 0;
                        const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

                        let newsup = new CustomersEntity();
                        newsup.fullyQualifiedName = a.FullyQualifiedName;
                        newsup.companyName = a.FullyQualifiedName;
                        newsup.familyName = a.FullyQualifiedName;

                        if (a.GivenNam != undefined && a.GivenName != null) newsup.givenName = a.GivenName;
                        else newsup.givenName = a.DisplayName;

                        newsup.displayName = a.DisplayName;

                        if (a.FamilyName != undefined && a.FamilyName != null) newsup.familyName = a.FamilyName;
                        else newsup.familyName = a.DisplayName;

                        newsup.companyName = a.CompanyName;
                        newsup.printOnCheckName = a.PrintOnCheckName;
                        newsup.taxable = a.Taxable;

                        //newsup.ema = createSuppliersDto.email;
                        if (a.PrimaryPhone != undefined && a.PrimaryPhone != null) {
                          newsup.mobile = a.PrimaryPhone.FreeFormNumber;
                        } else newsup.mobile = null;

                        if (a.primaryAddr != undefined && a.primaryAddr != null) {
                          newsup.billAddr = a.PrimaryAddr?.Line1 + a.PrimaryAddr?.City + a.PrimaryAddr?.CountrySubDivisionCode + "-" + a.PrimaryAddr?.PostalCode;
                          newsup.shippingAddress = a.PrimaryAddr?.Line1 + a.PrimaryAddr?.City + a.PrimaryAddr?.CountrySubDivisionCode + "-" + a.PrimaryAddr?.PostalCode;
                        }

                        newsup.customerCode = ledgerObj.ledgerCode;
                        newsup.contactPersons = "";
                        newsup.taxable = a.Taxable;

                        newsup.email = a.PrimaryEmailAddr?.Address ?? "";
                        newsup.billAddr = a.BillAddr?.City ?? null;
                        newsup.shippingAddress = a.BillAddr?.City ?? null;
                        newsup.openingBalance = a.Balance ?? 0;
                        newsup.creditLimit = 0;
                        newsup.ledger = saveLedger;
                        newsup.ledgerId = saveLedger.id;
                        newsup.createdBy = userPayload.id;
                        newsup.organizationId = userPayload.organizationId;
                        newsup.createdAt = new Date();
                        newsup.updatedAt = new Date();
                        newsup.createdBy = userPayload.id;
                        newsup.organizationId = userPayload.organizationId;
                        newsup.updatedBy = 0;
                        newsup.deletedBy = 0;
                        newsup.qbRefId = a.Id;

                        newsup.organization = organizationinforamtion;

                        const insertData = await queryRunner.manager.save(CustomersEntity, newsup);

                        if (insertData) {
                          let ledgerData = await queryRunner.manager.findOne(AccountsEntity, { where: { name: "Capital Account", organizationId: userPayload.organizationId } });

                          if (ledgerData != null) {
                            ledgerData["openingBalance"] = ledgerData.closingBalance;
                            ledgerData["closingBalance"] = Number(ledgerData.closingBalance) + Number(a.Balance);

                            // update ledger data
                            await queryRunner.manager.update(AccountsEntity, { id: ledgerData.id }, ledgerData);
                          }

                          // calling opening balance transaction function
                          if (a.Balance > 0) {
                            // body creation for creating opening balance transaction
                            const body = {
                              ledgerId: saveLedger.id,
                              captialId: ledgerData.id,
                              openingbalance: a.Balance,
                              openingbalancecap: ledgerData.openingBalance,
                              closingbalancecap: ledgerData.closingBalance,
                              userId: userPayload.id,
                              organizationId: userPayload.organizationId
                            };
                            await this.accountService.openingBalanceTransaction(body, queryRunner);
                          }
                        }

                        //delete insertData.ledger;
                        // await queryRunner.commitTransaction();
                        // return insertData;
                      }
                    })
                  );
                }
              }
            );
            // #endregion

            //#region Departments

            qboobject.findDepartments(
              {
                fetchAll: true
              },
              async (err: any, results: any) => {
                if (err) {
                } else {
                  await Promise.all(
                    results?.QueryResponse?.Department?.map(async (a: any) => {
                      const findName = await queryRunner.manager.findOne(DepartmentEntity, {
                        where: {
                          organizationId: organizationinforamtion.id,
                          qbRefId: a.Id
                        }
                      });
                      if (findName == null) {
                        let serviceinfo = new DepartmentEntity();
                        serviceinfo.createdAt = new Date();
                        serviceinfo.updatedAt = new Date();
                        serviceinfo.createdBy = 0;
                        serviceinfo.organizationId = organizationinforamtion.id;
                        serviceinfo.organization = organizationinforamtion;
                        serviceinfo.updatedBy = 0;
                        serviceinfo.deletedBy = 0;
                        serviceinfo.name = a.Name;
                        serviceinfo.qbRefId = a.Id;

                        const insertData = await queryRunner.manager.save(DepartmentEntity, serviceinfo);
                      }
                    })
                  );
                }
              }
            );

            //#endregion

            //#region Employees

            qboobject.findEmployees(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };
                  await Promise.all(
                    results?.QueryResponse?.Employee.map(async (a) => {
                      const findName = await queryRunner.manager.findOne(EmployeesEntity, {
                        where: {
                          organizationId: userPayload.organizationId,
                          qbRefId: a.Id
                        }
                      });
                      if (findName == null) {
                        const ledgerObj = new AccountsEntity();

                        ledgerObj.createdAt = new Date();
                        ledgerObj.updatedAt = new Date();
                        ledgerObj.createdBy = userPayload.id;
                        ledgerObj.organizationId = userPayload.organizationId;
                        ledgerObj.organization = organizationinforamtion;
                        ledgerObj.updatedBy = 0;
                        ledgerObj.deletedBy = 0;
                        // finding account group data
                        const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Direct Overhead" } });

                        ledgerObj.name = a.DisplayName;
                        ledgerObj.fullyQualifiedName = a.DisplayName;
                        ledgerObj.ledgerParent = accountGroup.id;
                        ledgerObj.nature = accountGroup.nature;
                        ledgerObj.accountSubType = accountGroup.groupName;
                        ledgerObj.classification = accountGroup.groupHeadType;
                        ledgerObj.accountType = accountGroup.groupHeadType;
                        ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Employee", userPayload);
                        ledgerObj.organization = organizationinforamtion;
                        ledgerObj.accountOpeningBalance = 0;
                        ledgerObj.openingBalance = 0;
                        ledgerObj.closingBalance = 0;
                        ledgerObj.qbRefId = a.Id;

                        const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

                        // prepare ledger data

                        if (saveLedger) {
                          const employee = new EmployeesEntity();
                          employee.createdAt = new Date();
                          employee.updatedAt = new Date();
                          employee.createdBy = userPayload.id;
                          employee.updatedBy = 0;
                          employee.deletedBy = 0;
                          employee.displayName = a.DisplayName;
                          employee.printOnCheckName = a.PrintOnCheckName;
                          employee.familyName = a.FamilyName;
                          employee.givenName = a.GivenName;
                          employee.dob = new Date();
                          employee.hireDate = new Date();
                          employee.ssn = a.SSN;
                          employee.releaseDate = null;
                          employee.employeeID = null;
                          employee.billingrate = 0;
                          employee.totalSalary = employee.billingrate * 8 * 22;

                          employee.ledgerId = ledgerObj.id;
                          employee.profileImgSrc = null;

                          employee.employeeCode = ledgerObj.ledgerCode;
                          if (a.PrimaryPhone != null && a.PrimaryPhone != undefined) employee.mobile = a.PrimaryPhone?.FreeFormNumber;
                          else employee.mobile = null;

                          employee.gender = "Unknown";
                          if (a.primaryAddr != undefined && a.primaryAddr != null)
                            employee.primaryAddr = a.PrimaryAddr?.Line1 + a.PrimaryAddr?.City + a.PrimaryAddr?.CountrySubDivisionCode + "-" + a.PrimaryAddr?.PostalCode;
                          employee.qbRefId = a.Id;

                          if (a.Email != null && a.Email != undefined) employee.email = a.Email;
                          else employee.email = "";

                          employee.paymentMethod = "QuickBook";
                          employee.organizationId = userPayload.organizationId;
                          employee.ledger = ledgerObj;
                          employee.organization = organizationinforamtion;

                          // save employee data
                          const insertData = await queryRunner.manager.save(EmployeesEntity, employee);
                        }
                      }
                    })
                  );
                }
              }
            );

            //#endregion

            //#region Vendors

            qboobject.findVendors(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };
                  await Promise.all(
                    results?.QueryResponse?.Vendor.map(async (a) => {
                      const findName = await queryRunner.manager.findOne(VendorsEntity, {
                        where: {
                          organizationId: userPayload.organizationId,
                          qbRefId: a.Id
                        }
                      });

                      if (findName == null) {
                        let ledgerObj = new AccountsEntity();

                        ledgerObj.createdBy = a.Id;

                        const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Accounts Payable" } });

                        ledgerObj.name = a.DisplayName;
                        ledgerObj.fullyQualifiedName = a.DisplayName;

                        ledgerObj.ledgerParent = accountGroup.id;
                        ledgerObj.nature = accountGroup.nature;
                        ledgerObj.accountType = accountGroup.groupHeadType;
                        ledgerObj.accountSubType = accountGroup.groupName;
                        ledgerObj.classification = accountGroup.groupHeadType;

                        ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Vendor", userPayload);
                        ledgerObj.accountOpeningBalance = a.Balance;
                        ledgerObj.openingBalance = 0;
                        ledgerObj.closingBalance = a.Balance;
                        ledgerObj.createdAt = new Date();
                        ledgerObj.updatedAt = new Date();
                        ledgerObj.createdBy = userPayload.id;
                        ledgerObj.organizationId = userPayload.organizationId;
                        ledgerObj.organization = organizationinforamtion;
                        ledgerObj.updatedBy = 0;
                        ledgerObj.deletedBy = 0;
                        //ledgerObj.status = StatusField.ACTIVE;

                        const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

                        //createCustormersDto.qbRefId = quickBookid.Id;
                        let newsup = new VendorsEntity();
                        if (a.GivenNam != undefined && a.GivenName != null) newsup.givenName = a.GivenName;
                        else newsup.givenName = a.DisplayName;

                        newsup.displayName = a.DisplayName;
                        newsup.printOnCheckName = a.PrintOnCheckName;

                        if (a.FamilyName != undefined && a.FamilyName != null) newsup.familyName = a.FamilyName;
                        else newsup.familyName = a.DisplayName;

                        newsup.companyName = a.CompanyName;

                        newsup.vendorCode = ledgerObj.ledgerCode;
                        if (a.WebAddr != undefined && a.WebAddr != null) newsup.website = a.WebAddr?.URI;
                        else newsup.website = null;

                        newsup.fax = null;
                        newsup.others = null;
                        //newsup.ema = createSuppliersDto.email;
                        if (a.PrimaryPhone != null && a.PrimaryPhone != undefined) newsup.mobile = a.PrimaryPhone?.FreeFormNumber;
                        else newsup.mobile = null;

                        if (a.primaryAddr != undefined && a.primaryAddr != null)
                          newsup.billAddr = a.PrimaryAddr?.Line1 + a.PrimaryAddr?.City + a.PrimaryAddr?.CountrySubDivisionCode + "-" + a.PrimaryAddr?.PostalCode;

                        newsup.openingBalance = a.Balance;
                        newsup.ledger = saveLedger;
                        newsup.ledgerId = saveLedger.id;
                        newsup.organizationId = userPayload.organizationId;
                        newsup.organization = organizationinforamtion;
                        newsup.createdAt = new Date();
                        newsup.updatedAt = new Date();
                        newsup.createdBy = userPayload.id;
                        newsup.organizationId = userPayload.organizationId;
                        newsup.updatedBy = 0;
                        newsup.deletedBy = 0;
                        newsup.qbRefId = a.Id;

                        const insertData = await queryRunner.manager.save(VendorsEntity, newsup);

                        if (insertData) {
                          let ledgerData = await queryRunner.manager.findOne(AccountsEntity, { where: { name: "Capital Account", organizationId: userPayload.organizationId } });

                          if (ledgerData != null) {
                            ledgerData["openingBalance"] = ledgerData.closingBalance;
                            ledgerData["closingBalance"] = Number(ledgerData.closingBalance) - Number(a.Balance);

                            // update ledger data
                            await queryRunner.manager.update(AccountsEntity, { id: ledgerData.id }, ledgerData);
                          }

                          if (a.Balance > 0) {
                            // body creation for creating opening balance transaction
                            const body = {
                              ledgerId: saveLedger.id,
                              captialId: ledgerData.id,
                              openingbalance: a.Balance,
                              openingbalancecap: ledgerData.openingBalance,
                              closingbalancecap: ledgerData.closingBalance,
                              userId: userPayload.id,
                              organizationId: userPayload.organizationId
                            };
                            // calling opening balance transaction function
                            await this.accountService.openingBalanceTransaction(body, queryRunner);
                          }
                        }
                      }
                    })
                  );
                }
              }
            );
            //#endregion

            //#region Accounts
            qboobject.findAccounts(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };

                  await Promise.all(
                    results?.QueryResponse?.Account.map(async (a) => {
                      const findName = await queryRunner.manager.findOne(AccountsEntity, {
                        where: {
                          organizationId: userPayload.organizationId,
                          qbRefId: a.Id
                        }
                      });
                      if (findName == null) {
                        let ledgerinfo = new AccountsEntity();
                        ledgerinfo.createdAt = new Date();
                        ledgerinfo.updatedAt = new Date();
                        ledgerinfo.createdBy = userPayload.id;
                        ledgerinfo.organizationId = userPayload.organizationId;
                        ledgerinfo.updatedBy = 0;
                        const findgroups = await queryRunner.manager.findOne(AccountingGroupEntity, {
                          where: {
                            organizationId: userPayload.organizationId,
                            groupName: a.AccountType
                          }
                        });
                        console.log("findgroups: ", findgroups);

                        if (findgroups != null) {
                          ledgerinfo.nature = findgroups.nature;
                          ledgerinfo.ledgerParent = findgroups.id;
                        } else {
                          const findgroupsother = await queryRunner.manager.findOne(AccountingGroupEntity, {
                            where: {
                              groupName: "Assets"
                            }
                          });
                          ledgerinfo.nature = findgroupsother.nature;
                          ledgerinfo.ledgerParent = findgroupsother.id;
                        }
                        ledgerinfo.accountOpeningBalance = a.CurrentBalance;
                        ledgerinfo.openingBalance = 0;
                        ledgerinfo.closingBalance = a.CurrentBalance;
                        ledgerinfo.ledgerCode = await this.accountService.generateBaseNumbers("Ledger", userPayload);
                        ledgerinfo.name = a.Name;
                        ledgerinfo.fullyQualifiedName = a.Name;
                        ledgerinfo.fullyQualifiedName = a.FullyQualifiedName;
                        ledgerinfo.accountType = a.AccountType;
                        ledgerinfo.accountSubType = a.AccountSubType;
                        ledgerinfo.classification = a.Classification;
                        ledgerinfo.qbRefId = a.Id;

                        const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerinfo);
                      }
                    })
                  );
                }
              }
            );
            //#endregion

            //#region TaxRate

            qboobject.findTaxRates(
              {
                fetchAll: true
              },
              async (err: any, results: any) => {
                if (err) {
                } else {
                  await Promise.all(
                    results?.QueryResponse?.TaxRate?.map(async (a: any) => {
                      const findName = await queryRunner.manager.findOne(TaxRate, {
                        where: {
                          organizationId: organizationinforamtion.id,
                          qbRefId: a.Id
                        }
                      });
                      if (findName == null) {
                        let serviceinfo = new TaxRate();
                        serviceinfo.createdAt = new Date();
                        serviceinfo.updatedAt = new Date();
                        serviceinfo.createdBy = 0;
                        serviceinfo.organizationId = organizationinforamtion.id;
                        serviceinfo.organization = organizationinforamtion;
                        serviceinfo.updatedBy = 0;
                        serviceinfo.deletedBy = 0;
                        serviceinfo.rateValue = a.RateValue;
                        serviceinfo.taxApplicableOn = a.Description;
                        serviceinfo.taxRateName = a.Name;

                        serviceinfo.qbRefId = a.Id;

                        const insertData = await queryRunner.manager.save(TaxRate, serviceinfo);
                      }
                    })
                  );
                }
              }
            );

            //#endregion

            //#region PurchaseOrder
            qboobject.findPurchaseOrders(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };

                  await Promise.all(
                    results?.QueryResponse?.PurchaseOrder.map(async (a) => {
                      var purchaseOrderData = await queryRunner.manager.findOne(PurchaseOrderEntity, {
                        where: {
                          organizationId: userPayload.organizationId,
                          qbRefId: a.Id
                        }
                      });

                      if (purchaseOrderData == null) {
                        const createentry = new PurchaseOrderEntity();

                        var vendordata = await queryRunner.manager.findOne(VendorsEntity, {
                          where: {
                            organizationId: userPayload.organizationId,
                            qbRefId: a.VendorRef.value
                          }
                        });

                        createentry.creditLedgerId = vendordata.ledgerId;

                        createentry.txnDate = new Date(a.TxnDate);
                        createentry.docNumber = await this.accountService.generateAllNumbersbasedonDate("PurchaseOrder", new Date(a.TxnDate), userPayload);
                        createentry.reference = a?.VendorRef?.name ?? "Quickbook";
                        createentry.comment = "Quickbook";
                        createentry.vendorAddr = vendordata.billAddr;
                        createentry.totalAmt = a.TotalAmt;
                        createentry.poStatus = "Open";
                        createentry.createdAt = new Date();
                        createentry.updatedAt = new Date();
                        createentry.createdBy = userPayload.id;
                        createentry.organizationId = userPayload.organizationId;
                        createentry.updatedBy = 0;
                        createentry.deletedBy = 0;
                        createentry.qbRefId = a.Id;

                        await queryRunner.manager.save(PurchaseOrderEntity, createentry);

                        a.Line?.map(async (detailsinfo) => {
                          let qdDetails = new PurchaseOrderDetailsEntity();
                          qdDetails.orderId = createentry.id;
                          qdDetails.order = createentry;

                          let productinfo = await queryRunner.manager.findOne(ProductsEntity, {
                            where: { qbRefId: detailsinfo.ItemBasedExpenseLineDetail.ItemRef.value }
                          });
                          qdDetails.productId = productinfo.id;
                          qdDetails.product = productinfo;
                          qdDetails.unitPrice = detailsinfo.ItemBasedExpenseLineDetail.Qty;
                          qdDetails.qty = detailsinfo.ItemBasedExpenseLineDetail.UnitPrice;
                          qdDetails.taxCodeRef = detailsinfo.ItemBasedExpenseLineDetail.TaxCodeRef.value;
                          qdDetails.totalAmount = detailsinfo.Amount;
                          qdDetails.qbRefId = detailsinfo.Id;
                          qdDetails.createdAt = new Date();
                          qdDetails.updatedAt = new Date();
                          qdDetails.createdBy = userPayload.id;
                          qdDetails.organization = organizationinforamtion;
                          qdDetails.organizationId = userPayload.organizationId;
                          qdDetails.updatedBy = 0;
                          qdDetails.deletedBy = 0;

                          let details = await queryRunner.manager.save(PurchaseOrderDetailsEntity, qdDetails);
                        });
                      }
                    })
                  );
                }
              }
            );
            //#endregion

            //#region Bill
            qboobject.findBills(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };

                  await Promise.all(
                    results?.QueryResponse?.Bill.map(async (a) => {
                      var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(a.TxnDate), userPayload);

                      var billData = await queryRunner.manager.findOne(BillEntity, {
                        where: {
                          organizationId: userPayload.organizationId,
                          qbRefId: a.Id
                        }
                      });

                      if (billData == null) {
                        const createentry = new BillEntity();

                        var vendordata = await queryRunner.manager.findOne(VendorsEntity, {
                          where: {
                            organizationId: userPayload.organizationId,
                            qbRefId: a.VendorRef.value
                          }
                        });

                        var assetgroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Purchase" } });

                        var salesledger = await queryRunner.manager.findOne(AccountsEntity, { where: { ledgerParent: assetgroup.id, organizationId: userPayload.organizationId } });

                        createentry.creditLedgerId = vendordata.ledgerId;
                        createentry.creditLedger = vendordata.ledger;

                        createentry.debitLedgerId = salesledger.id;
                        createentry.debitLedger = salesledger;

                        createentry.txnDate = new Date(a.TxnDate);
                        createentry.billNo = await this.accountService.generateAllNumbersbasedonDate("PurchaseInvoice", new Date(a.TxnDate), userPayload);
                        createentry.reference = a?.VendorRef?.name ?? "Quickbook";
                        createentry.comment = "Quickbook";
                        createentry.vendorAddr = vendordata.billAddr;

                        createentry.totalAmt = a.TotalAmt;
                        createentry.totalDueAmount = a.TotalAmt;
                        createentry.paymentStatus = "Open";
                        createentry.createdAt = new Date();
                        createentry.updatedAt = new Date();
                        createentry.createdBy = userPayload.id;
                        createentry.organizationId = userPayload.organizationId;
                        createentry.transactionId = "";
                        createentry.updatedBy = 0;
                        createentry.deletedBy = 0;
                        createentry.qbRefId = a.Id;

                        await queryRunner.manager.save(BillEntity, createentry);

                        let checkbillable = false;

                        a.Line?.map(async (detailsinfo) => {
                          let qdDetails = new BillDetailsEntity();
                          qdDetails.billId = createentry.id;
                          qdDetails.bill = createentry;

                          if (detailsinfo.DetailType == "ItemBasedExpenseLineDetail") {
                            let productinfo = await queryRunner.manager.findOne(ProductsEntity, {
                              where: { qbRefId: detailsinfo.ItemBasedExpenseLineDetail.ItemRef.value }
                            });
                            qdDetails.productId = productinfo.id;
                            qdDetails.product = productinfo;

                            qdDetails.unitPrice = detailsinfo.ItemBasedExpenseLineDetail.Qty;
                            qdDetails.qty = detailsinfo.ItemBasedExpenseLineDetail.UnitPrice;
                            qdDetails.taxCodeRef = detailsinfo.ItemBasedExpenseLineDetail.TaxCodeRef.value;
                            qdDetails.billableStatus = detailsinfo.ItemBasedExpenseLineDetail.BillableStatus;
                          } else if (detailsinfo.DetailType == "AccountBasedExpenseLineDetail") {
                            qdDetails.unitPrice = detailsinfo.Amount;
                            qdDetails.qty = 1;
                            qdDetails.taxCodeRef = detailsinfo.AccountBasedExpenseLineDetail.TaxCodeRef.value;
                            qdDetails.billableStatus = detailsinfo.AccountBasedExpenseLineDetail.BillableStatus;
                          }
                          qdDetails.tax = 0;
                          qdDetails.description = detailsinfo.Description;
                          if (qdDetails.billableStatus != "NotBillable") {
                            checkbillable = true;
                          }
                          qdDetails.amount = detailsinfo.Amount;
                          qdDetails.qbRefId = detailsinfo.Id;
                          qdDetails.createdAt = new Date();
                          qdDetails.updatedAt = new Date();
                          qdDetails.createdBy = userPayload.id;
                          qdDetails.organization = organizationinforamtion;
                          qdDetails.organizationId = userPayload.organizationId;
                          qdDetails.updatedBy = 0;
                          qdDetails.deletedBy = 0;

                          let details = await queryRunner.manager.save(BillDetailsEntity, qdDetails);
                        });

                        if (checkbillable) {
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
                          await this.accountService.addTransaction(body, queryRunner);
                          //#endregion
                        }
                      }
                    })
                  );
                }
              }
            );
            //#endregion

            //#region Payment Method
            qboobject.findPaymentMethods(
              {
                fetchAll: true
              },
              async (err: any, results: any) => {
                if (err) {
                } else {
                  await Promise.all(
                    results?.QueryResponse?.PaymentMethod?.map(async (a: any) => {
                      console.log("a: ", a);

                      const findName = await queryRunner.manager.findOne(PaymentMethodEntity, {
                        where: {
                          organizationId: organizationinforamtion.id,
                          qbRefId: a.Id
                        }
                      });
                      if (findName == null) {
                        let serviceinfo = new PaymentMethodEntity();
                        serviceinfo.createdAt = new Date();
                        serviceinfo.updatedAt = new Date();
                        serviceinfo.createdBy = 0;
                        serviceinfo.organizationId = organizationinforamtion.id;
                        serviceinfo.organization = organizationinforamtion;
                        serviceinfo.updatedBy = 0;
                        serviceinfo.deletedBy = 0;
                        serviceinfo.name = a.Name;
                        serviceinfo.type = a.Type;
                        serviceinfo.qbRefId = a.Id;

                        const insertData = await queryRunner.manager.save(PaymentMethodEntity, serviceinfo);
                      }
                    })
                  );
                }
              }
            );
            //#endregion

            //#region Vendor Credits
            qboobject.findVendorCredits(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };

                  await Promise.all(
                    results?.QueryResponse?.VendorCredit.map(async (a) => {
                      var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(a.TxnDate), userPayload);

                      var billData = await queryRunner.manager.findOne(VendorDebitsEntity, {
                        where: {
                          organizationId: userPayload.organizationId,
                          qbRefId: a.Id
                        }
                      });

                      if (billData == null) {
                        const createentry = new VendorDebitsEntity();

                        var vendordata = await queryRunner.manager.findOne(VendorsEntity, {
                          where: {
                            organizationId: userPayload.organizationId,
                            qbRefId: a.VendorRef.value
                          }
                        });

                        var assetgroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Purchase" } });

                        var salesledger = await queryRunner.manager.findOne(AccountsEntity, { where: { ledgerParent: assetgroup.id, organizationId: userPayload.organizationId } });
                        createentry.creditLedgerId = salesledger.id;
                        createentry.creditLedger = salesledger;

                        createentry.debitLedgerId = vendordata.ledgerId;
                        createentry.debitLedger = vendordata.ledger;

                        createentry.txnDate = new Date(a.TxnDate);
                        createentry.debitNoteNo = await this.accountService.generateAllNumbersbasedonDate("PurchaseInvoice", new Date(a.TxnDate), userPayload);

                        createentry.vendorAddr = vendordata.billAddr;
                        createentry.subTotalAmount = a.TotalAmt;
                        createentry.taxAmount = 0;
                        createentry.totalAmt = a.TotalAmt;
                        createentry.linkedTnx = a.LinkedTxn.TxnId;
                        createentry.linkedTnxType = a.LinkedTxn.TxnType;

                        createentry.createdAt = new Date();
                        createentry.updatedAt = new Date();
                        createentry.createdBy = userPayload.id;
                        createentry.organizationId = userPayload.organizationId;
                        createentry.transactionId = "";
                        createentry.updatedBy = 0;
                        createentry.deletedBy = 0;
                        createentry.qbRefId = a.Id;

                        await queryRunner.manager.save(VendorDebitsEntity, createentry);

                        let checkbillable = false;

                        a.Line?.map(async (detailsinfo) => {
                          let qdDetails = new VendorCreditDetailsEntity();

                          if (detailsinfo.DetailType == "ItemBasedExpenseLineDetail") {
                            let productinfo = await queryRunner.manager.findOne(ProductsEntity, {
                              where: { qbRefId: detailsinfo.ItemBasedExpenseLineDetail.ItemRef.value }
                            });
                            qdDetails.productId = productinfo.id;
                            qdDetails.product = productinfo;

                            qdDetails.unitPrice = detailsinfo.ItemBasedExpenseLineDetail.Qty;
                            qdDetails.qty = detailsinfo.ItemBasedExpenseLineDetail.UnitPrice;
                            qdDetails.taxCodeRef = detailsinfo.ItemBasedExpenseLineDetail.TaxCodeRef.value;
                            qdDetails.billableStatus = detailsinfo.ItemBasedExpenseLineDetail.BillableStatus;
                          } else if (detailsinfo.DetailType == "AccountBasedExpenseLineDetail") {
                            qdDetails.unitPrice = detailsinfo.Amount;
                            qdDetails.qty = 1;
                            qdDetails.taxCodeRef = detailsinfo.AccountBasedExpenseLineDetail.TaxCodeRef.value;
                            qdDetails.billableStatus = detailsinfo.AccountBasedExpenseLineDetail.BillableStatus;
                          }
                          qdDetails.tax = 0;

                          if (qdDetails.billableStatus != "NotBillable") {
                            checkbillable = true;
                          }
                          qdDetails.amount = detailsinfo.Amount;
                          createentry.linkedTnx = detailsinfo.LinkedTxn.TxnId;
                          createentry.linkedTnxType = detailsinfo.LinkedTxn.TxnType;
                          qdDetails.qbRefId = detailsinfo.Id;
                          qdDetails.createdAt = new Date();
                          qdDetails.updatedAt = new Date();
                          qdDetails.createdBy = userPayload.id;
                          qdDetails.organization = organizationinforamtion;
                          qdDetails.organizationId = userPayload.organizationId;
                          qdDetails.updatedBy = 0;
                          qdDetails.deletedBy = 0;

                          let details = await queryRunner.manager.save(VendorCreditDetailsEntity, qdDetails);
                        });

                        if (checkbillable) {
                          //#region Accounts Transactions
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
                            remarks: "@ ",
                            transactionReference: createentry.debitNoteNo
                          };

                          let customertran = await this.accountService.addTransaction(body, queryRunner);

                          //#endregion
                        }
                      }
                    })
                  );
                }
              }
            );
            //#endregion

            // #region Journals
            qboobject.findJournalEntries(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };

                  await Promise.all(
                    results?.QueryResponse?.JournalEntry.map(async (a) => {
                      var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(a.TxnDate), userPayload);

                      const manualJournal = await queryRunner.manager.findOne(ManualJournalsEntity, { where: { organizationId: userPayload.organizationId, qbRefId: a.Id } });
                      if (manualJournal == null) {
                        const createentry = new ManualJournalsEntity();
                        createentry.journalNo = await this.accountService.generateAllNumbersbasedonDate("ManualJournal", new Date(a.TxnDate), userPayload);

                        createentry.transactionId = TransactionID;
                        createentry.txnDate = new Date(a.TxnDate);
                        createentry.status = StatusField.ACTIVE;
                        createentry.adjustment = a.Adjustment;
                        createentry.privateNote = a.PrivateNote;
                        createentry.totalAmt = a.TotalAmt;

                        createentry.createdAt = new Date();
                        createentry.updatedAt = new Date();
                        createentry.createdBy = userPayload.id;
                        createentry.organizationId = userPayload.organizationId;
                        createentry.updatedBy = 0;
                        createentry.deletedBy = 0;

                        await queryRunner.manager.save(ManualJournalsEntity, createentry);

                        if (createentry.id > 0) {
                          a.Line?.map(async (detailsinfo) => {
                            let qdDetails = new ManualJournalDetailsEntity();

                            qdDetails.transactionId = createentry.transactionId;
                            qdDetails.description = detailsinfo.Description;
                            qdDetails.detailType = detailsinfo.DetailType;
                            qdDetails.postingType = detailsinfo.JournalEntryLineDetail.PostingType;
                            var accountinfo = await queryRunner.manager.findOne(AccountsEntity, {
                              where: { organizationId: userPayload.organizationId, qbRefId: detailsinfo.JournalEntryLineDetail.AccountRef.value }
                            });
                            qdDetails.accountId = accountinfo.id;

                            qdDetails.journalId = createentry.id;
                            qdDetails.journal = createentry;

                            qdDetails.amount = detailsinfo.Amount;
                            qdDetails.qbRefId = detailsinfo.Id;
                            qdDetails.createdAt = new Date();
                            qdDetails.updatedAt = new Date();
                            qdDetails.createdBy = userPayload.id;
                            qdDetails.organization = organizationinforamtion;
                            qdDetails.organizationId = userPayload.organizationId;
                            qdDetails.updatedBy = 0;
                            qdDetails.deletedBy = 0;

                            let details = await queryRunner.manager.save(VendorCreditDetailsEntity, qdDetails);

                            if (qdDetails.postingType == "Debit") {
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

                              let assstocktradn = await this.accountService.AddTransactionsStockDebit(transactionStock, queryRunner);
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

                              let assstocktradn = await this.accountService.AddTransactionsStockCredit(transactionStock, queryRunner);
                            }
                          });
                        }
                      }
                    })
                  );
                }
              }
            );
            //#endregion

            //#region Estimations
            qboobject.findEstimates(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };

                  await Promise.all(
                    results?.QueryResponse?.Estimate.map(async (a) => {
                      var estimationData = await queryRunner.manager.findOne(EstimationEntity, {
                        where: {
                          organizationId: userPayload.organizationId,
                          qbRefId: a.Id
                        }
                      });

                      if (estimationData == null) {
                        const createentry = new EstimationEntity();

                        var customerdata = await queryRunner.manager.findOne(CustomersEntity, {
                          where: {
                            organizationId: userPayload.organizationId,
                            qbRefId: a.CustomerRef.value
                          }
                        });

                        createentry.debitLedgerId = customerdata.ledgerId;

                        createentry.txnDate = new Date(a.TxnDate);
                        createentry.estimationNo = await this.accountService.generateAllNumbersbasedonDate("Estiamtion", new Date(a.TxnDate), userPayload);
                        createentry.reference = a?.CustomField?.Name ?? "Quickbook";
                        createentry.comment = "Quickbook";
                        createentry.docNumber = a.DocNumber;
                        if (a.LinkedTx != undefined) {
                          createentry.txnId = a.LinkedTxn.TxnId;
                          createentry.txnType = a.LinkedTxn.TxnType;
                        }

                        createentry.customerMemo = a.CustomerMemo.value;
                        createentry.billEmail = a.BillEmail?.Address;
                        createentry.billAddr = a.BillAddr?.Line1 + a.BillAddr?.Line2 + a.BillAddr?.Line3 + a.BillAddr?.Line4;
                        createentry.shipAddr = a.ShipAddr?.Line1 + a.ShipAddr?.City + a.ShipAddr?.CountrySubDivisionCode + a.ShipAddr?.PostalCode;
                        createentry.totalTax = Number(a.TxnTaxDetail?.TotalTax);
                        createentry.totalAmt = a.TotalAmt;
                        createentry.netAmountTaxable = createentry.totalAmt - createentry.totalTax;
                        createentry.subtotalAmount = createentry.netAmountTaxable;

                        createentry.taxPercent = a.TxnTaxDetail?.TaxLine?.TaxPercent;
                        createentry.taxid = a.TxnTaxDetail?.TaxLine?.TaxLineDetail?.value;

                        createentry.applyTaxAfterDiscount = a.ApplyTaxAfterDiscount;

                        createentry.estimationStatus = "Invoiced";
                        createentry.createdAt = new Date();
                        createentry.updatedAt = new Date();
                        createentry.createdBy = userPayload.id;
                        createentry.organizationId = userPayload.organizationId;
                        createentry.updatedBy = 0;
                        createentry.deletedBy = 0;
                        createentry.qbRefId = a.Id;

                        await queryRunner.manager.save(EstimationEntity, createentry);

                        a.Line?.map(async (detailsinfo) => {
                          if (detailsinfo.detailType == "SalesItemLineDetail") {
                            let qdDetails = new EstimationDetailsEntity();
                            qdDetails.estimationId = createentry.id;
                            qdDetails.discount = 0;

                            let productinfo = await queryRunner.manager.findOne(ProductsEntity, {
                              where: { qbRefId: detailsinfo.SalesItemLineDetail?.ItemRef?.value }
                            });
                            if (productinfo == null) {
                              const ledgerObj = new AccountsEntity();

                              const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Stock In Hand" } });

                              ledgerObj.name = "Stock " + detailsinfo.SalesItemLineDetail.ItemRef.name;
                              ledgerObj.fullyQualifiedName = detailsinfo.SalesItemLineDetail.ItemRef.name;
                              ledgerObj.ledgerParent = accountGroup.id;
                              ledgerObj.accountType = accountGroup.groupHeadType;
                              ledgerObj.accountSubType = accountGroup.groupName;
                              ledgerObj.classification = accountGroup.groupHeadType;
                              ledgerObj.nature = accountGroup.nature;
                              let userpayload = {
                                id: 0,
                                email: "dsfdf",
                                uniqueId: "dsfsdfdsf",
                                hashType: "dfdsfsdf",
                                organizationId: organizationinforamtion.id
                              };
                              ledgerObj.ledgerCode = `Stock-1001`;
                              ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Stock", userpayload);
                              ledgerObj.accountOpeningBalance = 0;
                              ledgerObj.openingBalance = 0;
                              ledgerObj.qbRefId = detailsinfo.SalesItemLineDetail.ItemRef.value;
                              ledgerObj.closingBalance = 0;
                              ledgerObj.createdAt = new Date();
                              ledgerObj.updatedAt = new Date();
                              ledgerObj.createdBy = 0;
                              ledgerObj.organizationId = organizationinforamtion.id;
                              ledgerObj.updatedBy = 0;
                              ledgerObj.deletedBy = 0;

                              const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

                              if (saveLedger) {
                                let serviceinfo = new ProductsEntity();
                                serviceinfo.createdAt = new Date();
                                serviceinfo.updatedAt = new Date();
                                serviceinfo.itemType = "Inventory";
                                serviceinfo.createdBy = 0;
                                serviceinfo.organizationId = organizationinforamtion.id;
                                serviceinfo.updatedBy = 0;
                                serviceinfo.deletedBy = 0;
                                serviceinfo.ledger = saveLedger;
                                serviceinfo.ledgerId = saveLedger.id;
                                serviceinfo.qbRefId = detailsinfo.SalesItemLineDetail.ItemRef.value;
                                serviceinfo.itemName = detailsinfo.SalesItemLineDetail.ItemRef.name;
                                serviceinfo.sellingPrice = 0;
                                serviceinfo.productsCode = ledgerObj.ledgerCode;
                                serviceinfo.openingStock = 0;
                                serviceinfo.sku = "quickbook";
                                serviceinfo.description = "quickbook description";
                                serviceinfo.categoryId = 0;
                                serviceinfo.supplierLedgerId = null;
                                serviceinfo.unitPrice = 0;

                                const insertData = await queryRunner.manager.save(ProductsEntity, serviceinfo);

                                let capitalledger = await queryRunner.manager.findOne(AccountsEntity, {
                                  where: {
                                    name: "Capital Account",
                                    organizationId: userpayload.organizationId
                                  }
                                });

                                if (insertData) {
                                  // stock data creation
                                  const stockinfo = new StockHistoryEntity();
                                  stockinfo.avgPurchaseRate = 0;
                                  stockinfo.pqty = 0;
                                  stockinfo.purchaseAmount = 0;
                                  stockinfo.avgSalesRate = 1;
                                  stockinfo.productId = insertData.id;
                                  stockinfo.product = insertData;
                                  stockinfo.sqty = 0;
                                  stockinfo.soldAmount = 0;
                                  stockinfo.remaningqty = 0;
                                  stockinfo.createdAt = new Date();
                                  stockinfo.updatedAt = new Date();
                                  stockinfo.createdBy = 0;
                                  stockinfo.organizationId = organizationinforamtion.id;
                                  stockinfo.updatedBy = 0;
                                  stockinfo.deletedBy = 0;
                                  // save stock data
                                  const stock = await queryRunner.manager.save(StockHistoryEntity, stockinfo);

                                  qdDetails.productId = serviceinfo.id;
                                  qdDetails.product = serviceinfo;
                                }
                              }
                            } else {
                              qdDetails.productId = productinfo.id;
                              qdDetails.product = productinfo;
                            }

                            qdDetails.description = detailsinfo?.Description;
                            qdDetails.detailType = detailsinfo?.DetailType;

                            qdDetails.unitPrice = detailsinfo.SalesItemLineDetail.UnitPrice;
                            qdDetails.qty = detailsinfo.SalesItemLineDetail.Qty;
                            qdDetails.taxCodeRef = detailsinfo.SalesItemLineDetail.TaxCodeRef.value;
                            qdDetails.totalAmount = detailsinfo.Amount;
                            qdDetails.qbRefId = detailsinfo.Id;
                            qdDetails.createdAt = new Date();
                            qdDetails.updatedAt = new Date();
                            qdDetails.createdBy = userPayload.id;
                            qdDetails.organization = organizationinforamtion;
                            qdDetails.organizationId = userPayload.organizationId;
                            qdDetails.updatedBy = 0;
                            qdDetails.deletedBy = 0;

                            let details = await queryRunner.manager.save(EstimationDetailsEntity, qdDetails);
                          }
                        });
                      }
                    })
                  );
                }
              }
            );
            //#endregion

            //#region Invoice
            qboobject.findInvoices(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };

                  await Promise.all(
                    results?.QueryResponse?.Invoice.map(async (a) => {
                      var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(a.TxnDate), userPayload);

                      var estimationData = await queryRunner.manager.findOne(InvoiceEntity, {
                        where: {
                          organizationId: userPayload.organizationId,
                          qbRefId: a.Id
                        }
                      });

                      if (estimationData == null) {
                        const createentry = new InvoiceEntity();

                        var customerdata = await queryRunner.manager.findOne(CustomersEntity, {
                          where: {
                            organizationId: userPayload.organizationId,
                            qbRefId: a.CustomerRef.value
                          }
                        });

                        createentry.debitLedgerId = customerdata.ledgerId;
                        createentry.debitLedger = customerdata.ledger;
                        var assetgroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Sales" } });

                        var salesledger = await queryRunner.manager.findOne(AccountsEntity, { where: { ledgerParent: assetgroup.id, organizationId: userPayload.organizationId } });

                        createentry.creditLedgerId = salesledger.id;
                        createentry.creditLedger = salesledger;

                        createentry.txnDate = new Date(a.TxnDate);
                        createentry.invoiceNo = await this.accountService.generateAllNumbersbasedonDate("Invoice", new Date(a.TxnDate), userPayload);
                        createentry.reference = a?.CustomField?.Name ?? "Quickbook";
                        createentry.comment = "Quickbook";
                        try {
                          createentry.terms = a.SalesTermRef.name;
                        } catch {
                          createentry.terms = "";
                        }

                        createentry.transactionId = TransactionID;
                        if (a.DocNumber != undefined) createentry.docNumber = a.DocNumber;
                        else createentry.docNumber = createentry.invoiceNo;
                        createentry.dueDate = a.DueDate;
                        try {
                          createentry.txnId = a.LinkedTxn?.TxnId;
                          createentry.txnType = a.LinkedTxn?.TxnType;
                        } catch {
                          createentry.txnId = null;
                          createentry.txnType = null;
                        }

                        if (a.BillAddr != undefined) createentry.billAddr = a.BillAddr.Line1 + a.BillAddr.Line2 + a.BillAddr.Line3 + a.BillAddr.Line4;
                        else createentry.billAddr = "";

                        if (a.ShipAddr != undefined) createentry.shipAddr = a.ShipAddr.Line1 + a.ShipAddr.City + a.ShipAddr.CountrySubDivisionCode + +"-" + a.ShipAddr.PostalCode;
                        else createentry.shipAddr = "";

                        try {
                          createentry.totalTax = a.TxnTaxDetail.TotalTax;
                        } catch {
                          createentry.totalTax = 0;
                        }
                        createentry.totalAmt = a.TotalAmt;
                        createentry.netAmountTaxable = createentry.totalAmt - createentry.totalTax;
                        createentry.applyTaxAfterDiscount = a.ApplyTaxAfterDiscount;

                        createentry.totalDueAmount = a.TotalAmt;
                        createentry.paymentStatus = "Open";
                        createentry.createdAt = new Date();
                        createentry.updatedAt = new Date();
                        createentry.createdBy = userPayload.id;
                        createentry.organizationId = userPayload.organizationId;
                        createentry.updatedBy = 0;
                        createentry.deletedBy = 0;
                        createentry.qbRefId = a.Id;

                        await queryRunner.manager.save(InvoiceEntity, createentry);

                        a.Line?.map(async (detailsinfo) => {
                          if (detailsinfo.detailType == "SalesItemLineDetail" && detailsinfo.Description != "Opening Balance") {
                            let qdDetails = new InvoiceDetailsEntity();
                            qdDetails.invoiceId = createentry.id;
                            qdDetails.invoice = createentry;

                            let productinfo = await queryRunner.manager.findOne(ProductsEntity, {
                              where: { qbRefId: detailsinfo.SalesItemLineDetail?.ItemRef?.value }
                            });
                            if (productinfo == null) {
                              const ledgerObj = new AccountsEntity();

                              const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Stock In Hand" } });

                              ledgerObj.name = "Stock " + detailsinfo.SalesItemLineDetail.ItemRef.name;
                              ledgerObj.fullyQualifiedName = detailsinfo.SalesItemLineDetail.ItemRef.name;
                              ledgerObj.ledgerParent = accountGroup.id;
                              ledgerObj.accountType = accountGroup.groupHeadType;
                              ledgerObj.accountSubType = accountGroup.groupName;
                              ledgerObj.classification = accountGroup.groupHeadType;
                              ledgerObj.nature = accountGroup.nature;
                              let userpayload = {
                                id: 0,
                                email: "dsfdf",
                                uniqueId: "dsfsdfdsf",
                                hashType: "dfdsfsdf",
                                organizationId: organizationinforamtion.id
                              };
                              ledgerObj.ledgerCode = `Stock-1001`;
                              ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Stock", userpayload);
                              ledgerObj.accountOpeningBalance = 0;
                              ledgerObj.openingBalance = 0;
                              ledgerObj.qbRefId = detailsinfo.SalesItemLineDetail.ItemRef.value;
                              ledgerObj.closingBalance = 0;
                              ledgerObj.createdAt = new Date();
                              ledgerObj.updatedAt = new Date();
                              ledgerObj.createdBy = 0;
                              ledgerObj.organizationId = organizationinforamtion.id;
                              ledgerObj.updatedBy = 0;
                              ledgerObj.deletedBy = 0;

                              const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

                              if (saveLedger) {
                                let serviceinfo = new ProductsEntity();
                                serviceinfo.createdAt = new Date();
                                serviceinfo.updatedAt = new Date();
                                serviceinfo.itemType = "Inventory";
                                serviceinfo.createdBy = 0;
                                serviceinfo.organizationId = organizationinforamtion.id;
                                serviceinfo.updatedBy = 0;
                                serviceinfo.deletedBy = 0;
                                serviceinfo.ledger = saveLedger;
                                serviceinfo.ledgerId = saveLedger.id;
                                serviceinfo.qbRefId = detailsinfo.SalesItemLineDetail.ItemRef.value;
                                serviceinfo.itemName = detailsinfo.SalesItemLineDetail.ItemRef.name;
                                serviceinfo.sellingPrice = 0;
                                serviceinfo.productsCode = ledgerObj.ledgerCode;
                                serviceinfo.openingStock = 0;
                                serviceinfo.sku = "quickbook";
                                serviceinfo.description = "quickbook description";
                                serviceinfo.categoryId = 0;
                                serviceinfo.supplierLedgerId = null;
                                serviceinfo.unitPrice = 0;

                                const insertData = await queryRunner.manager.save(ProductsEntity, serviceinfo);

                                let capitalledger = await queryRunner.manager.findOne(AccountsEntity, {
                                  where: {
                                    name: "Capital Account",
                                    organizationId: userpayload.organizationId
                                  }
                                });

                                if (insertData) {
                                  // stock data creation
                                  const stockinfo = new StockHistoryEntity();
                                  stockinfo.avgPurchaseRate = 0;
                                  stockinfo.pqty = 0;
                                  stockinfo.purchaseAmount = 0;
                                  stockinfo.avgSalesRate = 1;
                                  stockinfo.productId = insertData.id;
                                  stockinfo.product = insertData;
                                  stockinfo.sqty = 0;
                                  stockinfo.soldAmount = 0;
                                  stockinfo.remaningqty = 0;
                                  stockinfo.createdAt = new Date();
                                  stockinfo.updatedAt = new Date();
                                  stockinfo.createdBy = 0;
                                  stockinfo.organizationId = organizationinforamtion.id;
                                  stockinfo.updatedBy = 0;
                                  stockinfo.deletedBy = 0;
                                  // save stock data
                                  const stock = await queryRunner.manager.save(StockHistoryEntity, stockinfo);

                                  qdDetails.productId = serviceinfo.id;
                                  qdDetails.product = serviceinfo;
                                }
                              }
                            } else {
                              qdDetails.productId = productinfo.id;
                              qdDetails.product = productinfo;
                            }

                            qdDetails.description = detailsinfo?.Description;
                            qdDetails.detailType = detailsinfo?.DetailType;
                            qdDetails.qbRefId = detailsinfo.Id;
                            qdDetails.unitPrice = detailsinfo.SalesItemLineDetail.UnitPrice;
                            qdDetails.qty = detailsinfo.SalesItemLineDetail.Qty;
                            // qdDetails.taxCodeRef = detailsinfo.SalesItemLineDetail.TaxCodeRef.value;
                            qdDetails.totalAmount = detailsinfo.Amount;

                            qdDetails.createdAt = new Date();
                            qdDetails.updatedAt = new Date();
                            qdDetails.createdBy = userPayload.id;
                            qdDetails.organization = organizationinforamtion;
                            qdDetails.organizationId = userPayload.organizationId;
                            qdDetails.updatedBy = 0;
                            qdDetails.deletedBy = 0;

                            let details = await queryRunner.manager.save(InvoiceDetailsEntity, qdDetails);
                          }
                        });
                      }
                    })
                  );
                }
              }
            );
            //#endregion

            //#region Credit Memo
            qboobject.findCreditMemos(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };

                  await Promise.all(
                    results?.QueryResponse?.CreditMemo.map(async (a) => {
                      var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(a.TxnDate), userPayload);

                      var estimationData = await queryRunner.manager.findOne(CreditNotesEntity, {
                        where: {
                          organizationId: userPayload.organizationId,
                          qbRefId: a.Id
                        }
                      });

                      if (estimationData == null) {
                        const createentry = new CreditNotesEntity();

                        var customerdata = await queryRunner.manager.findOne(CustomersEntity, {
                          where: {
                            organizationId: userPayload.organizationId,
                            qbRefId: a.CustomerRef.value
                          }
                        });

                        var assetgroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Sales Return" } });

                        var salesledger = await queryRunner.manager.findOne(AccountsEntity, { where: { ledgerParent: assetgroup.id, organizationId: userPayload.organizationId } });

                        createentry.debitLedgerId = salesledger.id;
                        createentry.debitLedger = salesledger;

                        createentry.creditLedgerId = customerdata.ledgerId;
                        createentry.creditLedger = customerdata.ledger;

                        createentry.txnDate = new Date(a.TxnDate);
                        createentry.creditNoteNo = await this.accountService.generateAllNumbersbasedonDate("CreditMemo", new Date(a.TxnDate), userPayload);
                        createentry.reference = a?.CustomField?.Name ?? "Quickbook";
                        createentry.customerMemo = "Quickbook";

                        createentry.transactionId = TransactionID;
                        if (a.DocNumber != undefined) createentry.docNumber = a.DocNumber;
                        else createentry.docNumber = createentry.creditNoteNo;

                        if (a.BillAddr != undefined) createentry.billAddr = a.BillAddr.Line1 + a.BillAddr.Line2 + a.BillAddr.Line3 + a.BillAddr.Line4;
                        else createentry.billAddr = "";

                        if (a.ShipAddr != undefined) createentry.shipAddr = a.ShipAddr.Line1 + a.ShipAddr.City + a.ShipAddr.CountrySubDivisionCode + +"-" + a.ShipAddr.PostalCode;
                        else createentry.shipAddr = "";

                        try {
                          createentry.totalTax = a.TxnTaxDetail.TotalTax;
                        } catch {
                          createentry.totalTax = 0;
                        }
                        createentry.totalAmt = a.TotalAmt;
                        createentry.netAmountTaxable = createentry.totalAmt - createentry.totalTax;
                        createentry.applyTaxAfterDiscount = a.ApplyTaxAfterDiscount;
                        createentry.freeFormAddress = a.FreeFormAddress;

                        createentry.createdAt = new Date();
                        createentry.updatedAt = new Date();
                        createentry.createdBy = userPayload.id;
                        createentry.organizationId = userPayload.organizationId;
                        createentry.updatedBy = 0;
                        createentry.deletedBy = 0;
                        createentry.qbRefId = a.Id;

                        await queryRunner.manager.save(CreditNotesEntity, createentry);

                        a.Line?.map(async (detailsinfo) => {
                          if (detailsinfo.detailType == "SalesItemLineDetail" && detailsinfo.Description != "Opening Balance") {
                            let qdDetails = new CreditNoteDetailsEntity();
                            qdDetails.creditNoteId = createentry.id;
                            qdDetails.creditnoteDetails = createentry;

                            let productinfo = await queryRunner.manager.findOne(ProductsEntity, {
                              where: { qbRefId: detailsinfo.SalesItemLineDetail?.ItemRef?.value }
                            });
                            if (productinfo == null) {
                              const ledgerObj = new AccountsEntity();

                              const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Stock In Hand" } });

                              ledgerObj.name = "Stock " + detailsinfo.SalesItemLineDetail.ItemRef.name;
                              ledgerObj.fullyQualifiedName = detailsinfo.SalesItemLineDetail.ItemRef.name;
                              ledgerObj.ledgerParent = accountGroup.id;
                              ledgerObj.accountType = accountGroup.groupHeadType;
                              ledgerObj.accountSubType = accountGroup.groupName;
                              ledgerObj.classification = accountGroup.groupHeadType;
                              ledgerObj.nature = accountGroup.nature;
                              let userpayload = {
                                id: 0,
                                email: "dsfdf",
                                uniqueId: "dsfsdfdsf",
                                hashType: "dfdsfsdf",
                                organizationId: organizationinforamtion.id
                              };
                              ledgerObj.ledgerCode = `Stock-1001`;
                              ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Stock", userpayload);
                              ledgerObj.accountOpeningBalance = 0;
                              ledgerObj.openingBalance = 0;
                              ledgerObj.qbRefId = detailsinfo.SalesItemLineDetail.ItemRef.value;
                              ledgerObj.closingBalance = 0;
                              ledgerObj.createdAt = new Date();
                              ledgerObj.updatedAt = new Date();
                              ledgerObj.createdBy = 0;
                              ledgerObj.organizationId = organizationinforamtion.id;
                              ledgerObj.updatedBy = 0;
                              ledgerObj.deletedBy = 0;

                              const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

                              if (saveLedger) {
                                let serviceinfo = new ProductsEntity();
                                serviceinfo.createdAt = new Date();
                                serviceinfo.updatedAt = new Date();
                                serviceinfo.itemType = "Inventory";
                                serviceinfo.createdBy = 0;
                                serviceinfo.organizationId = organizationinforamtion.id;
                                serviceinfo.updatedBy = 0;
                                serviceinfo.deletedBy = 0;
                                serviceinfo.ledger = saveLedger;
                                serviceinfo.ledgerId = saveLedger.id;
                                serviceinfo.qbRefId = detailsinfo.SalesItemLineDetail.ItemRef.value;
                                serviceinfo.itemName = detailsinfo.SalesItemLineDetail.ItemRef.name;
                                serviceinfo.sellingPrice = 0;
                                serviceinfo.productsCode = ledgerObj.ledgerCode;
                                serviceinfo.openingStock = 0;
                                serviceinfo.sku = "quickbook";
                                serviceinfo.description = "quickbook description";
                                serviceinfo.categoryId = 0;
                                serviceinfo.supplierLedgerId = null;
                                serviceinfo.unitPrice = 0;

                                const insertData = await queryRunner.manager.save(ProductsEntity, serviceinfo);

                                let capitalledger = await queryRunner.manager.findOne(AccountsEntity, {
                                  where: {
                                    name: "Capital Account",
                                    organizationId: userpayload.organizationId
                                  }
                                });

                                if (insertData) {
                                  // stock data creation
                                  const stockinfo = new StockHistoryEntity();
                                  stockinfo.avgPurchaseRate = 0;
                                  stockinfo.pqty = 0;
                                  stockinfo.purchaseAmount = 0;
                                  stockinfo.avgSalesRate = 1;
                                  stockinfo.productId = insertData.id;
                                  stockinfo.product = insertData;
                                  stockinfo.sqty = 0;
                                  stockinfo.soldAmount = 0;
                                  stockinfo.remaningqty = 0;
                                  stockinfo.createdAt = new Date();
                                  stockinfo.updatedAt = new Date();
                                  stockinfo.createdBy = 0;
                                  stockinfo.organizationId = organizationinforamtion.id;
                                  stockinfo.updatedBy = 0;
                                  stockinfo.deletedBy = 0;
                                  // save stock data
                                  const stock = await queryRunner.manager.save(StockHistoryEntity, stockinfo);

                                  qdDetails.productId = serviceinfo.id;
                                  qdDetails.product = serviceinfo;
                                }
                              }
                            } else {
                              qdDetails.productId = productinfo.id;
                              qdDetails.product = productinfo;
                            }

                            qdDetails.description = detailsinfo?.Description;
                            qdDetails.detailType = detailsinfo?.DetailType;

                            qdDetails.unitPrice = detailsinfo.SalesItemLineDetail.UnitPrice;
                            qdDetails.qty = detailsinfo.SalesItemLineDetail.Qty;
                            qdDetails.taxCodeRef = detailsinfo.SalesItemLineDetail.TaxCodeRef.value;
                            qdDetails.totalAmount = detailsinfo.Amount;
                            qdDetails.qbRefId = detailsinfo.Id;
                            qdDetails.createdAt = new Date();
                            qdDetails.updatedAt = new Date();
                            qdDetails.createdBy = userPayload.id;
                            qdDetails.organization = organizationinforamtion;
                            qdDetails.organizationId = userPayload.organizationId;
                            qdDetails.updatedBy = 0;
                            qdDetails.deletedBy = 0;

                            let details = await queryRunner.manager.save(CreditNoteDetailsEntity, qdDetails);
                          }
                        });

                        //#region Accounts Ledger Transactions
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

                        await this.accountService.addTransaction(body, queryRunner);

                        //#endregion
                      }
                    })
                  );
                }
              }
            );
            //#endregion

            //#region Pay Bill
            qboobject.findBillPayments(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };

                  await Promise.all(
                    results?.QueryResponse?.BillPayment.map(async (a) => {
                      var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(a.TxnDate), userPayload);

                      var billpayment = await queryRunner.manager.findOne(PaymentMadeEntity, {
                        where: {
                          organizationId: userPayload.organizationId,
                          qbRefId: a.Id
                        }
                      });

                      if (billpayment == null) {
                        const createentry = new PaymentMadeEntity();

                        var vendordata = await queryRunner.manager.findOne(VendorsEntity, {
                          where: {
                            organizationId: userPayload.organizationId,
                            qbRefId: a.VendorRef.value
                          }
                        });

                        if (a.PayType == "CreditCard") {
                          var bankinforamtion = await queryRunner.manager.findOne(BankAccountEntity, { where: { qbRefId: a.CreditCardPayment.CCAccountRef.value } });
                          if (bankinforamtion == null) {
                            // ledger data creation
                            const ledgerObj = new AccountsEntity();

                            ledgerObj.name = a.CreditCardPayment.CCAccountRef.name;
                            ledgerObj.fullyQualifiedName = a.CreditCardPayment.CCAccountRef.name;
                            const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Credit Cards" } });
                            ledgerObj.accountType = accountGroup.groupHeadType;
                            ledgerObj.accountSubType = accountGroup.groupName;
                            ledgerObj.classification = accountGroup.groupName;
                            ledgerObj.ledgerParent = accountGroup.id;
                            ledgerObj.nature = accountGroup.nature;

                            ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Bank", userPayload);
                            ledgerObj.accountOpeningBalance = 0;
                            ledgerObj.openingBalance = 0;
                            ledgerObj.closingBalance = 0;

                            ledgerObj.createdAt = new Date();
                            ledgerObj.updatedAt = new Date();
                            ledgerObj.createdBy = userPayload.id;
                            ledgerObj.organizationId = userPayload.organizationId;
                            ledgerObj.updatedBy = 0;
                            ledgerObj.deletedBy = 0;

                            // save ledger
                            const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

                            //const currencyInfo = await this.ledgersService.findOneCurrency(1);

                            let newbank = new BankAccountEntity();
                            newbank.createdAt = new Date();
                            newbank.updatedAt = new Date();
                            newbank.createdBy = userPayload.id;
                            newbank.organizationId = userPayload.organizationId;
                            newbank.updatedBy = 0;
                            newbank.deletedBy = 0;
                            newbank.bankAccountName = a.CreditCardPayment.CCAccountRef.name;
                            newbank.accountType = 2;
                            newbank.accountCode = ledgerObj.ledgerCode;
                            newbank.openingBalance = 0;
                            newbank.accountNumber = "";
                            newbank.bankName = "";
                            newbank.description = "";
                            newbank.ledgerId = saveLedger.id;
                            newbank.ledger = saveLedger;
                            newbank.qbRefId = a.CreditCardPayment.CCAccountRef.value;
                            const insertData = await queryRunner.manager.save(BankAccountEntity, newbank);
                            createentry.creditLedgerId = saveLedger.id;
                            createentry.creditLedger = saveLedger;
                          } else {
                            createentry.creditLedgerId = bankinforamtion.ledgerId;
                            createentry.creditLedger = bankinforamtion.ledger;
                          }
                        } else if (a.PayType == "Check") {
                          var bankinforamtion = await queryRunner.manager.findOne(BankAccountEntity, { where: { qbRefId: a.CheckPayment.BankAccountRef.value } });
                          if (bankinforamtion == null) {
                            // ledger data creation
                            const ledgerObj = new AccountsEntity();

                            ledgerObj.name = a.CheckPayment.BankAccountRef.name;
                            ledgerObj.fullyQualifiedName = a.CheckPayment.BankAccountRef.name;
                            const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Bank Accounts" } });
                            ledgerObj.accountType = accountGroup.groupHeadType;
                            ledgerObj.accountSubType = accountGroup.groupName;
                            ledgerObj.classification = accountGroup.groupName;
                            ledgerObj.ledgerParent = accountGroup.id;
                            ledgerObj.nature = accountGroup.nature;

                            ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Bank", userPayload);
                            ledgerObj.accountOpeningBalance = 0;
                            ledgerObj.openingBalance = 0;
                            ledgerObj.closingBalance = 0;

                            ledgerObj.createdAt = new Date();
                            ledgerObj.updatedAt = new Date();
                            ledgerObj.createdBy = userPayload.id;
                            ledgerObj.organizationId = userPayload.organizationId;
                            ledgerObj.updatedBy = 0;
                            ledgerObj.deletedBy = 0;

                            // save ledger
                            const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

                            //const currencyInfo = await this.ledgersService.findOneCurrency(1);

                            let newbank = new BankAccountEntity();
                            newbank.createdAt = new Date();
                            newbank.updatedAt = new Date();
                            newbank.createdBy = userPayload.id;
                            newbank.organizationId = userPayload.organizationId;
                            newbank.updatedBy = 0;
                            newbank.deletedBy = 0;
                            newbank.bankAccountName = a.CheckPayment.BankAccountRef.name;
                            newbank.accountType = 5;
                            newbank.accountCode = ledgerObj.ledgerCode;
                            newbank.openingBalance = 0;
                            newbank.accountNumber = "";
                            newbank.bankName = "";
                            newbank.description = "";
                            newbank.ledgerId = saveLedger.id;
                            newbank.qbRefId = a.CheckPayment.BankAccountRef.value;
                            newbank.ledger = saveLedger;
                            const insertData = await queryRunner.manager.save(BankAccountEntity, newbank);
                            createentry.creditLedgerId = saveLedger.id;
                            createentry.creditLedger = saveLedger;
                          } else {
                            createentry.creditLedgerId = bankinforamtion.ledgerId;
                            createentry.creditLedger = bankinforamtion.ledger;
                          }
                        }

                        createentry.debitLedgerId = vendordata.ledgerId;
                        createentry.debitLedger = vendordata.ledger;

                        createentry.txnDate = new Date(a.TxnDate);
                        createentry.paymentsNo = await this.accountService.generateAllNumbersbasedonDate("PaymentPaid", new Date(a.TxnDate), userPayload);
                        createentry.reference = a.PrivateNote;
                        createentry.comment = "Quickbook";
                        createentry.totalAmt = a.TotalAmt;
                        createentry.payType = a.PayType;
                        createentry.transactionId = TransactionID;
                        createentry.createdAt = new Date();
                        createentry.updatedAt = new Date();
                        createentry.createdBy = userPayload.id;
                        createentry.organizationId = userPayload.organizationId;
                        createentry.organization = organizationinforamtion;
                        createentry.transactionId = "";
                        createentry.updatedBy = 0;
                        createentry.deletedBy = 0;
                        createentry.qbRefId = a.Id;

                        await queryRunner.manager.save(PaymentMadeEntity, createentry);

                        let checkbillable = false;

                        a.Line?.map(async (detailsinfo) => {
                          let qdDetails = new PaymentMadeDetailsEntity();
                          qdDetails.paymentsId = createentry.id;
                          qdDetails.payment = createentry;
                          qdDetails.bankreference = "";
                          qdDetails.txnId = detailsinfo?.LinkedTxn?.TxnId;
                          qdDetails.txnType = detailsinfo?.LinkedTxn?.TxnType;
                          qdDetails.amount = detailsinfo.Amount;
                          qdDetails.amountDue = detailsinfo.Amount;
                          qdDetails.qbRefId = detailsinfo.Id;
                          qdDetails.createdAt = new Date();
                          qdDetails.updatedAt = new Date();
                          qdDetails.createdBy = userPayload.id;
                          qdDetails.organization = organizationinforamtion;
                          qdDetails.organizationId = userPayload.organizationId;
                          qdDetails.updatedBy = 0;
                          qdDetails.deletedBy = 0;

                          let details = await queryRunner.manager.save(PaymentMadeDetailsEntity, qdDetails);
                        });

                        if (checkbillable) {
                          //#region Accounts Transactions
                          const body = {
                            debitLedgerId: createentry.debitLedgerId,
                            creditLedgerId: createentry.creditLedgerId,
                            transactionDate: new Date(),
                            debitAmount: createentry.totalAmt,
                            creditAmount: createentry.totalAmt,
                            referenceId: createentry.id,
                            transactionId: createentry.transactionId,
                            transactionSource: "Bill Payment",
                            userId: userPayload.id,
                            organizationId: userPayload.organizationId,
                            remarks: "@" + createentry.paymentsNo,
                            transactionReference: createentry.paymentsNo
                          };

                          var transaction = await this.accountService.addTransaction(body, queryRunner);

                          //#endregion
                        }
                      }
                    })
                  );
                }
              }
            );
            //#endregion
            //#region Payment
            qboobject.findPayments(
              {
                fetchAll: true
              },
              async (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  let userPayload = {
                    id: 0,
                    email: "dsfdf",
                    uniqueId: "dsfsdfdsf",
                    hashType: "dfdsfsdf",
                    organizationId: organizationinforamtion.id
                  };

                  await Promise.all(
                    results?.QueryResponse?.Payment.map(async (a) => {
                      var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(a.TxnDate), userPayload);

                      var billpayment = await queryRunner.manager.findOne(PaymentReceivedEntity, {
                        where: {
                          organizationId: userPayload.organizationId,
                          qbRefId: a.Id
                        }
                      });

                      if (billpayment == null) {
                        if (a.TotalAmt > 0) {
                          const createentry = new PaymentReceivedEntity();

                          var customerata = await queryRunner.manager.findOne(CustomersEntity, {
                            where: {
                              organizationId: userPayload.organizationId,
                              qbRefId: a.CustomerRef.value
                            }
                          });
                          console.log("Payment Information: ", a);

                          var bankinforamtion = await queryRunner.manager.findOne(BankAccountEntity, { where: { qbRefId: a.DepositToAccountRef.value } });
                          if (bankinforamtion == null) {
                            // ledger data creation
                            const ledgerObj = new AccountsEntity();

                            ledgerObj.name = "Cash Account";
                            ledgerObj.fullyQualifiedName = "Cash Account";
                            const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Cash In Hand" } });
                            ledgerObj.accountType = accountGroup.groupHeadType;
                            ledgerObj.accountSubType = accountGroup.groupName;
                            ledgerObj.classification = accountGroup.groupName;
                            ledgerObj.ledgerParent = accountGroup.id;
                            ledgerObj.nature = accountGroup.nature;

                            ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Bank", userPayload);
                            ledgerObj.accountOpeningBalance = 0;
                            ledgerObj.openingBalance = 0;
                            ledgerObj.closingBalance = 0;

                            ledgerObj.createdAt = new Date();
                            ledgerObj.updatedAt = new Date();
                            ledgerObj.createdBy = userPayload.id;
                            ledgerObj.organizationId = userPayload.organizationId;
                            ledgerObj.updatedBy = 0;
                            ledgerObj.deletedBy = 0;

                            // save ledger
                            const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

                            //const currencyInfo = await this.ledgersService.findOneCurrency(1);

                            let newbank = new BankAccountEntity();
                            newbank.createdAt = new Date();
                            newbank.updatedAt = new Date();
                            newbank.createdBy = userPayload.id;
                            newbank.organizationId = userPayload.organizationId;
                            newbank.updatedBy = 0;
                            newbank.deletedBy = 0;
                            newbank.bankAccountName = "Cash In Hand";
                            newbank.accountType = 2;
                            newbank.accountCode = ledgerObj.ledgerCode;
                            newbank.openingBalance = 0;
                            newbank.accountNumber = "";
                            newbank.bankName = "";
                            newbank.description = "";
                            newbank.ledgerId = saveLedger.id;
                            newbank.qbRefId = a.DepositToAccountRef.value;
                            newbank.ledger = saveLedger;
                            const insertData = await queryRunner.manager.save(BankAccountEntity, newbank);
                            createentry.debitLedgerId = saveLedger.id;
                            createentry.debitLedger = saveLedger;
                          } else {
                            createentry.debitLedgerId = bankinforamtion.ledgerId;
                            createentry.debitLedger = bankinforamtion.ledger;
                          }

                          createentry.creditLedgerId = customerata.id;
                          createentry.creditLedger = customerata.ledger;

                          createentry.txnDate = new Date(a.TxnDate);
                          createentry.paymentNumber = await this.accountService.generateAllNumbersbasedonDate("PaymentReceived", new Date(a.TxnDate), userPayload);

                          createentry.comment = "Quickbook";
                          createentry.totalAmt = a.TotalAmt;
                          createentry.unappliedAmt = a.UnappliedAmt;
                          createentry.depositToAccountRef = a.DepositToAccountRef.value;
                          if (a.PaymentMethodRef != undefined) createentry.paymentMethodRef = a.PaymentMethodRef.value;
                          else createentry.paymentMethodRef = 1;
                          if (a.LinkedTxn != undefined) {
                            createentry.txnId = a.LinkedTxn.TxnId;
                            createentry.txnType = a.LinkedTxn.TxnType;
                          } else {
                            createentry.txnId = 0;
                            createentry.txnType = "";
                          }
                          createentry.paymentRefNum = a.PaymentRefNum;
                          createentry.transactionId = TransactionID;
                          createentry.createdAt = new Date();
                          createentry.updatedAt = new Date();
                          createentry.createdBy = userPayload.id;
                          createentry.organizationId = userPayload.organizationId;
                          createentry.organization = organizationinforamtion;
                          createentry.transactionId = "";
                          createentry.updatedBy = 0;
                          createentry.deletedBy = 0;
                          createentry.qbRefId = a.Id;

                          await queryRunner.manager.save(PaymentReceivedEntity, createentry);

                          a.Line?.map(async (detailsinfo) => {
                            let qdDetails = new PaymentDetailsEntity();
                            qdDetails.paymentsId = createentry.id;
                            qdDetails.payment = createentry;
                            qdDetails.bankreference = "";
                            qdDetails.txnId = detailsinfo?.LinkedTxn?.TxnId;
                            qdDetails.txnType = detailsinfo?.LinkedTxn?.TxnType;
                            qdDetails.amountPaid = detailsinfo.Amount;
                            qdDetails.amountDue = 0;
                            qdDetails.qbRefId = detailsinfo.Id;

                            qdDetails.createdAt = new Date();
                            qdDetails.updatedAt = new Date();
                            qdDetails.createdBy = userPayload.id;
                            qdDetails.organization = organizationinforamtion;
                            qdDetails.organizationId = userPayload.organizationId;
                            qdDetails.updatedBy = 0;
                            qdDetails.deletedBy = 0;

                            let details = await queryRunner.manager.save(PaymentDetailsEntity, qdDetails);
                          });

                          //#region Accounts Transactions
                          const body = {
                            debitLedgerId: createentry.debitLedgerId,
                            creditLedgerId: createentry.creditLedgerId,
                            transactionDate: new Date(),
                            debitAmount: createentry.totalAmt,
                            creditAmount: createentry.totalAmt,
                            referenceId: createentry.id,
                            transactionId: createentry.transactionId,
                            transactionSource: "Bill Payment",
                            userId: userPayload.id,
                            organizationId: userPayload.organizationId,
                            remarks: "@" + createentry.paymentRefNum,
                            transactionReference: createentry.paymentNumber
                          };

                          var transaction = await this.accountService.addTransaction(body, queryRunner);

                          //#endregion
                        }
                      }
                    })
                  );
                }
              }
            );
            //#endregion

            //#endregion
            await queryRunner.commitTransaction();
            return "Authenticated";
          } catch (ex) {
            //console.log(ex)
            await queryRunner.rollbackTransaction();
            return "failed";
          } finally {
            //await queryRunner.release();
          }
        }
      }
    } catch (ex) {
      console.log("ex: ", ex);
      throw new BadRequestException(`failed`);
    }
  }

  async callback(url) {
    const parseRedirect = url;
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    // oauthClient
    //   .createToken(parseRedirect)
    //   .then(async function (authResponse) {
    //     qbtoken = JSON.stringify(authResponse.getJson());

    //     const realmeid = parseRedirect.split("realmId=")[1];
    //     const tokenvalue = JSON.parse(qbtoken);
    //     qbtoken = tokenvalue;

    //     realmeID = realmeid;
    //     accessToken = tokenvalue.access_token;
    //     refreshToken = tokenvalue.refresh_token;

    //     isauthenticated = true;

    const authResponse = await oauthClient.createToken(parseRedirect);
    qbtoken = JSON.stringify(authResponse.getJson());

    const realmeid = parseRedirect.split("realmId=")[1];
    const tokenvalue = JSON.parse(qbtoken);
    qbtoken = tokenvalue;

    realmeID = realmeid;
    accessToken = tokenvalue.access_token;
    refreshToken = tokenvalue.refresh_token;

    isauthenticated = true;

    try {
      let organizationinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
        where: { realmeID: realmeID }
      });

      organizationinforamtion.accessToken = accessToken;
      organizationinforamtion.refreshToken = refreshToken;

      await queryRunner.manager.update(OrganizationEntity, { id: organizationinforamtion.id }, organizationinforamtion);
      const qboobject = new QuickBooks(
        clientkey,
        clientsecret,
        organizationinforamtion.accessToken,
        false, // no token secret for oAuth 2.0
        organizationinforamtion.realmeID,
        true, // use the sandbox?
        true, // enable debugging?
        null, // set minorversion, or null for the latest version
        "2.0", //oAuth version
        organizationinforamtion.refreshToken
      );

      await queryRunner.commitTransaction();

      return "Successfully connected to QuickBooks!";
    } catch (err) {
      console.log(err);
      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`failed`);
    }
    //  finally {
    //   // release query runner which is manually created:
    //   await queryRunner.release();
    // }
    //#endregion End Transaction
    //   })
    // .catch(function (e) {
    //   console.error("The error message is :" + e);

    //   return "Error while getting the token";
    // });
  }

  async refreshtoken(userPayload: UserInterface) {
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    try {
      const qbinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
        where: {
          id: userPayload.organizationId
        }
      });
      const oauthClient = new OAuthClient({
        clientId: qbinforamtion.qbClientKey,
        clientSecret: qbinforamtion.qbClientSecret,
        environment: "sandbox", //|| "production"
        redirectUri: "http://localhost:4000/api/v1/auth/callback"
      });

      const refreshtoken = await oauthClient.refreshUsingToken(qbinforamtion.refreshToken);
      console.log("refreshtoken: ", refreshtoken);

      try {
        let resonse = JSON.stringify(refreshtoken.getJson());
        const tokenvalue = JSON.parse(resonse);

        qbinforamtion.refreshToken = tokenvalue.refresh_token;
        qbinforamtion.accessToken = tokenvalue.access_token;

        await queryRunner.manager.update(OrganizationEntity, { id: qbinforamtion.id }, qbinforamtion);
        await queryRunner.commitTransaction();
        return "Success";
      } catch (e) {
        console.error("The error message is :" + e);
        console.error(e.intuit_tid);
        return "failed";
      }
    } catch (ex) {
      //console.log(ex)
      //await queryRunner.rollbackTransaction();
      return "failed";
    } finally {
      //await queryRunner.release();
    }
  }

  async refreshtokentransaction(userPayload: UserInterface, queryRunner: QueryRunner) {
    try {
      const qbinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
        where: {
          id: userPayload.organizationId
        }
      });
      const oauthClient = new OAuthClient({
        clientId: qbinforamtion.qbClientKey,
        clientSecret: qbinforamtion.qbClientSecret,
        environment: "sandbox", //|| "production"
        redirectUri: "http://localhost:4000/api/v1/auth/callback"
      });

      const refreshtoken = await oauthClient.refreshUsingToken(qbinforamtion.refreshToken);
      console.log("refreshtoken: ", refreshtoken);

      try {
        let resonse = JSON.stringify(refreshtoken.getJson());
        const tokenvalue = JSON.parse(resonse);

        qbinforamtion.refreshToken = tokenvalue.refresh_token;
        qbinforamtion.accessToken = tokenvalue.access_token;

        await queryRunner.manager.update(OrganizationEntity, { id: qbinforamtion.id }, qbinforamtion);

        return "Success";
      } catch (e) {
        console.error("The error message is :" + e);
        console.error(e.intuit_tid);
        return "failed";
      }
    } catch (ex) {
      //console.log(ex)
      //await queryRunner.rollbackTransaction();
      return "failed";
    } finally {
      //await queryRunner.release();
    }
  }

  async isauthenticated(userPayload: UserInterface, queryRunner: QueryRunner) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
      where: { id: userPayload.organizationId }
    });

    const oauthClient = new OAuthClient({
      clientId: organizationinforamtion.qbClientKey,
      clientSecret: organizationinforamtion.qbClientSecret,
      environment: "sandbox" || "production",
      redirectUri: "http://localhost:4000/api/v1/auth/callback"
    });

    if (!oauthClient.isAccessTokenValid()) {
      await this.refreshtokentransaction(userPayload, queryRunner);
    }
    return "Authenticated";
  }

  //#endregion
  // ********** GENERAL USER ********
  //  create user by admin user
  async createUser(dto: AuthDto, userPayload: UserInterface): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }

    try {
      const accountGroup = await this.accountingGroupService.isAccountGroupsExist("Direct Overhead");

      let fileNameData;
      if (dto.file) {
        fileNameData = path.basename(dto.file.originalname, path.extname(dto.file.originalname));
      }
      const ledgerObj = new AccountsEntity();
      ledgerObj.name = dto.fullName;
      ledgerObj.ledgerParent = accountGroup.id;
      ledgerObj.accountType = accountGroup.groupHeadType;
      ledgerObj.nature = accountGroup.nature;
      ledgerObj.ledgerCode = `AC-${randToken.generate(5, "abcdefghijklnmopqrstuvwxyz0123456789")}`;
      ledgerObj.accountOpeningBalance = 0;
      ledgerObj.openingBalance = 0;
      ledgerObj.closingBalance = 0;
      ledgerObj.createdAt = new Date();
      ledgerObj.updatedAt = new Date();
      ledgerObj.createdBy = userPayload.id;
      ledgerObj.organizationId = userPayload.organizationId;
      ledgerObj.updatedBy = 0;
      ledgerObj.deletedBy = 0;

      const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);
      const dataCheck = await this.usersRepository.findOne({
        where: {
          email: dto.email,
          organizationId: userPayload.organizationId
        }
      });

      if (dataCheck) {
        exceptionmessage = `this mail is already exist!`;
        return `this mail is already exist!`;
      } else {
        let userdata = new UserEntity();
        userdata.fullName = dto.fullName;
        userdata.email = dto.email;
        userdata.password = bcrypt.hashSync(dto.password, 10);
        userdata.mobile = dto.mobile;
        userdata.gender = dto.gender;
        userdata.profileImgSrc = fileNameData ? fileNameData : null;
        var sadminutype = await queryRunner.manager.findOne(UserTypeEntity, { where: { id: dto.userTypeId } });
        userdata.userType = sadminutype;
        userdata.userTypeId = sadminutype.id;
        userdata.organizationId = userPayload.organizationId;
        var organization = await queryRunner.manager.findOne(OrganizationEntity, { where: { id: userPayload.organizationId } });
        userdata.organization = organization;
        userdata.ledger = ledgerObj;
        userdata.createdAt = new Date();
        userdata.updatedAt = new Date();
        userdata.createdBy = userPayload.id;
        userdata.organizationId = userPayload.organizationId;
        userdata.updatedBy = 0;
        userdata.deletedBy = 0;

        // save user data
        const saveUser = await queryRunner.manager.save(UserEntity, userdata);
        await queryRunner.commitTransaction();
        return saveUser;
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
    //#endregion End Transaction
  }

  // sign in user
  async signinUser(loginDto: LoginDto): Promise<any> {
    // const capResult = await this.recaptchaValidator.validate({
    //   response: loginDto?.recaptchaToken,
    //   score: 0.8,
    //   action: 'SomeAction',
    // });

    // if (!capResult.success) {
    //   throw new GoogleRecaptchaException(capResult.errors);
    // } else {
    console.log("loginDto: ", loginDto);

    const loginInfo = loginDto?.ipPayload;

    delete loginDto.ipPayload;

    const userRegCheck = await this.usersRepository.findOne({
      where: {
        email: loginDto.email,
        status: StatusField.DRAFT
      }
    });
    if (userRegCheck) {
      throw new BadRequestException("Your Registration process were pending!!!");
    }
    const user = await this.usersRepository.findOne({
      where: {
        email: loginDto.email,
        status: StatusField.ACTIVE
      },
      relations: ["userType", "organization"]
    });

    if (!user) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);

    const loginHostory = {
      cLientIPAddress: loginInfo.ip,
      browser: loginInfo.browser,
      os: loginInfo.os,
      userId: user.id,
      organizationId: user.organizationId
    };

    if (user && !user.userType) {
      throw new BadRequestException(`userType not found!!`);
    }
    const passwordMatches = await bcrypt.compare(loginDto.password, user.password);

    if (!passwordMatches) throw new ForbiddenException("Invalid password!");
    const tokens = await this.getTokens({
      id: user.id,
      email: user.email,
      hashType: encrypt(user?.userType?.userTypeName),
      organizationId: user.organizationId
    });
    await this.updateRtHashUser({ id: user.id }, tokens.refresh_token);
    if (tokens) {
      // const mainImage = `../../../assets/png-file/logo.png`;
      const mailData = new QueueMailDto();
      mailData.toMail = user.email;
      mailData.subject = `RB: Login Message`;
      mailData.bodyHTML = `Test Message`;
      // mailData.template = './login';
      // mailData.context = {
      //   imgSrc: mainImage,
      // };

      await this.activityLogService.createLoginHistory(loginHostory);

      // const test = await this.queueMailService.sendMail(mailData);
    }
    let logininforamtion = [];
    logininforamtion.push(tokens);

    logininforamtion.push(user.organization.qbaccounts);
    logininforamtion.push(user);

    return logininforamtion;
    // }
  }

  // sign in for self user
  // async signinSelf(loginDto: LoginDto): Promise<any> {
  //   const user = await this.usersRepository.findOne({
  //     where: {
  //       email: loginDto.email,
  //       status: StatusField.ACTIVE,
  //       userType: loginDto.userType,
  //     },
  //   });

  //   if (!user) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);

  //   const passwordMatches = user.password === loginDto.password;
  //   if (!passwordMatches) throw new ForbiddenException('Invalid password!');

  //   const tokens = await this.getTokens({
  //     id: user.id,
  //     email: user.email,
  //     hashType: encrypt(loginDto.userType),
  //   });
  //   await this.updateRtHashUser({ id: user.id }, tokens.refresh_token);

  //   if (tokens) {
  //     // const mainImage = `../../../assets/png-file/logo.png`;
  //     const mailData = new QueueMailDto();
  //     mailData.toMail = user.email;
  //     mailData.subject = `RB: Login Message`;
  //     mailData.bodyHTML = `Test Message`;

  //     // mailData.template = './login';

  //     // mailData.context = {
  //     //   imgSrc: mainImage,
  //     // };
  //     const test = await this.queueMailService.sendMail(mailData);
  //   }
  //   return tokens;
  // }

  // get user by id
  async findUserById(userPayload: UserInterface) {
    const data = await this.usersRepository.findOne({
      where: { id: userPayload.id },
      relations: ["userType", "ledger"]
    });
    if (!data) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);
    delete data.password;
    delete data.hashedRt;
    return data;
  }
  // get user by id
  async findSingleUser(id: number, userPayload: UserInterface) {
    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    const data = await this.usersRepository.findOne({
      where: { id: id }
    });
    if (!data) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);
    delete data.password;
    delete data.hashedRt;
    return data;
  }

  // get user by id
  async userById(userId: number) {
    const data = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ["userType", "ledger"]
    });
    if (!data) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);
    delete data.password;
    delete data.hashedRt;
    return data;
  }

  // update refresh token of user
  async updateRtHashUser(userPayload: any, rt: string) {
    const hash = await bcrypt.hash(rt, 10);
    const updatedData = {
      hashedRt: hash
    };
    await this.usersRepository.update({ id: userPayload.id }, updatedData);
  }

  // logout user
  async logout(userPayload: UserInterface) {
    const updatedData = {
      hashedRt: null
    };
    const isUpdated = await this.usersRepository.update({ id: userPayload.id }, updatedData);

    return isUpdated ? true : false;
  }

  // token refresh of user
  async refreshTokens(userId: number, rt: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user || !user.hashedRt) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);

    const rtMatches = await bcrypt.compare(rt, user.hashedRt);

    if (!rtMatches) throw new ForbiddenException("Token not matches!");

    const tokens = await this.getTokens({
      id: user.id,
      email: user.email,
      hashType: encrypt(UserTypesEnum.USER),
      organizationId: user.organizationId
    });
    await this.updateRtHashUser(user.id, tokens.refresh_token);

    return tokens;
  }

  //   forgot password
  async forgotPass(forgotPassDto: ForgotPassDto) {
    const userData = await this.validateUserByEmail(forgotPassDto.email);

    //generate password reset token
    const randomTokenString = randomToken.generate(20);
    // const paswordResetLink = `${
    //   this.configService.get('APP_ENV') === 'development'
    //     ? this.configService.get('PUBLIC_CDN')
    //     : this.configService.get('PUBLIC_CDN')
    // }reset-password?passResetToken=${randomTokenString}`;
    const paswordResetLink = `
      http://127.0.0.1:3000/user/change-password?passResetToken=${randomTokenString}`;
    //if email validating fails
    if (!userData) {
      throw new NotFoundException(`No user found with email associated ${forgotPassDto.email}`);
    }

    //update the data for pass reset
    const forgotPassRestUpdate = await this.updatePassResetToken(forgotPassDto, randomTokenString);

    if (forgotPassRestUpdate && forgotPassRestUpdate.affected > 0) {
      // const cdnLink = await this.configService.get('PUBLIC_CDN');
      const mainImage = `../../../assets/png-file/logo.png`;

      const mailData = new QueueMailDto();
      mailData.toMail = userData.email;
      mailData.subject = `Reset password instructions for RB account`;
      mailData.template = "./forgot-password";
      mailData.context = {
        name: `${userData.fullName}`,
        resetLink: paswordResetLink,
        imgSrc: mainImage
      };
      //send password reset link
      const sendMail = await this.queueMailService.sendMail(mailData);
      // if email is not sent then send errors
      if (sendMail != undefined) {
        throw new ConflictException(`${ErrorMessage.FAILED_TO_RESET} password!`);
      }
    } else {
      throw new ConflictException(`${ErrorMessage.FAILED_TO_RESET} password!`);
    }
    return forgotPassDto.email;
  }

  //validate user by email
  async validateUserByEmail(email: string) {
    const userData = await this.usersRepository.findOne({
      where: {
        email: email
      }
    });

    if (!userData) {
      throw new NotFoundException(ErrorMessage.EMAIL_NOT_FOUND);
    }
    delete userData.password;

    return userData;
  }

  //update user pass reset
  async updatePassResetToken(forgotPassDto: ForgotPassDto, passResetToken: string) {
    //set pass reset expiry date time
    const currentDate = new Date();
    const passResetExpireAt = new Date(currentDate);
    passResetExpireAt.setHours(passResetExpireAt.getHours() + Number(this.configService.get("PASS_RESET_EXPIRY", 1)));
    //prepare data to be updated
    const updateData = {};
    updateData["passResetToken"] = passResetToken;
    updateData["passResetTokenExpireAt"] = passResetExpireAt;

    const { email } = forgotPassDto;
    const userData = await this.usersRepository.update({ email: email }, updateData);

    return userData;
  }

  //hash password
  async hashPassword(password: string) {
    return bcrypt.hashSync(password, 10);
  }

  //change password by forgot password
  async changePasswordByForgotPass(changeForgotPassDto: ChangeForgotPassDto) {
    //validate pass reset token data and return user information from it
    const userData = await this.validatePassResetToken(changeForgotPassDto);

    //check for pass reset token expir
    const currentDate = new Date();

    if (new Date(currentDate) >= userData.passResetTokenExpireAt) {
      throw new ForbiddenException(`Pass Reset ${ErrorMessage.TOKEN_EXPIRED}`);
    }

    //update the password of the user
    const encryptedPassword = await this.hashPassword(changeForgotPassDto.password);
    const updatedData = await this.updateUserPasswordData(userData.id, encryptedPassword);

    //app sign in link
    const signInLink = "#";
    // if (changeForgotPassDto.userTypeSlug == UserTypesEnum.MENTOR) {
    //   signInLink = `${
    //     this.configService.get('APP_ENV') === 'development'
    //       ? this.configService.get('DEV_FRONTEND_MENTOR_DOMAIN')
    //       : this.configService.get('DEV_FRONTEND_MENTOR_DOMAIN')
    //   }/signin`;
    // } else {
    //   signInLink = `${
    //     this.configService.get('APP_ENV') === 'development'
    //       ? this.configService.get('DEV_FRONTEND_DOMAIN')
    //       : this.configService.get('PROD_FRONTEND_DOMAIN')
    //   }/signin`;
    // }
    // const cdnLink = await this.configService.get('PUBLIC_CDN');
    // const mainImage = `${cdnLink}ADMIN/logo-unisearch-67e1c334-cbc7-47cd-80d1-75ac4ed60dbb.png`;
    const mainImage = "#";
    const mailData = new QueueMailDto();
    mailData.toMail = updatedData.email;
    mailData.subject = `RB: Password Changed`;
    mailData.template = "./change-password";
    mailData.context = {
      signInLink: signInLink,
      imgSrc: mainImage
    };
    await this.queueMailService.sendMail(mailData);

    return updatedData.email;
  }

  //validate pass reset token
  async validatePassResetToken(changeForgotPassDto: ChangeForgotPassDto) {
    const { passResetToken } = changeForgotPassDto;
    const userData = await this.usersRepository.findOne({
      where: {
        passResetToken: passResetToken
      }
    });

    //user data error not found
    if (!userData) {
      throw new NotFoundException(`Password reset ${ErrorMessage.INFO_NOT_FOUND}.Please request a new one!`);
    }

    return userData;
  }

  //update user password data
  async updateUserPasswordData(userId: number, encryptedPassword: string) {
    const updateData = {
      password: encryptedPassword,
      passResetToken: null,
      passResetTokenExpireAt: null
    };

    await this.usersRepository.createQueryBuilder().update(UserEntity, updateData).where("id = :id", { id: userId }).execute();

    const updatedUser = await this.usersRepository.findOne({
      where: { id: userId }
    });

    if (!updatedUser) {
      throw new NotFoundException(`${ErrorMessage.UPDATE_FAILED}`);
    }

    return updatedUser;
  }

  // update user
  async updateUserProfile(updateUserDto: any, userPayload: UserInterface, id: number) {
    const userType = await this.userTypeService.findOneType(updateUserDto.userTypeId);

    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    updateUserDto["updatedAt"] = new Date();
    updateUserDto["updatedBy"] = userPayload.id;

    if (updateUserDto?.email) {
      const dataCheck = await this.usersRepository.createQueryBuilder("user").where(`user.email='${updateUserDto.email}'`).andWhere(`user.id != ${id}`).getOne();

      if (dataCheck) {
        throw new BadRequestException(`Email you provided, already exist. Please fill another email.`);
      }
    }

    const ledgerInfo = await this.ledgersService.findOneLedger(updateUserDto.ledgerId);

    let fileNameData;
    if (updateUserDto.file) {
      fileNameData = path.basename(updateUserDto.file.originalname, path.extname(updateUserDto.file.originalname));
    }

    updateUserDto["profileImgSrc"] = fileNameData ? fileNameData : null;
    delete updateUserDto.file;

    delete updateUserDto.userTypeId;
    delete updateUserDto.ledgerId;
    delete updateUserDto.currencyId;

    const updateUser = await this.usersRepository.createQueryBuilder().update(UserEntity, updateUserDto).where(`id = '${id}'`).execute();

    const dataFind = await this.usersRepository.createQueryBuilder("user").where(`user.email='${updateUserDto.email}'`).andWhere(`user.id = ${id}`).getOne();

    dataFind.userType = userType;
    dataFind.ledger = ledgerInfo;
    await this.usersRepository.save(dataFind);
    return `user profile updated successfully!!!`;

    // if (data.affected === 0) {
    //   throw new BadRequestException(ErrorMessage.UPDATE_FAILED);
    // }
  }

  // get user by id
  async getUserById(userId: number) {
    const data = await this.usersRepository.findOne({ where: { id: userId } });
    return data;
  }

  // find all user
  async findAllUser(listQueryParam: PaginationOptionsInterface, filter: any, userPayload: UserInterface) {
    // if (decrypt(userPayload.hashType) !== UserTypesEnum.USER) {
    //   throw new BadRequestException(
    //     "You are not allow to see any kind of User"
    //   );
    // }
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    const [result, total] = await this.usersRepository
      .createQueryBuilder("user")
      .where(`user.organizationId = ${userPayload.organizationId}`)
      .andWhere(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`user.fullName LIKE ('%${filter}%')`);
          }
        })
      )
      .orderBy("user.id", "DESC")
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    const results = result.map(({ password, hashedRt, ...Product }) => Product);

    return new Pagination<any>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit
    });
  }

  // delete user
  async deleteUser(userPayload: UserInterface) {
    const data = await this.usersRepository.delete({ id: userPayload.id });

    return `deleted successfully!!`;
  }

  // *******Common use api ******

  // get tokens FOR ALL
  async getTokens(userPayload: UserInterface) {
    const payload = {
      id: userPayload.id,
      email: userPayload.email,
      hashType: userPayload.hashType,
      organizationId: userPayload.organizationId
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("USER_SECRET"),
        expiresIn: "10d"
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("RT_SECRET"),
        expiresIn: "7d"
      })
    ]);

    return {
      access_token: at,
      refresh_token: rt
    };
  }

  // *******For ADMIN USER******

  // update admin
  async updateAdminProfile(updateUserDto: any, userPayload: UserInterface) {
    updateUserDto["updatedAt"] = new Date();
    updateUserDto["updatedBy"] = userPayload.id;

    if (updateUserDto?.email) {
      const dataCheck = await this.usersRepository.createQueryBuilder("user").where(`user.email='${updateUserDto.email}'`).andWhere(`user.id != ${userPayload.id}`).getOne();

      if (dataCheck) {
        return `Email you provided, already exist. Please fill another email.`;
      }
    }

    const data = await this.usersRepository.createQueryBuilder().update(UserEntity, updateUserDto).where(`id = '${userPayload.id}'`).returning("*").execute();

    if (data.affected === 0) {
      throw new BadRequestException(ErrorMessage.UPDATE_FAILED);
    }

    return "Admin Profile updated successfully!";
  }

  // sign up admin user
  async signupAdminUser(dto: any): Promise<any> {
    // const capResult = await this.recaptchaValidator.validate({
    //   response: dto.recaptchaToken,
    //   score: 0.8,
    //   action: "SomeAction"
    // });

    // if (!capResult.success) {
    //   throw new GoogleRecaptchaException(capResult.errors);
    // } else {
    // delete dto.recaptchaToken;
    const userType = await this.userTypeService.findOneType(dto.userTypeId);

    // if (userType.userTypeName != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    const dataCheck = await this.usersRepository.findOne({
      where: {
        email: dto.email
      }
    });
    if (dataCheck) {
      return `this mail is already exist!`;
    } else {
      const secPass = await this.configService.get("GENERATE_SECRET_CODE");
      dto["status"] = StatusField.ACTIVE;
      dto["uniqueId"] = uuidv4();
      dto["organizationId"] = dto.organizationId;
      dto.password = dto && dto.password && dto.password.length > 1 ? bcrypt.hashSync(dto.password, 10) : bcrypt.hashSync(secPass, 10);
      const insertData = await this.usersRepository.save(dto);
      insertData.userType = userType;
      await this.usersRepository.save(insertData);
      let tokens;
      if (insertData) {
        tokens = await this.getTokens({
          id: insertData.id,
          email: insertData.email,
          hashType: encrypt(insertData.userType.userTypeName),
          organizationId: insertData.organizationId
        });
        await this.updateRtHashAdmin(
          {
            id: insertData.id,
            email: insertData.email
          },
          tokens.refresh_token
        );
      }
      return tokens;
    }
    // }
  }

  // token refresh user
  async refreshTokensUser(userId: number, rt: string): Promise<any> {
    const systemUser = await this.usersRepository.findOne({
      where: { id: userId }
    });

    if (!systemUser || !systemUser.hashedRt) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);

    const rtMatches = await bcrypt.compare(rt, systemUser.hashedRt);

    if (!rtMatches) throw new ForbiddenException("Token not matches!");

    const tokens = await this.getTokens({
      id: systemUser.id,
      email: systemUser.email,
      hashType: encrypt(UserTypesEnum.USER),
      organizationId: systemUser.organizationId
    });
    await this.updateRtHashAdmin(systemUser.id, tokens.refresh_token);

    return tokens;
  }

  // update refresh token of user
  async updateRtHashAdmin(userPayload: any, rt: string) {
    const hash = await bcrypt.hash(rt, 10);
    const updatedData = {
      hashedRt: hash
    };
    await this.usersRepository.update({ id: userPayload.id }, updatedData);
  }
}
