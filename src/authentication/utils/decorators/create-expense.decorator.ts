/**dependencies */
import { ApiBody } from "@nestjs/swagger";

const expenseNo = "expenseNo";
const expenseDate = "expenseDate";
const expenseAmount = "expenseAmount";
const debitLedgerId = "debitLedgerId";
const creditLedgerId = "creditLedgerId";
const comment = "comment";
const reference = "reference";
const transportExpense = "transportExpense";
export const ExpenseApiDoc =
  (file = "file"): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      type: "multipart/form-data",
      schema: {
        type: "object",
        properties: {
          [expenseNo]: {
            type: "string",
            nullable: true
          },
          [expenseDate]: {
            type: "string",
            nullable: true
          },
          [expenseAmount]: {
            type: "number",
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
          [comment]: {
            type: "string",
            nullable: true
          },
          [reference]: {
            type: "string",
            nullable: true
          },
          [transportExpense]: {
            type: "string",
            nullable: true
          },
          [file]: {
            type: "string",
            format: "binary",
            nullable: true
          }
        }
      }
    })(target, propertyKey, descriptor);
  };
