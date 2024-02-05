import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AccountsEntity, ManualJournalsEntity, OrganizationEntity } from ".";

@Entity()
export class ManualJournalDetailsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  transactionId: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  detailType: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  postingType: string;

  @Column({ type: "bigint" })
  accountId: number;

  @Column({ type: "bigint" })
  journalId: number;

  @ManyToOne(() => ManualJournalsEntity, (journal) => journal.journalDetails, {
    onDelete: "RESTRICT"
  })
  journal: ManualJournalsEntity;

  @ManyToOne(() => AccountsEntity, (details) => details.accountJournal, {
    onDelete: "RESTRICT"
  })
  accountInfo: AccountsEntity;

  @Column({ type: "bigint" })
  organizationId: number;

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
