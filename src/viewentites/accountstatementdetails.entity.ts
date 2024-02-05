
import { AccountsEntity } from "src/entities";
import { Entity } from "typeorm";

@Entity()
export class AccountStatementDetails {
  TransactionDate: Date;
  AccountNumber: string;
  Description: string;
  Carieer: string;
  BillNo: string;
  Debit: number;
  Credit: number;
  Balance: number;
 
}
