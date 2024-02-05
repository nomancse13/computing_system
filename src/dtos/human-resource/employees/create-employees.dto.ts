import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateEmployeesDto {
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
  employeeID: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  familyName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobile: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryAddr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dob: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hireDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  releaseDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ssn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  billingrate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalSalary: number;

  @ApiPropertyOptional()
  @IsOptional()
  file: any;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  qbRefId: number;
}
