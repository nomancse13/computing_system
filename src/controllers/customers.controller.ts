import { UserGuard } from "src/authentication/auth/guards";
import { Body, Controller, Get, Post, Query, UseGuards, Param, Patch, Delete } from "@nestjs/common";

import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";
import { CustomersService } from "../services/customers.service";
import { CreateCustormersDto, UpdateCustomersDto } from "../dtos/receivables/customers";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";

@ApiTags("Sales|Customers")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "customers",
  version: "1"
})
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  // find single customers account
  @ApiOperation({
    summary: "find single customers by id",
    description: "this route is responsible for find single customers by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single customers required id",
    required: true
  })
  @Get("address/:id")
  async findCus(@Param("id") id: number, @UserPayload() userPayload: UserInterface) {
    const data = await this.customersService.findCustomerAddressById(id, userPayload);
    return { message: "successful!", result: data };
  }

  /**
   * DROPDOWN ->customer inovoice data
   */
  @Get("dropdown/invoice")
  @ApiOperation({
    summary: "Get customer inovoice dropdown data",
    description: "This api is responsible for fetching customer inovoice dropdown"
  })
  async customerinvoiceDropdown(@UserPayload() userPayload: UserInterface) {
    const data = await this.customersService.dropdownCustomerInvoice(userPayload);
    return { message: "successful", result: data };
  }
  /**
   * DROPDOWN ->customer data
   */
  @Get("dropdown")
  @ApiOperation({
    summary: "Get customer dropdown data",
    description: "This api is responsible for fetching customer dropdown"
  })
  async customerDropdown(@UserPayload() userPayload: UserInterface) {
    const data = await this.customersService.dropdown(userPayload);
    return { message: "successful", result: data };
  }
  //   create a new customers account
  @ApiOperation({
    summary: "create customers by a user",
    description: "this route is responsible for create a customers"
  })
  @ApiBody({
    type: CreateCustormersDto,
    description: "How to create a customers with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter customers",
        value: {
          email: "rizal@gmail.com",
          displayName: "rizal",
          mobile: "0192938283",
          billAddr: "syedpur",
          permanentAddress: "syedpur",
          openingBalance: 2000
        } as unknown as CreateCustormersDto
      }
    }
  })
  @Post("create")
  async create(@Body() createCustormersDto: CreateCustormersDto, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @UserPayload() userPayload: UserInterface) {
    createCustormersDto["ipPayload"] = ipClientPayload;

    const data = await this.customersService.createCustomers(createCustormersDto, userPayload);

    return { message: "successful!", result: data };
  }

  // update a customers by id
  @ApiOperation({
    summary: "update customers by id",
    description: "this route is responsible for update customers by id"
  })
  @ApiBody({
    type: UpdateCustomersDto,
    description: "How to update a customers by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          email: "rizal@gmail.com",
          displayName: "rizal",
          mobile: "0192938283",
          billAddr: "syedpur",
          permanentAddress: "syedpur",
          openingBalance: 2000
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a customers required id",
    required: true
  })
  @Patch(":id")
  async update(@Body() updateCustomersDto: UpdateCustomersDto, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @Param("id") id: number) {
    updateCustomersDto["ipPayload"] = ipClientPayload;

    const data = await this.customersService.updateCustomers(updateCustomersDto, userPayload, id);
    return { message: "successful!", result: data };
  }

  // find single customers account
  @ApiOperation({
    summary: "find single customers by id",
    description: "this route is responsible for find single customers by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single customers required id",
    required: true
  })
  @Get(":id")
  async findSingleCustomers(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.customersService.findSingleCustomer(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }

  // get all customers data with paginaiton
  @ApiOperation({
    summary: "get all customers data with pagination",
    description: "this route is responsible for getting all customers data with pagination"
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
    const result = await this.customersService.findAllCustomersData(listQueryParam, filter, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }

  // delete single customers account
  @ApiOperation({
    summary: "delete single customers account by id",
    description: "this route is responsible for delete single customers account by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single customers account required id",
    required: true
  })
  @Delete(":id")
  async deleteCustomers(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.customersService.deleteCustomer(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }
}
