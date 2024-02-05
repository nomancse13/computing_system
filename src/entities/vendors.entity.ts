import { CommonEntity } from "src/authentication/common";
import { AccountsEntity, OrganizationEntity } from ".";
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";

@Entity()
export class VendorsEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    email: string;

    @Column({ type: "varchar", length: 255 })
    vendorCode: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    givenName: string;

    @Column({ type: "varchar", length: 255 })
    displayName: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    printOnCheckName: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    familyName: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    companyName: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    mobile: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    acctNum: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    fax: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    others: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    website: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    accountNo: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    routingNo: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    billAddr: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    openingBalance: number;

    @Column({ type: "bigint" })
    ledgerId: number;

    @ManyToOne(() => AccountsEntity, (ledger) => ledger.supplierLedger, {
        onDelete: "RESTRICT"
    })
    ledger: AccountsEntity;

    @Column({ type: "bigint" })
    organizationId: number;

    @ManyToOne(() => OrganizationEntity, (org) => org.vendors, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;

    @Column({
        type: "bigint",
        nullable: true
    })
    qbRefId: number;
}
