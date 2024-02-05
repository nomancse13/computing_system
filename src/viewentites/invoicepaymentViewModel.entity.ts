import {
    Column,
    Entity,
} from "typeorm";


export class InvoicePaymentViewModelEntity {
    @Column({ type: "bigint" })
    id: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    invoiceNo: string;

    @Column({ type: "timestamp", default: () => "NOW()" })
    txnDate: Date;

    @Column({ type: "varchar", length: 255, nullable: true })
    bankreference: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    totalAmount: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    totalDueAmount: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    totalPaymentAmount: number;

    @Column({ type: "string", nullable: true })
    file: any;

    @Column({ type: "bigint" })
    LedgerId: number;
}
