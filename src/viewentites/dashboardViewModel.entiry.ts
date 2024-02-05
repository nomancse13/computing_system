import { AccountsEntity } from "src/entities";
import { Entity } from "typeorm";

@Entity()
export class DashboardViewModel {
    TotalCustomers: Number
    TotalTeachers: Number
    TotalEmployess: Number

    TotalPurchase: Number
    TotalallPurchase: Number
    LastMonthPurchase: Number
    PurchaseProgress: Number

    TotalSaless: Number
    TotalSalessMonth: Number
    LastMonthSales: Number
    SalesProgress: Number

    TotalPaidInvoice: Number
    TotalUnPaidInvoice: Number


    TotalExpense: Number
    LastMonthExpense: Number
    ExpenseProgress: Number

    TotalTExpense: Number
    LastMonthTExpense: Number
    TExpenseProgress: Number

    TotalTransactions: Number
    LastMonthTransactions: Number
    TransactionsProgress: Number

    TotalPaymentsReceived: Number
    LastMonthPaymentsReceived: Number
    PaymentsReceivedProgress: Number

    TotalPayments: Number
    LastMonthPayments: Number
    PaymentsProgress: Number

    TotalCreditMemo: Number
    LastMonthCreditMemo: Number
    CreditMemoProgress: Number

    TotalPurchaseReturn: Number
    LastMonthPurchaseReturn: Number
    PurchaseReturnProgress: Number

    AccountsReceivable: Number
    AccountsPayable: Number

    AdvancePayments: Number
    UnderPayments: Number

    TotalExpenses: {}
    TotalSales: {}
    YearlyTopExpense: {}
}