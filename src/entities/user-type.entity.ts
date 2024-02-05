import { IsNotEmpty, IsString } from "class-validator";
import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrganizationEntity, PermissionEntity } from ".";
import { UserEntity } from "src/entities";

@Entity()
export class UserTypeEntity extends CommonEntity {
    @PrimaryGeneratedColumn({
        type: "bigint",
        comment: "Primary id for the table"
    })
    id: number;

    @Column({ type: "varchar", length: 100 })
    @IsNotEmpty()
    @IsString()
    userTypeName: string;

    @Column({ type: "bigint" })
    organizationId: number;

    @Column({ type: "varchar", length: 100 })
    @IsNotEmpty()
    @IsString()
    slug: string;

    @Column({ type: "json", nullable: true })
    permissions: any;

    @ManyToOne(() => OrganizationEntity, (org) => org.users, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;

    @OneToMany(() => UserEntity, (user) => user.userType)
    users: UserEntity[];

}
