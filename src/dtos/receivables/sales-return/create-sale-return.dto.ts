import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

class creditDetails {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly id: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly productId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly qty: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly sellingPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly taxCodeRef: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly detailType: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly amount: number;
}

export class CreateCreditMemoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  txnDate: string;

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
  reference: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerMemo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  docNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txnType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billAddr: string;

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
  subtotalAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  netAmountTaxable: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  applyTaxAfterDiscount: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  freeFormAddress: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shipAddr: string;

  @ApiPropertyOptional()
  @IsOptional()
  creditDetails: any;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
