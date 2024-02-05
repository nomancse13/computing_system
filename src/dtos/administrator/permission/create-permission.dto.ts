import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";


export class CreatePermissionDto {
    @ApiPropertyOptional()
    @IsOptional()
    permissions: any;
}
