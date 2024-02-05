/**dependencies */
import { ApiBody } from "@nestjs/swagger";

const billNo = "billNo";
const txnDate = "txnDate";
const creditLedgerId = "creditLedgerId";
const comment = "comment";
const subTotalAmount = "subTotalAmount";
const totalAmount = "totalAmount";
const Products = "Products";
export const VendorInvoiceApiDoc =
  (file = "file"): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      type: "multipart/form-data",
      schema: {
        type: "object",
        properties: {
          [billNo]: {
            type: "string",
            nullable: true
          },
          [txnDate]: {
            type: "string",
            nullable: true
          },
          [comment]: {
            type: "string",
            nullable: true
          },
          [subTotalAmount]: {
            type: "number",
            nullable: true
          },
          [totalAmount]: {
            type: "number",
            nullable: true
          },

          [file]: {
            type: "string",
            format: "binary",
            nullable: true
          },

          [Products]: {
            type: "any",
            nullable: true
          },
          [creditLedgerId]: {
            type: "number",
            nullable: true
          }
        }
      }
    })(target, propertyKey, descriptor);
  };
