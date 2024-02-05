import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProductsEntity } from "./Products.entity";
import { OrganizationEntity } from "./organization.entity";
import { VendorDebitsEntity } from "./vendor-debits.entity";

@Entity()
export class VendorCreditDetailsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  qty: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  linkedTnx: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  linkedTnxType: string;

  @Column({ type: "bigint" })
  organizationId: number;

  @Column({ type: "bigint" })
  purchaseRetId: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  detailType: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  projectRef: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  taxCodeRef: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  accountRef: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  accountRefName: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  billableStatus: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  customerRef: string;

  @Column({
    type: "bigint",
    nullable: true
  })
  productId: number;

  @ManyToOne(() => ProductsEntity, (product) => product.billDetails, {
    onDelete: "RESTRICT"
  })
  product: ProductsEntity;

  @ManyToOne(() => OrganizationEntity, (org) => org.paymentDetails, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

  @ManyToOne(() => VendorDebitsEntity, (purchaseRet) => purchaseRet.purchaseRetDetails, {
    onDelete: "RESTRICT"
  })
  purchaseRet: VendorDebitsEntity;

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;
}
