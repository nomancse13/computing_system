import { PartialType } from "@nestjs/swagger";
import { CreateCustormersDto } from "./create-customers.dto";

export class UpdateCustomersDto extends PartialType(CreateCustormersDto) {}
