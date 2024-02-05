
import { AccountsEntity } from "src/entities";
import { Entity } from "typeorm";
import { AccountStatementDetails } from "./accountstatementdetails.entity";

@Entity()
export class AccountStatement {
  DateFrom: Date;
  Dateto: Date;
  AllLedgers: Array<AccountsEntity>;
  LedgerID: number;
  ReportName: string;
  displayName: string;
  CustomerCode: string;
  CustomerAddress: string;
  CustomerPhone: string;
  AccountNumber: string;
  OpeningBalance: number;
  ClosingBalance: number;
  TotalDebit: number;
  TotalCredit: number;
  TotalDue: number;
  statementdetails: Array<AccountStatementDetails>;
}
