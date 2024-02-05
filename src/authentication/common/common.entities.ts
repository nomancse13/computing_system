import { DateTime } from "aws-sdk/clients/rekognition";
import { Column, CreateDateColumn, DeleteDateColumn, Timestamp, UpdateDateColumn } from "typeorm";
import { StatusField } from "./enum";

export abstract class CommonEntity {
    @CreateDateColumn()
    createdAt: DateTime;

    @UpdateDateColumn({ nullable: true })
    updatedAt: DateTime;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: DateTime;

    @Column({ type: "int", nullable: true })
    createdBy: number;

    @Column({ type: "int", nullable: true })
    updatedBy: number;

    @Column({ type: "int", nullable: true })
    deletedBy: number;

    @Column({
        type: "enum",
        enum: StatusField,
        default: StatusField.ACTIVE
    })
    status: string;
}
