import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateSalaryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  note: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  month: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  debitLedgerId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  creditLedgerId: number;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
