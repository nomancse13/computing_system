import { PartialType } from "@nestjs/swagger/dist";
import { CreateUserTypeDto } from "./create-user-type.dto";

export class UpdateUserTypeDto extends PartialType(CreateUserTypeDto) {}
