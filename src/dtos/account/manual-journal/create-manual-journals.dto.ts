import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

class journalDetails {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly accountId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly detailType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly postingType: string;
}

export class CreateManualJounalsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  txnDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  adjustment: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  privateNote: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  debitAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  creditAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  file: any;

  @ApiPropertyOptional()
  @IsOptional()
  journalDetails: any;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
