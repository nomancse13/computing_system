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
import { CreateBankingDto, UpdateBankingDto } from "../dtos/banking";
import {
  PaginationOptionsInterface,
  UserInterface
} from "src/authentication/common/interfaces";
import {
  IpPlusClientAddress,
  UserPayload
} from "src/authentication/utils/decorators";
import { BankingService } from "../services/banking.service";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";

@ApiTags("Banking")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "bank/account",
  version: "1"
})
export class BankingController {
  constructor(private bankingService: BankingService) {}

  /**
   * DROPDOWN ->banking data
   */
  @Get("dropdown")
  @ApiOperation({
    summary: "Get banking dropdown data",
    description: "This api is responsible for fetching banking dropdown"
  })
  async bankingDropdown(@UserPayload() userPayload: UserInterface
  ) {
    const data = await this.bankingService.dropdown(userPayload);
    return { message: "successful", result: data };
  }

  /**
   * DROPDOWN ->banking data for payment voucher
   */
  @Get("dropdown/banking")
  @ApiOperation({
    summary: "Get banking dropdown data for payment voucher",
    description: "This api is responsible for fetching banking dropdown for payment voucher"
  })
  async dropdown(@UserPayload() userPayload: UserInterface
  ) {
    const data = await this.bankingService.dropdownForPaymentVoucher(userPayload);
    return { message: "successful", result: data };
  }
  //   create a new banking account
  @ApiOperation({
    summary: "create banking account by a user",
    description: "this route is responsible for create a banking account"
  })
  @ApiBody({
    type: CreateBankingDto,
    description:
      "How to create a banking account with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter banking account",
        value: {
          bankName: "Islami Bank Ltd",
          accountCode: "#B-506011223334",
          bankAccountName: "Rizal Mehedi",
          accountNumber: "Acc-11223344",
          openingBalance: 1000.2,
          accountType: 1,
          description: "This is test"
        } as unknown as CreateBankingDto
      }
    }
  })
  @Post()
  async create(
    @Body() createBankingDto: CreateBankingDto,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UserPayload() userPayload: UserInterface
  ) {
    createBankingDto["ipPayload"] = ipClientPayload;

    const data = await this.bankingService.createBankAcc(
      createBankingDto,
      userPayload
    );

    return { message: "successful!", result: data };
  }

  // update a banking by id
  @ApiOperation({
    summary: "update banking by id",
    description: "this route is responsible for update banking by id"
  })
  @ApiBody({
    type: UpdateBankingDto,
    description:
      "How to update a banking by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          bankName: "Islami Bank Ltd",
          accountCode: "#B-506011223334",
          bankAccountName: "Rizal Mehedi",
          accountNumber: "Acc-11223344",
          openingBalance: 1000.2,
          accountType: 1,
          description: "This is test"
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a Banking account required id",
    required: true
  })
  @Patch(":id")
  async update(
    @Body() updateBankingDto: UpdateBankingDto,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @Param("id") id: number
  ) {
    updateBankingDto["ipPayload"] = ipClientPayload;

    const data = await this.bankingService.updateBankAccount(
      updateBankingDto,
      userPayload,
      id
    );
    return { message: "successful!", result: data };
  }

  // find single banking account
  @ApiOperation({
    summary: "find single banking account by id",
    description:
      "this route is responsible for find single banking account by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single banking account required id",
    required: true
  })
  @Get(":id")
  async findSingleBankingAcc(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface
  ) {
    const data = await this.bankingService.findSingleBanking(
      id,
      userPayload,
      ipClientPayload
    );
    return { message: "successful!", result: data };
  }

  // get all banking data with paginaiton
  @ApiOperation({
    summary: "get all banking data with pagination",
    description:
      "this route is responsible for getting all banking data with pagination"
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
    const result = await this.bankingService.findAllBankingData(
      listQueryParam,
      filter,
      ipClientPayload,
      userPayload
    );

    return { message: "successful", result: result };
  }

  // delete single banking account
  @ApiOperation({
    summary: "delete single banking account by id",
    description:
      "this route is responsible for delete single banking account by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single banking account required id",
    required: true
  })
  @Delete(":id")
  async deleteBankingAcc(
    @Param("id") id: number,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface
  ) {
    const data = await this.bankingService.deleteBanking(
      id,
      userPayload,
      ipClientPayload
    );
    return { message: "successful!", result: data };
  }
}
