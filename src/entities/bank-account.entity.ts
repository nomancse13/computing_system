import { CommonEntity } from "src/authentication/common";
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from "typeorm";
import { AccountsEntity, OrganizationEntity } from ".";

@Entity()
export class BankAccountEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  accountCode: string;

  @Column({ type: "varchar", length: 255 })
  bankAccountName: string;

  @Column({ type: "varchar", length: 255 })
  accountNumber: string;

  @Column({ type: "varchar", length: 255 })
  bankName: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  openingBalance: number;

  @Column({
    type: "bigint"
  })
  accountType: number;

  @Column({ type: "text", nullable: true })
  description: string;

  @ManyToOne(() => AccountsEntity, (ledger) => ledger.bankings, {
    onDelete: "RESTRICT"
  })
  ledger: AccountsEntity;
  
  @Column({ type: "bigint"})
  organizationId: number;
             
  @ManyToOne(() => OrganizationEntity, (org) => org.bank, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;

  @Column({
    type: "bigint"
  })
  ledgerId: number;
}
