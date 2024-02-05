import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { EmployeesEntity, OrganizationEntity } from ".";

@Entity()
export class DepartmentEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "varchar", length: 255 })
    name: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    note: string;

    @Column({ type: "bigint" })
    organizationId: number;

    // @OneToMany(() => EmployeesEntity, (employees) => employees.department)
    // employees: EmployeesEntity[];

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
