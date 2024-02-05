import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrganizationEntity } from ".";

@Entity()
export class PaymentMethodEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "varchar", length: 255 })
    name: string;

    @Column({ type: "varchar", length: 255 })
    type: string;

    @Column({ type: "bigint" })
    organizationId: number;

    @ManyToOne(() => OrganizationEntity, (org) => org.desg, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;

    @Column({
        type: "bigint",
        nullable: true
    })
    qbRefId: number;
}
