import { CommonEntity } from "src/authentication/common";
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from "typeorm";
import { PermissionEntity } from ".";
import { UserEntity } from "src/entities";

@Entity()
export class ActivityLogEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  cLientIPAddress: string;

  @Column({
    type: "json"
  })
  browser: any;

  @Column({
    type: "json"
  })
  os: any;

  @Column({
    type: "json"
  })
  messageDetails: any;
  
  @Column({ type: "bigint" })
  organizationId: number;

  @Column({
    type: "json",
    nullable: true
  })
  logData: any;

  @ManyToOne(() => UserEntity, (user) => user.login, {
    onDelete: "RESTRICT"
  })
  user: UserEntity;
}
