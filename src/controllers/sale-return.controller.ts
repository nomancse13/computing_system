import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { UserGuard } from "src/authentication/auth/guards";

import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";
import { SaleReturnService } from "../services/sales-return.service";
import { CreateCreditMemoDto, UpdateCreditMemoDto } from "src/dtos/receivables/sales-return";

@ApiTags("Sales|Sale Return")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "sale/return",
  version: "1"
})
export class CreditMemoController {
  constructor(private saleVoucherService: SaleReturnService) {}

  //   create a new sale voucher
  @ApiOperation({
    summary: "create sale voucher by a user",
    description: "this route is responsible for create a sale voucher"
  })
  @ApiBody({
    type: CreateCreditMemoDto,
    description: "How to create a sale voucher with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter sale voucher",
        value: {
          txnDate: "2023-1 0-10",
          totalAmt: 6,
          creditLedgerID: 12,
          reference: 1236,
          customerMemo: "test",
          billAddr: "paltan",
          totalTax: 123,
          netAmountTaxable: 16,
          applyTaxAfterDiscount: true,
          freeFormAddress: true,
          shipAddr: "paltan",
          creditDetails: [
            {
              productId: 4,
              qty: 3,
              unitPrice: 23,
              description: "this is for invoice",
              detailType: "type",
              taxCodeRef: "eer33443",
              totalAmount: 123
            }
          ]
        } as unknown as CreateCreditMemoDto
      }
    }
  })
  @Post()
  async create(@Body() createSaleVoucherDto: CreateCreditMemoDto, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @UserPayload() userPayload: UserInterface) {
    createSaleVoucherDto["ipPayload"] = ipClientPayload;

    const data = await this.saleVoucherService.createSaleVoucher(createSaleVoucherDto, userPayload);

    return { message: "successful!", result: data };
  }

  // update a sale voucher by id
  @ApiOperation({
    summary: "update sale voucher by id",
    description: "this route is responsible for update sale voucher by id"
  })
  @ApiBody({
    type: UpdateCreditMemoDto,
    description: "How to update a sale voucher by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          creditNoteNo: "SR-0001",
          txnDate: "2023-10-10",
          paidAmount: 6,
          creditLedgerID: 12,
          reference: 1236,
          comment: "This is test"
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a sale voucher required id",
    required: true
  })
  @Patch(":id")
  async update(@Body() updateSaleVoucherDto: UpdateCreditMemoDto, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @Param("id") id: number) {
    updateSaleVoucherDto["ipPayload"] = ipClientPayload;

    const data = await this.saleVoucherService.updateSaleVoucher(updateSaleVoucherDto, userPayload, id);
    return { message: "successful!", result: data };
  }

  // find single sale voucher
  @ApiOperation({
    summary: "find single sale voucher by id",
    description: "this route is responsible for find single sale voucher by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single sale voucher required id",
    required: true
  })
  @Get(":id")
  async findSingle(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.saleVoucherService.findSingleVoucherData(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }

  // get all sale voucher data with paginaiton
  @ApiOperation({
    summary: "get all sale voucher data with pagination",
    description: "this route is responsible for getting all sale voucher data with pagination"
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
    const result = await this.saleVoucherService.findAllVoucherData(listQueryParam, filter, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }

  // delete single sale voucher account
  @ApiOperation({
    summary: "delete single sale voucher account by id",
    description: "this route is responsible for delete single sale voucher account by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single sale voucher account required id",
    required: true
  })
  @Delete(":id")
  async delete(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.saleVoucherService.deleteSale(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }
}
