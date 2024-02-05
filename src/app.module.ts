import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RouterModule } from "@nestjs/core";
import { MulterModule } from "@nestjs/platform-express";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "aws-sdk";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { validate } from "./authentication/auth/config/env.validation";
import {
  TypeOrmConfigModule,
  TypeOrmConfigService
} from "./authentication/auth/config/typeorm-config";
import { LoggerMiddleware } from "./authentication/middleware";
import { QueueMailConsumer } from "./modules/queue-mail/queue-mail.consumer";
import { UserModule } from "./modules/user.module";
import { AccountModule } from "./modules/account.module";
import { HumanResourceModule } from "./modules/human-resource.module";
import { ReceivablesModule } from "./modules/receivables.module";
import { QuickBooksModule } from "./modules/quickbooks/quickbook.module";
import { PayablesModule } from "./modules/payables.module";
import { QuickBooksSalesModule } from "./modules/quickbooks/sales/sales-quickbooks.module";
import { AdministratorModule } from "./modules/administrator.module";
import { IncomingMessage } from "http";
import { GoogleRecaptchaModule } from "@nestlab/google-recaptcha";
import { SeederModule } from "./database/seeders/seeder.module";
import { ReportsModule } from "./modules/report.module";

@Module({
  imports: [
    GoogleRecaptchaModule.forRoot({
      secretKey: "6Lc27gIiAAAAAC0li5RCtle10hy51Rz89facTX0G",
      response: (req: IncomingMessage) =>
        (req.headers.recaptcha || "").toString(),
      skipIf: process.env.NODE_ENV !== "production",
      actions: ["SignUp", "SignIn"],
      score: 0.8
    }),
    /**initialize nest js config module */ 
    ConfigModule.forRoot({
      validate: validate,
      //responsible for use config values globally
      isGlobal: true
    }),
    ScheduleModule.forRoot(),

    // Typeorm initialize
    TypeOrmModule.forRootAsync({
      imports: [TypeOrmConfigModule],
      inject: [ConfigService],
      // Use useFactory, useClass, or useExisting
      // to configure the ConnectionOptions.
      name: TypeOrmConfigService.connectionName,
      useExisting: TypeOrmConfigService,
      // connectionFactory receives the configured ConnectionOptions
      // and returns a Promise<Connection>.
      // dataSourceFactory: async (options) => {
      //   const connection = await createConnection(options);
      //   return connection;
      // },
    }),
    //module prefix for modules
    RouterModule.register([
      //module prefix for user
      {
        path: "user",
        module: UserModule
      },
      {
        path: "account",
        module: AccountModule
      },
      {
        path: "hr",
        module: HumanResourceModule
      },
      {
        path: "sales",
        module: ReceivablesModule
      },
      {
        path: "quickbook",
        module: QuickBooksModule
      },
      {
        path: "quickbook",
        module: QuickBooksSalesModule
      },
      {
        path: "purchase",
        module: PayablesModule
      },
      {
        path: "user",
        module: AdministratorModule
      },
      {
        path: "reports",
        module: ReportsModule
      }
    ]),
    MulterModule.register({ dest: "./uploads", storage: "./uploads" }),
    UserModule,
    QuickBooksModule,
    SeederModule,
    ReportsModule
  ],
  controllers: [AppController],
  providers: [AppService, QueueMailConsumer]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
