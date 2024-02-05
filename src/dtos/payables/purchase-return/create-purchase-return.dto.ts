import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

class PurchaseRetDetails {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  id: number;

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
  readonly amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly detailType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly projectRef: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly taxCodeRef: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly accountRef: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly accountRefName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly billableStatus: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly customerRef: string;
}

export class CreatePurchaseReturnDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  txnDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalAmt: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  debitLedgerId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference: string;

  @ApiPropertyOptional()
  @IsOptional()
  purchaserRetDetails: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorAddr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedTnx: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedTnxType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recNo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment: string;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
