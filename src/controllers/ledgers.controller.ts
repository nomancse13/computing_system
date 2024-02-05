import { UserGuard } from "src/authentication/auth/guards";
import { Body, Controller, Get, Post, Query, UseGuards, Param, Patch, Delete } from "@nestjs/common";

import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { LedgersService } from "../services/ledgers.service";
import { CreateLedgersDto, UpdateLedgersDto } from "../dtos/account/account";
import { PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";

@ApiTags("Account|Ledgers")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "ledger",
  version: "1"
})
export class LedgerController {
  constructor(private ledgersService: LedgersService) {}

  /**
   * DROPDOWN ->ledger dropdown
   */
  @Get("dropdown/ledger")
  @ApiOperation({
    summary: "Get ledger dropdown data",
    description: "This api is responsible for fetching ledger dropdown data"
  })
  async allDropdown(@UserPayload() userPayload: UserInterface) {
    const data = await this.ledgersService.ledgerDropdown(userPayload);
    return { message: "successful", result: data };
  }

  /**
   * DROPDOWN ->ledger for payment voucher
   */
  @Get("dropdown")
  @ApiOperation({
    summary: "Get payment voucher ledger data",
    description: "This api is responsible for fetching payment voucher ledger data"
  })
  async voucherdropdown(@UserPayload() userPayload: UserInterface) {
    const data = await this.ledgersService.dropdown(userPayload);
    return { message: "successful", result: data };
  }

  /**
   * DROPDOWN ->ledger debit
   */
  @Get("dropdown/debit")
  @ApiOperation({
    summary: "Get group ledger debit data",
    description: "This api is responsible for fetching debit ledger"
  })
  async ledgerDropdown(@UserPayload() userPayload: UserInterface) {
    const data = await this.ledgersService.drDropdown(userPayload);
    return { message: "successful", result: data };
  }
  /**
   * DROPDOWN ->ledger credit
   */
  @Get("dropdown/credit")
  @ApiOperation({
    summary: "Get group ledger credit data",
    description: "This api is responsible for fetching credit ledger"
  })
  async dropdown(@UserPayload() userPayload: UserInterface) {
    const data = await this.ledgersService.crDropdown(userPayload);
    return { message: "successful", result: data };
  }
  //   create a new ledger
  @ApiOperation({
    summary: "create ledgers by a user",
    description: "this route is responsible for create a ledgers"
  })
  @ApiBody({
    type: CreateLedgersDto,
    description: "How to create a ledgers with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter ledger info",
        value: {
          Name: "Test Ledger",
          ledgerParent: 1,
          ledgerCode: "2312",
          ledgerType: 1,
          nature: "Dr.",
          openingBalance: 1
        } as unknown as CreateLedgersDto
      }
    }
  })
  @Post()
  async create(@Body() createLedgersDto: CreateLedgersDto, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @UserPayload() userPayload: UserInterface) {
    createLedgersDto["ipPayload"] = ipClientPayload;

    const data = await this.ledgersService.createLedger(createLedgersDto, userPayload);

    return { message: "successful!", result: data };
  }

  // update a ledger by id
  @ApiOperation({
    summary: "update a ledger by id",
    description: "this route is responsible for update a ledger by id"
  })
  @ApiBody({
    type: UpdateLedgersDto,
    description: "How to update a ledger by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          Name: "Test Ledger",
          ledgerParent: 1,
          ledgerCode: "2312",
          ledgerType: 1,
          nature: "Dr.",
          openingBalance: 1
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a ledger required id",
    required: true
  })
  @Patch(":id")
  async update(@Body() updateOrganizationsDto: UpdateLedgersDto, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @UserPayload() userPayload: UserInterface, @Param("id") id: number) {
    updateOrganizationsDto["ipPayload"] = ipClientPayload;

    const data = await this.ledgersService.updateLedger(updateOrganizationsDto, userPayload, id);
    return { message: "successful!", result: data };
  }

  // find single ledger
  @ApiOperation({
    summary: "find single ledger by id",
    description: "this route is responsible for find single ledger by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single ledger required id",
    required: true
  })
  @Get(":id")
  async findledger(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.ledgersService.findSingleLedger(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }

  // get all ledger data with paginaiton
  @ApiOperation({
    summary: "get all ledger data with pagination",
    description: "this route is responsible for getting all ledger data with pagination"
  })
  @ApiQuery({
    name: "limit",
    type: Number,
    description: "insert limit if you need",
    required: false
  })
  @ApiQuery({
    name: "page",
    type: Number,
    description: "insert page if you need",
    required: false
  })
  @ApiQuery({
    name: "filter",
    type: String,
    description: "insert filter if you need",
    required: false
  })
  @Get("get/all")
  async getAll(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query("filter") filter: any,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UserPayload() userPayload: UserInterface
  ) {
    const result = await this.ledgersService.findAllLedger(listQueryParam, filter, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }

  // delete single ledger
  @ApiOperation({
    summary: "delete single ledger by id",
    description: "this route is responsible for delete single ledger by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single ledger required id",
    required: true
  })
  @Delete(":id")
  async deleteApiPlan(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.ledgersService.deleteLedger(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }
}
