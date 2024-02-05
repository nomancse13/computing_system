import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateExpensesDto {
     
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  expenseDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  expenseAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  debitLedgerId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  creditLedgerId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference: string;

  @ApiPropertyOptional()
  @IsOptional()
  file: any;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
