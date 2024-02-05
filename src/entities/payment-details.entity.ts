import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AccountsEntity } from "./accounts.entity";
import { InvoiceEntity } from "./invoice.entity";
import { PaymentReceivedEntity } from "./payment-received.entity";
import { OrganizationEntity } from "./organization.entity";

@Entity()
export class PaymentDetailsEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amountDue: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amountPaid: number;

    @Column({ type: "bigint", nullable: true })
    txnId: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    txnType: string;

    @ManyToOne(() => InvoiceEntity, (invoice) => invoice.paymentDeatils, {
        onDelete: "RESTRICT"
    })
    invoice: InvoiceEntity;

    @Column({ type: "varchar", length: 255 })
    bankreference: string;

    @ManyToOne(() => PaymentReceivedEntity, (payment) => payment.paymentDeatils, {
        onDelete: "RESTRICT"
    })
    payment: PaymentReceivedEntity;

    @Column({
        type: "bigint",
        nullable: true
    })
    invoiceId: number;

    @Column({ type: "varchar", nullable: true })
    refDoc: string;

    @Column({ type: "bigint" })
    organizationId: number;

    @Column({
        type: "bigint"
    })
    paymentsId: number;

    @ManyToOne(() => OrganizationEntity, (org) => org.paymentDetails, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;

    @Column({
        type: "bigint",
        nullable: true
    })
    qbRefId: number;
}
