export interface AddTransactionInterface {
  debitLedgerId: number;
  creditLedgerId: number;
  transactionDate: any;
  debitAmount: number;
  creditAmount: number;
  referenceId: number;
  transactionId: string;
  transactionSource: string;
  userId: number;
  organizationId: number;
  remarks: string;
  transactionReference: string;
}
