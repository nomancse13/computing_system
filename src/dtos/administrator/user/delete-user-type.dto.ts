import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class DeleteUserTypeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  readonly deleteIds: number[];
}
