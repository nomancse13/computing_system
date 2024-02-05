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
import { UserPayload } from "src/authentication/utils/decorators";
import { ActivityLogService } from "../services/activity-log.service";

@ApiTags("User|Log")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "log",
  version: "1"
})
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  // get all login history data with paginaiton
  @ApiOperation({
    summary: "get all login history data with pagination",
    description:
      "this route is responsible for getting all login history data with pagination"
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
  @Get("loginHistory/get/all/")
  async getAll(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query("filter") filter: any,
    @UserPayload() userPayload: UserInterface
  ) {
    const result = await this.activityLogService.findAllLoginHistory(
      listQueryParam,
      filter,
      userPayload
    );

    return { message: "successful", result: result };
  }

  // get all activity log data with paginaiton
  @ApiOperation({
    summary: "get all activity log data with pagination",
    description:
      "this route is responsible for getting all activity log data with pagination"
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
  async getAllLog(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query("filter") filter: any,
    @UserPayload() userPayload: UserInterface
  ) {
    const result = await this.activityLogService.findAllLog(
      listQueryParam,
      filter,
      userPayload
    );

    return { message: "successful", result: result };
  }
}
