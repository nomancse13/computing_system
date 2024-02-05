import { CommonEntity } from "src/authentication/common";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductsEntity } from "./Products.entity";
import { AccountingGroupEntity } from "./accounting-group.entity";
import { BankAccountEntity } from "./bank-account.entity";
import { BillDetailsEntity } from "./bill-details.entity";
import { BillEntity } from "./bill.entity";
import { CreditNotesEntity } from "./credit-notes.entity";
import { CustomersEntity } from "./customers.entity";
import { DepartmentEntity } from "./department.entity";
import { EmployeesEntity } from "./employees.entity";
import { ExpensesEntity } from "./expenses.entity";
import { InvoiceDetailsEntity } from "./invoice-details.entity";
import { InvoiceEntity } from "./invoice.entity";
import { AccountsEntity } from "./accounts.entity";
import { ManualJournalsEntity } from "./manual-journals.entity";
import { PaymentDetailsEntity } from "./payment-details.entity";
import { PaymentMadeEntity } from "./payment-made.entity";
import { PaymentReceivedEntity } from "./payment-received.entity";
import { ProductCategoryEntity } from "./productCategory.entity";
import { SalaryEntity } from "./salary.entity";
import { StockHistoryDetailsEntity } from "./stock-history-details.entity";
import { StockHistoryEntity } from "./stock-history.entity";
import { UserTypeEntity } from "./user-type.entity";
import { UserEntity } from "./user.entity";
import { VendorsEntity } from "./vendors.entity";

@Entity()
export class OrganizationEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  organizationName: string;

  @Column({ type: "varchar", length: 255 })
  organizationLogo: string;

  @Column({ type: "varchar", length: 255 })
  organizationType: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  country: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  address: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  phone: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  currency: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  currencySymbol: string;

  @Column({ type: "bigint", nullable: true })
  qbaccounts: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  qbClientKey: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  qbClientSecret: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  realmeID: string;

  @Column({ type: "varchar", length: 5000, nullable: true })
  accessToken: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  refreshToken: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  tokenExpiresat: string;

  @OneToMany(() => UserEntity, (users) => users.organization)
  users: UserEntity[];

  @OneToMany(() => UserEntity, (vendorDebits) => vendorDebits.organization)
  vendorDebits: UserEntity[];

  @OneToMany(() => UserEntity, (tranHist) => tranHist.organization)
  tranHist: UserEntity[];

  @OneToMany(() => UserTypeEntity, (userType) => userType.organization)
  userType: UserTypeEntity[];

  @OneToMany(() => VendorsEntity, (vendors) => vendors.organization)
  vendors: VendorsEntity[];

  @OneToMany(() => StockHistoryEntity, (stkHst) => stkHst.organization)
  stkHst: StockHistoryEntity[];

  @OneToMany(() => StockHistoryDetailsEntity, (stkHstDetails) => stkHstDetails.organization)
  stkHstDetails: StockHistoryDetailsEntity[];

  @OneToMany(() => ProductsEntity, (product) => product.organization)
  product: ProductsEntity[];

  @OneToMany(() => ProductCategoryEntity, (productsCategory) => productsCategory.organization)
  productsCategory: ProductCategoryEntity[];

  @OneToMany(() => SalaryEntity, (salary) => salary.organization)
  salary: SalaryEntity[];

  @OneToMany(() => PaymentReceivedEntity, (paymentReceived) => paymentReceived.organization)
  paymentReceived: PaymentReceivedEntity[];

  @OneToMany(() => PaymentMadeEntity, (paymentMade) => paymentMade.organization)
  paymentVoucher: PaymentReceivedEntity[];

  @OneToMany(() => PaymentDetailsEntity, (paymentDetails) => paymentDetails.organization)
  paymentDetails: PaymentDetailsEntity[];

  @OneToMany(() => ManualJournalsEntity, (journal) => journal.organization)
  journal: ManualJournalsEntity[];

  @OneToMany(() => AccountsEntity, (ledger) => ledger.organization)
  ledger: AccountsEntity[];

  @OneToMany(() => InvoiceEntity, (invoice) => invoice.organization)
  invoice: InvoiceEntity[];

  @OneToMany(() => InvoiceDetailsEntity, (invoiceDetails) => invoiceDetails.organization)
  invoiceDetails: InvoiceDetailsEntity[];

  @OneToMany(() => ExpensesEntity, (expenses) => expenses.organization)
  expenses: ExpensesEntity[];

  @OneToMany(() => EmployeesEntity, (employees) => employees.organization)
  employees: EmployeesEntity[];

  @OneToMany(() => DepartmentEntity, (desg) => desg.organization)
  desg: DepartmentEntity[];

  @OneToMany(() => CustomersEntity, (customers) => customers.organization)
  customers: CustomersEntity[];

  @OneToMany(() => CreditNotesEntity, (creditNotes) => creditNotes.organization)
  creditNotes: CreditNotesEntity[];

  @OneToMany(() => BillEntity, (bills) => bills.organization)
  bills: BillEntity[];

  @OneToMany(() => BillDetailsEntity, (billDetails) => billDetails.organization)
  billDetails: BillDetailsEntity[];

  @OneToMany(() => BankAccountEntity, (bank) => bank.organization)
  bank: BankAccountEntity[];

  @OneToMany(() => AccountingGroupEntity, (accGrp) => accGrp.organization)
  accGrp: AccountingGroupEntity[];
}
