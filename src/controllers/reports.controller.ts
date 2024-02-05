/**dependencies */
import {
  Controller,
  Get,
  Param,
  UseGuards
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags
} from "@nestjs/swagger";
import { UserGuard } from "src/authentication/auth/guards";
import {
  UserInterface
} from "src/authentication/common/interfaces";
import {
  UserPayload
} from "src/authentication/utils/decorators";
import { ReportsService } from "src/services/reports.service";

//guard
@ApiTags("Reports")
@Controller({
  //path name
  path: "",
  //version
  version: "1"
})
export class ReportsController {
  constructor(
    private readonly report: ReportsService,
  ) {}



  // find bank statement by ledgerid
  @ApiOperation({
    summary: "find single bank by ledgerid",
    description: "this route is responsible for find single bank by ledgerid"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single user required id",
    required: true
  })
  @ApiBearerAuth("jwt")
  @UseGuards(UserGuard)
  @Get("bankstatement/:id")
  async bankstatement(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface
  ) {
      const data = await this.report.bankStatement(id, userPayload);
    return { message: "successful!", result: data };
  }
   @Get("banksdropdown")
  async bankledgersdropdown(
    @UserPayload() userPayload: UserInterface
  ) {
    const data = await this.report.banksdropdown();
    return { message: "successful!", result: data };
  }
  


  // find customer statement by ledgerid
  @ApiOperation({
    summary: "find single bank by ledgerid",
    description: "this route is responsible for find single bank by ledgerid"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single user required id",
    required: true
  })
  @ApiBearerAuth("jwt")
  @UseGuards(UserGuard)
  @Get("customerstatement/:id")
  async customerstatement(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface
  ) {
      const data = await this.report.customerStatementSingle(id, userPayload);
    return { message: "successful!", result: data };
}
  // find supplier statement by ledgerid
  @ApiOperation({
    summary: "find single bank by ledgerid",
    description: "this route is responsible for find single supplier by ledgerid"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single user required id",
    required: true
  })
  @ApiBearerAuth("jwt")
  @UseGuards(UserGuard)
  @Get("vendorstatement/:id")
  async vendorstatement(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface
  ) {
      const data = await this.report.vendorStatementSingle(id, userPayload);
    return { message: "successful!", result: data };
  }
  
  // find account statement by ledgerid
  @ApiOperation({
    summary: "find single ledger by ledgerid",
    description: "this route is responsible for find single ledger by ledgerid"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single user required id",
    required: true
  })
  @ApiBearerAuth("jwt")
  @UseGuards(UserGuard)
  @Get("accountstatement/:id")
  async accountstatement(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface
  ) {
      const data = await this.report.accountStatementSingle(id, userPayload);
    return { message: "successful!", result: data };
  }
  

   // find account statement by ledgerid
  @ApiOperation({
    summary: "find balancesheet",
    description: "this route is responsible for find balancesheet"
  })

  @ApiBearerAuth("jwt")
  @UseGuards(UserGuard)
  @Get("balanceSheet")
  async balanceSheet(
    ipClientPayload,
    @UserPayload() userPayload: UserInterface
  ) {
    const data = await this.report.balanceSheet(ipClientPayload,
      userPayload);
    return { message: "successful!", result: data };
  }
  
 // find account statement by ledgerid
  @ApiOperation({
    summary: "find profit and loss",
    description: "this route is responsible for find profit and loss"
  })

  @ApiBearerAuth("jwt")
  @UseGuards(UserGuard)
  @Get("profitandLoss")
  async profitandLoss(
    ipClientPayload,
    @UserPayload() userPayload: UserInterface
  ) {
    const data = await this.report.profitLoss(ipClientPayload,
      userPayload);
    return { message: "successful!", result: data };
  }
}
