import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuickBooksModule } from "src/modules/quickbooks/quickbook.module";
import { ExpensesController } from "../controllers/expenses.controller";
import { PurchaseReturnController } from "../controllers/purchase-return.controller";
import { VendorsController } from "../controllers/vendors.controller";
import {
    BillDetailsEntity,
    BillEntity,
    ExpensesEntity,
    AccountsEntity,
    PaymentMadeEntity,
    StockHistoryDetailsEntity,
    StockHistoryEntity,
    TransactionHistoryEntity,
} from "../entities";
import { VendorDebitsEntity } from "../entities/vendor-debits.entity";
import { ExpensesService } from "../services/expenses.service";
import { PurchaseReturnService } from "../services/purchase-return.service";
import { AccountModule } from "./account.module";
import { AdministratorModule } from "./administrator.module";
import { UserModule } from "./user.module";
import { PaymentMadeDetailsEntity } from "src/entities/paymentmade-details.entity";
import { PaymentMadeService } from "src/services/payment-made.service";
import { PaymentMadeController } from "src/controllers/payment-made.controller";
import { PurchaseOrderEntity } from "../entities/purchase-order.entity";
import { PurchaseOrderDetailsEntity } from "../entities/purchase-order-details.entity";
import { PurchaseOrderController } from "../controllers/purchase-order.controller";
import { PurchaseOrderService } from "../services/purchase-order.service";
import { ProductsEntity } from "../entities/Products.entity"; 
import { VendorsEntity } from "../entities/vendors.entity";
import { VendorInvoiceController } from "../controllers/vendor-invoice.controller";
import { VendorInvoiceService } from "../services/vendor-invoice.service";
import { VendorsService } from "../services/Vendors.service";
import { AuthModule } from "../authentication/auth/auth.module";
/**Module */
@Module({
    imports: [
        TypeOrmModule.forFeature([
            VendorsEntity,
            PaymentMadeEntity,
            ExpensesEntity,
            TransactionHistoryEntity,
            VendorDebitsEntity,
            AccountsEntity,
            StockHistoryEntity,
            StockHistoryDetailsEntity,
            BillEntity,
            BillDetailsEntity,
            PaymentMadeDetailsEntity,
            PurchaseOrderEntity,
            PurchaseOrderDetailsEntity,
            ProductsEntity 
        ]),
        AccountModule,
        AdministratorModule,
        forwardRef(() => UserModule),
        QuickBooksModule,
        AuthModule
    ],
    controllers: [
        VendorsController,
        VendorInvoiceController,
        PaymentMadeController,
        PurchaseReturnController,
        ExpensesController,
        PurchaseOrderController
    ],
    providers: [
        VendorsService,
        VendorInvoiceService,
        PaymentMadeService,
        PurchaseReturnService,
        ExpensesService,
        PurchaseOrderService
    ],
    exports: [VendorsService]
})
export class PayablesModule { }
