import { PartialType } from "@nestjs/swagger";
import { CreateCreditMemoDto } from "./create-sale-return.dto";


export class UpdateCreditMemoDto extends PartialType(CreateCreditMemoDto) {}