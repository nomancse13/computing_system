import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

class ProductInfo {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference: string;

  //@ApiProperty()
  //@IsNumber()
  //@IsNotEmpty()
  //readonly taxId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly taxable: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly taxRate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly amount: number;
}

export class CreatePurchaseOrderDto {
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

  @ApiProperty()
  @IsBoolean()
  billable: boolean;

  //@ApiProperty()
  //@IsBoolean()
  //taxable: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  vendorAddr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference: string;

  @ApiPropertyOptional()
  @IsOptional()
  items: any;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
