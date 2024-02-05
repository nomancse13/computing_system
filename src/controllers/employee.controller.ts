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
  UseInterceptors,
  Delete,
  UploadedFile
} from "@nestjs/common";

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import { EmployeeService } from "../services/employee.service";
import {
  CreateEmployeesDto,
  UpdateEmployeesDto
} from "../dtos/human-resource/employees";
import { FileInterceptor } from "@nestjs/platform-express";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
import { EmployeeApiDoc } from "src/authentication/utils/decorators/create-employee.decorator";
import { TransactionInterceptor } from "src/authentication/utils/interceptors/transaction.interceptor";

@ApiTags("HRM|Employee")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "employee",
  version: "1"
})
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  /**
   * DROPDOWN ->employee data
   */
  @Get("dropdown")
  @ApiOperation({
    summary: "Get employee dropdown data",
    description: "This api is responsible for fetching employee dropdown"
  })
  async employeeDropdown(    @UserPayload() userPayload: UserInterface
  ) {
    const data = await this.employeeService.dropdown(userPayload);
    return { message: "successful", result: data };
  }
  //   create a new employee
  @ApiOperation({
    summary: "create employee by a user",
    description: "this route is responsible for create a employee"
  })
  @ApiBody({
    type: CreateEmployeesDto,
    description:
      "How to create a employee with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter employee info",
        value: {
          groupName: "test11",
          groupParentId: 1,
          groupIdentifier: "test",
          groupType: "test",
          nature: "test",
          postedTo: "test",
          groupHeadType: "test"
        } as unknown as CreateEmployeesDto
      }
    }
  })
  @ApiConsumes("multipart/form-data")
  @EmployeeApiDoc("file")
  @UseInterceptors(TransactionInterceptor)
  @UseInterceptors(FileInterceptor("file"))
  @Post("create")
  async create(
    @Body() createEmployeesDto: CreateEmployeesDto,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UploadedFile() file: any,
    @UserPayload() userPayload: UserInterface
  ) {
    createEmployeesDto["file"] = file;

    createEmployeesDto["ipPayload"] = ipClientPayload;

    const data = await this.employeeService.createEmployees(
      createEmployeesDto,
      userPayload
    );

    return { message: "successful!", result: data };
  }

  // update an employee by id
  @ApiOperation({
    summary: "update employee by id",
    description: "this route is responsible for update employee by id"
  })
  @ApiBody({
    type: UpdateEmployeesDto,
    description:
      "How to update an employee by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          groupName: "test11",
          groupParentId: 1,
          groupIdentifier: "test",
          groupType: "test",
          nature: "test",
          postedTo: "test",
          groupHeadType: "test"
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a employee required id",
    required: true
  })
  @ApiConsumes("multipart/form-data")
  @EmployeeApiDoc("file")
  @UseInterceptors(FileInterceptor("file"))
  @Patch(":id")
  async update(
    @Body() updateEmployeesDto: UpdateEmployeesDto,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UploadedFile() file: any,
    @Param("id") id: number
  ) {
    updateEmployeesDto["file"] = file;
    console.log("ipClientPayload: " + ipClientPayload);
    updateEmployeesDto["ipPayload"] = ipClientPayload;

    const data = await this.employeeService.updateEmployees(
      updateEmployeesDto,
      userPayload,
      id
    );
    return { message: "successful!", result: data };
  }

  // find single employee
  @ApiOperation({
    summary: "find single employee by id",
    description: "this route is responsible for find single employee by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single employee required id",
    required: true
  })
  @Get(":id")
  async findOne(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface
  ) {
    const data = await this.employeeService.findSingleEmployeesData(
      id,
      userPayload,
      ipClientPayload
    );
    return { message: "successful!", result: data };
  }

  // find  employee salary by id
  @ApiOperation({
    summary: "find employee salary by id",
    description: "this route is responsible for find employee salary by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find employee salary required id",
    required: true
  })
  @Get("salary/:id")
  async findSalary(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface
  ) {
    const data = await this.employeeService.getEmployeeSalaryById(id, userPayload);
    return { message: "successful!", result: data };
  }

  // get all employee data with paginaiton
  @ApiOperation({
    summary: "get all employee data with pagination",
    description:
      "this route is responsible for getting all employee data with pagination"
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
    const result = await this.employeeService.findAllEmployeesData(
      listQueryParam,
      keyword,
      ipClientPayload,
      userPayload
    );

    return { message: "successful", result: result };
  }

  // delete single employee
  @ApiOperation({
    summary: "delete single employee by id",
    description: "this route is responsible for delete single employee by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single employee required id",
    required: true
  })
  @Delete(":id")
  async delete(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface
  ) {
    const data = await this.employeeService.deleteEmployees(
      id,
      userPayload,
      ipClientPayload
    );
    return { message: "successful!", result: data };
  }
}
