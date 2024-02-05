import { UserGuard } from "src/authentication/auth/guards";
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Param,
  Patch,
  Delete
} from "@nestjs/common";

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from "@nestjs/swagger";
import { CreateAccountingGroupDto, UpdateAccountingGroupDto } from "../dtos/account/accounting-group";
import {
  PaginationOptionsInterface,
  UserInterface
} from "src/authentication/common/interfaces";
import {
  IpPlusClientAddress,
  UserPayload
} from "src/authentication/utils/decorators";
import { AccountingGroupService } from "../services/accounting-group.service";
import { UpdateOrganizationsDto } from "../dtos/configurations/organizations";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";

@ApiTags("Account|Accounting Group")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "group",
  version: "1"
})
export class AccountingGroupController {
  constructor(private accountingGroupService: AccountingGroupService) {}

  /**
   * DROPDOWN ->expense data
   */
  @Get("dropdown/expense")
  @ApiOperation({
    summary: "Get group dropdown expense data",
    description: "This api is responsible for fetching expense group dropdown"
  })
  async expenseDropdown(@UserPayload() userPayload: UserInterface) {
    const data = await this.accountingGroupService.dropdownExpense(userPayload);
    return { message: "successful", result: data };
  }
  /**
   * DROPDOWN ->group data
   */
  @Get("dropdown")
  @ApiOperation({
    summary: "Get group dropdown data",
    description: "This api is responsible for fetching group dropdown"
  })
  async groupDropdown(    @UserPayload() userPayload: UserInterface
  ) {
    const data = await this.accountingGroupService.dropdownGroup(userPayload);
    return { message: "successful", result: data };
  }

  //   create a new group
  @ApiOperation({
    summary: "create group by a user",
    description: "this route is responsible for create a group"
  })
  @ApiBody({
    type: CreateAccountingGroupDto,
    description:
      "How to create a group with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter group info",
        value: {
          groupName: "test11",
          groupParentId: 1
        } as unknown as CreateAccountingGroupDto
      }
    }
  })
  @Post('create')
  async create(
    @Body() createAccountingGroupDto: CreateAccountingGroupDto,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UserPayload() userPayload: UserInterface
  ) {
    createAccountingGroupDto["ipPayload"] = ipClientPayload;

    const data = await this.accountingGroupService.createAccGroup(
      createAccountingGroupDto,
      userPayload
    );

    return { message: "successful!", result: data };
  }

  // update an group by id
  @ApiOperation({
    summary: "update group by id",
    description: "this route is responsible for update group by id"
  })
  @ApiBody({
    type: UpdateOrganizationsDto,
    description:
      "How to update an group by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          groupName: "test11",
          groupParentId: 1
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a group required id",
    required: true
  })
  @Patch(":id")
  async update(
    @Body() updateAccountingGroupDto: UpdateAccountingGroupDto,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @Param("id") id: number
  ) {
    updateAccountingGroupDto["ipPayload"] = ipClientPayload;

    const data = await this.accountingGroupService.updateAccGroup(
      updateAccountingGroupDto,
      userPayload,
      id
    );
    return { message: "successful!", result: data };
  }

  // find single group
  @ApiOperation({
    summary: "find single group by id",
    description: "this route is responsible for find single group by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single group required id",
    required: true
  })
  @Get(":id")
  async findGroup(@Param("id") id: number, @UserPayload() userPayload: UserInterface) {
    const data = await this.accountingGroupService.findSingleGroup(id, userPayload);
    return { message: "successful!", result: data };
  }

  // get all group data with paginaiton
  @ApiOperation({
    summary: "get all group data with pagination",
    description:
      "this route is responsible for getting all group data with pagination"
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
    const result = await this.accountingGroupService.findAllGroup(
      listQueryParam,
      filter,
      ipClientPayload,
      userPayload
    );

    return { message: "successful", result: result };
  }

  // delete single group
  @ApiOperation({
    summary: "delete single group by id",
    description: "this route is responsible for delete single group by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single group required id",
    required: true
  })
  @Delete(":id")
  async deleteGroup(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface
  ) {
    
    const data = await this.accountingGroupService.deleteGroup(
      id,
      userPayload,
      ipClientPayload
    );

    return { message: "successful!", result: data };
  }
}
