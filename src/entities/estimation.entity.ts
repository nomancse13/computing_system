import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrganizationEntity } from ".";
import { AccountsEntity } from ".";
import { EstimationDetailsEntity } from "./estiamtion-details.entity";

@Entity()
export class EstimationEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  estimationNo: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  comment: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  txnDate: Date;

  @Column({ type: "timestamp", default: () => "NOW()" })
  expirationDate: Date;

  @Column({ type: "bigint", nullable: true })
  docNumber: number;

  @Column({ type: "bigint", nullable: true })
  txnId: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  txnType: string;

  @Column({ type: "bigint" })
  debitLedgerId: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  reference: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  customerMemo: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  billAddr: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  shipAddr: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  billEmail: string;

  @Column({ type: "varchar", length: 255 })
  estimationStatus: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalTax: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subtotalAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  netAmountTaxable: number;

  @Column({ type: "bool" })
  applyTaxAfterDiscount: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmt: number;

  @Column({ type: "bigint", default: 8 })
  taxPercent: number;

  @Column({ type: "bigint", default: 0 })
  taxid: number;

  @Column({ type: "bigint" })
  organizationId: number;

  @ManyToOne(() => AccountsEntity, (debitLedger) => debitLedger.debitInvoice, {
    onDelete: "RESTRICT"
  })
  debitLedger: AccountsEntity;

  @ManyToOne(() => OrganizationEntity, (org) => org.invoice, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

  @OneToMany(() => EstimationDetailsEntity, (estimationDetails) => estimationDetails.estiamtion)
  estimationDetails: EstimationDetailsEntity[];

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;
}
