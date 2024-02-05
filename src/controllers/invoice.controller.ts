import { UserGuard } from "src/authentication/auth/guards";
import { Body, Controller, Get, Post, Query, UseGuards, Param, Patch, Delete, UseInterceptors } from "@nestjs/common";

import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";
import { InvoiceService } from "../services/invoice.service";
import { CreateInvoiceDto, UpdateInvoiceDto } from "../dtos/receivables/invoice";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
@ApiTags("Sales|Invoice")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "invoice",
  version: "1"
})
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  //   create a new invoice
  @ApiOperation({
    summary: "create invoice by a user",
    description: "this route is responsible for create a invoice"
  })
  @ApiBody({
    type: CreateInvoiceDto,
    description: "How to create a invoice with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter invoice",
        value: {
          comment: "This is my first comment",
          subtotalAmount: 123,
          totalAmount: 19.68,
          terms: "dkjfdor",
          txnType: "test",
          netAmountTaxable: 19.68,
          txnId: 19,
          billAddr: "roton",
          shipAddr: "roton",
          applyTaxAfterDiscount: true,
          tax: 10,
          txnDate: "23-11-23",
          vat: true,
          debitLedgerId: 1,
          items: [
            {
              productId: 4,
              qty: 3,
              unitPrice: 23,
              description: "this is for invoice",
              detailType: "type",
              taxCodeRef: "eer33443"
            }
          ]
        } as unknown as CreateInvoiceDto
      }
    }
  })
  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @UserPayload() userPayload: UserInterface) {
    createInvoiceDto["ipPayload"] = ipClientPayload;

    const data = await this.invoiceService.createInvoice(createInvoiceDto, userPayload);

    return { message: "successful!", result: data };
  }

  // update a invoice by id
  @ApiOperation({
    summary: "update invoice by id",
    description: "this route is responsible for update invoice by id"
  })
  @ApiBody({
    type: UpdateInvoiceDto,
    description: "How to update a invoice by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          invoiceNo: "INV-0001",
          comment: "This is my first comment",
          subtotal: 123,
          total: 19.68,
          txnDate: "23-11-23",
          vat: true,
          debitLedgerId: 2,
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
    description: "for update a invoice required id",
    required: true
  })
  @Patch(":id")
  @ApiConsumes("multipart/form-data")
  async update(@Body() updateInvoiceDto: UpdateInvoiceDto, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @Param("id") id: number) {
    updateInvoiceDto["ipPayload"] = ipClientPayload;

    const data = await this.invoiceService.updateInvoice(updateInvoiceDto, userPayload, id);
    return { message: "successful!", result: data };
  }

  // find single invoice
  @ApiOperation({
    summary: "find single invoice by id",
    description: "this route is responsible for find single invoice by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single invoice required id",
    required: true
  })
  @Get(":id")
  async findSingleInvoice(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.invoiceService.findSingleInvoice(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }

  // get all invoice data with paginaiton
  @ApiOperation({
    summary: "get all invoice data with pagination",
    description: "this route is responsible for getting all invoice data with pagination"
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
  @Get("get/all/unpaid")
  async getAllUnpaidInvoice(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query("filter") filter: any,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UserPayload() userPayload: UserInterface
  ) {
    const result = await this.invoiceService.findAllInvoiceDataUnpaid(listQueryParam, filter, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }

  @Get("get/all/paid")
  async getAllPaidInvoice(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query("filter") filter: any,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UserPayload() userPayload: UserInterface
  ) {
    const result = await this.invoiceService.findAllInvoiceDataPaid(listQueryParam, filter, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }

  // delete single invoice account
  @ApiOperation({
    summary: "delete single invoice account by id",
    description: "this route is responsible for delete single invoice account by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single invoice account required id",
    required: true
  })
  @Delete(":id")
  async deleteInvoice(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.invoiceService.deleteInvoice(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }

  // #region Convert to Invoice
  @ApiOperation({
    summary: "update invoice by id",
    description: "this route is responsible for update invoice by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for convet a estimation to Invoice required id",
    required: true
  })
  @Patch("converttoInvoice/:id")
  async converttoInvoice(@UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @Param("id") id: number) {
    const data = await this.invoiceService.ConverttoInvoice(id, userPayload);
    return { message: "successful!", result: data };
  }

  //#endregion
  //#region Single  Invoice
  @ApiOperation({
    summary: "Pay single invoice by id",
    description: "this route is responsible for find Pay invoice by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single invoice required id",
    required: true
  })
  @Get("paynowinvoice/:id")
  async payNowInvoice(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.invoiceService.PayNowInvoice(id, userPayload);
    return { message: "successful!", result: data };
  }
  //#endregion

  //#region Pay Multiple Invoice
  @ApiOperation({
    summary: "Pay multiple invoice by id",
    description: "this route is responsible for Pay multiple invoice by id"
  })
  @ApiBody({
    description: "How to send multiple id in a body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter multiple id info",
        value: {
          ids: [3, 4]
        }
      }
    }
  })
  @Post("paynowinvoicemultiple")
  async payNowInvoiceMUltiple(@Body() ids: any[], @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    console.log(ids);

    const data = await this.invoiceService.PayNowInvoiceMultiple(ids, userPayload);
    return { message: "successful!", result: data };
  }
  //#endregion
}
