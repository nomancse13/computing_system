import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuickBooksModule } from "src/modules/quickbooks/quickbook.module";
import { CustomersController } from "../controllers/customers.controller";
import { InvoiceController } from "../controllers/invoice.controller";
import { CreditMemoController } from "../controllers/sale-return.controller";
import {
    CreditNotesEntity,
    CustomersEntity,
    InvoiceDetailsEntity,
    InvoiceEntity,
    AccountsEntity,
    PaymentReceivedEntity,
    StockHistoryDetailsEntity,
    StockHistoryEntity,
    TransactionHistoryEntity
} from "../entities";
import { CustomersService } from "../services/customers.service";
import { InvoiceService } from "../services/invoice.service";
import { SaleReturnService } from "../services/sales-return.service";
import { AccountModule } from "./account.module";
import { AdministratorModule } from "./administrator.module";
import { UserModule } from "./user.module";
import { PaymentReceivedController } from "src/controllers/payment-received.controller";
import { PaymentReceivedService } from "src/services/payment-received.service";
import { PaymentDetailsEntity } from "src/entities/payment-details.entity";
import { EstimationEntity } from "../entities/estimation.entity";
import { EstimationDetailsEntity } from "../entities/estiamtion-details.entity";
import { EstimationController } from "../controllers/estimation.controller";
import { EstimationService } from "../services/estiamtion.service";
import { AuthModule } from "../authentication/auth/auth.module";

/**Module */
@Module({
    imports: [
        TypeOrmModule.forFeature([
            CustomersEntity,
            InvoiceEntity,
            AccountsEntity,
            TransactionHistoryEntity,
            InvoiceDetailsEntity,
            StockHistoryDetailsEntity,
            StockHistoryEntity,
            CreditNotesEntity,
            PaymentReceivedEntity,
            PaymentDetailsEntity,
            EstimationEntity,
            EstimationDetailsEntity

        ]),
        forwardRef(() => UserModule),
        AccountModule,
        AdministratorModule,
        QuickBooksModule,
        AuthModule
    ],
    controllers: [
        InvoiceController,
        CreditMemoController,
        CustomersController,
        PaymentReceivedController,
        EstimationController
    ],
    providers: [
        InvoiceService,
        SaleReturnService,
        CustomersService,
        PaymentReceivedService,
        EstimationService
    ],
    exports: [SaleReturnService, CustomersService, PaymentReceivedService]
})
export class ReceivablesModule { }
