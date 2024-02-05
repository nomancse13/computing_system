import { CommonEntity } from "src/authentication/common";
import { OrganizationEntity } from "src/entities";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class TaxRate extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  rateValue: string;

  @Column({ type: "varchar", length: 255 })
  taxApplicableOn: string;

  @Column({ type: "varchar" })
  taxRateName: string;

  @Column({ type: "bigint" })
  organizationId: number;

  @ManyToOne(() => OrganizationEntity, (org) => org.ledger, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;

  
}
