import { plainToClass } from "class-transformer";
import { IsEnum, IsNumber, IsString, validateSync } from "class-validator";

enum Environment {
  Development = "development",
  Production = "production"
}

class EnvironmentVariables {
  @IsEnum(Environment)
  APP_ENV: Environment;

  @IsNumber()
  APP_PORT: number;

  @IsString()
  MYSQL_DB_HOST: string;

  @IsNumber()
  MYSQL_DB_PORT: number;

  @IsString()
  MYSQL_DB_USER: string;

  @IsString()
  MYSQL_DB_PASSWORD: string;

  @IsString()
  MYSQL_DB: string;

  @IsString()
  SWAGGER_USER: string;

  @IsNumber()
  SWAGGER_PASSWORD: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
