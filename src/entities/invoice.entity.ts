import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CustomersEntity, OrganizationEntity } from ".";
import { InvoiceDetailsEntity } from ".";
import { AccountsEntity } from ".";
import { PaymentDetailsEntity } from "./payment-details.entity";

@Entity()
export class InvoiceEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", nullable: true })
  docNumber: string;

  @Column({ type: "varchar", length: 255 })
  invoiceNo: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  comment: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  billEmail: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  txnDate: Date;

  @Column({ type: "bigint" })
  debitLedgerId: number;

  @Column({ type: "bigint" })
  creditLedgerId: number;

  @Column({ type: "bigint" })
  subtotalAmount: number;

  @Column({ type: "varchar", length: 255 })
  transactionId: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  reference: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  terms: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  dueDate: Date;

  @Column({ type: "varchar", length: 255 })
  paymentStatus: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  billAddr: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  shipAddr: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalTax: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  netAmountTaxable: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmt: number;

  @Column({ type: "bigint", nullable: true })
  txnId: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  txnType: string;

  @Column({ type: "bool" })
  applyTaxAfterDiscount: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalDueAmount: number;

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

  @ManyToOne(() => AccountsEntity, (creditLedger) => creditLedger.creditInvoice, {
    onDelete: "RESTRICT"
  })
  creditLedger: AccountsEntity;

  @OneToMany(() => InvoiceDetailsEntity, (invoiceDetails) => invoiceDetails.invoice)
  invoiceDetails: InvoiceDetailsEntity[];

  @OneToMany(() => PaymentDetailsEntity, (paymentDeatils) => paymentDeatils.invoice)
  paymentDeatils: PaymentDetailsEntity[];

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;
}
