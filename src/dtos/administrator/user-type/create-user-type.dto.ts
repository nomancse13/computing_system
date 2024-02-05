import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { StatusField } from "src/authentication/common/enum";

export class CreateUserTypeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly userTypeName: string;

  @ApiPropertyOptional({ enum: StatusField })
  @IsEnum(StatusField)
  @IsOptional()
  status: StatusField;

  @ApiPropertyOptional()
  @IsOptional()
  ipPayload: any;
}
