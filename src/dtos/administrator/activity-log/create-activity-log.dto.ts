import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateActivityLogDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cLientIPAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  browser: any;

  @ApiPropertyOptional()
  @IsOptional()
  os: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  organizationId: number;

  @ApiPropertyOptional()
  @IsOptional()
  messageDetails: any;

  @ApiPropertyOptional()
  @IsOptional()
  logData: any;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;
}
