import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

class items {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly unitPrice: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly qty: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly productId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly totalAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly detailType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly taxCodeRef: string;
}

export class CreateEstimationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  taxid: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalAmt: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  subtotalAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txnDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expirationDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txnType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billAddr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shipAddr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billEmail: string;

  @ApiPropertyOptional()
  @IsOptional()
  vat: any;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  debitLedgerId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  docNumber: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  txnId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalTax: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  netAmountTaxable: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  applyTaxAfterDiscount: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  items: any;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
