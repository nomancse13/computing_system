import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity()
export class LoginHistoryEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "Primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  cLientIPAddress: string;
  
  @Column({ type: "bigint" })
  organizationId: number;

  @Column({
    type: "json"
  })
  browser: any;

  @Column({
    type: "json"
  })
  os: any;

  @Column({ type: "timestamp", default: () => "NOW()" })
  loginTime: Date;

  @ManyToOne(() => UserEntity, (user) => user.login, {
    onDelete: "RESTRICT"
  })
  user: UserEntity;
}
