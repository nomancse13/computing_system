/**dependencies */
import { ApiBody } from "@nestjs/swagger";

const paymentNumber = "paymentNumber";
const txnDate = "txnDate";
const totalAmt = "totalAmt";
const refDoc = "refDoc";
const reference = "reference";
const comment = "comment";
const creditLedgerId = "creditLedgerId";
const debitLedgerId = "debitLedgerId";
const paymentMethod = "paymentMethod";

export const PaymentReceivedApiDoc =
  (file = "file"): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      type: "multipart/form-data",
      schema: {
        type: "object",
        properties: {
          [paymentNumber]: {
            type: "string",
            nullable: true
          },
          [txnDate]: {
            type: "string",
            nullable: true
          },
          [reference]: {
            type: "string",
            nullable: true
          },
          [comment]: {
            type: "string",
            nullable: true
          },
          [totalAmt]: {
            type: "number",
            nullable: true
          },

          [paymentMethod]: {
            type: "number",
            nullable: true
          },

          [file]: {
            type: "string",
            format: "binary",
            nullable: true
          },
          [creditLedgerId]: {
            type: "number",
            nullable: true
          },
          [debitLedgerId]: {
            type: "number",
            nullable: true
          }
        }
      }
    })(target, propertyKey, descriptor);
  };
