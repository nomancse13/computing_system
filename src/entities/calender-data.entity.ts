import { CommonEntity } from "src/authentication/common";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CalenderDataEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "Primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 100 })
  taskName: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  taskDate: Date;
}
