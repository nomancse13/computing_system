/**dependencies */
import { ApiBody } from "@nestjs/swagger";
import { StatusField } from "src/authentication/common/enum";

const organizationName = "organizationName";
const organizationType = "organizationType";
const password = "password";
const email = "email";
const country = "country";
const superAdminName = "superAdminName";
const superAdminEmail = "superAdminEmail";
const superAdminGender = "superAdminGender";
const superAdminPhone = "superAdminPhone";
const address = "address";
const phone = "phone";
const currency = "currency";
const currencySymbol = "currencySymbol";
export const OrgApiDoc =
  (logoFile = "logoFile"): MethodDecorator =>
  //   (profileImgFile = "profileImgFile"): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      type: "multipart/form-data",
      schema: {
        type: "object",
        properties: {
          [organizationName]: {
            type: "string",
            nullable: true
          },
          [organizationType]: {
            type: "string",
            nullable: true
          },
          [country]: {
            type: "string",
            nullable: true
          },
          [superAdminName]: {
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
          [superAdminEmail]: {
            type: "string",
            nullable: true
          },
          [superAdminGender]: {
            type: "string",
            nullable: true
          },
          [superAdminPhone]: {
            type: "string",
            nullable: true
          },
          [address]: {
            type: "string",
            nullable: true
          },
          [phone]: {
            type: "string",
            nullable: true
          },
          [currency]: {
            type: "string",
            nullable: true
          },
          [currencySymbol]: {
            type: "string",
            nullable: true
          },
          [logoFile]: {
            type: "string",
            format: "binary",
            nullable: true
          }
          //   [profileImgFile]: {
          //     type: "string",
          //     format: "binary",
          //     profileImgFile: true
          //   }
        }
      }
    })(target, propertyKey, descriptor);
  };
