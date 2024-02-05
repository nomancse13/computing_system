import { PartialType } from "@nestjs/swagger";
import { CreateEstimationDto } from "./create-estimation.dto";

export class UpdateEstiamtionDto extends PartialType(CreateEstimationDto) {}
