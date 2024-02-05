import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity()
export class DeviceHistoryEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "Primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  cLientIPAddress: string;
  
  @Column({ type: "bigint" })
  organizationId: number;

  @Column({ type: "varchar", length: 255 })
  browser: string;

  @Column({ type: "text" })
  address: string;

  @Column({ type: "varchar", length: 255 })
  os: string;

  @ManyToOne(() => UserEntity, (user) => user.devices, {
    onDelete: "RESTRICT"
  })
  user: UserEntity;
}
