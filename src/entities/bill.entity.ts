import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AccountsEntity, OrganizationEntity } from ".";
import { BillDetailsEntity } from "./bill-details.entity";
import { PaymentMadeDetailsEntity } from "./paymentmade-details.entity";

@Entity()
export class BillEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  billNo: string;

  @Column({ type: "bool" })
  billable: boolean;

  @Column({ type: "timestamp", default: () => "NOW()" })
  txnDate: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  terms: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  dueDate: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  reference: string;

  @Column({ type: "bigint" })
  debitLedgerId: number;

  @Column({ type: "bigint" })
  creditLedgerId: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  vendorAddr: string;

  @Column({ type: "varchar", length: 255 })
  paymentStatus: string;

  @Column({ type: "text", nullable: true })
  comment: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmt: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalDueAmount: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  transactionId: string;

  @Column({ type: "varchar", nullable: true })
  refDoc: string;

  @ManyToOne(() => AccountsEntity, (debitLedger) => debitLedger.debitBill, {
    onDelete: "RESTRICT"
  })
  debitLedger: AccountsEntity;

  @ManyToOne(() => AccountsEntity, (creditLedger) => creditLedger.creditBill, {
    onDelete: "RESTRICT"
  })
  creditLedger: AccountsEntity;

  @OneToMany(() => BillDetailsEntity, (billDetails) => billDetails.bill)
  billDetails: BillDetailsEntity[];

  @OneToMany(() => PaymentMadeDetailsEntity, (paymentDeatils) => paymentDeatils.bill)
  paymentDeatils: PaymentMadeDetailsEntity[];

  @Column({ type: "bigint" })
  organizationId: number;

  @ManyToOne(() => OrganizationEntity, (org) => org.bills, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;

  @Column({ type: "json", nullable: true })
  Products: any;
}
