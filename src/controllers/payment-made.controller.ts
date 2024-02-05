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
    Delete,
    UseInterceptors,
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
import {
    CreatePaymentVoucherDto,
    UpdatePaymentVoucherDto
} from "../dtos/payables/payment-voucher";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
import { FileInterceptor } from "@nestjs/platform-express";
import { PaymentVoucherApiDoc } from "src/authentication/utils/decorators/payment-voucher.decorator";
import { PaymentMadeService } from "src/services/payment-made.service";
@ApiTags("Expense|Payment Voucher")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
    path: "payment/voucher",
    version: "1"
})
export class PaymentMadeController {
    constructor(private PaymentMadeService: PaymentMadeService) { }

    //   create a new payment voucher
    @ApiOperation({
        summary: "create payment voucher by a user",
        description: "this route is responsible for create a payment voucher"
    })
    @ApiBody({
        type: CreatePaymentVoucherDto,
        description:
            "How to create a payment voucher with body?... here is the example given below!",
        examples: {
            a: {
                summary: "enter sale voucher",
                value: {
                    paymentsNo: "jsdhfdo",
                    txnDate: "noman",
                    paymentAmount: 6,
                    debitLedgerId: 2,
                    creditLedgerId: 2,
                    reference: 6,
                    refDoc: 6,
                    comment: "sdfjdofjdsfl"
                } as unknown as CreatePaymentVoucherDto
            }
        }
    })
    @ApiConsumes("multipart/form-data")
    @PaymentVoucherApiDoc("file")
    @UseInterceptors(FileInterceptor("file"))
    @Post('create')
    async create(
        @Body() createpaymentVoucherDto: CreatePaymentVoucherDto,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface,
        @UploadedFile() file: any,
        @UserPayload() userPayload: UserInterface
    ) {
        console.log('createVendorInvoiceDto: ' + createpaymentVoucherDto);
        createpaymentVoucherDto["ipPayload"] = ipClientPayload;

        createpaymentVoucherDto["file"] = file;

        const data = await this.PaymentMadeService.createPaymentVoucher(
            createpaymentVoucherDto,
            userPayload
        );

        return { message: "successful!", result: data };
    }

    // update a payment voucher by id
    @ApiOperation({
        summary: "update payment voucher by id",
        description: "this route is responsible for update payment voucher by id"
    })
    @ApiBody({
        type: UpdatePaymentVoucherDto,
        description:
            "How to update a payment voucher by id?... here is the example given below!",
        examples: {
            a: {
                summary: "default",
                value: {
                    paymentsNo: "jsdhfdo",
                    txnDate: "noman",
                    paymentAmount: 6,
                    debitLedgerId: 2,
                    creditLedgerId: 2,
                    reference: 6,
                    refDoc: 6,
                    comment: "sdfjdofjdsfl"
                }
            }
        }
    })
    @ApiParam({
        name: "id",
        type: Number,
        description: "for update a payment voucher required id",
        required: true
    })
    @ApiConsumes("multipart/form-data")
    @PaymentVoucherApiDoc("file")
    @UseInterceptors(FileInterceptor("file"))
    @Patch(":id")
    async update(
        @Body() updatePaymentVoucherDto: UpdatePaymentVoucherDto,
        @UserPayload() userPayload: UserInterface,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface,
        @UploadedFile() file: any,
        @Param("id") id: number
    ) {
        updatePaymentVoucherDto["ipPayload"] = ipClientPayload;

        updatePaymentVoucherDto["file"] = file;

        const data = await this.PaymentMadeService.updatepaymentVoucher(
            updatePaymentVoucherDto,
            userPayload,
            id
        );
        return { message: "successful!", result: data };
    }

    // find single payment voucher
    @ApiOperation({
        summary: "find single payment voucher by id",
        description:
            "this route is responsible for find single payment voucher by id"
    })
    @ApiParam({
        name: "id",
        type: Number,
        description: "find single payment voucher required id",
        required: true
    })
    @Get(":id")
    async findSingle(
        @Param("id") id: number,
        @UserPayload() userPayload: UserInterface,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface
    ) {
        const data = await this.PaymentMadeService.findSinglepaymentVoucherData(
            id,
            userPayload,
            ipClientPayload
        );
        return { message: "successful!", result: data };
    }

    // get all payment voucher data with paginaiton
    @ApiOperation({
        summary: "get all payment voucher data with pagination",
        description:
            "this route is responsible for getting all payment voucher data with pagination"
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
        const result = await this.PaymentMadeService.findAllpaymentVoucherData(
            listQueryParam,
            filter,
            ipClientPayload,
            userPayload
        );

        return { message: "successful", result: result };
    }

    // delete single payment voucher account
    @ApiOperation({
        summary: "delete single payment voucher account by id",
        description:
            "this route is responsible for delete single payment voucher account by id"
    })
    @ApiParam({
        name: "id",
        type: Number,
        description: "delete single payment voucher account required id",
        required: true
    })
    @Delete(":id")
    async delete(
        @Param("id") id: number,
        @UserPayload() userPayload: UserInterface,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface
    ) {
        const data = await this.PaymentMadeService.deletepaymentVoucher(
            id,
            userPayload,
            ipClientPayload
        );
        return { message: "successful!", result: data };
    }

    //#region Create Payment Made
    @ApiOperation({
        summary: "create payment voucher by a user",
        description: "this route is responsible for create a payment voucher"
    })
    @ApiBody({
        type: CreatePaymentVoucherDto,
        description:
            "How to create a payment voucher with body?... here is the example given below!",
        examples: {
            a: {
                summary: "enter sale voucher",
                value: {
                    paymentsNo: "jsdhfdo",
                    txnDate: "noman",
                    paymentAmount: 6,
                    debitLedgerId: 2,
                    creditLedgerId: 2,
                    reference: 6,
                    refDoc: 6,
                    comment: "sdfjdofjdsfl"
                } as unknown as CreatePaymentVoucherDto
            }
        }
    })
    @ApiConsumes("multipart/form-data")
    @PaymentVoucherApiDoc("file")
    @UseInterceptors(FileInterceptor("file"))
    @Post('createpaymentmade')
    async createpaymentmade(
        @Body() createpaymentVoucherDto: CreatePaymentVoucherDto,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface,
        @UploadedFile() file: any,
        @UserPayload() userPayload: UserInterface
    ) {
        console.log('createVendorInvoiceDto: ' + createpaymentVoucherDto);
        createpaymentVoucherDto["ipPayload"] = ipClientPayload;

        createpaymentVoucherDto["file"] = file;

        const data = await this.PaymentMadeService.createPaymentmade(
            createpaymentVoucherDto,
            userPayload
        );

        return { message: "successful!", result: data };
    }

    //#endregion
}
