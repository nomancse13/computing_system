import { PartialType } from "@nestjs/swagger";
import { CreateAccountingGroupDto } from "./create-accounting-group.dto";

export class UpdateAccountingGroupDto extends PartialType(
  CreateAccountingGroupDto
) {}
