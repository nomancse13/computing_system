import { CommonEntity } from "src/authentication/common";
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import { OrganizationEntity } from ".";
import { ProductsEntity } from "./products.entity";

@Entity()
export class ProductCategoryEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "varchar", length: 255, unique: true })
    Name: string;

    @Column({ type: "bigint" })
    organizationId: number;

    @ManyToOne(() => OrganizationEntity, (org) => org.productsCategory, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;

    @Column({
        type: "bigint",
        nullable: true
    })
    qbRefId: number;

    @OneToMany(
        () => ProductsEntity,
        (product) => product.productcategory
    )
    products: ProductsEntity[];

    
}
