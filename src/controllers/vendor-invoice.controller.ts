import { UserGuard } from "src/authentication/auth/guards";
import { Body, Controller, Get, Post, Query, UseGuards, Param, Patch, UseInterceptors, UploadedFile, Delete } from "@nestjs/common";

import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";

import { FileInterceptor } from "@nestjs/platform-express";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
import { VendorInvoiceApiDoc } from "src/authentication/utils/decorators/vendor-invoice.decorator";
import { CreateVendorInvoiceDto } from "../dtos/payables/vendors-invoice/create-vendor-invoice.dto";
import { VendorInvoiceService } from "../services/vendor-invoice.service";
import { UpdateVendorInvoiceDto } from "../dtos/payables/vendors-invoice/update-vendor-invoice.dto";

@ApiTags("Expense|Vendor Invoice")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "vendor/invoice",
  version: "1"
})
export class VendorInvoiceController {
  constructor(private vendorInvoiceService: VendorInvoiceService) {}

  //   create a new vendor invoice
  @ApiOperation({
    summary: "create vendor invoice by a user",
    description: "this route is responsible for create a vendor invoice"
  })
  @ApiBody({
    type: CreateVendorInvoiceDto,
    description: "How to create a vendor invoice with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter vendor invoice",
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
        } as unknown as CreateVendorInvoiceDto
      }
    }
  })
  // @ApiConsumes("multipart/form-data")
  // @VendorInvoiceApiDoc("file")
  // @UseInterceptors(FileInterceptor("file"))
  @Post()
  async create(
    @Body() createVendorInvoiceDto: CreateVendorInvoiceDto,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UploadedFile() file: any,
    @UserPayload() userPayload: UserInterface
  ) {
    createVendorInvoiceDto["ipPayload"] = ipClientPayload;
    createVendorInvoiceDto["file"] = file;

    const data = await this.vendorInvoiceService.createVendorInvoice(createVendorInvoiceDto, userPayload);

    return { message: "successful!", result: data };
  }

  // update a vendor invoice by id
  @ApiOperation({
    summary: "update vendor invoice by id",
    description: "this route is responsible for update vendor invoice by id"
  })
  @ApiBody({
    type: UpdateVendorInvoiceDto,
    description: "How to update a vendor invoice by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          invoiceNo: "jsdhfdo",
          month: "November",
          comment: "this is my first comment",
          subtotal: 123,
          total: 19.68,
          txnDate: "23-11-23",
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
    description: "for update a vendor invoice required id",
    required: true
  })
  @Patch(":id")
  // @ApiConsumes("multipart/form-data")
  // @VendorInvoiceApiDoc("file")
  // @UseInterceptors(FileInterceptor("file"))
  async update(
    @Body() updateVendorInvoiceDto: UpdateVendorInvoiceDto,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UploadedFile() file: any,
    @Param("id") id: number
  ) {
    updateVendorInvoiceDto["file"] = file;

    const data = await this.vendorInvoiceService.updateVendorInvoice(updateVendorInvoiceDto, userPayload, id);
    return { message: "successful!", result: data };
  }

  // find single vendor invoice
  @ApiOperation({
    summary: "find single vendor invoice by id",
    description: "this route is responsible for find single vendor invoice by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single vendor invoice required id",
    required: true
  })
  @Get(":id")
  async findOne(@Param("id") id: number, @UserPayload() userPayload: UserInterface) {
    const data = await this.vendorInvoiceService.findOneVendorInvoice(id, userPayload);
    return { message: "successful!", result: data };
  }

  // get all vendor invoice data with paginaiton
  @ApiOperation({
    summary: "get all vendor invoice data with pagination",
    description: "this route is responsible for getting all vendor invoice data with pagination"
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
  async getAllUnpaid(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query("filter") filter: any,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UserPayload() userPayload: UserInterface
  ) {
    const result = await this.vendorInvoiceService.findAllVendorUnPaidInvoiceData(listQueryParam, filter, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }

  // get all supplier invoice data with paginaiton
  @ApiOperation({
    summary: "get all vendor invoice data with pagination",
    description: "this route is responsible for getting all vendor invoice data with pagination"
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
  @Get("get/all/paid")
  async getAllPaidInvoice(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query("filter") filter: any,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UserPayload() userPayload: UserInterface
  ) {
    const result = await this.vendorInvoiceService.findAllVendorPaidInvoiceData(listQueryParam, filter, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }

  // delete single vendor invoice account
  @ApiOperation({
    summary: "delete single vendor invoice account by id",
    description: "this route is responsible for delete single vendor invoice account by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single vendor invoice account required id",
    required: true
  })
  @Delete(":id")
  async delete(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.vendorInvoiceService.deleteVendorInvoice(id, userPayload, ipClientPayload);
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
    const data = await this.vendorInvoiceService.ConverttoInvoice(id, userPayload);
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
    const data = await this.vendorInvoiceService.PayNowInvoice(id, userPayload);
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

    const data = await this.vendorInvoiceService.PayNowInvoiceMultiple(ids, userPayload);
    return { message: "successful!", result: data };
  }
  //#endregion
}
