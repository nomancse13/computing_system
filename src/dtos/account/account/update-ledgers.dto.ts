import { PartialType } from "@nestjs/swagger";
import { CreateLedgersDto } from "./create-ledgers.dto";

export class UpdateLedgersDto extends PartialType(CreateLedgersDto) {}
