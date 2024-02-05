import { CommonEntity } from "src/authentication/common";
import { BillEntity, CreditNotesEntity, EmployeesEntity, OrganizationEntity, PaymentReceivedEntity, UserEntity, VendorsEntity } from "src/entities";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BankAccountEntity, CustomersEntity, PaymentMadeEntity, SalaryEntity } from ".";

import { VendorDebitsEntity } from "src/entities/vendor-debits.entity";
import { ExpensesEntity, InvoiceEntity, ManualJournalsEntity, TransactionHistoryEntity } from ".";
import { ProductsEntity } from "./Products.entity";
import { ManualJournalDetailsEntity } from "./manual-journals-details.entity";

@Entity()
export class AccountsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: "bigint",
    comment: "primary id for the table"
  })
  id: number;

  @Column({ type: "varchar", length: 255 })
  fullyQualifiedName: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({
    type: "bigint"
  })
  ledgerParent: number;

  @Column({ type: "varchar" })
  accountType: string;

  @Column({ type: "varchar" })
  accountSubType: string;

  @Column({ type: "varchar", length: 255 })
  classification: string;

  @Column({ type: "varchar", length: 255 })
  ledgerCode: string;

  @Column({ type: "varchar", length: 255 })
  nature: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  accountOpeningBalance: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  openingBalance: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  closingBalance: number;

  @Column({ type: "bigint" })
  organizationId: number;

  @ManyToOne(() => OrganizationEntity, (org) => org.ledger, {
    onDelete: "RESTRICT"
  })
  organization: OrganizationEntity;

  @OneToMany(() => UserEntity, (user) => user.ledger)
  users: UserEntity[];

  @OneToMany(() => TransactionHistoryEntity, (th) => th.ledger)
  transactionHistory: TransactionHistoryEntity[];

  @OneToMany(() => BankAccountEntity, (banking) => banking.ledger)
  bankings: BankAccountEntity[];

  @OneToMany(() => ProductsEntity, (Product) => Product.ledger)
  Product: ProductsEntity[];

  @OneToMany(() => VendorsEntity, (supplierLedger) => supplierLedger.ledger)
  supplierLedger: VendorsEntity[];

  @OneToMany(() => CustomersEntity, (customers) => customers.ledger)
  customers: CustomersEntity[];

  @OneToMany(() => ManualJournalDetailsEntity, (jDetails) => jDetails.accountInfo)
  accountJournal: ManualJournalDetailsEntity;

  @OneToMany(() => SalaryEntity, (creditSalary) => creditSalary.creditLedger)
  creditSalary: SalaryEntity[];

  @Column({
    type: "bigint",
    nullable: true
  })
  qbRefId: number;

  @OneToMany(() => SalaryEntity, (debitSalary) => debitSalary.debitLedger)
  debitSalary: SalaryEntity[];

  @OneToMany(() => ExpensesEntity, (debitExpense) => debitExpense.debitLedger)
  debitExpense: ExpensesEntity[];

  @OneToMany(() => ExpensesEntity, (creditExpense) => creditExpense.creditLedger)
  creditExpense: ExpensesEntity[];

  @OneToMany(() => InvoiceEntity, (invoice) => invoice.debitLedger)
  invoice: InvoiceEntity[];

  @OneToMany(() => VendorDebitsEntity, (debitVendorDebits) => debitVendorDebits.debitLedger)
  debitVendorDebits: VendorDebitsEntity[];

  @OneToMany(() => VendorDebitsEntity, (creditVendorDebits) => creditVendorDebits.creditLedger)
  creditVendorDebits: VendorDebitsEntity[];

  @OneToMany(() => PaymentMadeEntity, (debitPaymentVoucher) => debitPaymentVoucher.debitLedger)
  debitPaymentVoucher: PaymentMadeEntity[];

  @OneToMany(() => PaymentMadeEntity, (creditPaymentVoucher) => creditPaymentVoucher.creditLedger)
  creditPaymentVoucher: PaymentMadeEntity[];

  @OneToMany(() => InvoiceEntity, (creditInvoice) => creditInvoice.creditLedger)
  creditInvoice: InvoiceEntity[];

  @OneToMany(() => InvoiceEntity, (debitInvoice) => debitInvoice.creditLedger)
  debitInvoice: InvoiceEntity[];

  @OneToMany(() => CreditNotesEntity, (creditNote) => creditNote.creditLedger)
  creditNote: CreditNotesEntity[];

  @OneToMany(() => CreditNotesEntity, (debitNote) => debitNote.debitLedger)
  debitNote: CreditNotesEntity[];

  @OneToMany(() => PaymentReceivedEntity, (creditPaymentReceived) => creditPaymentReceived.creditLedger)
  creditPaymentReceived: PaymentReceivedEntity[];

  @OneToMany(() => PaymentReceivedEntity, (debitPaymentReceived) => debitPaymentReceived.debitLedger)
  debitPaymentReceived: PaymentReceivedEntity[];

  @OneToMany(() => BillEntity, (debitBill) => debitBill.creditLedger)
  debitBill: BillEntity[];

  @OneToMany(() => BillEntity, (creditBill) => creditBill.debitLedger)
  creditBill: BillEntity[];

  @OneToMany(() => EmployeesEntity, (employee) => employee.ledger)
  employee: EmployeesEntity[];
}
