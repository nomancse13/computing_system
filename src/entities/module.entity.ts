import { CommonEntity } from "src/authentication/common";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PermissionEntity } from ".";

@Entity()
export class ModuleEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "primary id for the table"
    })
    id: number;

    @Column({ type: "bigint", nullable: true })
    organizationId: number;

    @Column({ type: "varchar", length: 255 })
    modulename: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    controllerName: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    serviceName: string;

    @OneToMany(() => PermissionEntity, (permission) => permission.module)
    permission: PermissionEntity[];
}