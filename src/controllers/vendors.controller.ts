import { UserGuard } from "src/authentication/auth/guards";
import { Body, Controller, Get, Post, Query, UseGuards, Param, Patch, Delete } from "@nestjs/common";

import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";
import { VendorsService } from "../services/Vendors.service";
import { CreateVendorsDto, UpdateVendorsDto } from "../dtos/payables/vendors";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";

@ApiTags("Expense|Vendors")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "vendors",
  version: "1"
})
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  // find single Vendors account
  @ApiOperation({
    summary: "find single Vendors by id",
    description: "this route is responsible for find single Vendors by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single Vendors required id",
    required: true
  })
  @Get("address/:id")
  async findVendors(@Param("id") id: number, @UserPayload() userPayload: UserInterface) {
    const data = await this.vendorsService.findVendorAddressById(id, userPayload);
    return { message: "successful!", result: data };
  }

  // delete single Vendors account
  @ApiOperation({
    summary: "delete single Vendors account by id",
    description: "this route is responsible for delete single Vendors account by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single Vendors account required id",
    required: true
  })
  @Delete("delete/:id")
  async deleteVendors(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    console.log("noman");

    const data = await this.vendorsService.deleteVendor(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }
  /**
   * DROPDOWN ->vendor data
   */
  @Get("dropdown")
  @ApiOperation({
    summary: "Get vendor dropdown data",
    description: "This api is responsible for fetching vendor dropdown"
  })
  async vendorDropdown(@UserPayload() userPayload: UserInterface) {
    const data = await this.vendorsService.dropdown(userPayload);
    return { message: "successful", result: data };
  }
  //   create a new Vendors account
  @ApiOperation({
    summary: "create Vendors by a user",
    description: "this route is responsible for create a Vendors"
  })
  @ApiBody({
    type: CreateVendorsDto,
    description: "How to create a Vendors with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter Vendors",
        value: {
          vendorCode: "Acc-0001",
          displayName: "Mahbub",
          mobile: "0192938283",
          billAddr: "Cumilla",
          permanentAddress: "Cumilla",
          openingBalance: 1000
        } as unknown as CreateVendorsDto
      }
    }
  })
  @Post()
  async create(@Body() createVendorsDto: CreateVendorsDto, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @UserPayload() userPayload: UserInterface) {
    createVendorsDto["ipPayload"] = ipClientPayload;
    console.log(ipClientPayload, "ipClientPayload");
    const data = await this.vendorsService.createVendors(createVendorsDto, userPayload);

    return { message: "successful!", result: data };
  }

  // update a Vendors by id
  @ApiOperation({
    summary: "update Vendors by id",
    description: "this route is responsible for update Vendors by id"
  })
  @ApiBody({
    type: UpdateVendorsDto,
    description: "How to update a Vendors by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          vendorCode: "ACC-0001",
          displayName: "noman",
          mobile: "0192938283",
          billAddr: "jamn",
          permanentAddress: "syedpur",
          openingBalance: 1000
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a Vendors required id",
    required: true
  })
  @Patch(":id")
  async update(@Body() updateVendorsDto: UpdateVendorsDto, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @Param("id") id: number) {
    updateVendorsDto["ipPayload"] = ipClientPayload;

    const data = await this.vendorsService.updateVendors(updateVendorsDto, userPayload, id);
    return { message: "successful!", result: data };
  }

  // find single Vendors account
  @ApiOperation({
    summary: "find single Vendors by id",
    description: "this route is responsible for find single Vendors by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single Vendors required id",
    required: true
  })
  @Get(":id")
  async findSingleVendors(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.vendorsService.findSingleVendor(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }

  // get all Vendors data with paginaiton
  @ApiOperation({
    summary: "get all Vendors data with pagination",
    description: "this route is responsible for getting all Vendors data with pagination"
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
    const result = await this.vendorsService.findAllVendorsData(listQueryParam, filter, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }
}
