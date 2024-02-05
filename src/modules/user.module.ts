/**dependencies */
import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "src/authentication/auth/auth.module";
import { QueueMailModule } from "./queue-mail/queue-mail.module";
import { QuickBooksModule } from "./quickbooks/quickbook.module";
import { AccountModule } from "./account.module";
import {
  TransactionHistoryEntity,
  BillDetailsEntity,
  BillEntity,
  InvoiceDetailsEntity,
  StockHistoryDetailsEntity,
  StockHistoryEntity,
  BankAccountEntity,
  MailConfigurationsEntity,
  CalenderDataEntity,
  DeviceHistoryEntity,
  AccountsEntity,
  OrganizationEntity,
  ProductsEntity,
  ProductCategoryEntity
} from "../entities";

import { AdministratorModule } from "./administrator.module";
import { BankingController } from "../controllers/banking.controller";
import { BankingService } from "../services/banking.service";
import { HumanResourceModule } from "./human-resource.module";
import { ReceivablesModule } from "./receivables.module";
import { ProductService } from "../services/Product.service";
import { UserController } from "../controllers/user.controller";
import { PayablesModule } from "./payables.module";
import { OrganizationController } from "src/controllers/organization.controller";
import { OrganizationsService } from "src/services/organization.service";
import { ProductsController } from "../controllers/products.controller";
import { ProductCategoryController } from "../controllers/products-category.controller";
import { ProductCategoryService } from "../services/product-category.service";
import { TaxRate } from "src/entities/taxRate.entity";
import { PaymentMethodEntity } from "../entities/paymentMethod.entity";
import { VendorCreditDetailsEntity } from "../entities/vendorcredit-details.entity";
import { ManualJournalDetailsEntity } from "../entities/manual-journals-details.entity";
import { CreditNoteDetailsEntity } from "../entities/credit-note-details.entity";
/**controllers */
/**Authentication strategies */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankAccountEntity,
      MailConfigurationsEntity,
      CalenderDataEntity,
      DeviceHistoryEntity,
      ProductsEntity,
      ProductCategoryEntity,
      StockHistoryEntity,
      StockHistoryDetailsEntity,
      InvoiceDetailsEntity,
      BillEntity,
      BillDetailsEntity,
      TransactionHistoryEntity,
      OrganizationEntity,
      AccountsEntity,
      TaxRate,
      PaymentMethodEntity,
      VendorCreditDetailsEntity,
      ManualJournalDetailsEntity,
      CreditNoteDetailsEntity
    ]),
    QueueMailModule,
    AccountModule,
    HumanResourceModule,
    ReceivablesModule,
    forwardRef(() => AuthModule),
    PayablesModule,
    AdministratorModule,
    QuickBooksModule
  ],
  controllers: [UserController, BankingController, ProductsController, ProductCategoryController, OrganizationController],
  providers: [BankingService, ProductService, ProductCategoryService, OrganizationsService],
  exports: [BankingService, ProductService, ProductCategoryService, OrganizationsService]
})
export class UserModule {}
