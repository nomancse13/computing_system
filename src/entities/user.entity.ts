/**dependencies */
import { CommonEntity } from "src/authentication/common";
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import { AccountsEntity, OrganizationEntity } from ".";
import { DeviceHistoryEntity } from "./devices-history.entity";
import { LoginHistoryEntity } from "./login-history.entity";
import { ActivityLogEntity } from ".";
import { UserTypeEntity } from "./user-type.entity";
/**common entity data */
@Entity("user")
export class UserEntity extends CommonEntity {
    @PrimaryGeneratedColumn({})
    id: number;

    @Column({ type: "varchar", length: 100 })
    fullName: string;

    @Column({ type: "varchar", length: 100 })
    email: string;

    @Column({ type: "varchar", length: 255 })
    password: string;

    @Column({ type: "varchar", length: 20, nullable: true })
    mobile: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    hashedRt: string;

    @Column({
        type: "varchar"
    })
    gender: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    profileImgSrc: string;

    @Column({ type: "varchar", length: "255", nullable: true, select: false })
    passResetToken: string;

    @Column({ type: "timestamp", select: false, nullable: true })
    passResetTokenExpireAt: Date;

    @Column({ type: "uuid", nullable: true })
    uniqueId: string;

    @Column({ type: "bigint" })
    userTypeId: number;

    @ManyToOne(() => UserTypeEntity, (userType) => userType.users, {
        onDelete: "RESTRICT"
    })
    userType: UserTypeEntity;

    @Column({
        type: "int"
    })
    ledgerId: number;

    @Column({
        type: "int"
    })
    organizationId: number;

    @ManyToOne(() => AccountsEntity, (ledger) => ledger.users, {
        onDelete: "RESTRICT"
    })
    ledger: AccountsEntity;

    @ManyToOne(() => OrganizationEntity, (org) => org.users, {
        onDelete: "RESTRICT"
    })
    organization: OrganizationEntity;

    @OneToMany(() => DeviceHistoryEntity, (devices) => devices.user)
    devices: DeviceHistoryEntity[];

    @OneToMany(() => LoginHistoryEntity, (login) => login.user)
    login: LoginHistoryEntity[];

    @OneToMany(() => ActivityLogEntity, (log) => log.user)
    log: ActivityLogEntity[];
}
