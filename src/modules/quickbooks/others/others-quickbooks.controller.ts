/**dependencies */
import { Controller, Get, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JournalQuickBooksService } from "./journal-quickbooks.service";
import { EmployeeQuickBooksService } from "./employee-quickbooks.service";
import { DepartmentQuickBooksService } from "./department-quickbooks.service";
import { CompanyQuickBooksService } from "./company-quickbooks.service";

//guard
@ApiTags("QUICKBOOKS|Others")
@Controller({
  //path name
  path: "others",
  //version
  version: "1"
})
export class OthersQuickBooksController {
  constructor(
    private readonly journalQuickBooksService: JournalQuickBooksService,
    private readonly employeeQuickBooksService: EmployeeQuickBooksService,
    private readonly departmentQuickBooksService: DepartmentQuickBooksService,
    private readonly companyQuickBooksService: CompanyQuickBooksService
  ) {}

  //   ******Journal Portion
  @Get("create/journal/code")
  async createJournalCode(@Req() req: any, @Res() res: any) {
    const data = await this.journalQuickBooksService.createJournalCode(
      req,
      res
    );

    return { message: "Successful", result: data };
  }
  @Get("create/journal/entry")
  async createJournalEntry(@Req() req: any, @Res() res: any) {
    const data = await this.journalQuickBooksService.createJournalEntry(
      req,
      res
    );

    return { message: "Successful", result: data };
  }
  @Get("update/jounal/code")
  async updateJournalCode(@Req() req: any, @Res() res: any) {
    const data = await this.journalQuickBooksService.updateJournalCode(
      req,
      res
    );

    return { message: "Successful", result: data };
  }
  @Get("update/jounal/entry")
  async updateJournalEntry(@Req() req: any, @Res() res: any) {
    const data = await this.journalQuickBooksService.updateJournalEntry(
      req,
      res
    );

    return { message: "Successful", result: data };
  }
  @Get("delete/jounal/code")
  async deleteJournalCode(@Req() req: any, @Res() res: any) {
    const data = await this.journalQuickBooksService.deleteJournalCode(
      req,
      res
    );

    return { message: "Successful", result: data };
  }
  @Get("delete/jounal/entry")
  async deleteJournalEntry(@Req() req: any, @Res() res: any) {
    const data = await this.journalQuickBooksService.deleteJournalEntry(
      req,
      res
    );

    return { message: "Successful", result: data };
  }
  @Get("find/jounal/codes")
  async findJournalCodes(@Req() req: any, @Res() res: any) {
    const data = await this.journalQuickBooksService.findJournalCodes(req, res);

    return { message: "Successful", result: data };
  }
  @Get("find/jounal/entries")
  async findJournalEntries(@Req() req: any, @Res() res: any) {
    const data = await this.journalQuickBooksService.findJournalEntries(
      req,
      res
    );

    return { message: "Successful", result: data };
  }

  //   ******Employee Portion

  @Get("create/employee")
  async createEmployee(@Req() req: any, @Res() res: any) {
    const data = await this.employeeQuickBooksService.createEmployee(req, res);

    return { message: "Successful", result: data };
  }
  @Get("get/employee")
  async getEmployee(@Req() req: any, @Res() res: any) {
    const data = await this.employeeQuickBooksService.getEmployee(req, res);

    return { message: "Successful", result: data };
  }

  @Get("update/employee")
  async updateEmployee(@Req() req: any, @Res() res: any) {
    const data = await this.employeeQuickBooksService.updateEmployee(req, res);

    return { message: "Successful", result: data };
  }
  @Get("get/employee")
  async findEmployees(@Req() req: any, @Res() res: any) {
    const data = await this.employeeQuickBooksService.findEmployees(req, res);

    return { message: "Successful", result: data };
  }

  //   ******department Portion

  @Get("create/department")
  async createDepartment(@Req() req: any, @Res() res: any) {
    const data = await this.departmentQuickBooksService.createDepartment(
      req,
      res
    );

    return { message: "Successful", result: data };
  }

  @Get("get/department")
  async getDepartment(@Req() req: any, @Res() res: any) {
    const data = await this.departmentQuickBooksService.getDepartment(req, res);

    return { message: "Successful", result: data };
  }

  @Get("update/department")
  async updateDepartment(@Req() req: any, @Res() res: any) {
    const data = await this.departmentQuickBooksService.updateDepartment(
      req,
      res
    );

    return { message: "Successful", result: data };
  }

  @Get("find/department")
  async findDepartments(@Req() req: any, @Res() res: any) {
    const data = await this.departmentQuickBooksService.findDepartments(
      req,
      res
    );

    return { message: "Successful", result: data };
  }

  //   ******company Portion

  @Get("get/company/info")
  async getCompanyInfo(@Req() req: any, @Res() res: any) {
    const data = await this.companyQuickBooksService.getCompanyInfo(req, res);

    return { message: "Successful", result: data };
  }

  @Get("update/company/info")
  async updateCompanyInfo(@Req() req: any, @Res() res: any) {
    const data = await this.companyQuickBooksService.updateCompanyInfo(
      req,
      res
    );

    return { message: "Successful", result: data };
  }

  @Get("find/company/info")
  async findCompanyInfos(@Req() req: any, @Res() res: any) {
    const data = await this.companyQuickBooksService.findCompanyInfos(req, res);

    return { message: "Successful", result: data };
  }
}
