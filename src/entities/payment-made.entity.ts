import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AccountsEntity, OrganizationEntity } from ".";
import { BankAccountEntity } from ".";
import { PaymentMadeDetailsEntity } from "./paymentmade-details.entity";

@Entity()
export class PaymentMadeEntity extends CommonEntity {
    //payment_voucher_entity
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "varchar", length: 255 })
    paymentsNo: string;

    @Column({ type: "timestamp", default: () => "NOW()" })
    txnDate: Date;

    @Column({ type: "bigint" })
    totalAmt: number;

    @Column({ type: "varchar" })
    transactionId: string;

    @Column({ type: "bigint" })
    debitLedgerId: number;

    @Column({ type: "bigint" })
    creditLedgerId: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    reference: string;

    @Column({ type: "varchar", nullable: true })
    payType: string;

    @Column({ type: "varchar", nullable: true })
    refDoc: string;

    @Column({ type: "text", nullable: true })
    comment: string;

    @ManyToOne(
        () => AccountsEntity,
        (debitLedger) => debitLedger.debitPaymentVoucher,
        {
            onDelete: "RESTRICT"
        }
    )
    debitLedger: AccountsEntity;

    @ManyToOne(
        () => AccountsEntity,
        (creditLedger) => creditLedger.creditPaymentVoucher,
        {
            onDelete: "RESTRICT"
        }
    )
    creditLedger: AccountsEntity;

    @Column({ type: "bigint" })
    organizationId: number;

    @OneToMany(
        () => PaymentMadeDetailsEntity,
        (paymentDeatils) => paymentDeatils.payment
    )
    paymentDeatils: PaymentMadeDetailsEntity[];

    @ManyToOne(() => OrganizationEntity, (org) => org.paymentVoucher, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;

    @Column({
        type: "bigint",
        nullable: true
    })
    qbRefId: number;
}
