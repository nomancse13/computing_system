import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCustormersDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    fullyQualifiedName: string;

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
    givenName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    displayName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    printOnCheckName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    companyName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    familyName: string;

    @ApiProperty()
    @IsBoolean()
    taxable: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    contactPersons: string;


    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    billAddr: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    shippingAddress: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    openingBalance: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    creditLimit: number;

    @ApiPropertyOptional()
    @IsOptional()
    ipPayload: any;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    qbRefId: number;
}
