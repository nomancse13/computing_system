import { Injectable } from "@nestjs/common/decorators";
import { InjectRepository } from "@nestjs/typeorm";
import { StatusField } from "src/authentication/common/enum";
import { AccountStatement } from "src/viewentites/accountstatement.entity";
import { AccountStatementDetails } from "src/viewentites/accountstatementdetails.entity";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { AccountingGroupEntity, AccountsEntity, StockHistoryEntity, TransactionHistoryEntity, VendorsEntity } from "../entities";
import { BankingService } from "./banking.service";
import { LedgersService } from "./ledgers.service";
import { CustomersService } from "./customers.service";
import { VendorsService } from "./vendors.service";
import { UserInterface } from "src/authentication/common/interfaces";
import { AllGroupViewEntity } from "src/viewentites/all-groupwiew.entity";
import { ChartLedgerViewModel } from "src/viewentites/chartledgerwiew.entity";
import { DataSource } from "typeorm";
import { BadRequestException } from "@nestjs/common";
let allgroupsglobal = [];
let allledgersglobal = [];
let allstockglobal = [];
let alltransactionhistory = [];
let allexpensehistory = [];
let totalexpense = 0;

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(TransactionHistoryEntity)
    private transactionHistoryRepository: BaseRepository<TransactionHistoryEntity>,

    @InjectRepository(AccountsEntity)
    private ledgerRepository: BaseRepository<AccountsEntity>,

    @InjectRepository(AccountingGroupEntity)
    private accountingGroupRepository: BaseRepository<AccountingGroupEntity>,
    @InjectRepository(StockHistoryEntity)
    private stockRepository: BaseRepository<StockHistoryEntity>,

    private readonly ledgersService: LedgersService,
    private readonly bankingService: BankingService,
    private readonly customerService: CustomersService,
    //private readonly vendorservice: VendorsService,
    private dataSource: DataSource
  ) {}

  /**
   * CREATE new user Type
   */
  async bankStatement(id, userPayload: UserInterface) {
    const alltransactions = new AccountStatement();
    alltransactions.DateFrom = new Date("2023-12-01");
    alltransactions.Dateto = new Date();
    const allLedger = await this.ledgersService.getallLedgers();

    // const bankledgers = allLedger.filter(a => a.ledgerCode.includes("B-"));

    // if (bankledgers.length > 0)
    // {
    //     alltransactions.AllLedgers = allLedger;
    // }

    let statementdetails = [];
    if (id != null && id != 0) {
      alltransactions.LedgerID = id;
      let ledgerinformationindex = allLedger.findIndex((a) => a.id == id);
      let ledgerinformation = allLedger[ledgerinformationindex];

      const information = await this.bankingService.findOneBankingByLedgerid(id);

      alltransactions.displayName = ledgerinformation.name;
      alltransactions.CustomerCode = ledgerinformation.ledgerCode;
      alltransactions.CustomerAddress = ledgerinformation.name;
      const alltransactionHistories = await this.transactionHistoryRepository.createQueryBuilder("transhistory").leftJoinAndSelect("transhistory.ledger", "ledger").getMany();
      //&& a.transactionDate>= alltransactions.DateFrom && a.transactionDate<=alltransactions.Dateto
      let transactionHistories = alltransactionHistories
        .filter((a) => a.ledgerId == id)
        .sort((a, b) => {
          return a[0].transactionDate - b[0].transactionDate;
        })
        .sort((a, b) => {
          return a[0].transactionReference - b[0].transactionReference;
        });

      try {
        let openingtransaction = transactionHistories.find((a) => a.transactionSource == "Opening Balance");

        if (openingtransaction) {
          alltransactions.OpeningBalance = openingtransaction.closingBalance;
          transactionHistories = transactionHistories.filter((Productsdsad) => Productsdsad.transactionSource != "Opening Balance");
        } else {
          alltransactions.OpeningBalance = transactionHistories[0].openingBalance;
        }

        alltransactions.TotalDebit = transactionHistories.reduce((accumulator, currentValue) => accumulator + currentValue.debit, 0);

        alltransactions.TotalCredit = transactionHistories.reduce((accumulator, currentValue) => accumulator + currentValue.credit, 0);

        alltransactions.TotalDue = Number(alltransactions.OpeningBalance) + Number(alltransactions.TotalDebit) - Number(alltransactions.TotalCredit);

        let single = new AccountStatementDetails();
        single.Debit = 0;
        single.Credit = 0;
        single.AccountNumber = "";
        single.Description = "Balance B/F";

        single.Carieer = "";
        single.BillNo = "";
        single.Balance = alltransactions.OpeningBalance;
        statementdetails.push(single);
        alltransactions.ClosingBalance = transactionHistories[transactionHistories.length - 1].closingBalance;
      } catch (e) {
        alltransactions.OpeningBalance = ledgerinformation.accountOpeningBalance;
        alltransactions.ClosingBalance = ledgerinformation.closingBalance;
      }

      if (transactionHistories.length > 0) {
        transactionHistories.forEach((element) => {
          if (element.debit != 0 || element.credit != 0) {
            let single = new AccountStatementDetails();
            single.TransactionDate = element.transactionDate;
            single.Debit = element.debit;
            single.Credit = element.credit;
            single.AccountNumber = element.ledger.name;
            single.Description = element.remarks;
            single.Carieer = element.remarks;
            single.BillNo = element.transactionReference;
            single.Balance = element.closingBalance;

            statementdetails.push(single);

            //return Productsdsad;
          }
        });
      }

      alltransactions.statementdetails = statementdetails;
    } else {
      alltransactions.displayName = "";
      alltransactions.CustomerCode = "";
      alltransactions.CustomerAddress = "";
      alltransactions.CustomerPhone = "";
    }
    return alltransactions;
  }

  async customerStatementSingle(id, userPayload: UserInterface) {
    const alltransactions = new AccountStatement();
    alltransactions.DateFrom = new Date("2023-12-01");
    alltransactions.Dateto = new Date();
    const allLedger = await this.ledgersService.getallLedgers();

    let statementdetails = [];
    if (id != null && id != 0) {
      alltransactions.LedgerID = id;
      let ledgerinformationindex = allLedger.findIndex((a) => a.id == id);
      let ledgerinformation = allLedger[ledgerinformationindex];

      const information = await this.customerService.findOneCustomerByLedgerid(id);

      alltransactions.displayName = ledgerinformation.name;
      alltransactions.CustomerCode = ledgerinformation.ledgerCode;
      alltransactions.CustomerAddress = ledgerinformation.name;
      const alltransactionHistories = await this.transactionHistoryRepository.createQueryBuilder("transhistory").leftJoinAndSelect("transhistory.ledger", "ledger").getMany();
      //&& a.transactionDate>= alltransactions.DateFrom && a.transactionDate<=alltransactions.Dateto
      let transactionHistories = alltransactionHistories
        .filter((a) => a.ledgerId == id)
        .sort((a, b) => {
          return a[0].transactionDate - b[0].transactionDate;
        })
        .sort((a, b) => {
          return a[0].transactionReference - b[0].transactionReference;
        });

      try {
        let openingtransaction = transactionHistories.find((a) => a.transactionSource == "Opening Balance");

        if (openingtransaction) {
          alltransactions.OpeningBalance = openingtransaction.closingBalance;
          transactionHistories = transactionHistories.filter((Productsdsad) => Productsdsad.transactionSource != "Opening Balance");
        } else {
          alltransactions.OpeningBalance = transactionHistories[0].openingBalance;
        }

        alltransactions.TotalDebit = transactionHistories.reduce((accumulator, currentValue) => accumulator + currentValue.debit, 0);

        alltransactions.TotalCredit = transactionHistories.reduce((accumulator, currentValue) => accumulator + currentValue.credit, 0);

        alltransactions.TotalDue = Number(alltransactions.OpeningBalance) + Number(alltransactions.TotalDebit) - Number(alltransactions.TotalCredit);

        let single = new AccountStatementDetails();
        single.Debit = 0;
        single.Credit = 0;
        single.AccountNumber = "";
        single.Description = "Balance B/F";

        single.Carieer = "";
        single.BillNo = "";
        single.Balance = alltransactions.OpeningBalance;
        statementdetails.push(single);
        alltransactions.ClosingBalance = transactionHistories[transactionHistories.length - 1].closingBalance;
      } catch (e) {
        alltransactions.OpeningBalance = ledgerinformation.accountOpeningBalance;
        alltransactions.ClosingBalance = ledgerinformation.closingBalance;
      }

      if (transactionHistories.length > 0) {
        transactionHistories.forEach((element) => {
          if (element.debit != 0 || element.credit != 0) {
            let single = new AccountStatementDetails();
            single.TransactionDate = element.transactionDate;
            single.Debit = element.debit;
            single.Credit = element.credit;
            single.AccountNumber = element.ledger.name;
            single.Description = element.remarks;
            single.Carieer = element.remarks;
            single.BillNo = element.transactionReference;
            single.Balance = element.closingBalance;

            statementdetails.push(single);

            //return Productsdsad;
          }
        });
      }

      alltransactions.statementdetails = statementdetails;
    } else {
      alltransactions.displayName = "";
      alltransactions.CustomerCode = "";
      alltransactions.CustomerAddress = "";
      alltransactions.CustomerPhone = "";
    }
    return alltransactions;
  }

  async vendorStatementSingle(id, userPayload: UserInterface) {
    const alltransactions = new AccountStatement();
    alltransactions.DateFrom = new Date("2023-12-01");
    alltransactions.Dateto = new Date();
    const allLedger = await this.ledgersService.getallLedgers();
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    let statementdetails = [];

    try {
      if (id != null && id != 0) {
        alltransactions.LedgerID = id;
        let ledgerinformationindex = allLedger.findIndex((a) => a.id == id);
        let ledgerinformation = allLedger[ledgerinformationindex];

        const information = await queryRunner.manager.findOne(VendorsEntity, { where: { ledgerId: id } });

        alltransactions.displayName = ledgerinformation.name;
        alltransactions.CustomerCode = ledgerinformation.ledgerCode;
        alltransactions.CustomerAddress = ledgerinformation.name;
        const alltransactionHistories = await this.transactionHistoryRepository.createQueryBuilder("transhistory").leftJoinAndSelect("transhistory.ledger", "ledger").getMany();
        //&& a.transactionDate>= alltransactions.DateFrom && a.transactionDate<=alltransactions.Dateto
        let transactionHistories = alltransactionHistories
          .filter((a) => a.ledgerId == id)
          .sort((a, b) => {
            return a[0].transactionDate - b[0].transactionDate;
          })
          .sort((a, b) => {
            return a[0].transactionReference - b[0].transactionReference;
          });

        try {
          let openingtransaction = transactionHistories.find((a) => a.transactionSource == "Opening Balance");

          if (openingtransaction) {
            alltransactions.OpeningBalance = openingtransaction.closingBalance;
            transactionHistories = transactionHistories.filter((Productsdsad) => Productsdsad.transactionSource != "Opening Balance");
          } else {
            alltransactions.OpeningBalance = transactionHistories[0].openingBalance;
          }

          alltransactions.TotalDebit = transactionHistories.reduce((accumulator, currentValue) => accumulator + currentValue.debit, 0);

          alltransactions.TotalCredit = transactionHistories.reduce((accumulator, currentValue) => accumulator + currentValue.credit, 0);

          alltransactions.TotalDue = Number(alltransactions.OpeningBalance) + Number(alltransactions.TotalDebit) - Number(alltransactions.TotalCredit);

          let single = new AccountStatementDetails();
          single.Debit = 0;
          single.Credit = 0;
          single.AccountNumber = "";
          single.Description = "Balance B/F";

          single.Carieer = "";
          single.BillNo = "";
          single.Balance = alltransactions.OpeningBalance;
          statementdetails.push(single);
          alltransactions.ClosingBalance = transactionHistories[transactionHistories.length - 1].closingBalance;
        } catch (e) {
          alltransactions.OpeningBalance = ledgerinformation.accountOpeningBalance;
          alltransactions.ClosingBalance = ledgerinformation.closingBalance;
        }

        if (transactionHistories.length > 0) {
          transactionHistories.forEach((element) => {
            if (element.debit != 0 || element.credit != 0) {
              let single = new AccountStatementDetails();
              single.TransactionDate = element.transactionDate;
              single.Debit = element.debit;
              single.Credit = element.credit;
              single.AccountNumber = element.ledger.name;
              single.Description = element.remarks;
              single.Carieer = element.remarks;
              single.BillNo = element.transactionReference;
              single.Balance = element.closingBalance;

              statementdetails.push(single);

              //return Productsdsad;
            }
          });
        }

        alltransactions.statementdetails = statementdetails;
      } else {
        alltransactions.displayName = "";
        alltransactions.CustomerCode = "";
        alltransactions.CustomerAddress = "";
        alltransactions.CustomerPhone = "";
      }
    } catch (err) {
      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException("Failed");
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction

    return alltransactions;
  }

  async accountStatementSingle(id, userPayload: UserInterface) {
    const alltransactions = new AccountStatement();
    alltransactions.DateFrom = new Date("2023-12-01");
    alltransactions.Dateto = new Date();
    const allLedger = await this.ledgersService.getallLedgers();

    // const bankledgers = allLedger.filter(a => a.ledgerCode.includes("B-"));

    // if (bankledgers.length > 0)
    // {
    //     alltransactions.AllLedgers = allLedger;
    // }

    let statementdetails = [];
    if (id != null && id != 0) {
      alltransactions.LedgerID = id;
      let ledgerinformationindex = allLedger.findIndex((a) => a.id == id);
      let ledgerinformation = allLedger[ledgerinformationindex];

      const information = await this.ledgersService.findOneLedgerByLedgerid(id);

      alltransactions.displayName = ledgerinformation.name;
      alltransactions.CustomerCode = ledgerinformation.ledgerCode;
      alltransactions.CustomerAddress = ledgerinformation.name;
      const alltransactionHistories = await this.transactionHistoryRepository.createQueryBuilder("transhistory").leftJoinAndSelect("transhistory.ledger", "ledger").getMany();
      //&& a.transactionDate>= alltransactions.DateFrom && a.transactionDate<=alltransactions.Dateto
      let transactionHistories = alltransactionHistories
        .filter((a) => a.ledgerId == id)
        .sort((a, b) => {
          return a[0].transactionDate - b[0].transactionDate;
        })
        .sort((a, b) => {
          return a[0].transactionReference - b[0].transactionReference;
        });

      try {
        let openingtransaction = transactionHistories.find((a) => a.transactionSource == "Opening Balance");

        if (openingtransaction) {
          alltransactions.OpeningBalance = openingtransaction.closingBalance;
          transactionHistories = transactionHistories.filter((Productsdsad) => Productsdsad.transactionSource != "Opening Balance");
        } else {
          alltransactions.OpeningBalance = transactionHistories[0].openingBalance;
        }

        alltransactions.TotalDebit = transactionHistories.reduce((accumulator, currentValue) => accumulator + currentValue.debit, 0);

        alltransactions.TotalCredit = transactionHistories.reduce((accumulator, currentValue) => accumulator + currentValue.credit, 0);

        alltransactions.TotalDue = Number(alltransactions.OpeningBalance) + Number(alltransactions.TotalDebit) - Number(alltransactions.TotalCredit);

        let single = new AccountStatementDetails();
        single.Debit = 0;
        single.Credit = 0;
        single.AccountNumber = "";
        single.Description = "Balance B/F";

        single.Carieer = "";
        single.BillNo = "";
        single.Balance = alltransactions.OpeningBalance;
        statementdetails.push(single);
        alltransactions.ClosingBalance = transactionHistories[transactionHistories.length - 1].closingBalance;
      } catch (e) {
        alltransactions.OpeningBalance = ledgerinformation.accountOpeningBalance;
        alltransactions.ClosingBalance = ledgerinformation.closingBalance;
      }

      if (transactionHistories.length > 0) {
        transactionHistories.forEach((element) => {
          if (element.debit != 0 || element.credit != 0) {
            let single = new AccountStatementDetails();
            single.TransactionDate = element.transactionDate;
            single.Debit = element.debit;
            single.Credit = element.credit;
            single.AccountNumber = element.ledger.name;
            single.Description = element.remarks;
            single.Carieer = element.remarks;
            single.BillNo = element.transactionReference;
            single.Balance = element.closingBalance;

            statementdetails.push(single);

            //return Productsdsad;
          }
        });
      }

      alltransactions.statementdetails = statementdetails;
    } else {
      alltransactions.displayName = "";
      alltransactions.CustomerCode = "";
      alltransactions.CustomerAddress = "";
      alltransactions.CustomerPhone = "";
    }
    return alltransactions;
  }

  /**
   * DROPDOWN -> banking
   */
  async banksdropdown() {
    return await this.ledgerRepository
      .createQueryBuilder("ledgers")
      .where(`ledgers.status = '${StatusField.ACTIVE}'`)
      //.where(`ledgers.ledgerCode = '${StatusField.ACTIVE}'`)
      .select(["ledgers.id as value", "ledgers.Name as label"])
      .getRawMany();
  }

  async balanceSheet(ipClientPayload: any, userPayload: UserInterface) {
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
    allstockglobal = await this.stockRepository.find({ where: { organizationId: userPayload.organizationId }, relations: ["product"] });
    allexpensehistory = alltransactionhistory.filter((a) => a.transactionSource == "Expense" || a.transactionSource == "Salary Payment");
    totalexpense = allexpensehistory.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0);

    allgroupsglobal = allgroupsglobal.filter((a) => a.groupType == 1 || a.groupType == 2 || a.groupType == 5);

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
          singleleddata.TotalExpense = 1;
          if (ledger.Name == "Profit & Loss Account") {
            let totalpurchase = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.pqty), 0);
            let totalsales = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgSalesRate) * Number(currentValue.sqty), 0);
            let totalclosing = allstockglobal.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.remaningqty), 0);
            let totalprofit = Number(totalsales) - (Number(totalpurchase) - Number(totalclosing)) - Number(totalexpense);

            singleleddata.TotalDeposit = totalprofit;
          } else {
            singleleddata.TotalDeposit = Number(ledger.closingBalance);
          }
          ledgerdettails.push(singleleddata);
        });

        let closingBalance = await this.CalculateParentExpense(group.id);

        single.CurrentBalance = closingBalance;
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

              singlechild4th.CurrentBalance = closingBalance4th;
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
              allexpensehistory = alltransactionhistory.filter((a) => a.transactionSource == "Expense" || a.transactionSource == "Salary Payment");
              totalexpense = allexpensehistory.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0);

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

  async profitLoss(ipClientPayload: any, userPayload: UserInterface) {
    const allstockdata = (allstockglobal = await this.stockRepository.find({ where: { organizationId: userPayload.organizationId }, relations: ["product"] }));
    const alltransactionhistory = await this.transactionHistoryRepository.find({ where: { organizationId: userPayload.organizationId } });
    const allg = [];

    let singlesales = new AllGroupViewEntity();
    singlesales.id = 1;
    singlesales.groupIdentifier = "";
    singlesales.groupName = "Net Sales";
    singlesales.groupParent = 0;
    singlesales.TotalExpense = 0;
    singlesales.TotalDeposit = allstockdata.reduce((accumulator, currentValue) => accumulator + Number(currentValue.avgSalesRate) * Number(currentValue.sqty), 0);

    allg.push(singlesales);

    let singlepurchase = new AllGroupViewEntity();
    singlepurchase.id = 2;
    singlepurchase.groupIdentifier = "";
    singlepurchase.groupName = "Cost of Sales";
    singlepurchase.groupParent = 0;
    singlepurchase.TotalExpense = 0;
    singlepurchase.TotalDeposit = allstockdata.reduce(
      (accumulator, currentValue) => accumulator + Number(currentValue.avgPurchaseRate) * Number(currentValue.pqty) - Number(currentValue.avgPurchaseRate) * Number(currentValue.remaningqty),
      0
    );

    allg.push(singlepurchase);

    let singlegrossprofit = new AllGroupViewEntity();
    singlegrossprofit.id = 3;
    singlegrossprofit.groupIdentifier = "";
    singlegrossprofit.groupName = "Gross Profit";
    singlegrossprofit.groupParent = 0;
    singlegrossprofit.TotalExpense = 0;
    singlegrossprofit.TotalDeposit = singlesales.TotalDeposit - singlepurchase.TotalDeposit;

    allg.push(singlegrossprofit);

    let expensetrans = alltransactionhistory.filter((a) => a.transactionSource == "Expense" || a.transactionSource == "Salary Payment");

    let singleexpesne = new AllGroupViewEntity();
    singleexpesne.id = 4;
    singleexpesne.groupIdentifier = "";
    singleexpesne.groupName = "Expense";
    singleexpesne.groupParent = 0;
    singleexpesne.TotalExpense = 0;
    singleexpesne.TotalDeposit = expensetrans.reduce((accumulator, currentValue) => accumulator + Number(currentValue.debit), 0);

    allg.push(singleexpesne);

    let singlenetprofit = new AllGroupViewEntity();
    singlenetprofit.id = 5;
    singlenetprofit.groupIdentifier = "";
    singlenetprofit.groupName = "Net Profit";
    singlenetprofit.groupParent = 0;
    singlenetprofit.TotalExpense = 0;
    singlenetprofit.TotalDeposit = singlegrossprofit.TotalDeposit - singleexpesne.TotalDeposit;

    allg.push(singlenetprofit);

    return allg;
  }

  //  async trialBalanceReport(ipClientPayload: any,
  //   userPayload: UserInterface) {
  //   const allGrpData = await this.accountingGroupRepository.find({
  //     where: { status: StatusField.ACTIVE }
  //   });
  //   allgroupsglobal = [];
  //   allledgersglobal = [];

  //   if(allGrpData.length>0)
  //   {
  //     allgroupsglobal.push.apply(allgroupsglobal, allGrpData);
  //     const allLedger = await this.ledgerRepository.find({
  //     where: { status: StatusField.ACTIVE }
  //     });

  //     if (allLedger.length > 0) {
  //       allledgersglobal.push.apply(allledgersglobal, allLedger);
  //     }
  //   }
  //   const allg = [];

  //   //First Level
  //   let maingroups = allgroupsglobal.filter(a => a.groupParent == null);
  //   await Promise.all( maingroups.map(async (group) => {
  //       let single = new AllGroupViewEntity();
  //       single.id = group.id;
  //       single.groupIdentifier = group.groupIdentifier;
  //       single.groupName = group.groupName;
  //       single.groupParent = group.groupParent;
  //       single.nature = group.nature;
  //       single.TotalExpense = 0;
  //       single.TotalDeposit = 0;

  //       let closingBalance =await this.CalculateParentExpense( group.id);

  //       single.CurrentBalance = closingBalance;
  //       single.ledgerdata = ledgerdettails;

  //       //#region Second Level

  //       let childs2ndlevel = [];

  //       let findnes2nd = allgroupsglobal.filter(a => a.groupParent == group.id);

  //       findnes2nd.map(async (child2nd) => {

  //         let singlechild2nd = new AllGroupViewEntity();
  //         singlechild2nd.id = child2nd.id;
  //         singlechild2nd.groupIdentifier = child2nd.groupIdentifier;
  //         singlechild2nd.groupName = child2nd.groupName;
  //         singlechild2nd.groupParent = child2nd.groupParent;
  //         singlechild2nd.nature = child2nd.nature;
  //         singlechild2nd.TotalExpense = 0;
  //         singlechild2nd.TotalDeposit = 0;

  //         let allLedgerchild2nd =allledgersglobal.filter(a => a.ledgerParent == child2nd.id);

  //         let ledgerdettailschild2nd = [];

  //         allLedgerchild2nd.map(async (ledgerchild2nd) => {
  //           let singleleddatachild2nd = new ChartLedgerViewModel();
  //           singleleddatachild2nd.ledgerdata = ledgerchild2nd;
  //           singleleddatachild2nd.TotalExpense = 1;
  //           singleleddatachild2nd.TotalDeposit = ledgerchild2nd.closingBalance;
  //           ledgerdettailschild2nd.push(singleleddatachild2nd);

  //         });

  //         let closingBalance2nd = await this.CalculateParentExpense(child2nd.id);

  //         singlechild2nd.CurrentBalance = closingBalance2nd;
  //         singlechild2nd.ledgerdata = ledgerdettailschild2nd;

  //         //#region Third Level
  //           let childs3rdlevel = [];
  //           let findnes3rd = allgroupsglobal.filter(a => a.groupParent == child2nd.id);
  //         findnes3rd.map(async (child3rd) => {

  //             let singlechild3rd = new AllGroupViewEntity();
  //             singlechild3rd.id = child3rd.id;
  //             singlechild3rd.groupIdentifier = child3rd.groupIdentifier;
  //             singlechild3rd.groupName = child3rd.groupName;
  //             singlechild3rd.groupParent = child3rd.groupParent;
  //             singlechild3rd.nature = child3rd.nature;
  //             singlechild3rd.TotalExpense = 0;
  //             singlechild3rd.TotalDeposit = 0;

  //             let allLedgerchild3rd =allledgersglobal.filter(a => a.ledgerParent == child3rd.id);

  //             let ledgerdettailschild3rd = [];

  //             allLedgerchild3rd.map(async (ledgerchild3rd) => {
  //             let singleleddatachild3rd= new ChartLedgerViewModel();
  //             singleleddatachild3rd.ledgerdata=ledgerchild3rd;
  //             singleleddatachild3rd.TotalExpense = 1;
  //               singleleddatachild3rd.TotalDeposit = ledgerchild3rd.closingBalance;
  //               ledgerdettailschild3rd.push(singleleddatachild3rd);

  //             });

  //             let closingBalance3rd =await this.CalculateParentExpense(child3rd.id);

  //             singlechild3rd.CurrentBalance = closingBalance3rd;
  //             singlechild3rd.ledgerdata = ledgerdettailschild3rd;

  //             //#region Forth Level
  //             let child4thlevel = [];

  //             let findnes4th = allgroupsglobal.filter(a => a.groupParent == child3rd.id);
  //             findnes4th.map(async (child4th) => {

  //               let singlechild4th = new AllGroupViewEntity();
  //               singlechild4th.id = child4th.id;
  //               singlechild4th.groupIdentifier = child4th.groupIdentifier;
  //               singlechild4th.groupName = child4th.groupName;
  //               singlechild4th.groupParent = child4th.groupParent;
  //               singlechild4th.nature = child4th.nature;
  //               singlechild4th.TotalExpense = 0;
  //               singlechild4th.TotalDeposit = 0;

  //               let allLedgerchild4th =allledgersglobal.filter(a => a.ledgerParent == child4th.id);

  //               let ledgerdettailschild4th= [];

  //               allLedgerchild4th.map(async (ledgerchild4th) => {
  //               let singleleddatachild4th= new ChartLedgerViewModel();
  //               singleleddatachild4th.ledgerdata=ledgerchild4th;
  //               singleleddatachild4th.TotalExpense = 1;
  //                 singleleddatachild4th.TotalDeposit = ledgerchild4th.closingBalance;
  //                 ledgerdettailschild4th.push(singleleddatachild4th);

  //               });

  //               let closingBalance4th =await this.CalculateParentExpense(child4th.id);

  //               singlechild4th.CurrentBalance = closingBalance4th;
  //               singlechild4th.ledgerdata = ledgerdettailschild4th;
  //               child4thlevel.push(singlechild4th);

  //               });

  //             singlechild3rd.childs = child4thlevel;
  //             childs3rdlevel.push(singlechild3rd);

  //           //#endregion

  //           });
  //       //#endregion

  //         //singlechild2nd.childs = childs3rdlevel;
  //         singlechild2nd.childs = childs3rdlevel;
  //         childs2ndlevel.push(singlechild2nd);

  //       });
  //       //#endregion

  //       single.childs = childs2ndlevel;

  //       allg.push(single);
  //     }))

  //   return allg;
  // }
}
