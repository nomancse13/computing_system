import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AccountsEntity, OrganizationEntity } from ".";
import { StockHistoryEntity } from "./stock-history.entity";
import { StockHistoryDetailsEntity } from "./stock-history-details.entity";
import { InvoiceDetailsEntity } from "./invoice-details.entity";
import { BillDetailsEntity } from "./bill-details.entity";
import { EstimationDetailsEntity } from "./estiamtion-details.entity";
import { PurchaseOrderDetailsEntity } from "./purchase-order-details.entity";
import { ProductCategoryEntity } from "./productCategory.entity";

@Entity()
export class ProductsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255, unique: true })
  itemName: string;

  @Column({ type: "varchar", length: 255 })
  productsCode: string;

  @Column({ type: "varchar" })
  itemType: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  sku: string;

  @Column({
    type: "bigint",
    nullable: true
  })
  unitPrice: number;

  @Column({
    type: "bigint"
  })
  sellingPrice: number;

  @Column({
    type: "bigint",
    nullable: true
  })
  ledgerId: number;

  @Column({
    type: "bigint",
    nullable: true
  })
  supplierLedgerId: number;

  @Column({
    type: "bool"
  })
  taxable: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  openingStock: number;

  @ManyToOne(() => AccountsEntity, (ledger) => ledger.Product, {
    onDelete: "RESTRICT"
  })
  ledger: AccountsEntity;

  @Column({ type: "bigint" })
  organizationId: number;

  @ManyToOne(() => OrganizationEntity, (org) => org.product, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

  @Column({ type: "bigint" })
  categoryId: number;

  @ManyToOne(() => ProductCategoryEntity, (productcategory) => productcategory.products, {
    onDelete: "RESTRICT"
  })
  productcategory: ProductCategoryEntity;

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;

  @OneToMany(() => StockHistoryEntity, (stock) => stock.product)
  stock: StockHistoryEntity[];

  @OneToMany(() => StockHistoryDetailsEntity, (stockDetails) => stockDetails.product)
  stockDetails: StockHistoryDetailsEntity[];

  @OneToMany(() => InvoiceDetailsEntity, (invoiceDetails) => invoiceDetails.product)
  invoiceDetails: InvoiceDetailsEntity[];

  @OneToMany(() => EstimationDetailsEntity, (estiamtionDetails) => estiamtionDetails.product)
  estiamtionDetails: EstimationDetailsEntity[];

  @OneToMany(() => PurchaseOrderDetailsEntity, (purchaseorderDetails) => purchaseorderDetails.product)
  purchaseorderDetails: PurchaseOrderDetailsEntity[];

  @OneToMany(() => BillDetailsEntity, (billDetails) => billDetails.product)
  billDetails: BillDetailsEntity[];
}
