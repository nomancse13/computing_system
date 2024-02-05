import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductCategoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  Name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  id: number;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  qbRefId: number;
}
