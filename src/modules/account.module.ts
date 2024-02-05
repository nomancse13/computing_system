/**dependencies */
import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "src/authentication/auth/auth.module";
import { QueueMailModule } from "src/modules/queue-mail/queue-mail.module";
import { AccountController } from "../controllers/account.controller";
import { AccountingGroupController } from "../controllers/accounting-group.controller";
import { AccountService } from "../services/account.service";
import { AccountingGroupService } from "../services/accounting-group.service";
import { AdministratorModule } from "./administrator.module";
import { UserModule } from "./user.module";

import { LedgerController } from "../controllers/ledgers.controller";
import { ManualJournalsController } from "../controllers/manual-journals.controller";
import { AccountingGroupEntity, AccountsEntity, ManualJournalsEntity, StockHistoryEntity, TransactionHistoryEntity } from "../entities";
import { LedgersService } from "../services/ledgers.service";
import { ManualJournalsService } from "../services/manual-journals.service";
/**controllers */
/**Authentication strategies */
@Module({
  imports: [
    TypeOrmModule.forFeature([AccountsEntity, AccountingGroupEntity, TransactionHistoryEntity, ManualJournalsEntity, StockHistoryEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    QueueMailModule,
    AdministratorModule
  ],
  controllers: [LedgerController, AccountingGroupController, AccountController, ManualJournalsController],
  providers: [LedgersService, AccountingGroupService, AccountService, ManualJournalsService],
  exports: [LedgersService, AccountService, AccountingGroupService]
})
export class AccountModule {}
