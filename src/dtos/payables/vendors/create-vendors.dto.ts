import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateVendorsDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    displayName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    routingNo: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    accountNo: string;


    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    givenName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    mobile: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    familyName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    companyName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    billAddr: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fax: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    website: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    others: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    openingBalance: number;

    @ApiPropertyOptional()
    @IsOptional()
    ipPayload: any;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    qbRefId: number;
}
