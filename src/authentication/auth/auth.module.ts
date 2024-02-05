/**dependencies */
import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
/**controllers */
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
/**Authentication strategies */
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QueueMailModule } from "src/modules/queue-mail/queue-mail.module";
import { OrganizationEntity, UserEntity } from "src/entities";
import { UserModule } from "src/modules/user.module";
import { UserStrategy, RtStrategy } from "./strategy";
import { AppLoggerModule } from "../logger/app-logger.module";
import { AccountModule } from "src/modules/account.module";
import { AdministratorModule } from "src/modules/administrator.module";
import { SeederModule } from "src/database/seeders/seeder.module";
import { SeederService } from "src/database/seeders/seeder.service";
// import { AtStrategy, RtStrategy } from './strategy';

@Module({
  imports: [
    forwardRef(() => UserModule),
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([UserEntity, OrganizationEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("USER_SECRET")
        // signOptions: {
        //   expiresIn: 3600,
        // },
      }),
      inject: [ConfigService]
    }),
    QueueMailModule,
    forwardRef(() => UserModule),
    AppLoggerModule,
    AccountModule,
    AdministratorModule,
    SeederModule
  ],
  controllers: [AuthController],
  providers: [AuthService, RtStrategy, UserStrategy, SeederService],
  exports: [AuthService]
})
export class AuthModule {}
