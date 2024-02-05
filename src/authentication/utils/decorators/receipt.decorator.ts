/**dependencies */
import { ApiBody } from "@nestjs/swagger";

const Voucher = "Voucher";
const Date = "date";
const DueAmount = "dueAmount";
const TransactionNo = "transactionNo";
const PaymentMethod = "paymentMethod";
const ReferenceDocument = "refDoc";
const Narration = "narration";
const Customer = "customer";
const Account = "account";
export const ReceiptApiDoc =
  (file = "file"): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      type: "multipart/form-data",
      schema: {
        type: "object",
        properties: {
          [Voucher]: {
            type: "string",
            nullable: true
          },
          [Date]: {
            type: "string",
            nullable: true
          },
          [DueAmount]: {
            type: "string",
            nullable: true
          },
          [TransactionNo]: {
            type: "string",
            nullable: true
          },
          [PaymentMethod]: {
            type: "string",
            nullable: true
          },
          [ReferenceDocument]: {
            type: "string",
            format: "binary",
            nullable: true
          },
          [Narration]: {
            type: "string",
            nullable: true
          },
          [Customer]: {
            type: "string",
            nullable: true
          },
          [Account]: {
            type: "number",
            nullable: true
          }
        }
      }
    })(target, propertyKey, descriptor);
  };
