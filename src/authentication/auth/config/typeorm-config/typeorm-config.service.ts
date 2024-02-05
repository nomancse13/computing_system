import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
import { TypeOrmConnectionName, TYPEORM_CONNECTION_NAMES } from "./constants/typeorm-constants";
import { TypeOrmLoggerContainer } from "./logger";

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  static connectionName: TypeOrmConnectionName = TYPEORM_CONNECTION_NAMES.DEFAULT;

  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: "mysql",
      host: this.configService.get<string>("MYSQL_DB_HOST"),
      port: +this.configService.get<number>("MYSQL_DB_PORT"),
      username: this.configService.get<string>("MYSQL_DB_USER"),
      password: this.configService.get<string>("MYSQL_DB_PASSWORD"),
      database: this.configService.get<string>("MYSQL_DB"),
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      autoLoadEntities: true, // we changed this line for adding new column
      synchronize: this.configService.get("APP_ENV") === "development" ? true : false,
      // Run migrations automatically,
      // you can disable this if you prefer running migration manually.
      migrationsRun: false,
      //custom logger implementation
      logger: TypeOrmLoggerContainer.ForConnection(TypeOrmConfigService.connectionName, this.configService.get("APP_ENV") === "development" ? true : true),
      migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
      name: TypeOrmConfigService.connectionName
    };
  }
}

// we deploy 2023-12-01
