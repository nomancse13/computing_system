import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ModuleEntity } from ".";
import { UserTypeEntity } from "./user-type.entity";

@Entity()
export class PermissionEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "boolean", default: true })
  create: boolean;

  @Column({ type: "boolean", default: true })
  list: boolean;

  @Column({ type: "boolean", default: true })
  update: boolean;

  @Column({ type: "boolean", default: true })
  delete: boolean;

  @Column({ type: "boolean", default: true })
  fullAccess: boolean;

  @ManyToOne(() => ModuleEntity, (module) => module.permission, {
    onDelete: "RESTRICT"
  })
  module: ModuleEntity;

}
