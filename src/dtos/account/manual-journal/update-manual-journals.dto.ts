import { PartialType } from "@nestjs/swagger";
import { CreateManualJounalsDto } from "./create-manual-journals.dto";

export class UpdateManualJounalsDto extends PartialType(
  CreateManualJounalsDto
) {}
