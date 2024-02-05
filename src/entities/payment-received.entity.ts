import { CommonEntity } from "src/authentication/common";
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import { AccountsEntity } from "./accounts.entity";
import { PaymentDetailsEntity } from "./payment-details.entity";
import { OrganizationEntity } from "./organization.entity";

@Entity()
export class PaymentReceivedEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "varchar", length: 255 })
    paymentNumber: string;

    @Column({ type: "timestamp", default: () => "NOW()" })
    txnDate: Date;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    totalAmt: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    unappliedAmt: number;

    @Column({ type: "bigint" })
    debitLedgerId: number;

    @Column({ type: "bigint" })
    creditLedgerId: number;

    @Column({ type: "bigint", nullable: true })
    depositToAccountRef: number;

    @Column({ type: "bigint", nullable: true })
    paymentMethodRef: number;

    @Column({ type: "bigint", nullable: true })
    txnId: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    txnType: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    paymentRefNum: string;

    @Column({ type: "bigint" })
    organizationId: number;

    @Column({ type: "varchar", nullable: true })
    refDoc: string;

    @Column({ type: "varchar" })
    transactionId: string;

    @Column({ type: "text", nullable: true })
    comment: string;

    @ManyToOne(
        () => AccountsEntity,
        (creditCustomer) => creditCustomer.creditPaymentReceived,
        {
            onDelete: "RESTRICT"
        }
    )
    creditLedger: AccountsEntity;

    @ManyToOne(
        () => AccountsEntity,
        (debitAccount) => debitAccount.debitPaymentReceived,
        {
            onDelete: "RESTRICT"
        }
    )
    debitLedger: AccountsEntity;

    @OneToMany(
        () => PaymentDetailsEntity,
        (paymentDeatils) => paymentDeatils.payment
    )
    paymentDeatils: PaymentDetailsEntity[];

    @ManyToOne(() => OrganizationEntity, (org) => org.paymentReceived, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;

    @Column({
        type: "bigint",
        nullable: true
    })
    qbRefId: number;
}
