import { CommonEntity } from "src/authentication/common";
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";

import { BillDetailsEntity, OrganizationEntity } from ".";
import { ProductsEntity } from "./Products.entity";

@Entity()
export class StockHistoryEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    avgPurchaseRate: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    pqty: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    purchaseAmount: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    avgSalesRate: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    sqty: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    soldAmount: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    remaningqty: number;

    @Column({ type: "bigint" })
    productId: number;

    @Column({ type: "bigint" })
    organizationId: number;

    @ManyToOne(() => ProductsEntity, (Product) => Product.stock, {
        onDelete: "RESTRICT"
    })
    product: ProductsEntity;

    @ManyToOne(() => OrganizationEntity, (org) => org.stkHst, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;
}
