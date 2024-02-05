import { UserGuard } from "src/authentication/auth/guards";
import { Body, Controller, Get, Post, Query, UseGuards, Param, Patch, Delete } from "@nestjs/common";

import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";
import { UpdateOrganizationsDto } from "../dtos/configurations/organizations";
import { DesignationService } from "../services/designation.service";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
import { CreateDepartmentDto, UpdateDepartmentDto } from "src/dtos/human-resource/department";

@ApiTags("HRM|Designation")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "designation",
  version: "1"
})
export class DesignationController {
  constructor(private designationService: DesignationService) {}

  /**
   * DROPDOWN ->designaiton data
   */
  @Get("dropdown")
  @ApiOperation({
    summary: "Get designaiton dropdown data",
    description: "This api is responsible for fetching designaiton dropdown"
  })
  async dropdown(@UserPayload() userPayload: UserInterface) {
    const data = await this.designationService.dropdown(userPayload);
    return { message: "successful", result: data };
  }

  //   create a new designation
  @ApiOperation({
    summary: "create designation by a user",
    description: "this route is responsible for create a designation"
  })
  @ApiBody({
    type: CreateDepartmentDto,
    description: "How to create a designation with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter designation info",
        value: {
          note: "this is for designation note",
          name: "noman"
        } as unknown as CreateDepartmentDto
      }
    }
  })
  @Post()
  async create(@Body() CreateDepartmentDto: CreateDepartmentDto, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @UserPayload() userPayload: UserInterface) {
    CreateDepartmentDto["ipPayload"] = ipClientPayload;

    const data = await this.designationService.createdesignation(CreateDepartmentDto, userPayload);

    return { message: "successful!", result: data };
  }

  // update an designation by id
  @ApiOperation({
    summary: "update designation by id",
    description: "this route is responsible for update designation by id"
  })
  @ApiBody({
    type: UpdateDepartmentDto,
    description: "How to update an designation by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          note: "this is for designation note",
          name: "noman"
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a designation required id",
    required: true
  })
  @Patch(":id")
  async update(@Body() UpdateDepartmentDto: UpdateDepartmentDto, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @Param("id") id: number) {
    UpdateDepartmentDto["ipPayload"] = ipClientPayload;

    const data = await this.designationService.updatedesignation(UpdateDepartmentDto, userPayload, id);
    return { message: "successful!", result: data };
  }

  // find single designation
  @ApiOperation({
    summary: "find single designation by id",
    description: "this route is responsible for find single designation by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single designation required id",
    required: true
  })
  @Get(":id")
  async findOne(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.designationService.findSingleDesignation(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }

  // get all designation data with paginaiton
  @ApiOperation({
    summary: "get all designation data with pagination",
    description: "this route is responsible for getting all designation data with pagination"
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
    name: "keyword",
    type: String,
    description: "insert keyword if you need",
    required: false
  })
  @Get("get/all")
  async getAll(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query("keyword") keyword: any,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UserPayload() userPayload: UserInterface
  ) {
    const result = await this.designationService.findAlldesignation(listQueryParam, keyword, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }

  // delete single designation
  @ApiOperation({
    summary: "delete single designation by id",
    description: "this route is responsible for delete single designation by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single designation required id",
    required: true
  })
  @Delete(":id")
  async delete(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.designationService.deletedesignation(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }
}
