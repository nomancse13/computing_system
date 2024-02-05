import { UserGuard } from "src/authentication/auth/guards";
import { Body, Controller, Get, Post, Query, UseGuards, Param, Patch, Delete } from "@nestjs/common";

import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";
import { PurchaseReturnService } from "../services/purchase-return.service";
import { CreatePurchaseReturnDto, UpdatePurchaseReturnDto } from "../dtos/payables/purchase-return";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";

@ApiTags("Expense|Purchase Return")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "purchase/return",
  version: "1"
})
export class PurchaseReturnController {
  constructor(private purchaseReturnService: PurchaseReturnService) {}

  //   create a new purchase return
  @ApiOperation({
    summary: "create purchase return by a user",
    description: "this route is responsible for create a purchase return"
  })
  @ApiBody({
    type: CreatePurchaseReturnDto,
    description: "How to create a purchase return with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter purchase return",
        value: {
          txnDate: "2023-10-10",
          totalAmt: 6,
          subTotalAmount: 4,
          debitLedgerId: 10,
          reference: "noman",
          vendorAddr: "paltan",
          linkedTnx: "test",
          linkedTnxType: "test",
          taxAmount: 123,
          recNo: 16,
          comment: "this is for test",
          purchaserRetDetails: [
            {
              productId: 4,
              qty: 3,
              unitPrice: 23,
              description: "this is for invoice",
              detailType: "type",
              taxCodeRef: "eer33443",
              projectRef: "eer33443",
              accountRef: "eer33443",
              accountRefName: "noman",
              billableStatus: "open",
              customerRef: "noman"
            }
          ]
        } as unknown as CreatePurchaseReturnDto
      }
    }
  })
  @Post()
  async create(@Body() createPurchaseReturnDto: CreatePurchaseReturnDto, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @UserPayload() userPayload: UserInterface) {
    createPurchaseReturnDto["ipPayload"] = ipClientPayload;

    const data = await this.purchaseReturnService.createPurchaseReturn(createPurchaseReturnDto, userPayload);

    return { message: "successful!", result: data };
  }

  // update a purchase return by id
  @ApiOperation({
    summary: "update purchase return by id",
    description: "this route is responsible for update purchase return by id"
  })
  @ApiBody({
    type: UpdatePurchaseReturnDto,
    description: "How to update a purchase return by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          voucher: "jsdhfdo",
          date: "noman",
          totalAmt: 6,
          debitLedgerId: 2,
          recNo: "lldfj",
          narration: "sdfjdofjdsfl"
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a purchase return required id",
    required: true
  })
  @Patch(":id")
  async update(
    @Body() updatePurchaseReturnDto: UpdatePurchaseReturnDto,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @Param("id") id: number
  ) {
    updatePurchaseReturnDto["ipPayload"] = ipClientPayload;

    const data = await this.purchaseReturnService.updatePurchaseReturn(updatePurchaseReturnDto, userPayload, id);
    return { message: "successful!", result: data };
  }

  // find single purchase return
  @ApiOperation({
    summary: "find single purchase return by id",
    description: "this route is responsible for find single purchase return by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single purchase return required id",
    required: true
  })
  @Get(":id")
  async findSingle(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.purchaseReturnService.findPurchaseReturnData(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }

  // get all purchase return data with paginaiton
  @ApiOperation({
    summary: "get all purchase return data with pagination",
    description: "this route is responsible for getting all purchase return data with pagination"
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
    const result = await this.purchaseReturnService.findAllPurchaseReturnData(listQueryParam, filter, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }

  // delete single purchase return
  @ApiOperation({
    summary: "delete single purchase return by id",
    description: "this route is responsible for delete single purchase return by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single purchase return required id",
    required: true
  })
  @Delete(":id")
  async delete(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.purchaseReturnService.deletePurchaseReturn(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }
}
