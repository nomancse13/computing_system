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
import {
  PaginationOptionsInterface,
  UserInterface
} from "src/authentication/common/interfaces";
import {
  IpPlusClientAddress,
  UserPayload
} from "src/authentication/utils/decorators";
import { SalaryService } from "../services/salary.service";
import {
  CreateSalaryDto,
  UpdateSalaryDto
} from "../dtos/human-resource/salary";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
@ApiTags("HRM|Salary")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "salary",
  version: "1"
})
export class SalaryController {
  constructor(private salaryService: SalaryService) {}

  //   create a new salary
  @ApiOperation({
    summary: "create salary by a user",
    description: "this route is responsible for create a salary"
  })
  @ApiBody({
    type: CreateSalaryDto,
    description:
      "How to create a salary with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter salary info",
        value: {
          note: "This is test",
          month: "November",
          totalAmount: 1000.0,
          debitLedgerId: 2,
          creditLedgerId: 2
        } as unknown as CreateSalaryDto
      }
    }
  })
  @Post()
  async create(
    @Body() createSalaryDto: CreateSalaryDto,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UserPayload() userPayload: UserInterface
  ) {
    createSalaryDto["ipPayload"] = ipClientPayload;

    const data = await this.salaryService.createSalary( 
      createSalaryDto,
      userPayload
    );

    return { message: "successful!", result: data };
  }

  // update an salary by id
  @ApiOperation({
    summary: "update salary by id",
    description: "this route is responsible for update salary by id"
  })
  @ApiBody({
    type: UpdateSalaryDto,
    description:
      "How to update an salary by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          note: "This is test",
          month: "November",
          totalAmount: 1000.0,
          debitLedgerId: 2,
          creditLedgerId: 2
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a salary required id",
    required: true
  })
  @Patch(":id")
  async update(
    @Body() updateSalaryDto: UpdateSalaryDto,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UserPayload() userPayload: UserInterface,
    @Param("id") id: number
  ) {
    const data = await this.salaryService.updateSalary(
      updateSalaryDto,
      userPayload,
      id
    );
    return { message: "successful!", result: data };
  }

  // find single salary
  @ApiOperation({
    summary: "find single salary by id",
    description: "this route is responsible for find single salary by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single salary required id",
    required: true
  })
  @Get(":id")
  async findOne(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface
  ) {
    const data = await this.salaryService.findOneSalaryData(
      id,
      userPayload,
      ipClientPayload
    );
    return { message: "successful!", result: data };
  }

  // get all salary data with paginaiton
  @ApiOperation({
    summary: "get all salary data with pagination",
    description:
      "this route is responsible for getting all salary data with pagination"
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
    console.log("noman");

    const result = await this.salaryService.findAllSalaryData(
      listQueryParam,
      filter,
      ipClientPayload,
      userPayload
    );

    return { message: "successful", result: result };
  }

  // delete single salary
  @ApiOperation({
    summary: "delete single salary by id",
    description: "this route is responsible for delete single salary by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single salary required id",
    required: true
  })
  @Delete(":id")
  async delete(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface
  ) {
    const data = await this.salaryService.deleteSalary(
      id,
      userPayload,
      ipClientPayload
    );
    return { message: "successful!", result: data };
  }
}
