import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateLedgersDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  ledgerParent: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fullyQualifiedName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  classification: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  accountSubType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ledgerType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  openingBalance: number;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
