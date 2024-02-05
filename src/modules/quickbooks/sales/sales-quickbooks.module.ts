/**dependencies */
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InvoiceQuickBooksService } from "./invoice-quickbooks.service";
import { EstimateQuickBooksService } from "./estimate-quickbooks.service";
import { CustomerQuickBooksService } from "./customer-quickbooks.service";
import { SalesQuickBookController } from "./sales-quickbooks.controller";
import { ProductsQuickbooksService } from "./items-quickbooks.service";

/**controllers */
/**Authentication strategies */

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [SalesQuickBookController],
  providers: [
    ProductsQuickbooksService,
    InvoiceQuickBooksService,
    EstimateQuickBooksService,
    CustomerQuickBooksService
  ],
  exports: []
})
export class QuickBooksSalesModule {}
