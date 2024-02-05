import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrganizationEntity } from ".";
import { AccountsEntity } from ".";
import { VendorCreditDetailsEntity } from "./vendorcredit-details.entity";

@Entity()
export class VendorDebitsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  debitNoteNo: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  reference: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  comment: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  linkedTnx: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  linkedTnxType: string;

  @Column({ type: "varchar", length: 255 })
  transactionId: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subTotalAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  taxAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmt: number;

  @Column({ type: "timestamp", default: () => "NOW()" })
  txnDate: Date;

  @Column({ type: "bigint" })
  debitLedgerId: number;

  @Column({ type: "bigint" })
  creditLedgerId: number;

  @Column({ type: "bigint" })
  organizationId: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  vendorAddr: string;

  @ManyToOne(() => AccountsEntity, (debitLedger) => debitLedger.debitVendorDebits, {
    onDelete: "RESTRICT"
  })
  debitLedger: AccountsEntity;

  @ManyToOne(() => AccountsEntity, (creditLedger) => creditLedger.creditVendorDebits, {
    onDelete: "RESTRICT"
  })
  creditLedger: AccountsEntity;

  @ManyToOne(() => OrganizationEntity, (org) => org.users, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

  @OneToMany(() => VendorCreditDetailsEntity, (purchaseRetDetails) => purchaseRetDetails.purchaseRet)
  purchaseRetDetails: VendorCreditDetailsEntity[];

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;
}
