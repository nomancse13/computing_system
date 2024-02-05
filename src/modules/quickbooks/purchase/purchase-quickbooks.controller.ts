/**dependencies */
import { Controller, Get, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PurchaseOrderQuickBooksService } from "./purchaseorder-quickbooks.service";
import { BillQuickBooksService } from "./bill-quickbooks.service";
import { VendorQuickBooksService } from "./vendor-quickbooks.service";

//guard
@ApiTags("QUICKBOOKS|Purchase")
@Controller({
  //path name
  path: "purchase",
  //version
  version: "1"
})
export class PurchaseQuickBooksController {
  constructor(
    private readonly billQuickBooksService: BillQuickBooksService,
    private readonly purchaseOrderQuickBooksService: PurchaseOrderQuickBooksService,
    private readonly vendorQuickBooksService: VendorQuickBooksService
  ) {}

  //   ******Bill Portion
  @Get("create/bill")
  async balancesheet(@Req() req: any, @Res() res: any) {
    const data = await this.billQuickBooksService.createBill(req, res);

    return { message: "Successful", result: data };
  }
  @Get("create/bill/payment")
  async profitandloss(@Req() req: any, @Res() res: any) {
    const data = await this.billQuickBooksService.createBillPayment(req, res);

    return { message: "Successful", result: data };
  }
  @Get("get/bill")
  async get(@Req() req: any, @Res() res: any) {
    const data = await this.billQuickBooksService.getBill(req, res);

    return { message: "Successful", result: data };
  }
  @Get("get/bill/payment")
  async getPayment(@Req() req: any, @Res() res: any) {
    const data = await this.billQuickBooksService.getBillPayment(req, res);

    return { message: "Successful", result: data };
  }
  @Get("update/bill/payment")
  async updatePayment(@Req() req: any, @Res() res: any) {
    const data = await this.billQuickBooksService.updateBillPayment(req, res);

    return { message: "Successful", result: data };
  }
  @Get("delete/bill/payment")
  async deleteBill(@Req() req: any, @Res() res: any) {
    const data = await this.billQuickBooksService.deleteBillPayment(req, res);

    return { message: "Successful", result: data };
  }
  @Get("update/bill")
  async updateBill(@Req() req: any, @Res() res: any) {
    const data = await this.billQuickBooksService.updateBill(req, res);

    return { message: "Successful", result: data };
  }
  @Get("find/bill")
  async findBill(@Req() req: any, @Res() res: any) {
    const data = await this.billQuickBooksService.findBills(req, res);

    return { message: "Successful", result: data };
  }
  @Get("find/bill/payment")
  async findBillPay(@Req() req: any, @Res() res: any) {
    const data = await this.billQuickBooksService.findBillPayments(req, res);

    return { message: "Successful", result: data };
  }

  //   ******Purchase Portion

  @Get("create/purchase")
  async create(@Req() req: any, @Res() res: any) {
    const data = await this.purchaseOrderQuickBooksService.createPurchase(
      req,
      res
    );

    return { message: "Successful", result: data };
  }
  @Get("create/purchase/order")
  async createe(@Req() req: any, @Res() res: any) {
    const data = await this.purchaseOrderQuickBooksService.createPurchaseOrder(
      req,
      res
    );

    return { message: "Successful", result: data };
  }

  @Get("get/purchase")
  async profitandlossdetails(@Req() req: any, @Res() res: any) {
    const data = await this.purchaseOrderQuickBooksService.getPurchase(
      req,
      res
    );

    return { message: "Successful", result: data };
  }
  @Get("get/purchase/order")
  async trialbalance(@Req() req: any, @Res() res: any) {
    const data = await this.purchaseOrderQuickBooksService.getPurchaseOrder(
      req,
      res
    );

    return { message: "Successful", result: data };
  }

  //   ******vendor Portion

  @Get("create/vendor")
  async createVendor(@Req() req: any, @Res() res: any) {
    const data = await this.vendorQuickBooksService.createVendor(req, res);

    return { message: "Successful", result: data };
  }

  @Get("create/vendor/credit")
  async createVendorCredit(@Req() req: any, @Res() res: any) {
    const data = await this.vendorQuickBooksService.createVendorCredit(
      req,
      res
    );

    return { message: "Successful", result: data };
  }

  @Get("get/vendor")
  async getVendor(@Req() req: any, @Res() res: any) {
    const data = await this.vendorQuickBooksService.getVendor(req, res);

    return { message: "Successful", result: data };
  }

  @Get("get/vendor")
  async getVendorCredit(@Req() req: any, @Res() res: any) {
    const data = await this.vendorQuickBooksService.getVendorCredit(req, res);

    return { message: "Successful", result: data };
  }

  @Get("update/vendor")
  async updateVendor(@Req() req: any, @Res() res: any) {
    const data = await this.vendorQuickBooksService.updateVendor(req, res);

    return { message: "Successful", result: data };
  }

  @Get("update/vendor/credit")
  async updateVendorCredit(@Req() req: any, @Res() res: any) {
    const data = await this.vendorQuickBooksService.updateVendorCredit(
      req,
      res
    );

    return { message: "Successful", result: data };
  }

  @Get("delete/vendor/credit")
  async deleteVendorCredit(@Req() req: any, @Res() res: any) {
    const data = await this.vendorQuickBooksService.deleteVendorCredit(
      req,
      res
    );

    return { message: "Successful", result: data };
  }

  @Get("find/vendors")
  async findVendors(@Req() req: any, @Res() res: any) {
    const data = await this.vendorQuickBooksService.findVendors(req, res);

    return { message: "Successful", result: data };
  }

  @Get("find/vendors/credits")
  async findVendorCredits(@Req() req: any, @Res() res: any) {
    const data = await this.vendorQuickBooksService.findVendorCredits(req, res);

    return { message: "Successful", result: data };
  }
}
