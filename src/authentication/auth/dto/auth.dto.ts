import {
  ApiProperty,
  ApiPropertyOptional
} from "@nestjs/swagger/dist/decorators/api-property.decorator";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min
} from "class-validator";
import { UserTypesEnum } from "src/authentication/common/enum";

export class AuthDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userTypeId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ledgerId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  organizationId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recaptchaToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;

  @ApiPropertyOptional()
  @IsOptional()
  file: any;
}
