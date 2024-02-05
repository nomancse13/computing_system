/**dependencies */
import { ApiBody } from "@nestjs/swagger";

const fullName = "fullName";
const email = "email";
const password = "password";
const mobile = "mobile";
const gender = "gender";
const recaptchaToken = "recaptchaToken";
const organizationId = "organizationId";
const userTypeId = "userTypeId";
export const UserApiDoc =
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

          [password]: {
            type: "string",
            nullable: true
          },
          [email]: {
            type: "string",
            nullable: true
          },
          [recaptchaToken]: {
            type: "string",
            nullable: true
          },
          [gender]: {
            type: "string",
            nullable: true
          },
          [organizationId]: {
            type: "number",
            nullable: true
          },

          [mobile]: {
            type: "string",
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
