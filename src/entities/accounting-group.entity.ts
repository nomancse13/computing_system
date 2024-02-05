import { CommonEntity } from "src/authentication/common";
import { OrganizationEntity } from "."
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class AccountingGroupEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  groupName: string;

  @Column({
    type: "bigint",
    nullable: true
  })
  groupParent: number;

  @Column({ type: "varchar", length: 255 })
  groupIdentifier: string;

  @Column({
    type: "bigint",
    nullable: true
  })
  groupType: number;

  @Column({ type: "varchar", length: 255})
  nature: string;

  @Column({ type: "varchar", length: 255 })
  postedTo: string;

  @Column({ type: "varchar", length: 255 })
  groupHeadType: string;

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;
  
  @Column({ type: "bigint", nullable: true })
  organizationId: number;
               
  @ManyToOne(() => OrganizationEntity, (org) => org.accGrp, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

}
