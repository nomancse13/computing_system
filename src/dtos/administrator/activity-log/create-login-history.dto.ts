import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateLoginHistoryDto {
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

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  organizationId: number;
}
