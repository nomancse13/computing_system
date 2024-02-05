import { PartialType } from "@nestjs/swagger";
import { CreateQuickbookAPiDto } from "./create-quickbookapi.dto";

export class UpdateQuickBookApiDto extends PartialType(CreateQuickbookAPiDto) {}
