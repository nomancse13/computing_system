/**dependencies */
import { ApiBody } from "@nestjs/swagger";
import { StatusField } from "src/authentication/common/enum";

const fullName = "fullName";
const billAddr = "billAddr";
const permanentAddress = "permanentAddress";
const employeeCode = "employeeCode";
const password = "password";
const email = "email";
const gender = "gender";
const mobile = "mobile";
const dob = "dob";
const joiningDate = "joiningDate";
const openingBalance = "openingBalance";
const paymentMethod = "paymentMethod";
const totalSalary = "totalSalary";
const designationId = "designationId";
const userTypeId = "userTypeId";
export const EmployeeApiDoc =
  (file = "file"): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      type: "multipart/form-data",
      schema: {
        type: "object",
        properties: {
          [fullName]: {
            type: "string",
            nullable: true
          },
          [billAddr]: {
            type: "string",
            nullable: true
          },
          [permanentAddress]: {
            type: "string",
            nullable: true
          },
          [employeeCode]: {
            type: "string",
            nullable: true
          },
          [password]: {
            type: "string",
            nullable: true
          },
          [email]: {
            type: "string",
            nullable: true
          },
          [gender]: {
            type: "string",
            nullable: true
          },
          // [openingBalance]: {
          //   type: "number",
          //   nullable: true
          // },
          [dob]: {
            type: "string",
            nullable: true
          },
          [joiningDate]: {
            type: "string",
            nullable: true
          },
          [paymentMethod]: {
            type: "string",
            nullable: true
          },
          [mobile]: {
            type: "string",
            nullable: true
          },
          [totalSalary]: {
            type: "number",
            nullable: true
          },
          [designationId]: {
            type: "number",
            nullable: true
          },
          [userTypeId]: {
            type: "number",
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
