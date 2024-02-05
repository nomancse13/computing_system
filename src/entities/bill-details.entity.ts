import { CommonEntity } from "src/authentication/common";
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import { OrganizationEntity, StockHistoryDetailsEntity } from ".";
import { BillEntity } from "./bill.entity";
import { ProductsEntity } from "./Products.entity";

@Entity()
export class BillDetailsEntity extends CommonEntity {
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
    tax: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    description: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    taxCodeRef: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    billableStatus: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    detailType: string;

    @Column({
        type: "bigint", nullable: true
    })
    productId: number;

    @Column({
        type: "bigint"
    })
    billId: number;

    @ManyToOne(() => BillEntity, (bill) => bill.billDetails, {
        onDelete: "RESTRICT"
    })
    bill: BillEntity;

    @ManyToOne(() => ProductsEntity, (product) => product.billDetails, {
        onDelete: "RESTRICT"
    })
    product: ProductsEntity;

    @Column({ type: "bigint" })
    organizationId: number;

    @OneToMany(
        () => StockHistoryDetailsEntity,
        (stockdetails) => stockdetails.bills
    )
    stockdetails: StockHistoryDetailsEntity[];

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
