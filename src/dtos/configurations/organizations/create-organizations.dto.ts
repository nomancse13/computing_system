import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateOrganizationsDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    organizationName: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    organizationType: string;

    @ApiPropertyOptional()
    @IsOptional()
    logoFile: any;

    @ApiPropertyOptional()
    @IsOptional()
    profileImgFile: any;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    country: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    superAdminName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    superAdminEmail: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    password: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    superAdminGender: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    superAdminPhone: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    qbaccounts: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    qbClientKey: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    qbClientSecret: string;

    
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    realmeID: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currency: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currencySymbol: string;
}
