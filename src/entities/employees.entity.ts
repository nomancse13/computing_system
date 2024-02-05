/**dependencies */
import { CommonEntity } from "src/authentication/common";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AccountsEntity, OrganizationEntity } from ".";

/**common entity data */
@Entity()
export class EmployeesEntity extends CommonEntity {
  @PrimaryGeneratedColumn({})
  id: number;

  @Column({ type: "varchar", length: 255 })
  displayName: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  printOnCheckName: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  familyName: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  givenName: string;

  @Column({ type: "varchar", length: 100 })
  employeeCode: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  gender: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  mobile: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  primaryAddr: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  dob: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  hireDate: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  releaseDate: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  paymentMethod: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  ssn: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  employeeID: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  billingrate: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalSalary: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  profileImgSrc: string;

  @Column({ type: "bigint" })
  organizationId: number;

  // @Column({ type: "bigint" })
  // departmentId: number;

  // @ManyToOne(() => DepartmentEntity, (department) => department.employees, {
  //   onDelete: "RESTRICT"
  // })
  // department: DepartmentEntity;

  @ManyToOne(() => AccountsEntity, (ledger) => ledger.employee, {
    onDelete: "RESTRICT"
  })
  ledger: AccountsEntity;

  @Column({
    type: "bigint",
    nullable: true
  })
  ledgerId: number;

  @ManyToOne(() => OrganizationEntity, (org) => org.employees, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;
}
