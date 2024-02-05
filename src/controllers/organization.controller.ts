import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { UserGuard } from "src/authentication/auth/guards";

import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";
import { UpdateDepartmentDto } from "src/dtos/human-resource/department";
import { OrganizationsService } from "src/services/organization.service";
import { CreateOrganizationsDto, UpdateOrganizationsDto } from "../dtos/configurations/organizations";
import { FileInterceptor } from "@nestjs/platform-express";
import { OrgApiDoc } from "src/authentication/utils/decorators/organization.decorator";

@ApiTags("User|Org")
@Controller({
  path: "organization",
  version: "1"
})
export class OrganizationController {
  constructor(private organizationsService: OrganizationsService) {}

  /**
   * DROPDOWN ->organization data
   */
  @Get("dropdown")
  @ApiOperation({
    summary: "Get organization dropdown data",
    description: "This api is responsible for fetching organization dropdown"
  })
  async dropdown() {
    const data = await this.organizationsService.dropdown();
    return { message: "successful", result: data };
  }

  //   create a new organization
  @ApiOperation({
    summary: "create organization by a user",
    description: "this route is responsible for create a organization"
  })
  @ApiBody({
    type: CreateOrganizationsDto,
    description: "How to create a organization with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter organization info",
        value: {
          organizationName: "Techno Limited",
          email: "techno@gmail.org",
          organizationLogo: "src/logo.png",
          organizationType: "Tech based",
          address: "Male",
          country: "Croatia",
          phone: "+385-(0) 21-388-951",
          currency: "Euro",
          currencySymbol: "kn"
        } as unknown as CreateOrganizationsDto
      }
    }
  })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("logoFile"))
  @OrgApiDoc("logoFile")
  @Post("create")
  async create(@Body() createOrganizationsDto: CreateOrganizationsDto, @UploadedFile() logoFile: any) {
    console.log("dadsaadads");
    createOrganizationsDto["logoFile"] = logoFile;

    const data = await this.organizationsService.createOrg(createOrganizationsDto);

    return { message: "successful!", result: data };
  }

  // update a designation by id
  @ApiOperation({
    summary: "update designation by id",
    description: "this route is responsible for update designation by id"
  })
  @ApiBody({
    type: UpdateDepartmentDto,
    description: "How to update a designation by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          organizationName: "Techno Limited",
          email: "techno@gmail.org",
          organizationLogo: "src/logo.png",
          organizationType: "Tech based",
          address: "Male",
          country: "Croatia",
          phone: "+385-(0) 21-388-951",
          currency: "Euro",
          currencySymbol: "kn"
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a organization required id",
    required: true
  })
  @ApiBearerAuth("jwt")
  @UseGuards(UserGuard)
  @Patch(":id")
  async update(@Body() updateOrganizationsDto: UpdateOrganizationsDto, @Param("id") id: number, @UserPayload() userPayload: UserInterface) {
    const data = await this.organizationsService.updateOrg(updateOrganizationsDto, id, userPayload);
    return { message: "successful!", result: data };
  }

  // find single designation
  @ApiOperation({
    summary: "find single organization by id",
    description: "this route is responsible for find single organization by id"
  })
  @ApiBearerAuth("jwt")
  @UseGuards(UserGuard)
  @Get("findOne")
  async findOne(@UserPayload() userPayload: UserInterface) {
    const data = await this.organizationsService.findOneOrg(userPayload);
    return { message: "successful!", result: data };
  }

  // get all organization data with paginaiton
  @ApiOperation({
    summary: "get all organization data with pagination",
    description: "this route is responsible for getting all organization data with pagination"
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
  async getAll(@Query() listQueryParam: PaginationOptionsInterface, @Query("keyword") keyword: any) {
    const result = await this.organizationsService.findAllOrgnaizationData(listQueryParam, keyword);

    return { message: "successful", result: result };
  }

  // delete single organization
  @ApiOperation({
    summary: "delete single organization by id",
    description: "this route is responsible for delete single organization by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single organization required id",
    required: true
  })
  @Delete(":id")
  async delete(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.organizationsService.deleteOrganization(id);
    return { message: "successful!", result: data };
  }
}
