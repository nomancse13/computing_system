import { UserGuard } from "src/authentication/auth/guards";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { ModuleService } from "../services/module.service";
import { CreateModuleDto, UpdateModuleDto } from "../dtos/administrator/module";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";

@ApiTags("User|Module")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "module",
  version: "1"
})
export class ModuleController {
  constructor(private moduleService: ModuleService) {}

  //   create a new module
  @ApiOperation({
    summary: "create module by a user",
    description: "this route is responsible for create a module"
  })
  @ApiBody({
    type: CreateModuleDto,
    description:
      "How to create a module with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter module info",
        value: {
          name: "noman",
          controllerName: "noman",
          method: "noman"
        } as unknown as CreateModuleDto
      }
    }
  })
  @Post()
  async create(
    @Body() createModuleDto: CreateModuleDto,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UserPayload() userPayload: UserInterface
  ) {
    createModuleDto["ipPayload"] = ipClientPayload;

    const data = await this.moduleService.createmodule(
      createModuleDto,
      userPayload
    );

    return { message: "successful!", result: data };
  }

  // update an module by id
  @ApiOperation({
    summary: "update module by id",
    description: "this route is responsible for update module by id"
  })
  @ApiBody({
    type: UpdateModuleDto,
    description:
      "How to update an module by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          note: "this is for module note",
          name: "noman"
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a module required id",
    required: true
  })
  @Patch(":id")
  async update(
    @Body() updateModuleDto: UpdateModuleDto,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @Param("id") id: number
  ) {
    updateModuleDto["ipPayload"] = ipClientPayload;

    const data = await this.moduleService.updatemodule(
      updateModuleDto,
      userPayload,
      id
    );
    return { message: "successful!", result: data };
  }

  // find single module
  @ApiOperation({
    summary: "find single module by id",
    description: "this route is responsible for find single module by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single module required id",
    required: true
  })
  @Get(":id")
  async findOne(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface
  ) {
    const data = await this.moduleService.findSingleModule(
      id,
      userPayload,
      ipClientPayload
    );
    return { message: "successful!", result: data };
  }

  // get all module data with paginaiton
  @ApiOperation({
    summary: "get all module data with pagination",
    description:
      "this route is responsible for getting all module data with pagination"
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
    const result = await this.moduleService.findAllmodule(
      listQueryParam,
      filter,
      ipClientPayload,
      userPayload
    );

    return { message: "successful", result: result };
  }

  // delete single module
  @ApiOperation({
    summary: "delete single module by id",
    description: "this route is responsible for delete single module by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single module required id",
    required: true
  })
  @Delete(":id")
  async delete(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface
  ) {
    const data = await this.moduleService.deletemodule(
      id,
      userPayload,
      ipClientPayload
    );
    return { message: "successful!", result: data };
  }
}
