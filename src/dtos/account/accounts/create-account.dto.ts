import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateAccountDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    code: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fullyQualifiedName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    nature: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    parentId: number;
}
