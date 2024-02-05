import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AccountsEntity, OrganizationEntity } from ".";
import { ManualJournalDetailsEntity } from "./manual-journals-details.entity";

@Entity()
export class ManualJournalsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  journalNo: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  txnDate: Date;

  @Column({ type: "varchar", length: 255 })
  transactionId: string;

  @Column({ type: "bool" })
  adjustment: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  privateNote: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmt: number;

  @Column({ type: "bigint" })
  organizationId: number;

  @OneToMany(() => ManualJournalDetailsEntity, (journalDetails) => journalDetails.journal)
  journalDetails: ManualJournalDetailsEntity[];

  @ManyToOne(() => OrganizationEntity, (org) => org.paymentDetails, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;
}
