import {
  ApiProperty,
  ApiPropertyOptional
} from "@nestjs/swagger/dist/decorators/api-property.decorator";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { UserTypesEnum } from "src/authentication/common/enum";

export class LoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly userType: string;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;

  // @ApiProperty()
  // @IsString()
  // @IsNotEmpty()
  // readonly recaptchaToken: string;
}
