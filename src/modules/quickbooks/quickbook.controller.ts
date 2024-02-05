/**dependencies */
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserInterface } from "../../authentication/common/interfaces";
import { QuickBookService } from "./quickbook.service";
import { UserGuard } from "src/authentication/auth/guards";
import { UserPayload } from "src/authentication/utils/decorators";
import { AuthService } from "src/authentication/auth/auth.service";

//guard
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@ApiTags("QUICKBOOKS")
@Controller({
  //path name
  path: "",
  //version
  version: "1"
})
export class QuickBookController {
    constructor(private readonly quickBookService: QuickBookService,
        private readonly authService: AuthService,
    ) { }

  //#region Authentication

  @Get("quickauth")
  @HttpCode(HttpStatus.CREATED)
  async signupLocal(@UserPayload() userPayload: UserInterface) {
   
      const data = await this.authService.intuitAuthentication(userPayload);
    // return data;
    return { message: "Successful", result: data }; 
  }

  // @Get("refresh")
  // async refresh(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
  //     const data = await this.authService.refreshtoken(req, res,userPayload);

  //   return { message: "Successful", result: data };
  // }
  //#endregion
  //#region Product
  @Post("createProduct")
  async createProduct(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    //const data = await this.quickBookService.createProduct(req, res,userPayload);

    //return { message: "Successful", result: data };
  }
  
  @Get("getProduct")
  async getProduct(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findProducts(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  
  @Patch("updateProduct")
  async updateProduct(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateProduct(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion
  //#region Customer

  @Post("createCustomer")
  async createCustomer(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createCustomer(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Get("getCustomer")
  async getCustomer(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getCustomer(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Get("findCustomers")
  async findCustomers(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    console.log('userPayload: ', userPayload);

    const data = await this.quickBookService.findCustomers(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Patch("updateCustomer")
  async updateCustomer(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateCustomer(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion
  //#region Vendor
  @Post("createVendor")
  async createVendor(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createVendor(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Get("getVendor")
  async getVendor(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getVendor(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Get("findVendors")
  async findVendors(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findVendors(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Patch("updateVendor")
  async updateVendor(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateVendor(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion
  //#region Employee
  @Post("createEmployee")
  async createEmployee(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createEmployee(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Get("getEmployee")
  async getEmployee(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getEmployee(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Get("findEmployee")
  async findEmployee(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findEmployees(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Patch("updateEmployee")
  async updateEmployee(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateEmployee(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion
  //#region Department
  @Post("createDepartment")
  async createDepartment(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createDepartment(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Get("getDepartment")
  async getDepartment(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getDepartment(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Get("findDepartment")
  async findDepartment(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findDepartments(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Patch("updateDepartment")
  async updateDepartment(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateDepartment(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion
  //#region Account
  @Post("createaccount")
  async createAccount(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createAccount(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateaccount")
  async updateAccount(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateAccount(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getAccount")
  async getAccount(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getAccount(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findAccounts")
  async findAccounts(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findAccounts(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion
  //#region Attachable
  @Post("createAttachable")
  async createAttachable(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createAttachable(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  @Get("get/attachable")
  async getAttachable(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getAttachable(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("updateAttachable")
  async updateAttachable(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateAttachable(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("delete/attachable")
  async deleteAttachable(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.deleteAttachable(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("find/attachables")
  async findAttachables(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findAttachables(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion
  //#region Class

  @Post("createclass")
  async createClass(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createClass(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateclass")
  async updateClass(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateClass(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getclass")
  async getClass(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getClass(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findclass")
  async findClass(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findClasses(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion
  //#region Invoice
  @Post("createInvoice")
  async createInvoice(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createInvoice(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateInvoice")
  async updateInvoice(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateInvoice(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getInvoice")
  async getInvoice(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getInvoice(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findInvoice")
  async findInvoice(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findInvoices(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion

  //#region Estimate
  @Post("createEstimate")
  async createEstimate(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createEstimate(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateEstimate")
  async updateEstimate(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateEstimate(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getEstimate")
  async getEstimate(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getEstimate(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findEstimate")
  async findEstimate(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findEstimates(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion

  //#region creditMemo

  @Post("createCreditMemo")
  async createCreditMemo(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createCreditMemo(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getCreditMemo")
  async getCreditMemo(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getCreditMemo(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateCreditMemo")
  async updateCreditMemo(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateCreditMemo(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findCreditMemos")
  async findCreditMemos(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findCreditMemos(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Delete("delete/credit/memo")
  async deleteCreditMemo(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.deleteCreditMemo(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion
  //#region Deposit
  @Post("createDeposit")
  async createDeposit(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createDeposit(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getDeposit")
  async getDeposit(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getDeposit(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateDeposit")
  async updateDeposit(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateDeposit(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findDeposits")
  async findDeposits(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findDeposits(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Delete("deleteDeposit")
  async deleteDeposit(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.deleteDeposit(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  //#endregion
  //#region Payment

  @Post("createPayment")
  async createPayment(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createPayment(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updatePayment")
  async updatePayment(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updatePayment(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findPayments")
  async findPayments(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findPayments(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Delete("deletePayment")
  async deletePayment(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.deletePayment(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  //#endregion
  //#region PaymentMethod
  @Post("createPaymentMethod")
  async createPaymentMethod(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createPaymentMethod(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getPaymentMethod")
  async getPaymentMethod(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getPaymentMethod(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updatePaymentMethod")
  async updatePaymentMethod(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updatePaymentMethod(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findPaymentsMethods")
  async findPaymentMethods(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findPaymentMethods(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  //#endregion
  //#region refundReceipt
  @Post("createRefundReceipt")
  async createRefundReceipt(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createRefundReceipt(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getRefundReceipt")
  async getRefundReceipt(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getRefundReceipt(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateRefundReceipt")
  async updateRefundReceipt(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateRefundReceipt(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Delete("deleteRefundReceipt")
  async deleteRefundReceipt(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.deleteRefundReceipt(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findRefundReceipt")
  async findRefundReceipts(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findRefundReceipts(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  //#endregion
  //#region SalesReceipt
  @Post("createSalesReceipt")
  async createSalesReceipt(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createSalesReceipt(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateSalesReceipt")
  async updateSalesReceipt(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateSalesReceipt(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findSalesReceipt")
  async findSalesReceipts(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findSalesReceipts(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Delete("deleteSalesReceipt")
  async deleteSalesReceipt(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.deleteSalesReceipt(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  //#endregion
  //#region Tax
  @Post("createTax")
  async createTaxService(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createTaxService(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getTaxAgency")
  async getTaxAgency(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getTaxAgency(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getTaxCode")
  async getTaxCode(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getTaxCode(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getTaxRate")
  async getTaxRate(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getTaxRate(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateTaxAgency")
  async updateTaxAgency(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateTaxAgency(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateTaxCode")
  async updateTaxCode(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateTaxCode(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateTaxRate")
  async updateTaxRate(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateTaxRate(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findTaxAgency")
  async findTaxAgencies(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findTaxAgencies(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findTaxCodes")
  async findTaxCodes(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findTaxCodes(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findTaxRates")
  async findTaxRates(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findTaxRates(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  //#endregion
  //#region Term
  @Post("createTerm")
  async createTerm(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createTerm(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getTerm")
  async getTerm(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getTerm(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateTerm")
  async updateTerm(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateTerm(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findTerms")
  async findTerms(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findTerms(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  //#endregion
  //#region TimeActivity
  @Post("createTimeActivity")
  async createTimeActivity(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createTimeActivity(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getTimeActivity")
  async getTimeActivity(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getTimeActivity(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findTimeActivities")
  async findTimeActivities(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findTimeActivities(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateTimeActivity")
  async updateTimeActivity(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateTimeActivity(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Delete("deleteTimeActivity")
  async deleteTimeActivity(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.deleteTimeActivity(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  //#endregion
  //#region Transfer
  @Post("createTransfer")
  async createTransfer(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createTransfer(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateTransfer")
  async updateTransfer(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateTransfer(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Delete("deleteTransfer")
  async deleteTransfer(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.deleteTransfer(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  //#endregion

  //#region Bill
  @Post("createBill")
  async createBill(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createBill(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateBill")
  async updateBill(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateBill(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getBill")
  async getBill(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getBill(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findBill")
  async findBill(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findBills(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion

  //#region Purchase
  @Post("createPurchase")
  async createPurchase(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createPurchase(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updatePurchase")
  async updatePurchase(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updatePurchase(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getPurchase")
  async getPurchase(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getPurchase(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findPurchase")
  async findPurchase(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findPurchases(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion

  //#region PurchaseOrder
  @Post("createPurchaseOrder")
  async createPurchaseOrder(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createPurchaseOrder(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updatePurchaseOrder")
  async updatePurchaseOrder(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updatePurchaseOrder(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getPurchaseOrder")
  async getPurchaseOrder(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getPurchaseOrder(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findPurchaseOrder")
  async findPurchaseOrder(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findPurchaseOrders(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion

  //#region BillPayment
  @Post("createBillPayment")
  async createBillPayment(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createBillPayment(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateBillPayment")
  async updateBillPayment(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateBillPayment(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getBillPayment")
  async getBillPayment(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getBillPayment(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findBillPayment")
  async findBillPayment(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findBillPayments(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion

  //#region VendorCredit
  @Post("createVendorCredit")
  async createVendorCredit(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.createVendorCredit(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateVendorCredit")
  async updateVendorCredit(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateVendorCredit(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("getVendorCredit")
  async getVendorCredit(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getVendorCredit(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findVendorCredit")
  async findVendorCredit(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findVendorCredits(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion

  //#region Exchange rate

  @Get("getExchangeRate")
  async getExchangeRate(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getExchangeRate(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updateExachangeRate")
  async updateExchangeRate(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updateExchangeRate(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findExchangeRates")
  async findExchangeRates(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findExchangeRates(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion

  //#region Preferences

  @Get("getPreferences")
  async getPreferences(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getPreferences(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Patch("updatePreferences")
  async updatePreferences(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.updatePreferences(req, res,userPayload);

    return { message: "Successful", result: data };
  }

  @Get("findPreferenceses")
  async findPreferenceses(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findPreferenceses(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion

  //#region Reports

  @Get("getReports")
  async getReports(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.getReports(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion

  //#region budgets

  @Get("findBudgets")
  async findBudgets(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findBudgets(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion

  //#region classes

  @Get("findClasses")
  async findClasses(@Req() req: any, @Res() res: any, @UserPayload() userPayload: UserInterface) {
    const data = await this.quickBookService.findClasses(req, res,userPayload);

    return { message: "Successful", result: data };
  }
  //#endregion
}
