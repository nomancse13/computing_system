import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateBankingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bankAccountName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  openingBalance: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  accountType: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
