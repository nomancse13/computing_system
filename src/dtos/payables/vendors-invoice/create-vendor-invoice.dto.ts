import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

class ProductInfo {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
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
  readonly taxRate: number;

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

export class CreateVendorInvoiceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalAmt: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  creditLedgerId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txnDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terms: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorAddr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference: string;

  @ApiProperty()
  @IsBoolean()
  billable: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  file: any;

  @ApiPropertyOptional()
  @IsOptional()
  items: any;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
