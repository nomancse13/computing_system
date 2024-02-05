import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AccountsEntity, OrganizationEntity } from ".";

@Entity()
export class TransactionHistoryEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "varchar", length: 255 })
    transactionId: string;

    @Column({ type: "timestamp", default: () => "NOW()" })
    transactionDate: Date;

    @Column({ type: "varchar", length: 255 })
    transactionType: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    debit: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    credit: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    openingBalance: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    closingBalance: number;

    @Column({ type: "varchar", length: 255 })
    transactionSource: string;

    @Column({ type: "varchar", length: 255 })
    transactionReference: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    remarks: string;

    @Column({
        type: "bigint"
    })
    referenceID: number;

    @Column({
        type: "bigint"
    })
    ledgerId: number;

    @Column({
        type: "bigint"
    })
    accountId: number;

    @ManyToOne(() => AccountsEntity, (ledger) => ledger.transactionHistory, {
        onDelete: "RESTRICT"
    })
    ledger: AccountsEntity;

    @Column({ type: "bigint" })
    organizationId: number;

    @ManyToOne(() => OrganizationEntity, (org) => org.users, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;

    @Column({
        type: "bigint",
        nullable: true
    })
    qbRefId: number;
}
