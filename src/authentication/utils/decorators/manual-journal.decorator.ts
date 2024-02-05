/**dependencies */
import { ApiBody } from "@nestjs/swagger";

const journalNo = "journalNo";
const comment = "comment";
const journalDate = "journalDate";
const debitLedgerId = "debitLedgerId";
const creditLedgerId = "creditLedgerId";
const debitAmount = "debitAmount";
const creditAmount = "creditAmount";
const reference = "reference";
export const ManualJournalApiDoc =
  (file = "file"): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      type: "multipart/form-data",
      schema: {
        type: "object",
        properties: {
          [journalNo]: {
            type: "string",
            nullable: true
          },
          [journalDate]: {
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
          [debitAmount]: {
            type: "number",
            nullable: true
          },
          [creditAmount]: {
            type: "number",
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
          [file]: {
            type: "string",
            format: "binary",
            nullable: true
          }
        }
      }
    })(target, propertyKey, descriptor);
  };
