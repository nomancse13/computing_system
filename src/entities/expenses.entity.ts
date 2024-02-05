import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AccountsEntity } from "./accounts.entity";
import { AccountingGroupEntity } from "./accounting-group.entity";
import { BankAccountEntity } from "./bank-account.entity";
import { OrganizationEntity } from "./organization.entity";

@Entity()
export class ExpensesEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "timestamp", default: () => "NOW()" })
    expenseDate: Date;

    @Column({ type: "varchar", length: 255 })
    transactionId: string;

    @Column({ type: "varchar", length: 255 })
    expenseNo: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    expenseAmount: number;

    @Column({ type: "bigint" })
    debitLedgerId: number;

    @Column({ type: "bigint" })
    creditLedgerId: number;

    @Column({ type: "varchar", nullable: true })
    reference: string;

    @Column({ type: "text", nullable: true })
    comment: string;

    @Column({ type: "varchar", nullable: true })
    refDoc: string;

    @ManyToOne(() => AccountsEntity, (debitLedger) => debitLedger.debitExpense, {
        onDelete: "RESTRICT"
    })
    debitLedger: AccountsEntity;

    @Column({ type: "bigint" })
    organizationId: number;

    @ManyToOne(
        () => AccountsEntity,
        (creditLedger) => creditLedger.creditExpense,
        {
            onDelete: "RESTRICT"
        }
    )
    creditLedger: AccountsEntity;

    @ManyToOne(() => OrganizationEntity, (org) => org.expenses, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;

    @Column({
        type: "bigint",
        nullable: true
    })
    qbRefId: number;
}
