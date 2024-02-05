import { PartialType } from "@nestjs/swagger";
import { CreateEmployeesDto } from "./create-employees.dto";

export class UpdateEmployeesDto extends PartialType(CreateEmployeesDto) {}
