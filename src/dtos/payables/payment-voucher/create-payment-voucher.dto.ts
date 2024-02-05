import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { InvoicePaymentViewModelEntity } from "../../../viewentites/invoicepaymentViewModel.entity";

export class CreatePaymentVoucherDto {

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
    debitLedgerId: number;

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
    payType: string;

    @ApiPropertyOptional()
    @IsOptional()
    file: any;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    comment: string;

    @ApiPropertyOptional()
    @IsOptional()
    ipPayload: any;

    @ApiProperty()
    @IsNotEmpty()
    invoices: InvoicePaymentViewModelEntity[];
}
