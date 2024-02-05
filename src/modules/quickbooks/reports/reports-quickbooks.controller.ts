/**dependencies */
import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ReportService } from "./reports.service";
import { UserGuard } from "src/authentication/auth/guards";
import { UserPayload } from "src/authentication/utils/decorators";
import { UserInterface } from "src/authentication/common/interfaces";

//guard
@ApiTags("QUICKBOOKS|Reports")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  //path name
  path: "reports",
  //version
  version: "1"
})
export class ReportsQuickBookController {
  constructor(
    private readonly reportService: ReportService // private readonly userService: UserService,
  ) {}

  @Get("balancesheet")
  async balancesheet(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportBalanceSheet(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Get("profitandloss")
  async profitandloss(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportProfitAndLoss(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Get("profitandlossdetails")
  async profitandlossdetails(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportProfitAndLossDetail(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Get("trialbalance")
  async trialbalance(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportTrialBalance(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("cashflow")
  async cashflow(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportCashFlow(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("inventoryValuationSummary")
  async InventoryValuationSummary(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportInventoryValuationSummary(
      req,
      res,userPayload
    );

    return { message: "Successful", result: data };
  }

  @Get("customerSales")
  async customerSales(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportCustomerSales(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("ProductSales")
  async ProductSales(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportProductSales(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportCustomerIncome")
  async reportCustomerIncome(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportCustomerIncome(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportCustomerBalance")
  async reportCustomerBalance(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportCustomerBalance(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportCustomerBalanceDetail")
  async reportCustomerBalanceDetail(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportCustomerBalanceDetail(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportAgedReceivables")
  async reportAgedReceivables(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportAgedReceivables(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportAgedReceivableDetail")
  async reportAgedReceivableDetail(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportAgedReceivableDetail(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportVendorBalance")
  async reportVendorBalance(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportVendorBalance(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportVendorBalanceDetail")
  async reportVendorBalanceDetail(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportVendorBalanceDetail(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportAgedPayables")
  async reportAgedPayables(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportAgedPayables(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportAgedPayableDetail")
  async reportAgedPayableDetail(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportAgedPayableDetail(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportVendorExpenses")
  async reportVendorExpenses(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportVendorExpenses(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportTransactionList")
  async reportTransactionList(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportTransactionList(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportGeneralLedgerDetail")
  async reportGeneralLedgerDetail(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportGeneralLedgerDetail(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportDepartmentSales")
  async reportDepartmentSales(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportDepartmentSales(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("reportClassSales")
  async reportClassSales(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.reportClassSales(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getInvoicePdf")
  async getInvoicePdf(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.getInvoicePdf(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getCreditMemoPdf")
  async getCreditMemoPdf(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.getCreditMemoPdf(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getSalesReceiptPdf")
  async getSalesReceiptPdf(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.getSalesReceiptPdf(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("sendInvoicePdf")
  async sendInvoicePdf(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.sendInvoicePdf(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("sendCreditMemoPdf")
  async sendCreditMemoPdf(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.sendCreditMemoPdf(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("sendEstimatePdf")
  async sendEstimatePdf(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.sendEstimatePdf(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("sendSalesReceiptPdf")
  async sendSalesReceiptPdf(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.sendSalesReceiptPdf(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("sendPurchaseOrder")
  async sendPurchaseOrder(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.sendPurchaseOrder(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("batch")
  async batch(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.batch(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("upload")
  async upload(@Req() req: any, @Res() res: any,@UserPayload() userPayload: UserInterface) {
    const data = await this.reportService.upload(req, res,userPayload);

    return { message: "Successful", result: data };
  }
}
