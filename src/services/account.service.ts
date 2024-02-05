import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as randToken from "rand-token";
import { StatusField } from "src/authentication/common/enum";
import {
  AddTransactionInterface,
  AdjustTransactionHistoryInterface,
  AdjustTransactionHistoryUpdateInterface,
  RevertTransactionInterface,
  TransactionStock,
  UpdateLedgerTransactionInterface,
  UpdateOpeningBalanceTransactionInterface,
  UpdateTransactionInterface
} from "src/authentication/common/http/response/interfaces";
import { DeleteTransactionsInterface, OpeningBalanceInterface, UserInterface } from "src/authentication/common/interfaces";

import { AllGroupViewEntity } from "src/viewentites/all-groupwiew.entity";
import { ChartLedgerViewModel } from "src/viewentites/chartledgerwiew.entity";
import { DataSource, Like, QueryRunner } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import {
  AccountingGroupEntity,
  BankAccountEntity,
  BillEntity,
  CreditNotesEntity,
  CustomersEntity,
  EmployeesEntity,
  ExpensesEntity,
  InvoiceEntity,
  AccountsEntity,
  ManualJournalsEntity,
  PaymentMadeEntity,
  PaymentReceivedEntity,
  StockHistoryEntity,
  VendorsEntity,
  TransactionHistoryEntity,
  VendorDebitsEntity
} from "../entities";
import { ProductsEntity } from "../entities/Products.entity";
import { EstimationEntity } from "../entities/estimation.entity";
import { PurchaseOrderEntity } from "../entities/purchase-order.entity";
import { DashboardViewModel } from "../viewentites/dashboardViewModel.entiry";
import { ActivityLogService } from "./activity-log.service";

let transactionHistories = [];
let debittransactionHistories = [];
let credittransactionHistories = [];
let lasttransactiononthisday = [];
let lasttransactiononthisdata = null;
let checkdebittransactiononthisdata = null;
let lasttransactiononthisdayfind = null;
let organizedataasorder = null;
let aftertransactionhistroyfindings = null;
let transactionhistroyafter = null;
let lasttransactionbefore = null;
let lastcredittransactiononthisdata = null;
let checkcredittransactiononthisdata = null;
let allgroupsglobal = [];
let allledgersglobal = [];
let allstockglobal = [];
let alltransactionhistory = [];
let allexpensehistory = [];
let totalexpense = 0;

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(TransactionHistoryEntity)
    private transactionHistoryRepository: BaseRepository<TransactionHistoryEntity>,
    @InjectRepository(AccountingGroupEntity)
    private accountingGroupRepository: BaseRepository<AccountingGroupEntity>,
    @InjectRepository(StockHistoryEntity)
    private stockHistoryEntityRepository: BaseRepository<StockHistoryEntity>,
    @InjectRepository(AccountsEntity)
    private ledgerRepository: BaseRepository<AccountsEntity>,
    private activityLogService: ActivityLogService,
    private dataSource: DataSource
  ) {}

  //#region chart of account

  async chartOfAccount(ipClientPayload: any, userPayload: UserInterface) {
    allgroupsglobal = [];
    allledgersglobal = [];
    allstockglobal = [];
    alltransactionhistory = [];
    allexpensehistory = [];
    alltransactionhistory = await this.transactionHistoryRepository.find({ where: { organizationId: userPayload.organizationId } });

    allgroupsglobal = await this.accountingGroupRepository.find({
      where: [
        {
          status: StatusField.ACTIVE,
          organizationId: null
        },
        {
          status: StatusField.ACTIVE,
          organizationId: userPayload.organizationId
        }
      ]
    });

    if (allgroupsglobal.length > 0) {
      allledgersglobal = await this.ledgerRepository.find({
        where: [
          {
            status: StatusField.ACTIVE,
            organizationId: userPayload.organizationId
          }
        ]
      });
    }
    const allg = [];
    allstockglobal = await this.stockHistoryEntityRepository.find({ where: { organizationId: userPayload.organizationId }, relations: ["product"] });
    allexpensehistory = alltransactionhistory.filter((a) => a.transactionSource == "Expense" || a.transactionSource == "Salary Payment");
    totalexpense = allexpensehistory.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0);
    //First Level
    let maingroups = allgroupsglobal.filter((a) => a.groupParent == null);
    await Promise.all(
      maingroups.map(async (group) => {
        let single = new AllGroupViewEntity();
        single.id = group.id;
        single.groupIdentifier = group.groupIdentifier;
        single.groupName = group.groupName;
        single.groupParent = group.groupParent;
        single.nature = group.nature;
        single.TotalExpense = 0;
        single.TotalDeposit = 0;

        let allLedger = allledgersglobal.filter((a) => a.ledgerParent == group.id);

        let ledgerdettails = [];

        allLedger.map(async (ledger) => {
          let singleleddata = new ChartLedgerViewModel();
          singleleddata.ledgerdata = ledger;
          if (ledger.Name == "Profit & Loss Account") {
            let totalpurchase = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.pqty), 0);
            let totalsales = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgSalesRate) * Number(currentValue.sqty), 0);
            let totalclosing = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.remaningqty), 0);

            let totalprofit = Number(totalsales) - (Number(totalpurchase) - Number(totalclosing)) - Number(totalexpense);

            singleleddata.TotalDeposit = totalprofit;
          } else {
            singleleddata.TotalDeposit = Number(ledger.closingBalance);
          }
          singleleddata.TotalExpense = 1;

          ledgerdettails.push(singleleddata);
        });

        single.CurrentBalance = await this.CalculateParentExpense(group.id);

        single.ledgerdata = ledgerdettails;

        //#region Second Level

        let childs2ndlevel = [];

        let findnes2nd = allgroupsglobal.filter((a) => a.groupParent == group.id);

        findnes2nd.map(async (child2nd) => {
          let singlechild2nd = new AllGroupViewEntity();
          singlechild2nd.id = child2nd.id;
          singlechild2nd.groupIdentifier = child2nd.groupIdentifier;
          singlechild2nd.groupName = child2nd.groupName;
          singlechild2nd.groupParent = child2nd.groupParent;
          singlechild2nd.nature = child2nd.nature;
          singlechild2nd.TotalExpense = 0;
          singlechild2nd.TotalDeposit = 0;

          let allLedgerchild2nd = allledgersglobal.filter((a) => a.ledgerParent == child2nd.id);

          let ledgerdettailschild2nd = [];

          allLedgerchild2nd.map(async (ledgerchild2nd) => {
            let singleleddatachild2nd = new ChartLedgerViewModel();
            singleleddatachild2nd.ledgerdata = ledgerchild2nd;
            singleleddatachild2nd.TotalExpense = 1;
            if (ledgerchild2nd.Name == "Profit & Loss Account") {
              let totalpurchase = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.pqty), 0);
              let totalsales = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgSalesRate) * Number(currentValue.sqty), 0);
              let totalclosing = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.remaningqty), 0);
              let totalprofit = Number(totalsales) - (Number(totalpurchase) - Number(totalclosing)) - Number(totalexpense);

              singleleddatachild2nd.TotalDeposit = totalprofit;
            } else {
              singleleddatachild2nd.TotalDeposit = Number(ledgerchild2nd.closingBalance);
            }

            ledgerdettailschild2nd.push(singleleddatachild2nd);
          });

          let closingBalance2nd = await this.CalculateParentExpense(child2nd.id);

          singlechild2nd.CurrentBalance = closingBalance2nd;
          singlechild2nd.ledgerdata = ledgerdettailschild2nd;

          //#region Third Level
          let childs3rdlevel = [];
          let findnes3rd = allgroupsglobal.filter((a) => a.groupParent == child2nd.id);
          findnes3rd.map(async (child3rd) => {
            let singlechild3rd = new AllGroupViewEntity();
            singlechild3rd.id = child3rd.id;
            singlechild3rd.groupIdentifier = child3rd.groupIdentifier;
            singlechild3rd.groupName = child3rd.groupName;
            singlechild3rd.groupParent = child3rd.groupParent;
            singlechild3rd.nature = child3rd.nature;
            singlechild3rd.TotalExpense = 0;
            singlechild3rd.TotalDeposit = 0;

            let allLedgerchild3rd = allledgersglobal.filter((a) => a.ledgerParent == child3rd.id);

            let ledgerdettailschild3rd = [];

            allLedgerchild3rd.map(async (ledgerchild3rd) => {
              let singleleddatachild3rd = new ChartLedgerViewModel();
              singleleddatachild3rd.ledgerdata = ledgerchild3rd;
              singleleddatachild3rd.TotalExpense = 1;
              if (ledgerchild3rd.Name == "Profit & Loss Account") {
                let totalpurchase = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.pqty), 0);
                let totalsales = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgSalesRate) * Number(currentValue.sqty), 0);
                let totalclosing = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.remaningqty), 0);
                let totalprofit = Number(totalsales) - (Number(totalpurchase) - Number(totalclosing)) - Number(totalexpense);

                singleleddatachild3rd.TotalDeposit = totalprofit;
              } else {
                singleleddatachild3rd.TotalDeposit = Number(ledgerchild3rd.closingBalance);
              }

              ledgerdettailschild3rd.push(singleleddatachild3rd);
            });

            let closingBalance3rd = await this.CalculateParentExpense(child3rd.id);

            singlechild3rd.CurrentBalance = closingBalance3rd;
            singlechild3rd.ledgerdata = ledgerdettailschild3rd;

            //#region Forth Level
            let child4thlevel = [];

            let findnes4th = allgroupsglobal.filter((a) => a.groupParent == child3rd.id);
            findnes4th.map(async (child4th) => {
              let singlechild4th = new AllGroupViewEntity();
              singlechild4th.id = child4th.id;
              singlechild4th.groupIdentifier = child4th.groupIdentifier;
              singlechild4th.groupName = child4th.groupName;
              singlechild4th.groupParent = child4th.groupParent;
              singlechild4th.nature = child4th.nature;
              singlechild4th.TotalExpense = 0;
              singlechild4th.TotalDeposit = 0;

              let allLedgerchild4th = allledgersglobal.filter((a) => a.ledgerParent == child4th.id);

              let ledgerdettailschild4th = [];

              allLedgerchild4th.map(async (ledgerchild4th) => {
                let singleleddatachild4th = new ChartLedgerViewModel();
                singleleddatachild4th.ledgerdata = ledgerchild4th;
                singleleddatachild4th.TotalExpense = 1;
                if (ledgerchild4th.Name == "Profit & Loss Account") {
                  let totalpurchase = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.pqty), 0);
                  let totalsales = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgSalesRate) * Number(currentValue.sqty), 0);
                  let totalclosing = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.remaningqty), 0);
                  let totalprofit = Number(totalsales) - (Number(totalpurchase) - Number(totalclosing)) - Number(totalexpense);

                  singleleddatachild4th.TotalDeposit = totalprofit;
                } else {
                  singleleddatachild4th.TotalDeposit = Number(ledgerchild4th.closingBalance);
                }

                ledgerdettailschild4th.push(singleleddatachild4th);
              });

              let closingBalance4th = await this.CalculateParentExpense(child4th.id);

              singlechild4th.CurrentBalance = Number(closingBalance4th);
              singlechild4th.ledgerdata = ledgerdettailschild4th;
              child4thlevel.push(singlechild4th);
            });

            singlechild3rd.childs = child4thlevel;
            childs3rdlevel.push(singlechild3rd);

            //#endregion
          });
          //#endregion

          //singlechild2nd.childs = childs3rdlevel;
          singlechild2nd.childs = childs3rdlevel;
          childs2ndlevel.push(singlechild2nd);
        });
        //#endregion

        single.childs = childs2ndlevel;

        allg.push(single);
      })
    );

    return allg;
  }

  async CalculateParentExpense(parentid) {
    let allledgers = [];

    try {
      let allLedger = allledgersglobal.filter((a) => a.ledgerParent == parentid);
      if (allLedger.length > 0) {
        allledgers.push.apply(allledgers, allLedger);
      }
      if (allgroupsglobal.length > 0) {
        let allGrpData = allgroupsglobal.filter((Product) => Product.groupParent == parentid);

        if (allGrpData.length > 0) {
          allGrpData.forEach((group) => {
            let alchildledgers = allledgersglobal.filter((a) => a.ledgerParent == group.id);
            if (alchildledgers.length > 0) {
              allledgers.push.apply(allledgers, alchildledgers);
            }

            let findchildgroups = allgroupsglobal.filter((Product) => Product.groupParent == group.id);
            if (findchildgroups.length > 0) {
              findchildgroups.forEach((cProduct) => {
                let alchildnledgers = allledgersglobal.filter((a) => a.ledgerParent == cProduct.id);
                if (alchildnledgers.length > 0) {
                  allledgers.push.apply(allledgers, alchildnledgers);
                }

                const findchildngroups = allgroupsglobal.filter((Product) => Product.groupParent == cProduct.id);

                if (findchildngroups.length > 0) {
                  findchildngroups.forEach((cnProduct) => {
                    let alchildnnledgers = allledgersglobal.filter((a) => a.ledgerParent == cnProduct.id);
                    if (alchildnnledgers.length > 0) {
                      allledgers.push.apply(allledgers, alchildnnledgers);
                    }
                    let findchildnbgroups = allgroupsglobal.filter((Product) => Product.groupParent == cnProduct.id);
                    if (findchildnbgroups.length > 0) {
                      findchildnbgroups.forEach((cnnProduct) => {
                        let alchildnnnledgers = allledgersglobal.filter((a) => a.ledgerParent == cnnProduct.id);
                        if (alchildnnnledgers.length > 0) {
                          allledgers.push.apply(allledgers, alchildnnnledgers);
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }

        let currentbalancelocal = 0.0;

        if (allledgers.length > 0) {
          allledgers.forEach((led) => {
            if (led.Name == "Profit & Loss Account") {
              let totalpurchase = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.pqty), 0);
              let totalsales = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgSalesRate) * Number(currentValue.sqty), 0);
              let totalclosing = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.remaningqty), 0);
              let expensetrans = alltransactionhistory.filter((a) => a.transactionSource == "Expense");
              let totalprofit = Number(totalsales) - (Number(totalpurchase) - Number(totalclosing)) - Number(totalexpense);
              currentbalancelocal = Number(currentbalancelocal) + Number(totalprofit);
            } else {
              currentbalancelocal = Number(currentbalancelocal) + Number(led.closingBalance);
            }
          });
        }

        return currentbalancelocal;
      }
    } catch (e) {
      return 0;
    }
  }

  //#endregion

  //#region Previouscode
  //async chartOfAccount(ipClientPayload: any, userPayload: UserInterface) {
  //    allgroupsglobal = [];
  //    allledgersglobal = [];

  //    allgroupsglobal = await this.accountingGroupRepository.find({
  //        where: {
  //            status: StatusField.ACTIVE,
  //            //organizationId: null
  //        }
  //    });

  //    if (allgroupsglobal.length > 0) {
  //        const allLedger = await this.ledgerRepository.find({
  //            where: {
  //                status: StatusField.ACTIVE,
  //                //organizationId: userPayload.organizationId
  //            }
  //        });

  //        if (allLedger.length > 0) {
  //            allledgersglobal.push.apply(allledgersglobal, allLedger);
  //        }
  //    }
  //    const allg = [];
  //    allstockglobal = await this.stockHistoryEntityRepository.find({ relations: ['product'] });
  //    //First Level
  //    let maingroups = allgroupsglobal.filter((a) => a.groupParent == null);
  //    await Promise.all(
  //        maingroups.map(async (group) => {
  //            let single = new AllGroupViewEntity();
  //            single.id = group.id;
  //            single.groupIdentifier = group.groupIdentifier;
  //            single.groupName = group.groupName;
  //            single.groupParent = group.groupParent;
  //            single.nature = group.nature;
  //            single.TotalExpense = 0;
  //            single.TotalDeposit = 0;

  //            let allLedger = allledgersglobal.filter(
  //                (a) => a.ledgerParent == group.id
  //            );

  //            let ledgerdettails = [];

  //            allLedger.map(async (ledger) => {
  //                let singleleddata = new ChartLedgerViewModel();
  //                singleleddata.ledgerdata = ledger;

  //                if (ledger.LedgerType == "Stock") {
  //                    let currentstock = allstockglobal.filter(a => a.Product.ledgerId == ledger.id)[0];

  //                    singleleddata.TotalDeposit = currentstock.remaningqty * currentstock.avgPurchaseRate;
  //                    singleleddata.TotalExpense = currentstock.avgPurchaseRate;
  //                }
  //                else {
  //                    singleleddata.TotalExpense = 1;
  //                    singleleddata.TotalDeposit = Number(ledger.closingBalance);
  //                }

  //                ledgerdettails.push(singleleddata);
  //            });

  //            single.CurrentBalance = await this.CalculateParentExpense(group.id);

  //            single.ledgerdata = ledgerdettails;

  //            //#region Second Level

  //            let childs2ndlevel = [];

  //            let findnes2nd = allgroupsglobal.filter((a) => a.groupParent == group.id);

  //            findnes2nd.map(async (child2nd) => {
  //                let singlechild2nd = new AllGroupViewEntity();
  //                singlechild2nd.id = child2nd.id;
  //                singlechild2nd.groupIdentifier = child2nd.groupIdentifier;
  //                singlechild2nd.groupName = child2nd.groupName;
  //                singlechild2nd.groupParent = child2nd.groupParent;
  //                singlechild2nd.nature = child2nd.nature;
  //                singlechild2nd.TotalExpense = 0;
  //                singlechild2nd.TotalDeposit = 0;

  //                let allLedgerchild2nd = allledgersglobal.filter(
  //                    (a) => a.ledgerParent == child2nd.id
  //                );

  //                let ledgerdettailschild2nd = [];

  //                allLedgerchild2nd.map(async (ledgerchild2nd) => {
  //                    let singleleddatachild2nd = new ChartLedgerViewModel();

  //                    if (ledgerchild2nd.LedgerType == "Stock") {
  //                        let currentstock = allstockglobal.filter(a => a.Product.ledgerId == ledgerchild2nd.id)[0];

  //                        singleleddatachild2nd.TotalDeposit = currentstock.remaningqty * currentstock.avgPurchaseRate;
  //                        singleleddatachild2nd.TotalExpense = currentstock.avgPurchaseRate;
  //                    }
  //                    else {
  //                        singleleddatachild2nd.TotalExpense = 1;
  //                        singleleddatachild2nd.TotalDeposit = Number(ledgerchild2nd.closingBalance);
  //                    }

  //                    ledgerdettailschild2nd.push(singleleddatachild2nd);
  //                });

  //                let closingBalance2nd = await this.CalculateParentExpense(
  //                    child2nd.id
  //                );

  //                singlechild2nd.CurrentBalance = closingBalance2nd;
  //                singlechild2nd.ledgerdata = ledgerdettailschild2nd;

  //                //#region Third Level
  //                let childs3rdlevel = [];
  //                let findnes3rd = allgroupsglobal.filter(
  //                    (a) => a.groupParent == child2nd.id
  //                );
  //                findnes3rd.map(async (child3rd) => {
  //                    let singlechild3rd = new AllGroupViewEntity();
  //                    singlechild3rd.id = child3rd.id;
  //                    singlechild3rd.groupIdentifier = child3rd.groupIdentifier;
  //                    singlechild3rd.groupName = child3rd.groupName;
  //                    singlechild3rd.groupParent = child3rd.groupParent;
  //                    singlechild3rd.nature = child3rd.nature;
  //                    singlechild3rd.TotalExpense = 0;
  //                    singlechild3rd.TotalDeposit = 0;

  //                    let allLedgerchild3rd = allledgersglobal.filter(
  //                        (a) => a.ledgerParent == child3rd.id
  //                    );

  //                    let ledgerdettailschild3rd = [];

  //                    allLedgerchild3rd.map(async (ledgerchild3rd) => {
  //                        let singleleddatachild3rd = new ChartLedgerViewModel();
  //                        singleleddatachild3rd.ledgerdata = ledgerchild3rd;

  //                        if (ledgerchild3rd.LedgerType == "Stock") {
  //                            let currentstock = allstockglobal.filter(a => a.Product.ledgerId == ledgerchild3rd.id)[0];

  //                            singleleddatachild3rd.TotalDeposit = currentstock.remaningqty * currentstock.avgPurchaseRate;
  //                            singleleddatachild3rd.TotalExpense = currentstock.avgPurchaseRate;
  //                        }
  //                        else {
  //                            singleleddatachild3rd.TotalExpense = 1;
  //                            singleleddatachild3rd.TotalDeposit = Number(ledgerchild3rd.closingBalance);
  //                        }

  //                        ledgerdettailschild3rd.push(singleleddatachild3rd);
  //                    });

  //                    let closingBalance3rd = await this.CalculateParentExpense(
  //                        child3rd.id
  //                    );

  //                    singlechild3rd.CurrentBalance = closingBalance3rd;
  //                    singlechild3rd.ledgerdata = ledgerdettailschild3rd;

  //                    //#region Forth Level
  //                    let child4thlevel = [];

  //                    let findnes4th = allgroupsglobal.filter(
  //                        (a) => a.groupParent == child3rd.id
  //                    );
  //                    findnes4th.map(async (child4th) => {
  //                        let singlechild4th = new AllGroupViewEntity();
  //                        singlechild4th.id = child4th.id;
  //                        singlechild4th.groupIdentifier = child4th.groupIdentifier;
  //                        singlechild4th.groupName = child4th.groupName;
  //                        singlechild4th.groupParent = child4th.groupParent;
  //                        singlechild4th.nature = child4th.nature;
  //                        singlechild4th.TotalExpense = 0;
  //                        singlechild4th.TotalDeposit = 0;

  //                        let allLedgerchild4th = allledgersglobal.filter(
  //                            (a) => a.ledgerParent == child4th.id
  //                        );

  //                        let ledgerdettailschild4th = [];

  //                        allLedgerchild4th.map(async (ledgerchild4th) => {
  //                            let singleleddatachild4th = new ChartLedgerViewModel();
  //                            singleleddatachild4th.ledgerdata = ledgerchild4th;

  //                            if (ledgerchild4th.LedgerType == "Stock") {
  //                                let currentstock = allstockglobal.filter(a => a.Product.ledgerId == ledgerchild4th.id)[0];

  //                                singleleddatachild4th.TotalDeposit = currentstock.remaningqty * currentstock.avgPurchaseRate;
  //                                singleleddatachild4th.TotalExpense = currentstock.avgPurchaseRate;
  //                            }
  //                            else {
  //                                singleleddatachild4th.TotalExpense = 1;
  //                                singleleddatachild4th.TotalDeposit = Number(ledgerchild4th.closingBalance);
  //                            }

  //                            ledgerdettailschild4th.push(singleleddatachild4th);
  //                        });

  //                        let closingBalance4th = await this.CalculateParentExpense(
  //                            child4th.id
  //                        );

  //                        singlechild4th.CurrentBalance = Number(closingBalance4th);
  //                        singlechild4th.ledgerdata = ledgerdettailschild4th;
  //                        child4thlevel.push(singlechild4th);
  //                    });

  //                    singlechild3rd.childs = child4thlevel;
  //                    childs3rdlevel.push(singlechild3rd);

  //                    //#endregion
  //                });
  //                //#endregion

  //                //singlechild2nd.childs = childs3rdlevel;
  //                singlechild2nd.childs = childs3rdlevel;
  //                childs2ndlevel.push(singlechild2nd);
  //            });
  //            //#endregion

  //            single.childs = childs2ndlevel;

  //            allg.push(single);
  //        })
  //    );

  //    return allg;
  //}

  //async CalculateParentExpense(parentid) {
  //    let allledgers = [];

  //    try {
  //        let allLedger = allledgersglobal.filter(
  //            (a) => a.ledgerParent == parentid
  //        );
  //        if (allLedger.length > 0) {
  //            allledgers.push.apply(allledgers, allLedger);
  //        }
  //        if (allgroupsglobal.length > 0) {
  //            let allGrpData = allgroupsglobal.filter(Product => Product.groupParent == parentid);

  //            if (allGrpData.length > 0) {
  //                allGrpData.forEach((group) => {
  //                    let alchildledgers = allledgersglobal.filter(
  //                        (a) => a.ledgerParent == group.id
  //                    );
  //                    if (alchildledgers.length > 0) {
  //                        allledgers.push.apply(allledgers, alchildledgers);
  //                    }

  //                    let findchildgroups = allgroupsglobal.filter(
  //                        (Product) => Product.groupParent == group.id
  //                    );
  //                    if (findchildgroups.length > 0) {
  //                        findchildgroups.forEach((cProduct) => {
  //                            let alchildnledgers = allledgersglobal.filter(
  //                                (a) => a.ledgerParent == cProduct.id
  //                            );
  //                            if (alchildnledgers.length > 0) {
  //                                allledgers.push.apply(allledgers, alchildnledgers);
  //                            }

  //                            const findchildngroups = allgroupsglobal.filter(
  //                                (Product) => Product.groupParent == cProduct.id
  //                            );

  //                            if (findchildngroups.length > 0) {
  //                                findchildngroups.forEach((cnProduct) => {
  //                                    let alchildnnledgers = allledgersglobal.filter(
  //                                        (a) => a.ledgerParent == cnProduct.id
  //                                    );
  //                                    if (alchildnnledgers.length > 0) {
  //                                        allledgers.push.apply(allledgers, alchildnnledgers);
  //                                    }
  //                                    let findchildnbgroups = allgroupsglobal.filter(
  //                                        (Product) => Product.groupParent == cnProduct.id
  //                                    );
  //                                    if (findchildnbgroups.length > 0) {
  //                                        findchildnbgroups.forEach((cnnProduct) => {
  //                                            let alchildnnnledgers = allledgersglobal.filter(
  //                                                (a) => a.ledgerParent == cnnProduct.id
  //                                            );
  //                                            if (alchildnnnledgers.length > 0) {
  //                                                allledgers.push.apply(allledgers, alchildnnnledgers);
  //                                            }
  //                                        });
  //                                    }
  //                                });
  //                            }
  //                        });
  //                    }
  //                });
  //            }

  //            let currentbalancelocal = 0.0;

  //            if (allledgers.length > 0) {
  //                allledgers.forEach((led) => {

  //                    if (led.LedgerType == "Stock") {
  //                        let currentstock = allstockglobal.filter(a => a.Product.ledgerId == led.id)[0];
  //                        currentbalancelocal = Number(currentbalancelocal) + Number(currentstock.remaningqty) * Number(currentstock.avgPurchaseRate);
  //                    }
  //                    else {
  //                        currentbalancelocal = Number(currentbalancelocal) + Number(led.closingBalance);
  //                    }
  //                });
  //            }

  //            return currentbalancelocal;
  //        }
  //    } catch (e) {
  //        return 0;
  //    }
  //}
  //#endregion

  // Sales History

  // async SalesHistory(salesBody: SalesInterface, queryRunner: QueryRunner) {
  //     try {
  //         const stockledger = await queryRunner.manager.findOne(ProductsEntity, { where: { id: salesBody.currencyId } }
  //         );
  //         let stockBody = {
  //             ledgerId: stockledger.ledger.id,
  //             transactionDate: new Date(),
  //             amount: salesBody.amount,
  //             transactionId: salesBody.transId,
  //             transactionSource: "Invoice",
  //             referenceId: salesBody.invoiceId,
  //             userId: salesBody.userId,
  //             organizationId: salesBody.organizationId,
  //             remarks: "Stockout- " + salesBody.amount,
  //             transactionReference: salesBody.invoiceNo
  //         };

  //         const transaction = this.AddTransactionsStockCredit(stockBody, queryRunner);
  //         if (transaction) return true;

  //         return false;
  //     } catch (e) {
  //         return false;
  //     }
  // }

  // // purchase history

  // async purchaseHistory(transactionBody: any, queryRunner: QueryRunner) {
  //     const stockledger = await queryRunner.manager.findOne(ProductsEntity, { where: { id: transactionBody.currencyId } });

  //     let stockBody = {
  //         ledgerId: stockledger.ledger.id,
  //         transactionDate: new Date(),
  //         amount: transactionBody.amount,
  //         transactionId: transactionBody.transactionId,
  //         transactionSource: "Purchase",
  //         invoiceId: transactionBody.id,
  //         userId: transactionBody.id,
  //         remarks: "purchase " + transactionBody.amount,
  //         transactionReference: transactionBody.billNo
  //     };

  //     const transaction = this.AddTransactionsStockDebit(stockBody, queryRunner);
  //     if (transaction) return true;

  //     return false;
  // }

  // //Profit and Loss History
  // async ProfitandLossHistory(transactionBody: ProfitandLossInterface, queryRunner: QueryRunner) {
  //     try {
  //         //#region PL History
  //         const lastSales = await queryRunner.manager.find(ProfitandLossHistoryEntity, {
  //             where: { organizationId: transactionBody.organizationId }, order: { id: "DESC" }
  //         })[0];

  //         let salesHistory = new ProfitandLossHistoryEntity();

  //         salesHistory.plDate = transactionBody.tranDate;

  //         let lastBalance;

  //         if (lastSales) {
  //             lastBalance = lastSales.currentBalance;
  //             salesHistory.lastBalance = lastSales.currentBalance;
  //         } else {
  //             lastBalance = 0;

  //             salesHistory.lastBalance = 0;
  //         }

  //         salesHistory.transactionAmount = 0;

  //         salesHistory.transactionAmount = transactionBody.amount;
  //         salesHistory.currentBalance = transactionBody.amount + lastBalance;
  //         console.log(salesHistory, 'salesHistory');

  //         await queryRunner.manager.save(ProfitandLossHistoryEntity, salesHistory);

  //         return true;
  //         //#endregion
  //     } catch (ex) {
  //         return false;
  //     }
  // }

  // CheckLastTransactionDebitAdd

  async CheckLastTransactionDebitUpdate(transactionReference: string, transactionDate: Date, queryRunner: QueryRunner) {
    try {
      // Finding Same Day transactions
      lasttransactiononthisday = debittransactionHistories
        .filter((a) => a.transactionDate == transactionDate && a.transactionSource != "Opening Balance")
        .sort((a, b) => {
          return b.transactionId - a.transactionId;
        })
        .sort((a, b) => {
          return b.transactionReference.localeCompare(a.transactionReference);
        });
      lasttransactiononthisday = lasttransactiononthisday.filter((a) => a.transactionReference != "");
      if (lasttransactiononthisday.length > 0) {
        // Finding Same Type or Same Source transactions
        lasttransactiononthisdayfind = lasttransactiononthisday
          .filter((a) => a.transactionReference.slice(0, 2) == transactionReference.slice(0, 2))
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          })[0];
        if (lasttransactiononthisdayfind) {
          // Checking Updated Transaction is less or greater
          if (lasttransactiononthisdayfind[0].transactionReference.localeCompare(transactionReference) < 0) {
            lasttransactiononthisdata = lasttransactiononthisdayfind;
          } else {
            lasttransactiononthisdata = lasttransactiononthisday
              .filter((a) => a.transactionReference.localeCompare(transactionReference) < 0)
              .sort((a, b) => {
                return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
              })
              .sort((a, b) => {
                return b.transactionReference.localeCompare(a.transactionReference);
              })[0];
            if (lasttransactiononthisdata == null) {
              lasttransactionbefore = debittransactionHistories
                .filter((a) => a.transactionDate < transactionDate)
                .sort((a, b) => {
                  return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
                })
                .sort((a, b) => {
                  return b.transactionReference.localeCompare(a.transactionReference);
                })[0];
              lasttransactiononthisdata = lasttransactionbefore;
            }
          }
        } else {
          organizedataasorder = lasttransactiononthisday
            .filter((a) => a.transactionReference.slice(0, 2).localeCompare(transactionReference.slice(0, 2)) < 0)
            .sort((a, b) => {
              return b.transactionReference.localeCompare(a.transactionReference);
            })[0];
          if (organizedataasorder) lasttransactiononthisdata = organizedataasorder;
          else {
            lasttransactiononthisdata = debittransactionHistories
              .filter((a) => a.transactionDate < transactionDate)
              .sort((a, b) => {
                return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
              })
              .sort((a, b) => {
                return b.transactionReference.localeCompare(a.transactionReference);
              })[0];
            if (lasttransactiononthisdata == null) {
              lasttransactiononthisdata = null;
            }
          }
        }

        aftertransactionhistroyfindings = lasttransactiononthisday
          .filter((a) => a.transactionReference.slice(0, 2).localeCompare(transactionReference.slice(0, 2)) > 0 || a.transactionReference.localeCompare(transactionReference) > 0)
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          })[0];
        if (aftertransactionhistroyfindings) {
          checkdebittransactiononthisdata = aftertransactionhistroyfindings;
        } else {
          transactionhistroyafter = debittransactionHistories
            .filter((a) => a.transactionDate > transactionDate)
            .sort((a, b) => {
              return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
            })
            .sort((a, b) => {
              return a.transactionReference.localeCompare(b.transactionReference);
            })[0];
          if (transactionhistroyafter) {
            checkdebittransactiononthisdata = transactionhistroyafter;
          } else checkdebittransactiononthisdata = null;
        }
      } else {
        lasttransactionbefore = debittransactionHistories
          .filter((a) => a.transactionDate < transactionDate)
          .sort((a, b) => {
            return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
          })
          .sort((a, b) => {
            return a.transactionReference.localeCompare(b.transactionReference);
          })[0];
        if (lasttransactionbefore) lasttransactiononthisdata = lasttransactionbefore;
        else lasttransactiononthisdata = null;

        transactionhistroyafter = debittransactionHistories
          .filter((a) => a.transactionDate > transactionDate)
          .sort((a, b) => {
            return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
          })
          .sort((a, b) => {
            return a.transactionReference.localeCompare(b.transactionReference);
          })[0];
        if (transactionhistroyafter) checkdebittransactiononthisdata = transactionhistroyafter;
        else checkdebittransactiononthisdata = null;
      }

      return true;
    } catch (ex) {
      return false;
    }
  }

  // CheckLastTransactionDebitAdd

  async CheckLastTransactionCreditUpdate(transactionReference: string, transactionDate: Date, queryRunner: QueryRunner) {
    try {
      lasttransactiononthisday = debittransactionHistories
        .filter((a) => a.transactionDate == transactionDate && a.transactionSource != "Opening Balance")
        .sort((a, b) => {
          return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
        })
        .sort((a, b) => {
          return b.transactionReference.localeCompare(a.transactionReference);
        });
      lasttransactiononthisday = lasttransactiononthisday.filter((a) => a.transactionReference != "");
      if (lasttransactiononthisday.length > 0) {
        lasttransactiononthisdayfind = lasttransactiononthisday
          .filter((a) => a.transactionReference.slice(0, 2) == transactionReference.slice(0, 2))
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          })[0];
        if (lasttransactiononthisdayfind) {
          lasttransactiononthisdata = lasttransactiononthisdayfind;
        } else {
          organizedataasorder = lasttransactiononthisday
            .filter((a) => a.transactionReference.slice(0, 2).localeCompare(transactionReference.slice(0, 2)) < 0)
            .sort((a, b) => {
              return b.transactionReference.localeCompare(a.transactionReference);
            })[0];
          if (organizedataasorder) lasttransactiononthisdata = organizedataasorder;
          else {
            lasttransactiononthisdata = debittransactionHistories
              .filter((a) => a.transactionDate < transactionDate)
              .sort((a, b) => {
                return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
              })
              .sort((a, b) => {
                return b.transactionReference.localeCompare(a.transactionReference);
              })[0];
            if (lasttransactiononthisdata == null) {
              lasttransactiononthisdata = null;
            }
          }
        }

        aftertransactionhistroyfindings = lasttransactiononthisday
          .filter((a) => a.transactionReference.slice(0, 2).localeCompare(transactionReference.slice(0, 2)) > 0)
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          })[0];
        if (aftertransactionhistroyfindings) {
          checkdebittransactiononthisdata = aftertransactionhistroyfindings;
        } else {
          transactionhistroyafter = debittransactionHistories
            .filter((a) => a.transactionDate > transactionDate)
            .sort((a, b) => {
              return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
            })
            .sort((a, b) => {
              return a.transactionReference.localeCompare(b.transactionReference);
            })[0];
          if (transactionhistroyafter) {
            checkdebittransactiononthisdata = transactionhistroyafter;
          } else checkdebittransactiononthisdata = null;
        }
      } else {
        lasttransactionbefore = debittransactionHistories
          .filter((a) => a.transactionDate < transactionDate)
          .sort((a, b) => {
            return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
          })
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          })[0];
        if (lasttransactionbefore) lasttransactiononthisdata = lasttransactionbefore;
        else lasttransactiononthisdata = null;

        transactionhistroyafter = debittransactionHistories
          .filter((a) => a.transactionDate > transactionDate)
          .sort((a, b) => {
            return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
          })
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          })[0];
        if (transactionhistroyafter) checkdebittransactiononthisdata = transactionhistroyafter;
        else checkdebittransactiononthisdata = null;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  // CheckLastTransactionDebitAdd

  async CheckLastTransactionDebit(transactionReference: string, transactionDate: any, queryRunner: QueryRunner) {
    try {
      // Finding Same Day transactions
      lasttransactiononthisday = debittransactionHistories
        .filter((a) => a.transactionDate == transactionDate && a.transactionSource != "Opening Balance")
        .sort((a, b) => {
          return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
        })
        .sort((a, b) => {
          return b.transactionReference.localeCompare(a.transactionReference);
        });
      lasttransactiononthisday = lasttransactiononthisday.filter((a) => a.transactionReference != "");
      if (lasttransactiononthisday.length > 0) {
        // Finding Same Type or Same Source transactions
        lasttransactiononthisdayfind = lasttransactiononthisday
          .filter((a) => a.transactionReference.slice(0, 2) == transactionReference.slice(0, 2))
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          })[0];
        if (lasttransactiononthisdayfind) {
          // Checking Updated Transaction is less or greater
          lasttransactiononthisdata = lasttransactiononthisdayfind;
        } else {
          organizedataasorder = lasttransactiononthisday
            .filter((a) => a.transactionReference.slice(0, 2).localeCompare(transactionReference.slice(0, 2)) < 0)
            .sort((a, b) => {
              return b.transactionReference.localeCompare(a.transactionReference);
            })[0];
          if (organizedataasorder) lasttransactiononthisdata = organizedataasorder;
          else {
            lasttransactiononthisdata = debittransactionHistories
              .filter((a) => a.transactionDate < transactionDate)
              .sort((a, b) => {
                return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
              })
              .sort((a, b) => {
                return b.transactionReference.localeCompare(a.transactionReference);
              })[0];
            if (lasttransactiononthisdata == null) {
              lasttransactiononthisdata = null;
            }
          }
        }

        aftertransactionhistroyfindings = lasttransactiononthisday
          .filter((a) => a.transactionReference.slice(0, 2).localeCompare(transactionReference.slice(0, 2)) > 0 || a.transactionReference.localeCompare(transactionReference) > 0)
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          })[0];
        if (aftertransactionhistroyfindings) {
          checkdebittransactiononthisdata = aftertransactionhistroyfindings;
        } else {
          transactionhistroyafter = debittransactionHistories
            .filter((a) => a.transactionDate > transactionDate)
            .sort((a, b) => {
              return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
            })
            .sort((a, b) => {
              return a.transactionReference.localeCompare(b.transactionReference);
            })[0];
          if (transactionhistroyafter) {
            checkdebittransactiononthisdata = transactionhistroyafter;
          } else checkdebittransactiononthisdata = null;
        }
      } else {
        lasttransactionbefore = debittransactionHistories
          .filter((a) => a.transactionDate < transactionDate)
          .sort((a, b) => {
            return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
          })
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          })[0];
        if (lasttransactionbefore) lasttransactiononthisdata = lasttransactionbefore;
        else lasttransactiononthisdata = null;

        transactionhistroyafter = debittransactionHistories
          .filter((a) => a.transactionDate > transactionDate)
          .sort((a, b) => {
            return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
          })
          .sort((a, b) => {
            return a.transactionReference.localeCompare(b.transactionReference);
          })[0];
        if (transactionhistroyafter) checkdebittransactiononthisdata = transactionhistroyafter;
        else checkdebittransactiononthisdata = null;
      }

      return true;
    } catch (ex) {
      return false;
    }
  }

  async CheckLastTransactionCredit(transactionReference: string, transactionDate: any, queryRunner: QueryRunner) {
    try {
      // Finding Same Day transactions
      lasttransactiononthisday = credittransactionHistories
        .filter((a) => a.transactionDate == transactionDate && a.transactionSource != "Opening Balance")
        .sort((a, b) => {
          return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
        })
        .sort((a, b) => {
          return b.transactionReference.localeCompare(a.transactionReference);
        });
      lasttransactiononthisday = lasttransactiononthisday.filter((a) => a.transactionReference != "");
      if (lasttransactiononthisday.length > 0) {
        // Finding Same Type or Same Source transactions
        lasttransactiononthisdayfind = lasttransactiononthisday
          .filter((a) => a.transactionReference.slice(0, 2) == transactionReference.slice(0, 2))
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          })[0];
        if (lasttransactiononthisdayfind) {
          // Checking Updated Transaction is less or greater
          lastcredittransactiononthisdata = lasttransactiononthisdayfind;
        } else {
          organizedataasorder = lasttransactiononthisday
            .filter((a) => a.transactionReference.slice(0, 2).localeCompare(transactionReference.slice(0, 2)) < 0)
            .sort((a, b) => {
              return b.transactionReference.localeCompare(a.transactionReference);
            })[0];
          if (organizedataasorder) lastcredittransactiononthisdata = organizedataasorder;
          else {
            lastcredittransactiononthisdata = credittransactionHistories
              .filter((a) => a.transactionDate < transactionDate)
              .sort((a, b) => {
                return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
              })
              .sort((a, b) => {
                return b.transactionReference.localeCompare(a.transactionReference);
              })[0];
            if (lastcredittransactiononthisdata == null) {
              lastcredittransactiononthisdata = null;
            }
          }
        }

        aftertransactionhistroyfindings = lasttransactiononthisday
          .filter((a) => a.transactionReference.slice(0, 2).localeCompare(transactionReference.slice(0, 2)) > 0 || a.transactionReference.localeCompare(transactionReference) > 0)
          .sort((a, b) => {
            return a.transactionReference.localeCompare(b.transactionReference);
          })[0];
        if (aftertransactionhistroyfindings) {
          checkcredittransactiononthisdata = aftertransactionhistroyfindings;
        } else {
          transactionhistroyafter = credittransactionHistories
            .filter((a) => a.transactionDate > transactionDate)
            .sort((a, b) => {
              return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
            })
            .sort((a, b) => {
              return a.transactionReference.localeCompare(b.transactionReference);
            })[0];
          if (transactionhistroyafter) {
            checkcredittransactiononthisdata = transactionhistroyafter;
          } else checkcredittransactiononthisdata = null;
        }
      } else {
        lasttransactionbefore = credittransactionHistories
          .filter((a) => a.transactionDate < transactionDate)
          .sort((a, b) => {
            return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
          })
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          })[0];
        if (lasttransactionbefore) lastcredittransactiononthisdata = lasttransactionbefore;
        else lastcredittransactiononthisdata = null;

        transactionhistroyafter = credittransactionHistories
          .filter((a) => a.transactionDate > transactionDate)
          .sort((a, b) => {
            return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
          })
          .sort((a, b) => {
            return a.transactionReference.localeCompare(b.transactionReference);
          })[0];
        if (transactionhistroyafter) checkcredittransactiononthisdata = transactionhistroyafter;
        else checkcredittransactiononthisdata = null;
      }

      return true;
    } catch (ex) {
      return false;
    }
  }

  // CheckLastTransactionDebitAdd

  async checkLastTransactionDebitAdd(transactionReference: string, transactionDate: any, queryRunner: QueryRunner) {
    try {
      if (debittransactionHistories && debittransactionHistories.length > 1) {
        lasttransactiononthisday = debittransactionHistories
          .filter((a) => a.transactionDate == transactionDate && a.transactionSource != "Opening Balance")
          .sort((a, b) => {
            return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
          })
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          });

        lasttransactiononthisday = lasttransactiononthisday.filter((a) => a.transactionReference != "");
        if (lasttransactiononthisday.length > 0) {
          lasttransactiononthisdayfind = lasttransactiononthisday
            .filter((a) => a.transactionReference.slice(0, 2) == transactionReference.slice(0, 2))
            .sort((a, b) => {
              return b.transactionReference.localeCompare(a.transactionReference);
            })[0];
          if (lasttransactiononthisdayfind) {
            lasttransactiononthisdata = lasttransactiononthisdayfind;
          } else {
            //console.log(transactionReference.slice(0, 2), 'transactionReferencedsadasd.slice(0, 2)');
            //console.log("INV-212024-002".slice(0, 2).localeCompare(transactionReference.slice(0, 2)), 'transactionReferencedsadasd.slice(0, 2)');

            organizedataasorder = lasttransactiononthisday
              .filter((a) => a.transactionReference.slice(0, 2).localeCompare(transactionReference.slice(0, 2)) < 0)
              .sort((a, b) => {
                return b.transactionReference.localeCompare(a.transactionReference);
              })[0];
            if (organizedataasorder) lasttransactiononthisdata = organizedataasorder;
            else {
              lasttransactiononthisdata = debittransactionHistories
                .filter((a) => a.transactionDate < transactionDate)
                .sort((a, b) => {
                  return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
                })
                .sort((a, b) => {
                  return b.transactionReference.localeCompare(a.transactionReference);
                })[0];
              if (lasttransactiononthisdata == null) lasttransactiononthisdata = null;
            }
          }

          console.log(transactionReference.slice(0, 2), "transactionReferenced.slice(0, 2)");

          aftertransactionhistroyfindings = lasttransactiononthisday
            .filter((a) => a.transactionReference.slice(0, 2).localeCompare(transactionReference.slice(0, 2)) > 0 || a.TransactionReference.localeCompare(transactionReference.slice(0, 2)) > 0)
            .sort((a, b) => {
              return b.transactionReference.localeCompare(a.transactionReference);
            })[0];
          if (aftertransactionhistroyfindings) {
            checkdebittransactiononthisdata = aftertransactionhistroyfindings;
          } else {
            transactionhistroyafter = debittransactionHistories
              .filter((a) => a.transactionDate > transactionDate)
              .sort((a, b) => {
                return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
              })
              .sort((a, b) => {
                return b.transactionReference.localeCompare(a.transactionReference);
              })[0];
            if (transactionhistroyafter) checkdebittransactiononthisdata = transactionhistroyafter;
            else checkdebittransactiononthisdata = null;
          }
        } else {
          lasttransactionbefore = debittransactionHistories
            .filter((a) => a.transactionDate < transactionDate)
            .sort((a, b) => {
              return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
            })
            .sort((a, b) => {
              return b.transactionReference.localeCompare(a.transactionReference);
            })[0];
          if (lasttransactionbefore) lasttransactiononthisdata = lasttransactionbefore;
          else lasttransactiononthisdata = null;

          transactionhistroyafter = debittransactionHistories
            .filter((a) => a.transactionDate > transactionDate)
            .sort((a, b) => {
              return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
            })
            .sort((a, b) => {
              return b.transactionReference.localeCompare(a.transactionReference);
            })[0];
          if (transactionhistroyafter) checkdebittransactiononthisdata = transactionhistroyafter;
          else checkdebittransactiononthisdata = null;
        }
      } else {
        lastcredittransactiononthisdata = debittransactionHistories[0];
      }
      return true;
    } catch (e) {
      console.log("errrpr: " + e);
      return false;
    }
  }
  // checkLastTransactionCreditAdd

  async CheckLastTransactionCreditAdd(transactionReference: string, transactionDate: Date, queryRunner: QueryRunner) {
    try {
      /* console.log(credittransactionHistories, "credittransactionHistories")*/
      if (credittransactionHistories.length > 1) {
        lasttransactiononthisday = credittransactionHistories
          .filter((a) => a.transactionDate == transactionDate && a.transactionSource != "Opening Balance")
          .sort((a, b) => {
            return b.transactionId - a.transactionId;
          })
          .sort((a, b) => {
            return b.transactionReference.localeCompare(a.transactionReference);
          });

        lasttransactiononthisday = lasttransactiononthisday.filter((a) => a.transactionReference != "");

        if (lasttransactiononthisday.length > 0) {
          lasttransactiononthisdayfind = lasttransactiononthisday
            .filter((a) => a.transactionReference.slice(0, 2) == transactionReference.slice(0, 2))
            .sort((a, b) => {
              return b.transactionReference.localeCompare(a.transactionReference);
            })[0];

          if (lasttransactiononthisdayfind) {
            lastcredittransactiononthisdata = lasttransactiononthisdayfind;
          } else {
            organizedataasorder = lasttransactiononthisday
              .filter((a) => a.transactionReference.slice(0, 2).localeCompare(transactionReference.slice(0, 2)) < 0)
              .sort((a, b) => {
                return b.transactionReference.localeCompare(a.transactionReference);
              })[0];
            if (organizedataasorder) lastcredittransactiononthisdata = organizedataasorder;
            else {
              lastcredittransactiononthisdata = credittransactionHistories
                .filter((a) => a.transactionDate < transactionDate)
                .sort((a, b) => {
                  return b.transactionDate.toString().localeCompare(a.transactionDate);
                })
                .sort((a, b) => {
                  return b.transactionReference.localeCompare(a.transactionReference);
                })[0];
              if (lastcredittransactiononthisdata == null) lastcredittransactiononthisdata = null;
            }
          }

          aftertransactionhistroyfindings = lasttransactiononthisday
            .filter((a) => a.transactionReference.slice(0, 2).localeCompare(transactionReference.slice(0, 2)) > 0 || a.transactionReference.localeCompare(transactionReference.slice(0, 2)) > 0)
            .sort((a, b) => {
              return b.transactionReference.localeCompare(a.transactionReference);
            })[0];

          if (aftertransactionhistroyfindings) {
            checkcredittransactiononthisdata = aftertransactionhistroyfindings;
          } else {
            transactionhistroyafter = credittransactionHistories
              .filter((a) => a.transactionDate > transactionDate)
              .sort((a, b) => {
                return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
              })
              .sort((a, b) => {
                return b.transactionReference.localeCompare(a.transactionReference);
              })[0];
            if (transactionhistroyafter) checkcredittransactiononthisdata = transactionhistroyafter;
            else checkcredittransactiononthisdata = null;
          }
        } else {
          lasttransactionbefore = credittransactionHistories
            .filter((a) => a.transactionDate < transactionDate)
            .sort((a, b) => {
              return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
            })
            .sort((a, b) => {
              return b.transactionReference.localeCompare(a.transactionReference);
            })[0];
          if (lasttransactionbefore) lastcredittransactiononthisdata = lasttransactionbefore;
          else lastcredittransactiononthisdata = null;

          transactionhistroyafter = credittransactionHistories
            .filter((a) => a.transactionDate > transactionDate)
            .sort((a, b) => {
              return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
            })
            .sort((a, b) => {
              return b.transactionReference.localeCompare(a.transactionReference);
            })[0];
          if (transactionhistroyafter) checkcredittransactiononthisdata = transactionhistroyafter;
          else checkcredittransactiononthisdata = null;
        }
      } else {
        lastcredittransactiononthisdata = credittransactionHistories[0];
      }
      return true;
    } catch (e) {
      console.log("CheckLastTransactionCreditAdd: " + e);
      return false;
    }
  }

  // add transaction

  async addTransaction(transactionBody: AddTransactionInterface, queryRunner: QueryRunner) {
    transactionHistories = await queryRunner.manager.find(TransactionHistoryEntity, { where: { organizationId: transactionBody.organizationId }, relations: ["ledger"] });

    let checkafterdebit = true;

    const creditLedgerInfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: transactionBody.creditLedgerId, organizationId: transactionBody.organizationId } });

    // debit ledger part
    const debitLedgerInfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: transactionBody.debitLedgerId, organizationId: transactionBody.organizationId } });

    let debitNature = debitLedgerInfo.nature;
    let debitTransactiontype = "Dr";
    console.log("debitNature: ", debitNature);

    if (debitLedgerInfo) {
      // ledger adjustment
      debitLedgerInfo.openingBalance = Number(debitLedgerInfo.closingBalance);

      debitLedgerInfo.closingBalance =
        debitTransactiontype == debitNature
          ? Number(debitLedgerInfo.openingBalance) + Number(transactionBody.debitAmount)
          : Number(debitLedgerInfo.openingBalance) - Number(transactionBody.debitAmount);
      debitLedgerInfo.updatedAt = new Date();
      debitLedgerInfo.updatedBy = transactionBody.userId;

      await queryRunner.manager.update(
        AccountsEntity,
        {
          id: debitLedgerInfo.id,
          organizationId: transactionBody.organizationId
        },
        debitLedgerInfo
      );

      // transaction history

      const transactionHistory = new TransactionHistoryEntity();
      transactionHistory.transactionId = transactionBody.transactionId;
      transactionHistory.transactionDate = transactionBody.transactionDate;
      transactionHistory.transactionType = debitTransactiontype;
      transactionHistory.transactionSource = transactionBody.transactionSource;
      transactionHistory.transactionReference = transactionBody.transactionReference;
      transactionHistory.accountId = creditLedgerInfo.id;
      transactionHistory.remarks = transactionBody.remarks;
      transactionHistory.referenceID = transactionBody.referenceId;
      transactionHistory.debit = Number(transactionBody.debitAmount);
      transactionHistory.credit = 0;

      debittransactionHistories = transactionHistories.filter((e) => e.ledgerId == debitLedgerInfo.id);

      const checkDebit = await this.checkLastTransactionDebitAdd(transactionBody.transactionReference, transactionBody.transactionDate, queryRunner);

      if (checkDebit) {
        if (!checkdebittransactiononthisdata) {
          transactionHistory.openingBalance = Number(debitLedgerInfo.openingBalance);
          transactionHistory.closingBalance = Number(debitLedgerInfo.closingBalance);
        } else {
          if (lasttransactiononthisdata) {
            transactionHistory.openingBalance = Number(lasttransactiononthisdata.closingBalance);
            transactionHistory.closingBalance =
              debitTransactiontype == debitNature
                ? Number(transactionHistory.openingBalance) + Number(transactionBody.debitAmount)
                : Number(transactionHistory.openingBalance) - Number(transactionBody.debitAmount);
          } else {
            transactionHistory.openingBalance = Number(debitLedgerInfo.openingBalance);

            transactionHistory.closingBalance =
              debitTransactiontype == debitNature
                ? Number(transactionHistory.openingBalance) + Number(transactionBody.debitAmount)
                : Number(transactionHistory.openingBalance) - Number(transactionBody.debitAmount);
          }
        }

        transactionHistory.ledgerId = debitLedgerInfo.id;
        transactionHistory.createdAt = new Date();
        transactionHistory.updatedAt = new Date();
        transactionHistory.createdBy = transactionBody.userId;
        transactionHistory.organizationId = transactionBody.organizationId;
        transactionHistory.updatedBy = 0;
        transactionHistory.deletedBy = 0;

        await queryRunner.manager.save(TransactionHistoryEntity, transactionHistory);

        if (checkdebittransactiononthisdata) {
          const adjustTrasactionHistory = {
            trnxDate: transactionBody.transactionDate,
            ledgerId: debitLedgerInfo.id,
            openingBalance: transactionHistory.closingBalance,
            referenceCode: transactionBody.transactionReference
          };

          checkafterdebit = await this.AdjustTransactionHistoryAdd(adjustTrasactionHistory, queryRunner);
        }
      }
      // credit part
      const creditNature = creditLedgerInfo.nature;
      const creditTransactiontype = "Cr";
      if (creditLedgerInfo) {
        // ledger adjustment
        creditLedgerInfo.openingBalance = Number(creditLedgerInfo.closingBalance);
        creditLedgerInfo.closingBalance =
          creditTransactiontype == creditNature
            ? Number(creditLedgerInfo.openingBalance) + Number(transactionBody.creditAmount)
            : Number(creditLedgerInfo.openingBalance) - Number(transactionBody.creditAmount);
        creditLedgerInfo.updatedAt = new Date();
        creditLedgerInfo.updatedBy = transactionBody.userId;

        await queryRunner.manager.update(
          AccountsEntity,
          {
            id: creditLedgerInfo.id,
            organizationId: transactionBody.organizationId
          },
          creditLedgerInfo
        );

        // transaction history
        const transactionHistorycredit = new TransactionHistoryEntity();
        transactionHistorycredit.transactionId = transactionBody.transactionId;
        transactionHistorycredit.transactionDate = transactionBody.transactionDate;
        transactionHistorycredit.transactionType = creditTransactiontype;

        transactionHistorycredit.transactionSource = transactionBody.transactionSource;
        transactionHistorycredit.transactionReference = transactionBody.transactionReference;
        transactionHistorycredit.accountId = debitLedgerInfo.id;
        transactionHistorycredit.remarks = transactionBody.remarks;
        transactionHistorycredit.referenceID = transactionBody.referenceId;
        transactionHistorycredit.debit = 0;
        transactionHistorycredit.credit = Number(transactionBody.creditAmount);
        credittransactionHistories = transactionHistories.filter((e) => e.ledgerId == creditLedgerInfo.id);

        const checkCredit = await this.CheckLastTransactionCreditAdd(transactionBody.transactionReference, transactionBody.transactionDate, queryRunner);

        let closingBalance;
        if (checkCredit) {
          if (!checkcredittransactiononthisdata) {
            transactionHistorycredit.openingBalance = creditLedgerInfo.openingBalance;
            transactionHistorycredit.closingBalance = creditLedgerInfo.closingBalance;
            closingBalance = creditLedgerInfo.closingBalance;
          } else {
            if (lastcredittransactiononthisdata) {
              transactionHistorycredit.openingBalance = lastcredittransactiononthisdata.closingBalance;
              transactionHistorycredit.closingBalance =
                creditTransactiontype == creditNature
                  ? Number(transactionHistorycredit.openingBalance) + Number(transactionBody.creditAmount)
                  : Number(transactionHistorycredit.openingBalance) - Number(transactionBody.creditAmount);

              closingBalance =
                creditTransactiontype == creditNature
                  ? Number(transactionHistorycredit.openingBalance) + Number(transactionBody.creditAmount)
                  : Number(transactionHistorycredit.openingBalance) - Number(transactionBody.creditAmount);
            } else {
              transactionHistorycredit.openingBalance = creditLedgerInfo.accountOpeningBalance;

              transactionHistorycredit.closingBalance =
                creditTransactiontype == creditNature
                  ? Number(transactionHistorycredit.openingBalance) + Number(transactionBody.creditAmount)
                  : Number(transactionHistorycredit.openingBalance) - Number(transactionBody.creditAmount);

              closingBalance =
                creditTransactiontype == creditNature
                  ? Number(transactionHistorycredit.openingBalance) + Number(transactionBody.creditAmount)
                  : Number(transactionHistorycredit.openingBalance) - Number(transactionBody.creditAmount);
            }
          }
          transactionHistorycredit.ledgerId = creditLedgerInfo.id;
          transactionHistorycredit.createdAt = new Date();
          transactionHistorycredit.updatedAt = new Date();
          transactionHistorycredit.createdBy = transactionBody.userId;
          transactionHistorycredit.organizationId = transactionBody.organizationId;
          transactionHistorycredit.updatedBy = 0;
          transactionHistorycredit.deletedBy = 0;

          await queryRunner.manager.save(TransactionHistoryEntity, transactionHistorycredit);

          let checkaftercredit = true;
          if (checkcredittransactiononthisdata) {
            const adjustTrasactionHistory = {
              trnxDate: transactionBody.transactionDate,
              ledgerId: creditLedgerInfo.id,
              openingBalance: transactionHistorycredit.closingBalance,
              referenceCode: transactionBody.transactionReference
            };

            checkaftercredit = await this.AdjustTransactionHistoryAdd(adjustTrasactionHistory, queryRunner);
          }
          console.log("checkaftercredit: " + checkaftercredit);
          console.log("checkafterdebit: " + checkafterdebit);
          if (checkaftercredit && checkafterdebit) {
            return true;
          }
        }
      }
    }
  }

  // add transaction

  async AddTransactionsStockDebit(transactionBody: any, queryRunner: QueryRunner) {
    transactionHistories = await queryRunner.manager.find(TransactionHistoryEntity, { where: { organizationId: transactionBody.organizationId }, relations: ["ledger"] });

    try {
      let checkafterdebit = true;

      const debitLedgerInfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: transactionBody.ledgerId, organizationId: transactionBody.organizationId } });

      //#region Debit transaction

      let debitTransactiontype = "Dr";
      console.log("debitLedgerInfo: " + debitLedgerInfo.id);

      if (debitLedgerInfo) {
        const debitnature = debitLedgerInfo.nature;

        //#region Ledger Adjustment
        debitLedgerInfo.openingBalance = debitLedgerInfo.closingBalance;
        debitLedgerInfo.closingBalance =
          debitTransactiontype == debitnature ? Number(debitLedgerInfo.openingBalance) + Number(transactionBody.amount) : Number(debitLedgerInfo.closingBalance) - Number(transactionBody.amount);
        debitLedgerInfo.updatedAt = new Date();
        debitLedgerInfo.updatedBy = transactionBody.userId;

        await queryRunner.manager.update(AccountsEntity, { id: transactionBody.ledgerId }, debitLedgerInfo);
        console.log("debitLedgerInfo: " + debitLedgerInfo.id);

        console.log("------------------------------------------updateSingleLedger: ---------------------------------------------------------------");
        //#endregion

        //#region Transaction History
        const transactionHistory = new TransactionHistoryEntity();
        transactionHistory.transactionId = transactionBody.transactionId;
        transactionHistory.transactionDate = transactionBody.transactionDate;
        transactionHistory.transactionType = debitTransactiontype;
        transactionHistory.transactionSource = transactionBody.transactionSource;
        transactionHistory.transactionReference = transactionBody.transactionReference;
        transactionHistory.accountId = debitLedgerInfo.id;
        transactionHistory.remarks = transactionBody.remarks;
        transactionHistory.referenceID = transactionBody.referenceID;
        transactionHistory.debit = transactionBody.amount;
        transactionHistory.credit = 0;

        debittransactionHistories = transactionHistories.filter((e) => e.ledgerId == debitLedgerInfo.id);

        const checkdebit = await this.checkLastTransactionDebitAdd(transactionBody.transactionReference, transactionBody.transactionDate, queryRunner);
        console.log("------------------------------------------checkdebit: " + checkdebit + "---------------------------------------------------------------");
        if (checkdebit) {
          if (!checkdebittransactiononthisdata) {
            transactionHistory.openingBalance = debitLedgerInfo.openingBalance;
            transactionHistory.closingBalance = debitLedgerInfo.closingBalance;
          } else {
            if (lasttransactiononthisdata) {
              transactionHistory.openingBalance = lasttransactiononthisdata.closingBalance;
              transactionHistory.closingBalance =
                debitTransactiontype == debitnature ? Number(debitLedgerInfo.openingBalance) + Number(transactionBody.amount) : Number(debitLedgerInfo.openingBalance) - Number(transactionBody.amount);
            } else {
              transactionHistory.openingBalance = debitLedgerInfo.accountOpeningBalance;
              transactionHistory.closingBalance =
                debitTransactiontype == debitnature ? Number(debitLedgerInfo.openingBalance) + Number(transactionBody.amount) : Number(debitLedgerInfo.openingBalance) - Number(transactionBody.amount);
            }
          }

          transactionHistory.ledgerId = debitLedgerInfo.id;
          transactionHistory.createdAt = new Date();
          transactionHistory.updatedAt = new Date();
          transactionHistory.createdBy = transactionBody.userId;
          transactionHistory.organizationId = transactionBody.organizationId;
          transactionHistory.updatedBy = 0;
          transactionHistory.deletedBy = 0;

          await queryRunner.manager.save(TransactionHistoryEntity, transactionHistory);
          console.log("------------------------------------------transactionHistory: ---------------------------------------------------------------");
          if (checkdebittransactiononthisdata) {
            const adjustTrasactionHistory = {
              trnxDate: transactionBody.transactionDate,
              ledgerId: debitLedgerInfo.id,
              openingBalance: transactionHistory.closingBalance,
              referenceCode: transactionBody.transactionReference
            };

            checkafterdebit = await this.AdjustTransactionHistoryAdd(adjustTrasactionHistory, queryRunner);
          }
        }
        //#endregion
      }
      //#endregion
      if (checkafterdebit) {
        console.log("------------------------------------------transactionHistory: ---------------------------------------------------------------");
        return true;
      }
      return false;
    } catch (ex) {
      console.log("------------------------------------------ex: " + ex + "---------------------------------------------------------------");
      return false;
    }
  }

  // add transaction

  async AddTransactionsStockCredit(transactionStock: TransactionStock, queryRunner: QueryRunner) {
    transactionHistories = await queryRunner.manager.find(TransactionHistoryEntity, { where: { organizationId: transactionStock.organizationId }, relations: ["ledger"] });

    try {
      let creditnature = "";

      const creditLedgerInfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: transactionStock.ledgerId } });

      creditnature = creditLedgerInfo.nature;

      //#region Credit Transaction

      let creditTransactiontype = "Cr";

      if (creditLedgerInfo) {
        //#region Ledger Adjustment
        creditLedgerInfo.openingBalance = creditLedgerInfo.closingBalance;
        creditLedgerInfo.closingBalance =
          creditTransactiontype == creditnature ? Number(creditLedgerInfo.openingBalance) + Number(transactionStock.amount) : Number(creditLedgerInfo.openingBalance) - Number(transactionStock.amount);
        creditLedgerInfo.updatedAt = new Date();
        //creditLedgerInfo.user = transactionStock.userId;
        //transactionStock.queryRunner.

        await queryRunner.manager.update(AccountsEntity, { id: creditLedgerInfo.id }, creditLedgerInfo);

        const activelog = {
          cLientIPAddress: "local",
          browser: "chrome",
          os: "chrome",
          userId: 1,
          messageDetails: {
            tag: "updateSingleLedger",
            message: `updateSingleLedger`,
            date: new Date()
          },
          logData: creditLedgerInfo,
          organizationId: transactionStock.organizationId
        };

        await this.activityLogService.createLog(activelog, queryRunner);
        //#endregion

        //#region Transaction History
        const transactionHistory = new TransactionHistoryEntity();

        transactionHistory.transactionId = transactionStock.transactionId;
        transactionHistory.transactionDate = transactionStock.transactionDate;
        transactionHistory.transactionType = creditTransactiontype;
        transactionHistory.transactionSource = transactionStock.transactionSource;
        transactionHistory.transactionReference = transactionStock.transactionReference;
        transactionHistory.accountId = creditLedgerInfo.id;
        transactionHistory.remarks = transactionStock.remarks;
        transactionHistory.referenceID = transactionStock.referenceId;
        transactionHistory.debit = transactionStock.amount;
        transactionHistory.credit = 0;

        credittransactionHistories = transactionHistories.filter((e) => e.ledgerId == creditLedgerInfo.id);

        var checkcredit = await this.CheckLastTransactionCreditAdd(transactionStock.transactionReference, transactionStock.transactionDate, queryRunner);
        console.log("checkcredit: " + checkcredit);

        let closingBalance;
        if (checkcredit) {
          if (!checkcredittransactiononthisdata) {
            transactionHistory.openingBalance = creditLedgerInfo.openingBalance;
            transactionHistory.closingBalance = creditLedgerInfo.closingBalance;
            closingBalance = creditLedgerInfo.closingBalance;
          } else {
            if (lastcredittransactiononthisdata) {
              transactionHistory.openingBalance = creditLedgerInfo.closingBalance;
              transactionHistory.closingBalance =
                creditTransactiontype == creditnature
                  ? Number(creditLedgerInfo.openingBalance) + Number(transactionStock.amount)
                  : Number(creditLedgerInfo.openingBalance) - Number(transactionStock.amount);

              closingBalance = transactionHistory.closingBalance;
            } else {
              transactionHistory.openingBalance = creditLedgerInfo.accountOpeningBalance;
              transactionHistory.closingBalance =
                creditTransactiontype == creditnature
                  ? Number(creditLedgerInfo.openingBalance) + Number(transactionStock.amount)
                  : Number(creditLedgerInfo.openingBalance) - Number(transactionStock.amount);
              closingBalance = transactionHistory.closingBalance;
            }
          }

          transactionHistory.ledgerId = creditLedgerInfo.id;
          transactionHistory.createdAt = new Date();
          transactionHistory.updatedAt = new Date();
          transactionHistory.createdBy = transactionStock.userId;
          transactionHistory.organizationId = transactionStock.organizationId;
          transactionHistory.updatedBy = 0;
          transactionHistory.deletedBy = 0;

          await queryRunner.manager.save(TransactionHistoryEntity, transactionHistory);

          let checkaftercredit = true;
          console.log(closingBalance, "checkaftercredit: ");

          if (checkcredittransactiononthisdata) {
            const adjustTrasactionHistory = {
              trnxDate: transactionStock.transactionDate,
              ledgerId: creditLedgerInfo.id,
              openingBalance: closingBalance,
              referenceCode: transactionStock.transactionReference
            };

            checkaftercredit = await this.AdjustTransactionHistoryAdd(adjustTrasactionHistory, queryRunner);
          }
          console.log(checkcredittransactiononthisdata, "checkcredittransactiononthisdata: ");
          console.log(checkaftercredit, "checkaftercredit: ");
          if (checkaftercredit) {
            console.log(checkaftercredit, "checkaftercredit: ");
            return true;
          }
        }
        //#endregion
      }

      return false;
      //#endregion
    } catch (ex) {
      console.log("AddTransactionsStockCredit: " + ex);

      //Log.Fatal("log4net Fatal Level", ex);
      //OrganizationManagementAccountingDBAccess.AddLogReport(ex.ToString(), "OrganizationManagementAccountingTransactions", "BankAccountLedgerTransactions");
      return false;
    }
  }

  // get transaction history by transaction id

  async getTransactionHistoryByTid(did: number, cid: number, queryRunner: QueryRunner) {
    const debitTransationHistory = await queryRunner.manager.findOne(TransactionHistoryEntity, { where: { id: did } });
    const creditTransationHistory = await queryRunner.manager.findOne(TransactionHistoryEntity, { where: { id: cid } });

    const allTransactionHistory = await queryRunner.manager.find(TransactionHistoryEntity, {
      where: [{ ledgerId: debitTransationHistory.ledgerId }, { ledgerId: creditTransationHistory.ledgerId }],
      relations: ["ledger"]
    });

    return allTransactionHistory;
  }

  // add transaction

  async UpdateTransactions(transactionBody: UpdateTransactionInterface, queryRunner: QueryRunner) {
    transactionHistories = await this.getTransactionHistoryByTid(transactionBody.debitTransactionId, transactionBody.creditTransactionId, queryRunner);
    try {
      //#region Debit transaction
      const debitTransationHistory = await queryRunner.manager.findOne(TransactionHistoryEntity, {
        where: {
          id: transactionBody.debitTransactionId
        }
      });

      const debitinforamtion = await queryRunner.manager.findOne(AccountsEntity, { where: { id: debitTransationHistory.ledgerId } });

      let debitTransactionnature = "Dr";

      debitTransactionnature = debitinforamtion.nature;
      let debitTransactiontype = "Dr";
      let debitadjustment = true;
      console.log(debitinforamtion, "debitinforamtion");

      if (debitinforamtion) {
        //#region Ledger Adjustment
        debitinforamtion.openingBalance = debitinforamtion.closingBalance;
        debitinforamtion.closingBalance =
          debitTransactiontype == debitTransactionnature
            ? Number(debitinforamtion.openingBalance) + Number(transactionBody.debitAmount) - Number(debitTransationHistory.debit)
            : Number(debitinforamtion.openingBalance) - Number(transactionBody.debitAmount) + Number(debitTransationHistory.debit);
        //debitinforamtion.ClosingBalance = debitTransactiontype == debitledgerinfo.Nature ? debitinforamtion.OpeningBalance + DebitAmount : debitinforamtion.OpeningBalance - DebitAmount;
        debitinforamtion.updatedAt = new Date();
        debitinforamtion.updatedBy = transactionBody.userId;
        await queryRunner.manager.update(AccountsEntity, { id: debitinforamtion.id }, debitinforamtion);

        //#endregion

        //#region Transaction History

        if (debitTransationHistory) {
          //debittransactionhistory.transactionDate = transactionDate;
          debitTransationHistory.remarks = transactionBody.remarks;
          if (debitTransationHistory.debit != transactionBody.debitAmount) {
            debitTransationHistory.debit = transactionBody.debitAmount;
            debitTransationHistory.credit = 0;

            debittransactionHistories = transactionHistories.filter((a) => a.ledgerId == debitinforamtion.id && a.id != debitTransationHistory.id);
            const checkdebit = await this.CheckLastTransactionDebit(debitTransationHistory.transactionReference, transactionBody.transactionDate, queryRunner);
            console.log(checkdebit, "checkdebit");

            if (checkdebit) {
              debitTransationHistory.closingBalance =
                debitTransactiontype == debitTransactionnature
                  ? Number(debitTransationHistory.openingBalance) + Number(transactionBody.debitAmount)
                  : Number(debitTransationHistory.openingBalance) - Number(transactionBody.debitAmount);
              debitTransationHistory.updatedBy = transactionBody.userId;
              debitTransationHistory.updatedAt = new Date();
              let update = await queryRunner.manager.update(TransactionHistoryEntity, { id: debitTransationHistory.id }, debitTransationHistory);

              if (checkdebittransactiononthisdata) {
                let adjustTrasactionHistoryUpdate = {
                  trnxDate: transactionBody.transactionDate,
                  transactionId: transactionBody.debitTransactionId,
                  ledgerId: debitTransationHistory.ledgerId,
                  openingBalance: debitTransationHistory.closingBalance,
                  referenceCode: debitTransationHistory.transactionReference
                };

                debitadjustment = await this.AdjustTransactionHistoryUpdate(adjustTrasactionHistoryUpdate, queryRunner);
                console.log(debitadjustment, "debitadjustment");
              }
            }
          } else {
            debitTransationHistory.updatedBy = transactionBody.userId;
            debitTransationHistory.updatedAt = new Date();

            await queryRunner.manager.update(TransactionHistoryEntity, { id: debitTransationHistory.id }, debitTransationHistory);

            debitadjustment = true;
            console.log(debitadjustment, "debitadjustmentelse");
          }
        }

        //#endregion
      } else {
        console.log(debitadjustment, "debitadjustmentfalse");
        return false;
      }
      //#endregion
      //#region Credit Transaction
      var credittransactionhistory = await queryRunner.manager.findOne(TransactionHistoryEntity, {
        where: {
          id: transactionBody.creditTransactionId
        }
      });
      const creditledgerinfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: credittransactionhistory.ledgerId } });

      let creditTransactiontype = "Cr";
      let transactionnature = "";

      let creditadjustment = true;
      console.log(creditledgerinfo, "creditledgerinfo");
      if (creditledgerinfo) {
        transactionnature = creditledgerinfo.nature;

        //#region Ledger Adjustment
        creditledgerinfo.openingBalance = creditledgerinfo.closingBalance;
        creditledgerinfo.closingBalance =
          creditTransactiontype == transactionnature
            ? Number(creditledgerinfo.openingBalance) + Number(transactionBody.creditAmount) - Number(credittransactionhistory.credit)
            : Number(creditledgerinfo.openingBalance) - Number(transactionBody.creditAmount) + Number(credittransactionhistory.credit);
        //crditinfo.ClosingBalance = creditTransactiontype == creditledgerinfo.Nature ? crditinfo.OpeningBalance + CreditAmount : crditinfo.OpeningBalance - CreditAmount;
        creditledgerinfo.updatedAt = new Date();
        creditledgerinfo.updatedBy = transactionBody.userId;
        await queryRunner.manager.update(AccountsEntity, { id: creditledgerinfo.id }, creditledgerinfo);

        console.log(creditledgerinfo, "creditledgerinfo");

        //#endregion

        // #region Transaction History

        if (credittransactionhistory) {
          //credithistory.transactionDate = transactionDate;
          credittransactionhistory.remarks = transactionBody.remarks;
          if (credittransactionhistory.credit != transactionBody.creditAmount) {
            credittransactionhistory.debit = 0;
            credittransactionhistory.credit = transactionBody.creditAmount;

            credittransactionHistories = transactionHistories.filter((a) => a.ledgerId == creditledgerinfo.id && a.id != credittransactionhistory.id);

            var checkcredit = await this.CheckLastTransactionCredit(credittransactionhistory.transactionReference, transactionBody.transactionDate, queryRunner);

            if (checkcredit) {
              credittransactionhistory.closingBalance =
                creditTransactiontype == transactionnature
                  ? Number(credittransactionhistory.openingBalance) + Number(transactionBody.creditAmount)
                  : Number(credittransactionhistory.openingBalance) - Number(transactionBody.creditAmount);

              credittransactionhistory.ledgerId = creditledgerinfo.id;
              credittransactionhistory.updatedBy = transactionBody.userId;
              credittransactionhistory.updatedAt = new Date();
              await queryRunner.manager.update(
                TransactionHistoryEntity,
                {
                  id: credittransactionhistory.id
                },
                credittransactionhistory
              );

              if (checkcredittransactiononthisdata) {
                let adjustTrasactionHistoryUpdate = {
                  trnxDate: transactionBody.transactionDate,
                  transactionId: transactionBody.creditTransactionId,
                  ledgerId: credittransactionhistory.ledgerId,
                  openingBalance: credittransactionhistory.closingBalance,
                  referenceCode: credittransactionhistory.transactionReference
                };

                creditadjustment = await this.AdjustTransactionHistoryUpdate(adjustTrasactionHistoryUpdate, queryRunner);
                console.log(creditadjustment, "creditadjustment");
              }
            }
          } else {
            credittransactionhistory.updatedBy = transactionBody.userId;
            credittransactionhistory.updatedAt = new Date();
            await queryRunner.manager.update(
              TransactionHistoryEntity,
              {
                id: credittransactionhistory.id
              },
              credittransactionhistory
            );
            creditadjustment = true;
            console.log(creditadjustment, "creditadjustmentelse");
          }
        }

        //#endregion

        if (debitadjustment == true && creditadjustment == true) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } catch (ex) {
      //Log.Fatal("log4net Fatal Level", ex);
      //OrganizationManagementAccountingDBAccess.AddLogReport(ex.ToString(), "OrganizationManagementAccountingTransactions", "BankAccountLedgerTransactions");
      return false;
    }
  }

  // DeleteTransactions
  async DeleteTransactions(transactionBody: DeleteTransactionsInterface, queryRunner: QueryRunner) {
    transactionHistories = await this.getTransactionHistoryByTid(transactionBody.debitTransactionId, transactionBody.creditTransactionId, queryRunner);
    try {
      let debitnature = "";
      let creditnature = "";

      //#region Delete Debit transaction
      const debitTransationHistory = await queryRunner.manager.findOne(TransactionHistoryEntity, {
        where: {
          id: transactionBody.debitTransactionId
        }
      });

      const debitledgerinfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: debitTransationHistory.ledgerId } });

      let transactiontype = "Dr";
      var debitadjustmentremove = true;

      if (debitledgerinfo) {
        debitnature = debitledgerinfo.nature;

        debitledgerinfo.openingBalance = debitledgerinfo.closingBalance;
        debitledgerinfo.closingBalance =
          transactiontype == debitnature
            ? Number(debitledgerinfo.openingBalance) - Number(debitTransationHistory.debit)
            : Number(debitledgerinfo.openingBalance) + Number(debitTransationHistory.debit);
        debitledgerinfo.updatedAt = new Date();
        debitledgerinfo.updatedBy = transactionBody.userId;
        await queryRunner.manager.update(AccountsEntity, { id: debitledgerinfo.id }, debitledgerinfo);

        console.log("deletetransaction update success: ");
        let debittransactionhistory = await queryRunner.manager.findOne(TransactionHistoryEntity, {
          where: {
            id: debitTransationHistory.id
          }
        });
        if (debittransactionhistory) {
          let openingdebitbalance = 0.0;

          debittransactionHistories = transactionHistories.filter((a) => a.ledgerId == debitledgerinfo.id && a.id != debitTransationHistory.id);
          var checkdebit = await this.CheckLastTransactionDebit(debitTransationHistory.transactionReference, debitTransationHistory.transactionDate, queryRunner);
          if (checkdebit) {
            openingdebitbalance = debittransactionhistory.openingBalance;

            await queryRunner.manager.remove(TransactionHistoryEntity, debitTransationHistory);

            console.log("deletetransaction entity success: ");
            if (checkdebittransactiononthisdata) {
              let adjustTrasactionHistoryUpdate = {
                trnxDate: debitTransationHistory.transactionDate,
                transactionId: transactionBody.debitTransactionId,
                ledgerId: debitTransationHistory.ledgerId,
                openingBalance: openingdebitbalance,
                referenceCode: debittransactionhistory.transactionReference
              };

              debitadjustmentremove = await this.AdjustTransactionHistoryUpdate(adjustTrasactionHistoryUpdate, queryRunner);
            }
            console.log("deletetransaction entity success: ");
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
      console.log("debitadjustmentremove: ", debitadjustmentremove);

      //#endregion
      //#region Delete Credit transaction
      var credittransaction = await queryRunner.manager.findOne(TransactionHistoryEntity, {
        where: {
          id: transactionBody.creditTransactionId
        }
      });

      const creditledgerinfo = await queryRunner.manager.findOne(AccountsEntity, {
        where: {
          id: credittransaction.ledgerId
        }
      });

      let creditTransactiontype = "Cr";
      var creditadjustmentremove = true;

      if (creditledgerinfo) {
        creditnature = creditledgerinfo.nature;

        creditledgerinfo.openingBalance = creditledgerinfo.closingBalance;
        creditledgerinfo.closingBalance =
          creditTransactiontype == creditnature
            ? Number(creditledgerinfo.openingBalance) - Number(credittransaction.credit)
            : Number(creditledgerinfo.openingBalance) + Number(credittransaction.credit);
        creditledgerinfo.updatedAt = new Date();
        creditledgerinfo.updatedBy = transactionBody.userId;

        await queryRunner.manager.update(AccountsEntity, { id: creditledgerinfo.id }, creditledgerinfo);

        var credittransactionhistory = await queryRunner.manager.findOne(TransactionHistoryEntity, {
          where: {
            id: credittransaction.id
          }
        });
        if (credittransactionhistory) {
          let creditopeingbalance = 0.0;
          credittransactionHistories = transactionHistories.filter((a) => a.ledgerId == credittransaction.ledgerId && a.id != credittransaction.id);
          const checkcredit = await this.CheckLastTransactionCredit(credittransactionhistory.transactionReference, credittransactionhistory.transactionDate, queryRunner);
          if (checkcredit) {
            creditopeingbalance = credittransactionhistory.openingBalance;
            await queryRunner.manager.remove(TransactionHistoryEntity, credittransactionhistory);

            if (checkcredittransactiononthisdata) {
              let adjustTrasactionHistoryUpdate = {
                trnxDate: credittransactionhistory.transactionDate,
                transactionId: transactionBody.creditTransactionId,
                ledgerId: credittransactionhistory.ledgerId,
                openingBalance: creditopeingbalance,
                referenceCode: credittransactionhistory.transactionReference
              };

              creditadjustmentremove = await this.AdjustTransactionHistoryUpdate(adjustTrasactionHistoryUpdate, queryRunner);
            }

            console.log("creditadjustmentremove: ", creditadjustmentremove);
            if (debitadjustmentremove && creditadjustmentremove) {
              return true;
            }
          }
        }
      }

      return false;
      //#endregion
    } catch (ex) {
      //Log.Fatal("log4net Fatal Level", ex);
      console.log("deletetransaction: " + ex);
      //OrganizationManagementAccountingDBAccess.AddLogReport(ex.ToString(), "OrganizationManagementAccountingTransactions", "BankAccountLedgerTransactions");
      return false;
    }
  }

  // add transaction

  async UpdateDebitLedgerTransactions(transactionBody: UpdateLedgerTransactionInterface, queryRunner: QueryRunner) {
    transactionHistories = await queryRunner.manager.find(TransactionHistoryEntity, { where: { organizationId: transactionBody.organizationId }, relations: ["ledger"] });

    const transactionHst = await queryRunner.manager.findOne(TransactionHistoryEntity, {
      where: {
        id: transactionBody.trnasactionId
      }
    });

    // debit ledger part
    const debitLedgerInfo = await queryRunner.manager.findOne(AccountsEntity, {
      where: {
        id: transactionBody.ledgerId
      }
    });
    const debitNature = debitLedgerInfo.nature;
    const debitTransactiontype = "Dr";

    if (debitLedgerInfo) {
      // ledger adjustment
      debitLedgerInfo.openingBalance = debitLedgerInfo.closingBalance;
      debitLedgerInfo.closingBalance =
        debitTransactiontype == debitNature ? Number(debitLedgerInfo.openingBalance) - Number(transactionHst.debit) : Number(debitLedgerInfo.openingBalance) + Number(transactionHst.debit);
      debitLedgerInfo.updatedAt = new Date();
      debitLedgerInfo.updatedBy = transactionBody.userId;

      const test = await queryRunner.manager.update(AccountsEntity, { id: transactionBody.ledgerId }, debitLedgerInfo);
      console.log(test, "test");

      // transaction history
      debittransactionHistories = transactionHistories.filter((e) => {
        return e.ledgerId == debitLedgerInfo.id;
      });

      let previousledgeropning = 0.0;
      const checkDebit = await this.CheckLastTransactionDebit(transactionHst.transactionReference, transactionHst.transactionDate, queryRunner);

      if (checkDebit) {
        previousledgeropning = transactionHst.openingBalance;

        let adjustTrasactionHistoryUpdate = {
          trnxDate: transactionHst.transactionDate,
          transactionId: transactionHst.id,
          ledgerId: debitLedgerInfo.id,
          openingBalance: previousledgeropning,
          referenceCode: transactionHst.transactionReference
        };

        let preledger = await this.AdjustTransactionHistoryUpdate(adjustTrasactionHistoryUpdate, queryRunner);

        if (preledger) {
          let newDebitInfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: transactionBody.ledgerId } });
          if (newDebitInfo) {
            newDebitInfo.openingBalance = newDebitInfo.closingBalance;
            newDebitInfo.closingBalance =
              debitTransactiontype == newDebitInfo.nature
                ? Number(newDebitInfo.openingBalance) + Number(transactionBody.newAmount)
                : Number(newDebitInfo.openingBalance) - Number(transactionBody.newAmount);
            newDebitInfo.updatedAt = new Date();
            newDebitInfo.updatedBy = transactionBody.userId;
            await queryRunner.manager.update(AccountsEntity, { id: transactionBody.ledgerId }, newDebitInfo);

            let transactionHistory = await queryRunner.manager.findOne(TransactionHistoryEntity, {
              where: {
                id: transactionBody.trnasactionId
              }
            });
            console.log(transactionHistory, "transactionHistory");

            transactionHistory.id = transactionBody.trnasactionId;
            transactionHistory.transactionDate = transactionBody.trnasacitonDate;
            transactionHistory.debit = transactionBody.newAmount;
            transactionHistory.credit = 0;
            transactionHistory.ledgerId = newDebitInfo.id;
            debittransactionHistories = transactionHistories.filter((a) => a.ledgerId == newDebitInfo.id);

            const checkDebit1 = await this.CheckLastTransactionDebitUpdate(transactionHistory.transactionReference, transactionBody.trnasacitonDate, queryRunner);

            let closingBalance;
            if (checkDebit1) {
              if (!checkdebittransactiononthisdata) {
                transactionHistory.openingBalance = newDebitInfo.openingBalance;
                transactionHistory.closingBalance = newDebitInfo.closingBalance;
                closingBalance = newDebitInfo.closingBalance;
              } else {
                if (lasttransactiononthisdata) {
                  transactionHistory.openingBalance = lasttransactiononthisdata.closingBalance;
                  transactionHistory.closingBalance =
                    debitTransactiontype == debitNature
                      ? Number(transactionHistory.openingBalance) + Number(transactionBody.newAmount)
                      : Number(transactionHistory.openingBalance) - Number(transactionBody.newAmount);
                  closingBalance =
                    debitTransactiontype == debitNature
                      ? Number(transactionHistory.openingBalance) + Number(transactionBody.newAmount)
                      : Number(transactionHistory.openingBalance) - Number(transactionBody.newAmount);
                } else {
                  transactionHistory.openingBalance = newDebitInfo.accountOpeningBalance;

                  transactionHistory.closingBalance =
                    debitTransactiontype == debitNature
                      ? Number(transactionHistory.openingBalance) + Number(transactionBody.newAmount)
                      : Number(transactionHistory.openingBalance) - Number(transactionBody.newAmount);
                  closingBalance =
                    debitTransactiontype == debitNature
                      ? Number(transactionHistory.openingBalance) + Number(transactionBody.newAmount)
                      : Number(transactionHistory.openingBalance) - Number(transactionBody.newAmount);
                }
              }
              transactionHistory.updatedAt = new Date();
              transactionHistory.updatedBy = transactionBody.userId;
              const creditTran = await queryRunner.manager.findOne(TransactionHistoryEntity, {
                where: {
                  id: transactionHistory.id,
                  transactionType: "Cr"
                }
              });
              console.log(creditTran, "creditTran");
              console.log(transactionHistory, "transactionHistory");

              transactionHistory.accountId = creditTran ? creditTran.ledgerId : transactionHistory.accountId;
              console.log(transactionHistory, "transactionHistory");

              await queryRunner.manager.update(TransactionHistoryEntity, { id: transactionBody.trnasactionId }, transactionHistory);

              let debitadjustment = true;
              if (checkdebittransactiononthisdata) {
                let adjustTrasactionHistoryUpdate = {
                  trnxDate: transactionBody.trnasacitonDate,
                  transactionId: transactionBody.trnasactionId,
                  ledgerId: transactionBody.ledgerId,
                  openingBalance: transactionHistory.closingBalance,
                  referenceCode: transactionHistory.transactionReference
                };

                debitadjustment = await this.AdjustTransactionHistoryUpdate(adjustTrasactionHistoryUpdate, queryRunner);
              }
              if (debitadjustment) {
                return true;
              }
            }
          }
        }
      }
    }
  }

  // update credit ledger transaction

  async UpdateCreditLedgerTransactions(transactionBody: UpdateLedgerTransactionInterface, queryRunner: QueryRunner) {
    transactionHistories = await queryRunner.manager.find(TransactionHistoryEntity, { where: { organizationId: transactionBody.organizationId }, relations: ["ledger"] });

    const transactionHst = await queryRunner.manager.findOne(TransactionHistoryEntity, {
      where: {
        id: transactionBody.trnasactionId
      }
    });
    let checkafterdebit = true;

    const creditLedgerInfo = await queryRunner.manager.findOne(AccountsEntity, {
      where: {
        id: transactionBody.ledgerId
      }
    });

    // credit part
    const creditNature = creditLedgerInfo.nature;
    const creditTransactiontype = "Cr";
    if (creditLedgerInfo) {
      // ledger adjustment
      creditLedgerInfo.openingBalance = creditLedgerInfo.closingBalance;
      creditLedgerInfo.closingBalance =
        creditTransactiontype == creditNature ? Number(creditLedgerInfo.openingBalance) - Number(transactionHst.credit) : Number(creditLedgerInfo.openingBalance) + Number(transactionHst.credit);
      creditLedgerInfo.updatedAt = new Date();
      creditLedgerInfo.updatedBy = transactionBody.userId;
      await queryRunner.manager.update(AccountsEntity, { id: creditLedgerInfo.id }, creditLedgerInfo);

      // transaction history
      debittransactionHistories = transactionHistories.filter((e) => {
        return e.ledgerId == creditLedgerInfo.id;
      });

      let previousledgeropning = 0.0;
      const checkDebit = await this.CheckLastTransactionDebit(transactionHst.transactionReference, transactionHst.transactionDate, queryRunner);

      if (checkDebit) {
        previousledgeropning = transactionHst.openingBalance;

        let adjustTrasactionHistoryUpdate = {
          trnxDate: transactionHst.transactionDate,
          transactionId: transactionHst.id,
          ledgerId: creditLedgerInfo.id,
          openingBalance: previousledgeropning,
          referenceCode: transactionHst.transactionReference
        };

        let preledger = await this.AdjustTransactionHistoryUpdate(adjustTrasactionHistoryUpdate, queryRunner);

        if (preledger) {
          let creditInfoNew = await queryRunner.manager.findOne(AccountsEntity, { where: { id: transactionBody.ledgerId } });
          if (creditInfoNew) {
            creditInfoNew.openingBalance = creditLedgerInfo.closingBalance;
            creditInfoNew.closingBalance =
              creditTransactiontype == creditNature
                ? Number(creditInfoNew.openingBalance) + Number(transactionBody.newAmount)
                : Number(creditInfoNew.openingBalance) - Number(transactionBody.newAmount);
            creditInfoNew.updatedAt = new Date();
            creditInfoNew.updatedBy = transactionBody.userId;

            await queryRunner.manager.update(AccountsEntity, { id: creditInfoNew.id }, creditInfoNew);

            //  transaction history
            let credittransactionhistory = await queryRunner.manager.findOne(TransactionHistoryEntity, {
              where: {
                id: transactionBody.trnasactionId
              }
            });
            console.log(credittransactionhistory, "credittransactionhistory");

            credittransactionhistory.id = transactionBody.trnasactionId;
            credittransactionhistory.transactionDate = transactionBody.trnasacitonDate;
            credittransactionhistory.debit = 0;
            credittransactionhistory.credit = transactionBody.newAmount;
            credittransactionhistory.ledgerId = creditInfoNew.id;
            debittransactionHistories = transactionHistories.filter((a) => a.ledgerId == creditInfoNew.id);
            const checkDebit1 = await this.CheckLastTransactionDebitUpdate(credittransactionhistory.transactionReference, transactionBody.trnasacitonDate, queryRunner);

            if (checkDebit1) {
              if (!checkdebittransactiononthisdata) {
                credittransactionhistory.openingBalance = creditInfoNew.openingBalance;
                credittransactionhistory.closingBalance = creditInfoNew.closingBalance;
              } else {
                if (lasttransactiononthisdata) {
                  credittransactionhistory.openingBalance = lasttransactiononthisdata.closingBalance;
                  credittransactionhistory.closingBalance =
                    creditTransactiontype == creditNature
                      ? Number(credittransactionhistory.openingBalance) + Number(transactionBody.newAmount)
                      : Number(credittransactionhistory.openingBalance) - Number(transactionBody.newAmount);
                } else {
                  credittransactionhistory.openingBalance = creditInfoNew.accountOpeningBalance;

                  credittransactionhistory.closingBalance =
                    creditTransactiontype == creditNature
                      ? Number(credittransactionhistory.openingBalance) + Number(transactionBody.newAmount)
                      : Number(credittransactionhistory.openingBalance) - Number(transactionBody.newAmount);
                }
              }
              credittransactionhistory.updatedAt = new Date();
              credittransactionhistory.updatedBy = transactionBody.userId;
              const debitTran = await queryRunner.manager.findOne(TransactionHistoryEntity, {
                where: {
                  id: credittransactionhistory.id,
                  transactionType: "Dr"
                }
              });
              credittransactionhistory.accountId = debitTran ? debitTran.ledgerId : credittransactionhistory.accountId;
              console.log(debitTran, "debitTran");

              const hist = await queryRunner.manager.update(
                TransactionHistoryEntity,
                {
                  id: credittransactionhistory.id
                },
                credittransactionhistory
              );
              console.log(hist, "hist");

              let debitadjustment = true;
              if (checkdebittransactiononthisdata) {
                let adjustTrasactionHistoryUpdate = {
                  trnxDate: transactionBody.trnasacitonDate,
                  transactionId: transactionBody.trnasactionId,
                  ledgerId: transactionBody.ledgerId,
                  openingBalance: credittransactionhistory.closingBalance,
                  referenceCode: credittransactionhistory.transactionReference
                };

                debitadjustment = await this.AdjustTransactionHistoryUpdate(adjustTrasactionHistoryUpdate, queryRunner);
              }
              if (debitadjustment) {
                return true;
              }
            }
          }
        }
      }
    }
  }

  // add transaction

  async AdjustTransactionHistoryAdd(transactionBody: AdjustTransactionHistoryInterface, queryRunner: QueryRunner) {
    try {
      let lastclosing = transactionBody.openingBalance;
      let checksameday = true;
      try {
        transactionHistories = transactionHistories.filter((a) => {
          return a.transactionReference != "";
        });
        if (transactionHistories.length > 1) {
          console.log("transactionHistories: " + transactionHistories.length);

          const findtranslactionsonthisday = transactionHistories
            .filter((a) => {
              return (
                a.ledgerId == transactionBody.ledgerId &&
                a.transactionDate == transactionBody.trnxDate &&
                a.transactionReference.slice(0, 2).localeCompare(transactionBody.referenceCode.slice(0, 2)) > 0
              );
            })
            .sort((a, b) => {
              return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
            })
            .sort((a, b) => {
              return a.transactionReference.localeCompare(b.transactionReference);
            });

          if (findtranslactionsonthisday && findtranslactionsonthisday.length > 0) {
            let lastopening = transactionBody.openingBalance;
            let ledgerNature = "";
            //console.log('ledgerNature: ', ledgerNature);

            for (let Product = 0; Product < findtranslactionsonthisday.length; Product++) {
              if (findtranslactionsonthisday[Product].transactionSource == "Opening Balance") {
                let v = transactionHistories.filter((m) => m.id == findtranslactionsonthisday[Product].id)[0];
                if (v) {
                  v.transactionDate = transactionBody.trnxDate;

                  await queryRunner.manager.update(TransactionHistoryEntity, { id: v.id }, v);
                }
              } else {
                ledgerNature = findtranslactionsonthisday[Product].ledgers.nature;
                console.log("ledgerNature: ", ledgerNature);

                let v = transactionHistories.filter((m) => m.id == findtranslactionsonthisday[Product].id)[0];
                if (v) {
                  if (findtranslactionsonthisday[Product].debit > 0) {
                    v.openingBalance = lastopening;
                    v.closingBalance =
                      "Dr" == ledgerNature
                        ? Number(v.openingBalance) + Number(findtranslactionsonthisday[Product].debit)
                        : Number(v.openingBalance) - Number(findtranslactionsonthisday[Product].debit);
                  } else if (findtranslactionsonthisday[Product].credit > 0) {
                    v.openingBalance = lastopening;
                    v.closingBalance =
                      "Cr" == ledgerNature
                        ? Number(v.openingBalance) + Number(findtranslactionsonthisday[Product].credit)
                        : Number(v.openingBalance) - Number(findtranslactionsonthisday[Product].credit);
                  }

                  await queryRunner.manager.update(TransactionHistoryEntity, { id: v.id }, v);
                  lastopening = v.closingBalance;
                  lastclosing = lastopening;
                }
              }
            }
          }
        }
      } catch {
        checksameday = false;
      }

      let findtranslactionsafter = transactionHistories.filter((a) => a.ledgerId == transactionBody.ledgerId && a.transactionDate > transactionBody.trnxDate);

      if (findtranslactionsafter && findtranslactionsafter.length > 0) {
        let lastopening = lastclosing;
        let ledgerNature = "";
        console.log("ledgerNature: dsfesf ", ledgerNature);
        findtranslactionsafter = findtranslactionsafter
          .sort((a, b) => {
            return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
          })
          .sort((a, b) => {
            return a.transactionReference.localeCompare(b.transactionReference);
          });
        for (let Product = 0; Product < findtranslactionsafter.length; Product++) {
          if (findtranslactionsafter[Product].transactionSource == "Opening Balance") {
            let v = transactionHistories.filter((m) => m.id == findtranslactionsafter[Product].id)[0];
            if (v) {
              v.transactionDate = transactionBody.trnxDate;

              await queryRunner.manager.update(TransactionHistoryEntity, { id: v.id }, v);
            }
          } else {
            ledgerNature = findtranslactionsafter[Product].ledger.nature;
            console.log("ledgerNature: dsasdasd sdsadsadzsdffdsfdsf", ledgerNature);

            let v = transactionHistories.filter((m) => m.id == findtranslactionsafter[Product].id)[0];
            if (v) {
              if (findtranslactionsafter[Product].debit > 0) {
                v.openingBalance = lastopening;
                v.closingBalance =
                  "Dr" == ledgerNature ? Number(v.openingBalance) + Number(findtranslactionsafter[Product].debit) : Number(v.openingBalance) - Number(findtranslactionsafter[Product].debit);
              } else if (findtranslactionsafter[Product].credit > 0) {
                v.openingBalance = lastopening;
                v.closingBalance =
                  "Cr" == ledgerNature ? Number(v.openingBalance) + Number(findtranslactionsafter[Product].credit) : Number(v.openingBalance) - Number(findtranslactionsafter[Product].credit);
              }
              await queryRunner.manager.update(TransactionHistoryEntity, { id: v.id }, v);
              lastopening = v.closingBalance;
              lastclosing = lastopening;
            }
          }
        }

        return true;
      } else if (checksameday) {
        return true;
      }

      return false;
    } catch (ex) {
      console.log("errror: " + ex);

      return false;
    }
  }

  // add transaction

  async AdjustTransactionHistoryUpdate(transactionBody: AdjustTransactionHistoryUpdateInterface, queryRunner: QueryRunner) {
    try {
      let checklasttrans = true;

      let lastopening = transactionBody.openingBalance;
      try {
        transactionHistories = transactionHistories.filter((a) => a.TransactionReference != "");
        var findtranslactionsonthisday = transactionHistories
          .filter((a) => a.ledgerId == transactionBody.ledgerId && a.transactionDate == transactionBody.trnxDate && a.transactionReference.localeCompare(transactionBody.referenceCode) > 0)
          .sort((a, b) => {
            return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
          })
          .sort((a, b) => {
            return a.transactionReference.localeCompare(b.transactionReference);
          });
        if (findtranslactionsonthisday && findtranslactionsonthisday.length > 0) {
          let ledgerNature = "";
          findtranslactionsonthisday.forEach(async (Product) => {
            if (Product.transactionSource == "Opening Balance") {
              var v = transactionHistories.filter((m) => m.id == Product.id)[0];
              if (v) {
                v.transactionDate = transactionBody.trnxDate;

                await queryRunner.manager.update(TransactionHistoryEntity, { id: v.id }, v);
              }
            } else {
              ledgerNature = Product.ledger.nature;
              var v = transactionHistories.filter((m) => m.id == Product.id)[0];

              if (v) {
                if (Product.debit > 0) {
                  v.openingBalance = lastopening;
                  v.closingBalance = "Dr" == ledgerNature ? Number(v.openingBalance) + Number(Product.debit) : Number(v.openingBalance) - Number(Product.debit);
                } else if (Product.credit > 0) {
                  v.openingBalance = lastopening;
                  v.closingBalance = "Cr" == ledgerNature ? Number(v.openingBalance) + Number(Product.credit) : Number(v.openingBalance) - Number(Product.credit);
                }

                await queryRunner.manager.update(TransactionHistoryEntity, { id: v.id }, v);
                lastopening = v.closingBalance;
              }
            }
          });
        }
      } catch (e) {
        checklasttrans = false;
      }

      var findtranslactions = transactionHistories
        .filter((a) => a.ledgerId == transactionBody.ledgerId && a.transactionDate > transactionBody.trnxDate && a.id != transactionBody.transactionId)
        .sort((a, b) => {
          return b.transactionDate.toString().localeCompare(a.transactionDate.toString());
        })
        .sort((a, b) => {
          return b.transactionReference.localeCompare(a.transactionReference);
        });

      if (findtranslactions && findtranslactions.length > 0) {
        let ledgerNature = "";

        //findtranslactions = findtranslactions.OrderBy(a => a.transactionDate).ThenBy(a => a.TransactionReference);
        findtranslactions.forEach(async (Product) => {
          if (Product.transactionSource == "Opening Balance") {
            var v = transactionHistories.filter((m) => m.id == Product.id)[0];
            if (v) {
              v.transactionDate = transactionBody.trnxDate;
              await queryRunner.manager.update(TransactionHistoryEntity, { id: v.id }, v);
            }
          } else {
            ledgerNature = Product.ledger.nature;
            var v = transactionHistories.filter((m) => m.id == Product.id)[0];
            if (v) {
              if (Product.debit > 0) {
                v.openingBalance = lastopening;
                v.closingBalance = "Dr" == ledgerNature ? Number(v.openingBalance) + Number(Product.debit) : Number(v.openingBalance) - Number(Product.debit);
              } else if (Product.credit > 0) {
                v.openingBalance = lastopening;
                v.closingBalance = "Cr" == ledgerNature ? Number(v.openingBalance) + Number(Product.credit) : Number(v.openingBalance) - Number(Product.credit);
              }
              /*Log.Fatal("Check Transaction: " + v.TransactionReference + ": Opening: " + v.OpeningBalance + " :Closing: " + v.ClosingBalance, null);*/
              lastopening = v.closingBalance;

              await queryRunner.manager.update(TransactionHistoryEntity, { id: v.id }, v);
            }
          }
        });

        return true;
      } else if (checklasttrans == true) {
        return true;
      }
      return false;
    } catch (ex) {
      console.log("eroor from manujal ; ", ex);
      return false;
    }
  }

  // add transaction

  async RevertTransactionHistory(transactionBody: RevertTransactionInterface, queryRunner: QueryRunner) {
    try {
      var ledgerinfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: transactionBody.ledgerId } });
      var ledgernaturess = "";

      if (ledgerinfo) {
        var findtranslactions = transactionHistories.filter((a) => a.ledgerId == transactionBody.ledgerId && a.id != transactionBody.transactionId);

        let lastclosing = transactionBody.openingBalance;

        if (findtranslactions && findtranslactions.length > 0) {
          let lastopening = transactionBody.openingBalance;

          findtranslactions = findtranslactions
            .sort((a, b) => {
              return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
            })
            .sort((a, b) => {
              return a.transactionReference.localeCompare(b.transactionReference);
            });

          for (let Product = 0; Product < findtranslactions.length; Product++) {
            let v = findtranslactions.filter((m) => m.id == findtranslactions[Product].id)[0];
            if (v) {
              ledgernaturess = ledgerinfo.nature;
              if (findtranslactions[Product].debit > 0) {
                v.openingBalance = lastopening;
                v.closingBalance = "Dr" == ledgernaturess ? Number(v.openingBalance) + Number(findtranslactions[Product].debit) : Number(v.openingBalance) - Number(findtranslactions[Product].debit);
              } else if (findtranslactions[Product].credit > 0) {
                v.openingBalance = lastopening;
                v.closingBalance = "Cr" == ledgernaturess ? Number(v.openingBalance) + Number(findtranslactions[Product].credit) : Number(v.openingBalance) - Number(findtranslactions[Product].credit);
              }

              lastopening = v.closingBalance;
              lastclosing = lastopening;

              await queryRunner.manager.update(TransactionHistoryEntity, { id: v.id }, v);
            }
          }
        }

        return lastclosing.toString();
      }
      return "false";
    } catch (ex) {
      //Log.Fatal("log4net Fatal Level", ex);
      return "false";
    }
  }

  // opening balance transaction

  async openingBalanceTransaction(transactionBody: OpeningBalanceInterface, queryRunner: QueryRunner) {
    const ledgerInfo = await queryRunner.manager.findOne(AccountsEntity, { where: { id: transactionBody.ledgerId } });

    const transactionId = randToken.generate(10, "abcdefghijklnmopqrstuvwxyz0123456789");

    const newEntryOp = new TransactionHistoryEntity();

    if (ledgerInfo) {
      newEntryOp.transactionId = transactionId;
      newEntryOp.transactionDate = new Date();
      newEntryOp.transactionType = ledgerInfo.nature;
      newEntryOp.accountId = transactionBody.captialId;
      newEntryOp.transactionReference = "";
      newEntryOp.remarks = "Opening Balance";
      newEntryOp.transactionSource = "Opening Balance";
      newEntryOp.referenceID = 0;
      newEntryOp.organizationId = transactionBody.organizationId;

      if (ledgerInfo.nature == "Dr") {
        newEntryOp.debit = transactionBody.openingbalance;
        newEntryOp.credit = 0;
      } else {
        newEntryOp.credit = transactionBody.openingbalance;
        newEntryOp.debit = 0;
      }

      newEntryOp.openingBalance = 0;
      newEntryOp.closingBalance = transactionBody.openingbalance;
      const rate = 0.0;

      newEntryOp.closingBalance = transactionBody.openingbalance;
      newEntryOp.ledgerId = ledgerInfo.id;
      newEntryOp.ledger = ledgerInfo;

      if (newEntryOp) {
        newEntryOp.createdAt = new Date();
        newEntryOp.updatedAt = new Date();
        newEntryOp.createdBy = transactionBody.userId;
        newEntryOp.organizationId = transactionBody.organizationId;
        newEntryOp.updatedBy = 0;
        newEntryOp.deletedBy = 0;

        await queryRunner.manager.save(TransactionHistoryEntity, newEntryOp);
      }

      const newEntryCapital = new TransactionHistoryEntity();

      newEntryCapital.transactionId = transactionId;
      newEntryCapital.transactionDate = new Date();

      if (ledgerInfo.nature == "Dr") {
        newEntryCapital.transactionType = "Cr";
      } else {
        newEntryCapital.transactionType = "Dr";
      }

      newEntryCapital.accountId = ledgerInfo.id;
      newEntryCapital.transactionReference = "";
      newEntryCapital.remarks = "Opening Balance";
      newEntryCapital.transactionSource = "Opening Balance";
      newEntryCapital.referenceID = 0;
      newEntryCapital.organizationId = transactionBody.organizationId;
      if (ledgerInfo.nature == "Dr") {
        newEntryCapital.debit = 0;
        newEntryCapital.credit = transactionBody.openingbalance;
      } else {
        newEntryCapital.credit = 0;
        newEntryCapital.debit = transactionBody.openingbalance;
      }

      newEntryCapital.openingBalance = transactionBody.openingbalancecap;
      newEntryCapital.closingBalance = transactionBody.closingbalancecap;
      newEntryCapital.ledgerId = transactionBody.captialId;

      if (newEntryCapital) {
        await queryRunner.manager.save(TransactionHistoryEntity, newEntryCapital);
      }

      return true;
    } else {
      return false;
    }
  }

  // opening balance transaction

  async UpdateOpeningBalanceTransactions(transactionBody: UpdateOpeningBalanceTransactionInterface, queryRunner: QueryRunner) {
    try {
      transactionHistories = await queryRunner.manager.find(TransactionHistoryEntity, {
        where: {
          ledgerId: transactionBody.ledgerId
        }
      });

      var lowetstdate = transactionHistories
        .filter((a) => a.ledgerId == transactionBody.ledgerId)
        .sort((a, b) => {
          return a.transactionDate.toString().localeCompare(b.transactionDate.toString());
        })[0];

      let transactioninfo = await queryRunner.manager.findOne(TransactionHistoryEntity, {
        where: {
          ledgerId: transactionBody.ledgerId,
          transactionSource: "Opening Balance"
        }
      });

      if (transactioninfo) {
        if (transactioninfo.transactionType == "Dr") {
          transactioninfo.debit = transactionBody.balance;
          transactioninfo.credit = 0;
        } else {
          transactioninfo.debit = 0;
          transactioninfo.credit = transactionBody.balance;
        }
        transactioninfo.transactionDate = lowetstdate.transactionDate;
        transactioninfo.closingBalance = transactionBody.balance;

        transactioninfo.updatedAt = new Date();
        transactioninfo.updatedBy = transactionBody.userId;
        await queryRunner.manager.update(TransactionHistoryEntity, { id: transactioninfo.id }, transactioninfo);

        //databaseModel.SaveChanges();

        const capitalinfo = await queryRunner.manager.findOne(TransactionHistoryEntity, {
          where: {
            id: transactionBody.capitalTranId
          }
        });

        if (capitalinfo.transactionType == "Dr") {
          capitalinfo.debit = transactionBody.balance;
          capitalinfo.credit = 0;
        } else {
          capitalinfo.debit = 0;
          capitalinfo.credit = transactionBody.balance;
        }
        capitalinfo.updatedAt = new Date();
        capitalinfo.updatedBy = transactionBody.userId;

        await queryRunner.manager.update(TransactionHistoryEntity, { id: capitalinfo.id }, capitalinfo);

        let revertTransaction = {
          ledgerId: transactionBody.ledgerId,
          openingBalance: transactionBody.balance,
          transactionId: transactioninfo.id
        };

        const others = await this.RevertTransactionHistory(revertTransaction, queryRunner);

        if (others != "false") {
          return others;
        } else {
          return "false";
        }
      }

      return "false";
    } catch (ex) {
      console.log(ex);

      //Log.Fatal("log4net Fatal Level", ex);

      return "false";
    }
  }
  async genderateTenDigitUniqueTransactionCode(passdate: Date, userPayload: UserInterface) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      let currentyear = passdate.getFullYear();

      let currentmonth = passdate.getMonth() + 1;

      let currentdate = passdate.getDate();

      let isexists = null;
      let moduleheader = null;
      let delimiter1 = "-";
      var finalstring = "";
      isexists = await queryRunner.manager.findOne(TransactionHistoryEntity, {
        where: { transactionId: Like("%tnx-" + userPayload.organizationId + "-" + currentdate + currentmonth + currentyear + "-%"), organizationId: userPayload.organizationId },
        order: { id: "DESC" }
      });

      moduleheader = "tnx-" + userPayload.organizationId + "-";

      if (!isexists) {
        let number = moduleheader + currentdate + currentmonth + currentyear + "-00001";
        return number;
      } else {
        let categorysplit = isexists.transactionId.split(delimiter1);

        let currentnumber = Number(categorysplit[3].trim());
        let current = currentdate + currentmonth + currentyear;

        if (Number(current) > Number(categorysplit[2].trim().toString())) {
          finalstring = moduleheader + currentdate + currentmonth + currentyear + "-00001";
        } else {
          currentnumber = Number(currentnumber) + 1;
          let count = currentnumber.toString().length;

          if (count == 1) {
            finalstring = moduleheader + currentdate + currentmonth + currentyear + "-0000" + currentnumber.toString();
          } else if (count == 2) {
            finalstring = moduleheader + currentdate + currentmonth + currentyear + "-000" + currentnumber.toString();
          } else if (count == 3) {
            finalstring = moduleheader + currentdate + currentmonth + currentyear + "-00" + currentnumber.toString();
          } else if (count == 4) {
            finalstring = moduleheader + currentdate + currentmonth + currentyear + "-0" + currentnumber.toString();
          } else {
            finalstring = moduleheader + currentdate + currentmonth + currentyear + "-" + currentnumber.toString();
          }
        }

        return finalstring;
      }
    } catch (err) {
      console.log(err);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
  }

  async generateAllNumbersbasedonDate(modulename: string, passdate: Date, userPayload: UserInterface) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      let currentyear = passdate.getFullYear();
      let currentmonth = passdate.getMonth() + 1;

      let currentdate = passdate.getDate();
      let isexists = null;
      let moduleheader = null;
      let delimiter1 = "-";
      var finalstring = "";

      if (modulename == "Invoice") {
        isexists = await queryRunner.manager.findOne(InvoiceEntity, {
          where: { invoiceNo: Like("%INV-" + userPayload.organizationId + "-" + currentdate + currentmonth + currentyear + "-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "INV-" + userPayload.organizationId + "-";
      } else if (modulename == "Estiamtion") {
        isexists = await queryRunner.manager.findOne(EstimationEntity, {
          where: { estimationNo: Like("%EST-" + currentdate + currentmonth + currentyear + "-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "EST-" + userPayload.organizationId + "-";
      } else if (modulename == "PaymentReceived") {
        isexists = await queryRunner.manager.findOne(PaymentReceivedEntity, {
          where: { paymentNumber: Like("%PR-" + userPayload.organizationId + "-" + currentdate + currentmonth + currentyear + "-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "PR-" + userPayload.organizationId + "-";
      } else if (modulename == "CreditMemo") {
        isexists = await queryRunner.manager.findOne(CreditNotesEntity, {
          where: { creditNoteNo: Like("%CN-" + userPayload.organizationId + "-" + currentdate + currentmonth + currentyear + "-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        console.log("isexists: ", isexists);

        moduleheader = "CN-" + userPayload.organizationId + "-";
      } else if (modulename == "PurchaseOrder") {
        isexists = await queryRunner.manager.findOne(PurchaseOrderEntity, {
          where: { docNumber: Like("%PO-" + userPayload.organizationId + "-" + currentdate + currentmonth + currentyear + "-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "PO-" + userPayload.organizationId + "-";
        console.log("isexists: ", isexists);
      } else if (modulename == "PurchaseInvoice") {
        isexists = await queryRunner.manager.findOne(BillEntity, {
          where: { billNo: Like("%BILL-" + userPayload.organizationId + "-" + currentdate + currentmonth + currentyear + "-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "BILL-" + userPayload.organizationId + "-";
      } else if (modulename == "PaymentPaid") {
        isexists = await queryRunner.manager.findOne(PaymentMadeEntity, {
          where: { paymentsNo: Like("%PP-" + userPayload.organizationId + "-" + currentdate + currentmonth + currentyear + "-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "PP-" + userPayload.organizationId + "-";
      } else if (modulename == "PurchaseReturn") {
        isexists = await queryRunner.manager.findOne(VendorDebitsEntity, {
          where: { debitNoteNo: Like("%DN-" + userPayload.organizationId + "-" + currentdate + currentmonth + currentyear + "-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "DN-" + userPayload.organizationId + "-";
      } else if (modulename == "ManualJournal") {
        isexists = await queryRunner.manager.findOne(ManualJournalsEntity, {
          where: { journalNo: Like("%MJ-" + userPayload.organizationId + "-" + currentdate + currentmonth + currentyear + "-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "MJ-" + userPayload.organizationId + "-";
      } else if (modulename == "Bookkeeping") {
        isexists = await queryRunner.manager.findOne(InvoiceEntity, {
          where: { invoiceNo: Like("%BK-" + userPayload.organizationId + "-" + currentdate + currentmonth + currentyear + "-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "BK-" + userPayload.organizationId + "-";
      } else if (modulename == "Expense") {
        isexists = await queryRunner.manager.findOne(ExpensesEntity, {
          where: { expenseNo: Like("%Ex-" + userPayload.organizationId + "-" + currentdate + currentmonth + currentyear + "-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "Ex-" + userPayload.organizationId + "-";
      }

      if (!isexists) {
        let number = moduleheader + currentdate + currentmonth + currentyear + "-001";
        return number;
      } else {
        let categorysplit = null;

        if (modulename == "Invoice") {
          categorysplit = isexists.invoiceNo.split(delimiter1);
        } else if (modulename == "Estiamtion") {
          categorysplit = isexists.estimationNo.split(delimiter1);
        } else if (modulename == "PaymentReceived") {
          categorysplit = isexists.paymentNumber.split(delimiter1);
        } else if (modulename == "CreditMemo") {
          categorysplit = isexists.creditNoteNo.split(delimiter1);
        } else if (modulename == "PurchaseOrder") {
          categorysplit = isexists.docNumber.split(delimiter1);
        } else if (modulename == "PurchaseInvoice") {
          categorysplit = isexists.billNo.split(delimiter1);
        } else if (modulename == "PaymentPaid") {
          categorysplit = isexists.paymentsNo.split(delimiter1);
        } else if (modulename == "PurchaseReturn") {
          categorysplit = isexists.debitNoteNo.split(delimiter1);
        } else if (modulename == "ManualJournal") {
          categorysplit = isexists.journalNo.split(delimiter1);
        } else if (modulename == "Bookkeeping") {
          categorysplit = isexists.invoiceNo.split(delimiter1);
        } else if (modulename == "Expense") {
          categorysplit = isexists.expenseNo.split(delimiter1);
        }

        let currentnumber = Number(categorysplit[3].trim());
        let current = currentdate + currentmonth + currentyear;

        if (Number(current) > Number(categorysplit[2].trim().toString())) {
          finalstring = moduleheader + currentdate + currentmonth + currentyear + "-001";
        } else {
          currentnumber = Number(currentnumber) + 1;
          let count = currentnumber.toString().length;

          if (count == 1) {
            finalstring = moduleheader + currentdate + currentmonth + currentyear + "-00" + currentnumber.toString();
          } else if (count == 2) {
            finalstring = moduleheader + currentdate + currentmonth + currentyear + "-0" + currentnumber.toString();
          } else {
            finalstring = moduleheader + currentdate + currentmonth + currentyear + "-" + currentnumber.toString();
          }
        }

        return finalstring;
      }
    } catch (err) {
      console.log('console.log("isexists: ", isexists);: ', err);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
  }
  async generateBaseNumbers(modulename: string, userPayload: UserInterface) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      let isexists = null;
      let moduleheader = null;
      let delimiter1 = "-";
      var finalstring = "";

      if (modulename == "Customer") {
        isexists = await queryRunner.manager.findOne(CustomersEntity, {
          where: { organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "C-" + userPayload.organizationId + "-";
      } else if (modulename == "Vendor") {
        isexists = await queryRunner.manager.findOne(VendorsEntity, {
          where: { organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "V-" + userPayload.organizationId + "-";
      } else if (modulename == "Bank") {
        isexists = await queryRunner.manager.findOne(BankAccountEntity, {
          where: { organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });
        moduleheader = "B-" + userPayload.organizationId + "-";
      } else if (modulename == "Ledger") {
        isexists = await queryRunner.manager.findOne(AccountsEntity, {
          where: { ledgerCode: Like("%Ac-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });

        moduleheader = "Ac-" + userPayload.organizationId + "-";
      } else if (modulename == "Employee") {
        isexists = await queryRunner.manager.findOne(EmployeesEntity, {
          where: { employeeCode: Like("%Emp-%"), organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });

        moduleheader = "Emp-" + userPayload.organizationId + "-";
      } else if (modulename == "Stock") {
        isexists = await queryRunner.manager.findOne(ProductsEntity, {
          where: { organizationId: userPayload.organizationId },
          order: { id: "DESC" }
        });

        moduleheader = "Stock-" + userPayload.organizationId + "-";
      }

      if (!isexists) {
        let number = moduleheader + "001";
        return number;
      } else {
        let categorysplit = null;

        if (modulename == "Customer") {
          categorysplit = isexists.customerCode.split(delimiter1);
        } else if (modulename == "Vendor") {
          categorysplit = isexists.vendorCode.split(delimiter1);
        } else if (modulename == "Bank") {
          categorysplit = isexists.accountCode.split(delimiter1);
        } else if (modulename == "Ledger") {
          categorysplit = isexists.ledgerCode.split(delimiter1);
        } else if (modulename == "Employee") {
          categorysplit = isexists.employeeCode.split(delimiter1);
        } else if (modulename == "Stock") {
          categorysplit = isexists.productsCode.split(delimiter1);
        }

        let currentnumber = Number(categorysplit[2].trim());

        currentnumber = Number(currentnumber) + 1;
        let count = currentnumber.toString().length;

        if (count == 1) {
          finalstring = moduleheader + "00" + currentnumber.toString();
        } else if (count == 2) {
          finalstring = moduleheader + "0" + currentnumber.toString();
        } else {
          finalstring = moduleheader + "" + currentnumber.toString();
        }

        return finalstring;
      }
    } catch (err) {
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
  }
  async dashboard(userPayload: UserInterface) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      const dashboard = new DashboardViewModel();
      //#region Data

      dashboard.TotalCustomers = await queryRunner.manager.count(CustomersEntity, { where: { organizationId: userPayload.organizationId } });
      dashboard.TotalEmployess = await queryRunner.manager.count(EstimationEntity, { where: { organizationId: userPayload.organizationId } });

      var alltransactions = await queryRunner.manager.find(TransactionHistoryEntity, { where: { organizationId: userPayload.organizationId } });
      var currentyear = new Date().getFullYear();
      var currentmonth = new Date().getMonth() + 1;

      var daysinmonth = new Date().getDate();
      var startdate = new Date(currentyear + "-" + currentmonth + "-01");
      var enddate = new Date();

      var thismonthtransactions = alltransactions.filter((a) => a.transactionDate >= startdate && a.transactionDate <= enddate);

      var lastyear = new Date(new Date().getMonth()).getFullYear();
      var lastmonth = new Date().getMonth();
      var lastdaysinmonth = new Date(lastyear, lastmonth, 0).getDate();
      var laststartdate = new Date(lastyear, lastmonth, 1);
      var lastenddate = new Date(lastyear, lastmonth, lastdaysinmonth);

      var lastmonthtransactions = alltransactions.filter((a) => a.transactionDate >= laststartdate && a.transactionDate <= lastenddate);
      // #endregion

      var allledgers = await queryRunner.manager.find(AccountsEntity, { where: { organizationId: userPayload.organizationId } });

      //#region Sales Calculations
      var allsalescurrent = thismonthtransactions.filter((a) => a.transactionSource == "Invoice" && a.credit > 0);
      var allsaleslast = lastmonthtransactions.filter((a) => a.transactionSource == "Invoice" && a.credit > 0);
      var allinvoices = await queryRunner.manager.find(InvoiceEntity, { where: { organizationId: userPayload.organizationId } });
      var allpayments = await queryRunner.manager.find(PaymentReceivedEntity, { where: { organizationId: userPayload.organizationId } });
      var allpaymentsmade = await queryRunner.manager.find(PaymentMadeEntity, { where: { organizationId: userPayload.organizationId } });
      var allpurchase = await queryRunner.manager.find(BillEntity, { where: { organizationId: userPayload.organizationId } });
      var thismonthsales = 0.0;

      dashboard.TotalSalessMonth = allsalescurrent.reduce((accumulator, currentValue) => accumulator + Number(currentValue.credit), 0);
      let totalpurchase = allpurchase.reduce((accumulator, currentValue) => accumulator + Number(currentValue.totalAmt), 0);
      let totalpaymentsmade = allpaymentsmade.reduce((accumulator, currentValue) => accumulator + Number(currentValue.totalAmt), 0);

      if (totalpurchase > totalpaymentsmade) {
        dashboard.TotalallPurchase = Number(dashboard.TotalallPurchase) + Number(totalpurchase) - Number(totalpaymentsmade);
      }

      dashboard.LastMonthSales = allsaleslast.reduce((accumulator, currentValue) => accumulator + currentValue.credit, 0);

      if (dashboard.TotalSalessMonth == 0 && dashboard.LastMonthSales == 0) {
        dashboard.SalesProgress = 0;
      } else {
        dashboard.SalesProgress = (Number(dashboard.TotalSalessMonth) - Number(dashboard.LastMonthSales)) / Number(dashboard.TotalSalessMonth);
      }

      var totalpaidamount =
        Number(allinvoices.reduce((accumulator, currentValue) => accumulator + Number(currentValue.totalAmt), 0)) -
        Number(allinvoices.reduce((accumulator, currentValue) => accumulator + currentValue.totalDueAmount, 0));

      dashboard.TotalPaidInvoice = totalpaidamount;
      dashboard.TotalUnPaidInvoice = Number(allinvoices.reduce((accumulator, currentValue) => accumulator + Number(currentValue.totalDueAmount), 0));

      var advancepayments = allpayments.filter((a) => a.comment == "Advance");
      var allcustomers = await queryRunner.manager.find(CustomersEntity, { where: { organizationId: userPayload.organizationId } });

      allcustomers.forEach(async (Product) => {
        var customtran = alltransactions.filter((a) => a.ledgerId == Product.ledgerId);
        var debittrans = customtran.filter((a) => a.transactionSource == "Invoice");
        var credittrans = customtran.filter((a) => a.transactionSource == "Payment Received");
        let totaldebit = Number(debittrans.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0));
        let totalcredit = Number(debittrans.reduce((accumulator, currentValue) => accumulator + Number(currentValue.credit), 0));

        if (totaldebit > totalcredit) {
          dashboard.TotalSaless = Number(dashboard.TotalSaless) + Number(totaldebit) - Number(totalcredit);
        }

        if (totalcredit > 0) {
          if (totalcredit - totaldebit > 0) {
            dashboard.AdvancePayments = Number(dashboard.AdvancePayments) + Number(totalcredit) - Number(totaldebit);
          } else if (Number(totalcredit) - Number(totaldebit) < 0) {
            dashboard.UnderPayments = Number(dashboard.UnderPayments) + Number(dashboard.AdvancePayments) + Number(totaldebit) - Number(totalcredit);
          }
        }
      });

      //#endregion

      //#region Purchase Calculations
      var allpurchasecurrent = thismonthtransactions.filter(
        (a) => (a.transactionSource == "Purchase" || a.transactionSource == "Expense" || a.transactionSource == "Transport Expense" || a.transactionSource == "Salary Payment") && a.debit > 0
      );
      var allpurchaselast = lastmonthtransactions.filter(
        (a) => (a.transactionSource == "Purchase" || a.transactionSource == "Expense" || a.transactionSource == "Transport Expense" || a.transactionSource == "Salary Payment") && a.debit > 0
      );

      dashboard.TotalPurchase = allpurchasecurrent.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0);
      dashboard.LastMonthPurchase = allpurchaselast.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0);

      if (dashboard.TotalPurchase == 0) {
        dashboard.PurchaseProgress = 0;
      } else {
        dashboard.PurchaseProgress = (Number(dashboard.TotalPurchase) - Number(dashboard.LastMonthPurchase)) / Number(dashboard.TotalPurchase);
      }

      // #endregion

      //#region Expense Calculations
      var allexpensecurrent = thismonthtransactions.filter(
        (a) => (a.transactionSource == "Expense" || a.transactionSource == "Transport Expense" || a.transactionSource == "Salary Payment") && a.debit > 0
      );
      var allexpenselast = lastmonthtransactions.filter(
        (a) => (a.transactionSource == "Expense" || a.transactionSource == "Transport Expense" || a.transactionSource == "Salary Payment") && a.debit > 0
      );
      dashboard.TotalExpense = allexpensecurrent.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0);
      dashboard.LastMonthExpense = allexpenselast.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0);

      if (dashboard.TotalExpense == 0 && dashboard.LastMonthExpense == 0) {
        dashboard.ExpenseProgress = 0;
      } else {
        dashboard.ExpenseProgress = (Number(dashboard.TotalExpense) - Number(dashboard.LastMonthExpense)) / Number(dashboard.TotalExpense);
      }

      //#endregion

      //#region Transactions
      dashboard.TotalTransactions = thismonthtransactions.length;
      dashboard.LastMonthTransactions = lastmonthtransactions.length;

      if (dashboard.TotalTransactions == 0 && dashboard.LastMonthTransactions == 0) {
        dashboard.TransactionsProgress = 0;
      } else {
        dashboard.TransactionsProgress = (Number(dashboard.TotalTransactions) - Number(dashboard.LastMonthTransactions)) / Number(dashboard.TotalTransactions);
      }
      //#endregion

      //#region PaymentsReceived Calculations
      var allpaymetsrecurrent = thismonthtransactions.filter((a) => a.transactionSource == "Payment Received" && a.credit > 0);
      var allpaymetsrelast = lastmonthtransactions.filter((a) => a.transactionSource == "Payment Received" && a.credit > 0);

      dashboard.TotalPaymentsReceived = allpaymetsrecurrent.reduce((accumulator, currentValue) => accumulator + Number(currentValue.credit), 0);
      dashboard.LastMonthPaymentsReceived = allpaymetsrelast.reduce((accumulator, currentValue) => accumulator + Number(currentValue.credit), 0);

      if (dashboard.TotalPaymentsReceived == 0 && dashboard.LastMonthPaymentsReceived == 0) {
        dashboard.PaymentsReceivedProgress = 0;
      } else {
        dashboard.PaymentsReceivedProgress = (Number(dashboard.TotalPaymentsReceived) - Number(dashboard.LastMonthPaymentsReceived)) / Number(dashboard.TotalPaymentsReceived);
      }

      //#endregion

      //#region Paymentspaid Calculations
      var allpaymetspaidcurrent = thismonthtransactions.filter(
        (a) => a.transactionSource == "Expense" || a.transactionSource == "Transport Expense" || a.transactionSource == "Salary Payment" || (a.transactionSource == "Payment Paid" && a.debit > 0)
      );
      var allpaymetspaidrelast = lastmonthtransactions.filter(
        (a) => a.transactionSource == "Expense" || a.transactionSource == "Transport Expense" || a.transactionSource == "Salary Payment" || (a.transactionSource == "Payment Paid" && a.debit > 0)
      );

      dashboard.TotalPayments = allpaymetspaidcurrent.reduce((accumulator, currentValue) => accumulator + Number(currentValue.credit), 0);
      dashboard.LastMonthPayments = allpaymetspaidrelast.reduce((accumulator, currentValue) => accumulator + Number(currentValue.credit), 0);

      if (dashboard.TotalPayments == 0 && dashboard.LastMonthPayments == 0) {
        dashboard.PaymentsProgress = 0;
      } else {
        dashboard.PaymentsProgress = (Number(dashboard.TotalPayments) - Number(dashboard.LastMonthPayments)) / Number(dashboard.TotalPayments);
      }

      //#endregion

      //#region Sales Return Calculations
      var allCreditMemocurrent = thismonthtransactions.filter((a) => a.transactionSource == "Sales Return" && a.debit > 0);
      var allCreditMemolast = lastmonthtransactions.filter((a) => a.transactionSource == "Sales Return" && a.debit > 0);

      dashboard.TotalCreditMemo = allCreditMemocurrent.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0);
      dashboard.LastMonthCreditMemo = allCreditMemolast.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0);

      if (dashboard.TotalCreditMemo == 0 && dashboard.LastMonthCreditMemo == 0) {
        dashboard.CreditMemoProgress = 0;
      } else {
        dashboard.CreditMemoProgress = (Number(dashboard.TotalCreditMemo) - Number(dashboard.LastMonthCreditMemo)) / Number(dashboard.TotalCreditMemo);
      }

      //#endregion

      //#region Purchase Return Calculations
      var allpurchasereturncurrent = thismonthtransactions.filter((a) => a.transactionSource == "Sales Return" && a.debit > 0);
      var allpurchasereturnlast = lastmonthtransactions.filter((a) => a.transactionSource == "Sales Return" && a.debit > 0);

      dashboard.TotalPurchaseReturn = allpurchasereturncurrent.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0);
      dashboard.LastMonthPurchaseReturn = allpurchasereturnlast.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0);

      if (dashboard.TotalPurchaseReturn == 0 && dashboard.LastMonthPurchaseReturn == 0) {
        dashboard.PurchaseReturnProgress = 0;
      } else {
        dashboard.PurchaseReturnProgress = (Number(dashboard.TotalPurchaseReturn) - Number(dashboard.LastMonthPurchaseReturn)) / Number(dashboard.TotalPurchaseReturn);
      }

      //#endregion

      //#region Accounts Receivables and payables Calculations

      var customers = allledgers.filter((a) => a.ledgerCode.includes("C-"));
      dashboard.AccountsReceivable = customers.reduce((accumulator, currentValue) => accumulator + Number(currentValue.closingBalance), 0);

      var Vendors = allledgers.filter((a) => a.ledgerCode.includes("S-"));
      dashboard.AccountsPayable = Vendors.reduce((accumulator, currentValue) => accumulator + Number(currentValue.closingBalance), 0);

      if (Number(dashboard.AccountsReceivable) < 0 && Number(dashboard.AccountsPayable) > 0) {
        dashboard.AccountsPayable = Number(dashboard.AccountsPayable) - Number(dashboard.AccountsReceivable);
        dashboard.AccountsReceivable = Number(0);
      } else if (Number(dashboard.AccountsReceivable) < 0 && Number(dashboard.AccountsPayable) < 0) {
        var prev = -dashboard.AccountsPayable;
        dashboard.AccountsPayable = -dashboard.AccountsReceivable;
        dashboard.AccountsReceivable = Number(prev);
      } else if (Number(dashboard.AccountsReceivable) > 0 && Number(dashboard.AccountsPayable) < 0) {
        dashboard.AccountsReceivable = Number(dashboard.AccountsReceivable) - Number(dashboard.AccountsPayable);
        dashboard.AccountsPayable = Number(0);
      } else {
        dashboard.AccountsReceivable = dashboard.AccountsReceivable;
        dashboard.AccountsPayable = dashboard.AccountsPayable;
      }

      //#endregion
      return dashboard;
    } catch (err) {
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
  }
}
