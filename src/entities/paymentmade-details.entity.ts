import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BillEntity } from "./bill.entity";
import { OrganizationEntity } from "./organization.entity";
import { PaymentMadeEntity } from "./payment-made.entity";

@Entity()
export class PaymentMadeDetailsEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amountDue: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number;

    @Column({ type: "varchar", length: 255 })
    bankreference: string;

    @ManyToOne(() => BillEntity, (bill) => bill.paymentDeatils, {
        onDelete: "RESTRICT"
    })
    bill: BillEntity;

    @ManyToOne(() => PaymentMadeEntity, (payment) => payment.paymentDeatils, {
        onDelete: "RESTRICT"
    })
    payment: PaymentMadeEntity;

    @Column({
        type: "bigint",
        nullable: true
    })
    billId: number;

    @Column({ type: "varchar", nullable: true })
    refDoc: string;

    @Column({ type: "bigint", nullable: true })
    txnId: number;

    @Column({ type: "varchar", nullable: true })
    txnType: string;

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
