import { CommonEntity } from "src/authentication/common";
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import { OrganizationEntity } from ".";
import { PurchaseOrderEntity } from "./purchase-order.entity";
import { ProductsEntity } from "./Products.entity";

@Entity()
export class PurchaseOrderDetailsEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    qty: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    totalAmount: number;

    @Column({
        type: "bigint"
    })
    productId: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    taxCodeRef: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    detailType: string;

    @Column({
        type: "bigint",
        nullable: true
    })
    taxCodeId: number;

    @Column({
        type: "bigint",
        nullable: true
    })
    taxPercent: number;

    @Column({
        type: "bigint"
    })
    orderId: number;

    @ManyToOne(() => PurchaseOrderEntity, (order) => order.orderdetails, {
        onDelete: "RESTRICT"
    })
    order: PurchaseOrderEntity;

    @ManyToOne(() => ProductsEntity, (product) => product.purchaseorderDetails, {
        onDelete: "RESTRICT"
    })
    product: ProductsEntity;


    @Column({ type: "bigint" })
    organizationId: number;

    @ManyToOne(() => OrganizationEntity, (org) => org.billDetails, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;

    @Column({
        type: "bigint",
        nullable: true
    })
    qbRefId: number;
}
