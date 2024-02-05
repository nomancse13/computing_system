/**dependencies */
import { ApiBody } from "@nestjs/swagger";

const paymentsNo = "paymentsNo";
const txnDate = "txnDate";
const paymentAmount = "paymentAmount";
const refDoc = "refDoc";
const debitLedgerId = "debitLedgerId";
const reference = "reference";
const comment = "comment";
const creditLedgerId = "creditLedgerId";
export const PaymentVoucherApiDoc =
  (file = "file"): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      type: "multipart/form-data",
      schema: {
        type: "object",
        properties: {
          [paymentsNo]: {
            type: "string",
            nullable: true
          },
          [txnDate]: {
            type: "string",
            nullable: true
          },
          [debitLedgerId]: {
            type: "number",
            nullable: true
          },
          [creditLedgerId]: {
            type: "number",
            nullable: true
          },
          [paymentAmount]: {
            type: "number",
            nullable: true
          },
          [comment]: {
            type: "string",
            nullable: true
          },
          [file]: {
            type: "string",
            format: "binary",
            nullable: true
          },

          [reference]: {
            type: "string",
            nullable: true
          }
        }
      }
    })(target, propertyKey, descriptor);
  };
