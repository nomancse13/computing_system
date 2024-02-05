/**dependencies */
import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "src/authentication/auth/auth.module";
import { QueueMailModule } from "../queue-mail/queue-mail.module";

import { QuickBookController } from "./quickbook.controller";
import { ReportService } from "../quickbooks/reports/reports.service";
import { QuickBooksSalesModule } from "./sales/sales-quickbooks.module";
import { QuickBookService } from "./quickbook.service";
import { ReportsQuickBookController } from "./reports/reports-quickbooks.controller";
import { PurchaseQuickBooksController } from "./purchase/purchase-quickbooks.controller";
import { BillQuickBooksService } from "./purchase/bill-quickbooks.service";
import { PurchaseOrderQuickBooksService } from "./purchase/purchaseorder-quickbooks.service";
import { VendorQuickBooksService } from "./purchase/vendor-quickbooks.service";
import { OthersQuickBooksController } from "./others/others-quickbooks.controller";
import { CompanyQuickBooksService } from "./others/company-quickbooks.service";
import { DepartmentQuickBooksService } from "./others/department-quickbooks.service";
import { EmployeeQuickBooksService } from "./others/employee-quickbooks.service";
import { JournalQuickBooksService } from "./others/journal-quickbooks.service";
import { OrganizationEntity } from "src/entities";

/**controllers */
/**Authentication strategies */

@Module({
    imports: [
        TypeOrmModule.forFeature([
            OrganizationEntity 
        ]),
        QueueMailModule,
        QuickBooksSalesModule,
        forwardRef(() => AuthModule)
    ],
    controllers: [
        QuickBookController,
        ReportsQuickBookController,
        PurchaseQuickBooksController,
        OthersQuickBooksController
    ],
    providers: [
        QuickBookService,
        ReportService,
        BillQuickBooksService,
        PurchaseOrderQuickBooksService,
        VendorQuickBooksService,
        CompanyQuickBooksService,
        DepartmentQuickBooksService,
        EmployeeQuickBooksService,
        JournalQuickBooksService,
    ],
    exports: [QuickBookService, ReportService]
})
export class QuickBooksModule { }
