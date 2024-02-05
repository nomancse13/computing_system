import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductsDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    itemName: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    itemType: string;

    @ApiProperty() 
    @IsNotEmpty()
    @IsBoolean()
    taxable: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    sku: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    unitPrice: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    openingStock: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    vendorLedgerId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    categoryId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    sellingPrice: number;

    @ApiPropertyOptional()
    @IsOptional()
    ipPayload: any;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    qbRefId: number;
}
