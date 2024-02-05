
import { AccountsEntity } from "src/entities";
import { Entity } from "typeorm";

@Entity()
export class ChartLedgerViewModel {
  ledgerdata: AccountsEntity;
  TotalExpense: number;
  TotalDeposit: number;
}
