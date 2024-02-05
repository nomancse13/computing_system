import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateModuleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  controllerName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  method: string;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
