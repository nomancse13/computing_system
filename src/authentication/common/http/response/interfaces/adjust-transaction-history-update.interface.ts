export interface AdjustTransactionHistoryUpdateInterface {
  trnxDate: Date;
  transactionId: number;
  ledgerId: number;
  openingBalance: number;
  referenceCode: string;
}
