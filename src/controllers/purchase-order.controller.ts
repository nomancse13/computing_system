import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { UserGuard } from "src/authentication/auth/guards";

import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";

import { FileInterceptor } from "@nestjs/platform-express";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
import { VendorInvoiceApiDoc } from "src/authentication/utils/decorators/vendor-invoice.decorator";
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from "../dtos/payables/purchase-order";
import { PurchaseOrderService } from "../services/purchase-order.service";

@ApiTags("Expense |Purchase Order")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "purchase/order",
  version: "1"
})
export class PurchaseOrderController {
  constructor(private purchaseOrderService: PurchaseOrderService) {}

  //   create a new Purchase Order
  @ApiOperation({
    summary: "create Purchase Order by a user",
    description: "this route is responsible for create a Purchase Order"
  })
  @ApiBody({
    type: CreatePurchaseOrderDto,
    description: "How to create a Purchase Order with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter Purchase Order",
        value: {
          billNo: "Bill-00001",
          txnDate: "2023-10-10",
          totalAmount: 200,
          subtotalAmount: 123,
          comment: "This is test",
          refDoc: "ssrc",
          vat: true,
          creditLedgerId: 2,
          Products: [
            {
              productId: 1,
              qty: 3,
              sellingPrice: 23,
              discount: 34,
              amount: 23
            },
            {
              productId: 2,
              qty: 3,
              sellingPrice: 23,
              discount: 34,
              amount: 23
            }
          ]
        } as unknown as CreatePurchaseOrderDto
      }
    }
  })
  @ApiConsumes("multipart/form-data")
  @VendorInvoiceApiDoc("file")
  @UseInterceptors(FileInterceptor("file"))
  @Post()
  async create(
    @Body() CreatePurchaseOrderDto: CreatePurchaseOrderDto,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UploadedFile() file: any,
    @UserPayload() userPayload: UserInterface
  ) {
    CreatePurchaseOrderDto["ipPayload"] = ipClientPayload;
    CreatePurchaseOrderDto["file"] = file;

    const data = await this.purchaseOrderService.createPurchaseOrder(CreatePurchaseOrderDto, userPayload);

    return { message: "successful!", result: data };
  }

  // update a Purchase Order by id
  @ApiOperation({
    summary: "update Purchase Order by id",
    description: "this route is responsible for update Purchase Order by id"
  })
  @ApiBody({
    type: UpdatePurchaseOrderDto,
    description: "How to update a Purchase Order by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          orderNo: "jsdhfdo",
          comment: "this is my first comment",
          subtotal: 123,
          total: 19.68,
          orderDate: "23-11-23",
          fileSrc: "ssrc",
          vat: true,
          customerId: 2,
          Products: [
            {
              productId: 1,
              qty: 3,
              sellingPrice: 23,
              discount: 34,
              amount: 23
            },
            {
              productId: 2,
              qty: 3,
              sellingPrice: 23,
              discount: 34,
              amount: 23
            }
          ]
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a Purchase Order required id",
    required: true
  })
  @Patch(":id")
  // @ApiConsumes("multipart/form-data")
  // @VendorInvoiceApiDoc("file")
  // @UseInterceptors(FileInterceptor("file"))
  async update(
    @Body() UpdatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UploadedFile() file: any,
    @Param("id") id: number
  ) {
    UpdatePurchaseOrderDto["file"] = file;

    const data = await this.purchaseOrderService.updatePurchaseOrder(UpdatePurchaseOrderDto, userPayload, id);
    return { message: "successful!", result: data };
  }

  // find single Purchase Order
  @ApiOperation({
    summary: "find single Purchase Order by id",
    description: "this route is responsible for find single Purchase Order by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single Purchase Order required id",
    required: true
  })
  @Get(":id")
  async findOne(@Param("id") id: number, @UserPayload() userPayload: UserInterface) {
    const data = await this.purchaseOrderService.findOnePurchaseOrder(id, userPayload);
    return { message: "successful!", result: data };
  }

  // get all Purchase Order data with paginaiton
  @ApiOperation({
    summary: "get all Purchase Order data with pagination",
    description: "this route is responsible for getting all Purchase Order data with pagination"
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
    const result = await this.purchaseOrderService.findAllPurchaseOrderData(listQueryParam, filter, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }

  // delete single Purchase Order account
  @ApiOperation({
    summary: "delete single Purchase Order account by id",
    description: "this route is responsible for delete single Purchase Order account by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single Purchase Order account required id",
    required: true
  })
  @Delete(":id")
  async delete(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.purchaseOrderService.deletePurchaseOrder(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }
}
