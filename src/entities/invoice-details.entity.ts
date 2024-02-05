import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AccountsEntity, OrganizationEntity, StockHistoryDetailsEntity } from ".";
import { InvoiceEntity } from ".";
import { ProductsEntity } from "./Products.entity";

@Entity()
export class InvoiceDetailsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  purchaseRate: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  qty: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string;

  // @Column({ type: "varchar", length: 255, nullable: true })
  // taxCodeRef: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  detailType: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: "bigint" })
  productId: number;

  @Column({ type: "bigint" })
  invoiceId: number;

  @ManyToOne(() => InvoiceEntity, (invoice) => invoice.invoiceDetails, {
    onDelete: "RESTRICT"
  })
  invoice: InvoiceEntity;

  @ManyToOne(() => ProductsEntity, (product) => product.stock, {
    onDelete: "RESTRICT"
  })
  product: ProductsEntity;

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;

  @Column({ type: "bigint", nullable: true })
  organizationId: number;

  @OneToMany(() => StockHistoryDetailsEntity, (stockDetails) => stockDetails.invoiceDetails)
  stockDetails: StockHistoryDetailsEntity[];

  @ManyToOne(() => OrganizationEntity, (org) => org.invoiceDetails, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;
}
