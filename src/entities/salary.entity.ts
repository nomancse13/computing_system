/**dependencies */
import { CommonEntity } from "src/authentication/common";
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import { EmployeesEntity, OrganizationEntity } from ".";
import { BankAccountEntity } from ".";
import { AccountsEntity } from ".";

/**common entity data */
@Entity()
export class SalaryEntity extends CommonEntity {
    @PrimaryGeneratedColumn({})
    id: number;

    @Column({
        type: "text"
    })
    note: string;

    @Column({ type: "varchar", length: 255 })
    month: string;

    @Column({ type: "varchar", length: 255 })
    paymentNo: string;

    @Column({ type: "varchar", length: 255 })
    transactionId: string;

    @Column({ type: "timestamp", default: () => "NOW()" })
    txnDate: Date;

    @Column({ type: "bigint" })
    debitLedgerId: number;

    @Column({ type: "varchar" })
    creditLedgerId: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    totalAmount: number;

    @Column({ type: "bigint" })
    organizationId: number;

    @ManyToOne(() => AccountsEntity, (debitLedger) => debitLedger.debitSalary, {
        onDelete: "RESTRICT"
    })
    debitLedger: AccountsEntity;

    @ManyToOne(() => AccountsEntity, (creditLedger) => creditLedger.creditSalary, {
        onDelete: "RESTRICT"
    })
    creditLedger: AccountsEntity;

    @ManyToOne(() => OrganizationEntity, (org) => org.salary, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;
}
