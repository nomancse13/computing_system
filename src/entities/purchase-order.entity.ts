import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AccountsEntity, OrganizationEntity } from ".";
import { PurchaseOrderDetailsEntity } from "./purchase-order-details.entity";

@Entity()
export class PurchaseOrderEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  docNumber: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  txnDate: Date;

  @Column({ type: "bool" })
  billable: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  reference: string;

  @Column({ type: "bigint" })
  creditLedgerId: number;

  @Column({ type: "varchar", length: 255 })
  poStatus: string;

  @Column({ type: "text", nullable: true })
  comment: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  vendorAddr: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmt: number;

  @ManyToOne(() => AccountsEntity, (creditLedger) => creditLedger.creditBill, {
    onDelete: "RESTRICT"
  })
  creditLedger: AccountsEntity;

  @OneToMany(() => PurchaseOrderDetailsEntity, (orderdetails) => orderdetails.order)
  orderdetails: PurchaseOrderDetailsEntity[];

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
