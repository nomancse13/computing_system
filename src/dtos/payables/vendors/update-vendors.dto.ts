import { PartialType } from "@nestjs/swagger";
import { CreateVendorsDto } from "./create-vendors.dto";

export class UpdateVendorsDto extends PartialType(CreateVendorsDto) {}
