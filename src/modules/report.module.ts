import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportsController } from "src/controllers/reports.controller";
import {
    AccountingGroupEntity,
    AccountsEntity,
    StockHistoryEntity,
    TransactionHistoryEntity
} from "../entities";
import { AccountModule } from "./account.module";
import { UserModule } from "./user.module";
import { ReceivablesModule } from "./receivables.module";
import { PayablesModule } from "./payables.module";
import { ReportsService } from "../services/reports.service";

/**Module */
@Module({
    imports: [
        TypeOrmModule.forFeature([
            TransactionHistoryEntity,
            AccountsEntity,
            AccountingGroupEntity,
            StockHistoryEntity
        ]),
        AccountModule,
        UserModule,
        ReceivablesModule,
        PayablesModule
    ],
    controllers: [
        ReportsController,
    ],
    providers: [
        ReportsService
    ],
    exports: [ReportsService]
})
export class ReportsModule { }
