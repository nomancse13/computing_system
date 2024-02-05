import {
  ApiProperty,
  ApiPropertyOptional
} from "@nestjs/swagger/dist/decorators/api-property.decorator";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { UserTypesEnum } from "src/authentication/common/enum";

export class UpdateUserDto {
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

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;
}
