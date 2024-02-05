import { CommonEntity } from "src/authentication/common";
import { InvoiceEntity, AccountsEntity, OrganizationEntity } from ".";
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import { bool } from "aws-sdk/clients/redshiftdata";

@Entity()
export class CustomersEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "varchar", length: 255 })
    fullyQualifiedName: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    email: string;

    @Column({ type: "varchar", length: 255 })
    customerCode: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    givenName: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    displayName: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    companyName: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    familyName: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    mobile: string;

    @Column({ type: "boolean" })
    taxable: boolean;

    @Column({ type: "varchar", length: 255, nullable: true })
    contactPersons: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    printOnCheckName: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    billAddr: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    shippingAddress: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    openingBalance: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    creditLimit: number;

    @Column({ type: "bigint"})
    ledgerId: number;

    @ManyToOne(() => AccountsEntity, (ledger) => ledger.customers, {
        onDelete: "RESTRICT"
    })
    ledger: AccountsEntity;

    @Column({ type: "bigint" })
    organizationId: number;

    @ManyToOne(() => OrganizationEntity, (org) => org.desg, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;

    @Column({
        type: "bigint",
        nullable: true
    })
    qbRefId: number;
}
