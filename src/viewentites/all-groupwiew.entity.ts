
import { Entity } from "typeorm";
import { ChartLedgerViewModel } from "./chartledgerwiew.entity";

@Entity()
export class AllGroupViewEntity {
  id: number;
  groupName: string;
  groupParent: number;
  groupIdentifier: string;
  nature: string;
  TotalExpense: number;
  TotalDeposit: number;
  CurrentBalance: number;
  ledgerdata: Array<ChartLedgerViewModel>;
  childs: Array<AllGroupViewEntity>;
}
