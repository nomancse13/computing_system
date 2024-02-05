import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BillDetailsEntity, InvoiceDetailsEntity, AccountsEntity, OrganizationEntity } from ".";
import { ProductsEntity } from "./Products.entity";

@Entity()
export class StockHistoryDetailsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  rate: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  qty: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  remainingAmount: number;

  @Column({ type: "bigint" })
  stockType: number;

  @Column({ type: "bigint" })
  productId: number;

  @Column({ type: "bigint", nullable: true })
  stockinId: number;

  @Column({ type: "bigint", nullable: true })
  stockoutId: number;

    @ManyToOne(() => ProductsEntity, (product) => product.stockDetails, {
    onDelete: "RESTRICT"
  })
    product: ProductsEntity;

  @ManyToOne(
    () => InvoiceDetailsEntity,
    (invoiceDetails) => invoiceDetails.stockDetails,
    {
      onDelete: "RESTRICT"
    }
  )
  invoiceDetails: InvoiceDetailsEntity;

    @ManyToOne(() => ProductsEntity, (Products) => Products.stockDetails, {
    onDelete: "RESTRICT"
  })
    Products: ProductsEntity;
  
  @Column({ type: "bigint" })
  organizationId: number;
  
  @ManyToOne(() => BillDetailsEntity, (bills) => bills.stockdetails, {
    onDelete: "RESTRICT"
  })
  bills: BillDetailsEntity;
  
  @ManyToOne(() => OrganizationEntity, (org) => org.stkHstDetails, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;
}
