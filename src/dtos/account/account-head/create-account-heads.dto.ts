import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateAccountHeadsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  groupName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  groupParentId: number;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
