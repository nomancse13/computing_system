/**dependencies */
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InvoiceQuickBooksService } from "./invoice-quickbooks.service";
import { EstimateQuickBooksService } from "./estimate-quickbooks.service";
import { CustomerQuickBooksService } from "./customer-quickbooks.service";
import { ProductsQuickbooksService } from "./items-quickbooks.service";

//guard
@ApiTags("QUICKBOOK|Sales")
@Controller({
  //path name
  path: "sales",
  //version
  version: "1"
})
export class SalesQuickBookController {
  constructor(
    private readonly ProductsQuickbooksService: ProductsQuickbooksService,
    private readonly invoiceQuickBooksService: InvoiceQuickBooksService,
    private readonly estimateQuickBooksService: EstimateQuickBooksService,
    private readonly customerQuickBooksService: CustomerQuickBooksService
  ) {}

  @Get("createProduct")
  async balancesheet(@Req() req: any, @Res() res: any) {
    const data = await this.ProductsQuickbooksService.createProduct(req, res);

    return { message: "Successful", result: data };
  }

  @Get("invoicedata")
  async cashflow(@Req() req: any, @Res() res: any) {
    const data = await this.invoiceQuickBooksService.invoicedata(req, res);

    return { message: "Successful", result: data };
  }

  @Get("create/invoice")
  async invoice(@Req() req: any, @Res() res: any) {
    const data = await this.invoiceQuickBooksService.createInvoice(req, res);

    return { message: "Successful", result: data };
  }

  @Get("get/invoice")
  async get(@Req() req: any, @Res() res: any) {
    const data = await this.invoiceQuickBooksService.getInvoice(req, res);

    return { message: "Successful", result: data };
  }

  @Get("create/sales/receipt")
  async createReceipt(@Req() req: any, @Res() res: any) {
    const data = await this.invoiceQuickBooksService.createSalesReceipt(
      req,
      res
    );

    return { message: "Successful", result: data };
  }

  @Get("get/sales/receipt")
  async getReceipt(@Req() req: any, @Res() res: any) {
    const data = await this.invoiceQuickBooksService.getSalesReceipt(req, res);

    return { message: "Successful", result: data };
  }

  @Get("send/sales/receipt/pdf")
  async getSalesReceipt(@Req() req: any, @Res() res: any) {
    const data = await this.invoiceQuickBooksService.sendSalesReceiptPdf(
      req,
      res
    );

    return { message: "Successful", result: data };
  }

  @Get("update/invoice")
  async update(@Req() req: any, @Res() res: any) {
    const data = await this.invoiceQuickBooksService.updateInvoice(req, res);

    return { message: "Successful", result: data };
  }

  @Get("delete/invoice")
  async delete(@Req() req: any, @Res() res: any) {
    const data = await this.invoiceQuickBooksService.deleteInvoice(req, res);

    return { message: "Successful", result: data };
  }

  @Get("find/invoice")
  async find(@Req() req: any, @Res() res: any) {
    const data = await this.invoiceQuickBooksService.findInvoices(req, res);

    return { message: "Successful", result: data };
  }

  @Get("estimation/create")
  async reportCustomerIncome(@Req() req: any, @Res() res: any) {
    const data = await this.estimateQuickBooksService.createEstimate(req, res);

    return { message: "Successful", result: data };
  }

  @Get("estimation/get")
  async reportCustomerBalance(@Req() req: any, @Res() res: any) {
    const data = await this.estimateQuickBooksService.getEstimate(req, res);

    return { message: "Successful", result: data };
  }

  @Get("estimation/update")
  async reportCustomerBalanceDetail(@Req() req: any, @Res() res: any) {
    const data = await this.estimateQuickBooksService.updateEstimate(req, res);

    return { message: "Successful", result: data };
  }

  @Get("estimation/delete")
  async reportAgedReceivables(@Req() req: any, @Res() res: any) {
    const data = await this.estimateQuickBooksService.deleteEstimate(req, res);

    return { message: "Successful", result: data };
  }

  @Get("estimation/find")
  async estimationFind(@Req() req: any, @Res() res: any) {
    const data = await this.estimateQuickBooksService.findEstimates(req, res);

    return { message: "Successful", result: data };
  }

  @Get("customerdata")
  async reportAgedReceivableDetail(@Req() req: any, @Res() res: any) {
    const data = await this.customerQuickBooksService.customerdata(req, res);

    return { message: "Successful", result: data };
  }

  @Get("customer/create")
  async reportVendorBalance(@Req() req: any, @Res() res: any) {
    const data = await this.customerQuickBooksService.createCustomer(req, res);

    return { message: "Successful", result: data };
  }

  @Get("customer/get")
  async reportVendorBalanceDetail(@Req() req: any, @Res() res: any) {
    const data = await this.customerQuickBooksService.getCustomer(req, res);

    return { message: "Successful", result: data };
  }

  @Get("customer/update")
  async reportAgedPayables(@Req() req: any, @Res() res: any) {
    const data = await this.customerQuickBooksService.updateCustomer(req, res);

    return { message: "Successful", result: data };
  }

  @Get("customer/find")
  async reportAgedPayableDetail(@Req() req: any, @Res() res: any) {
    const data = await this.customerQuickBooksService.findCustomers(req, res);

    return { message: "Successful", result: data };
  }
}
