import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CustomersEntity, OrganizationEntity } from ".";
import { InvoiceDetailsEntity } from ".";
import { AccountsEntity } from ".";
import { CreditNoteDetailsEntity } from "./credit-note-details.entity";

@Entity()
export class CreditNotesEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", nullable: true })
  docNumber: string;

  @Column({ type: "varchar", length: 255 })
  creditNoteNo: string;

  @Column({ type: "varchar", length: 255 })
  transactionId: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  txnDate: Date;

  @Column({ type: "varchar", nullable: true })
  reference: string;

  @Column({ type: "bigint" })
  debitLedgerId: number;

  @Column({ type: "bigint" })
  creditLedgerId: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  customerMemo: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  billAddr: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  shipAddr: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  txnType: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalTax: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  netAmountTaxable: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmt: number;

  @Column({ type: "bool" })
  applyTaxAfterDiscount: boolean;

  @Column({ type: "bool" })
  freeFormAddress: boolean;

  @ManyToOne(() => AccountsEntity, (debitLedger) => debitLedger.debitInvoice, {
    onDelete: "RESTRICT"
  })
  debitLedger: AccountsEntity;

  @Column({ type: "bigint" })
  organizationId: number;

  @ManyToOne(() => AccountsEntity, (creditLedger) => creditLedger.creditInvoice, {
    onDelete: "RESTRICT"
  })
  creditLedger: AccountsEntity;

  @OneToMany(() => CreditNoteDetailsEntity, (invoiceDetails) => invoiceDetails.creditnoteDetails)
  creditnoteDetails: CreditNoteDetailsEntity[];

  @ManyToOne(() => OrganizationEntity, (org) => org.creditNotes, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;
}
