import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

class ProductInfo {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly sellingPrice: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;

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
  readonly amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description: string;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsNumber()
  // readonly discount: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billEmail: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  docNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalTax: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalAmt: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalDueAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  subtotalAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terms: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txnType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  netAmountTaxable: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  txnId: number;

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
  @IsBoolean()
  applyTaxAfterDiscount: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txnDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  vat: any;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  debitLedgerId: number;

  @ApiProperty()
  @IsNotEmpty()
  items: any;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
