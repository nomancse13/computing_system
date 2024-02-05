import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class MailConfigurationsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  emailFrom: string;

  @Column({ type: "varchar", length: 255 })
  Password: string;

  @Column({ type: "varchar", length: 255 })
  MailProtocol: string;

  @Column({ type: "varchar", length: 255 })
  MailAddressLink: string;

  @Column({ type: "varchar", length: 255 })
  MailPortNumber: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  MailCC1: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  MailCC2: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  MailCC3: string;

  @Column({ type: "varchar", length: 255 })
  MailSubject: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  mailType: string;
}
