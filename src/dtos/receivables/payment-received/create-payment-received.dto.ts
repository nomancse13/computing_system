import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { InvoiceEntity } from "../../../entities";
import { InvoicePaymentViewModelEntity } from "../../../viewentites/invoicepaymentViewModel.entity";

export class CreatePaymentReceivedDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  txnDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalAmt: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentRefNum: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  creditLedgerId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unappliedAmt: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  depositToAccountRef: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  txnId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txnType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  paymentMethodRef: number;

  @ApiPropertyOptional()
  @IsOptional()
  file: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  debitLedgerId: number;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;

  @ApiProperty()
  @IsNotEmpty()
  invoices: InvoicePaymentViewModelEntity[];
}
