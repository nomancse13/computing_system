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
import { FileInterceptor } from "@nestjs/platform-express";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
import { PaymentReceivedService } from "src/services/payment-received.service";
import {
    CreatePaymentReceivedDto,
    UpdatePaymentReceivedDto
} from "src/dtos/receivables/payment-received";
import { PaymentReceivedApiDoc } from "src/authentication/utils/decorators/payment-received.decorator";
@ApiTags("Sales|Deposits")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
    path: "receipt",
    version: "1"
})
export class PaymentReceivedController {
    constructor(private paymentReceivedService: PaymentReceivedService) { }

    //   create a new receipt
    @ApiOperation({
        summary: "create receipt by a user",
        description: "this route is responsible for create a receipt"
    })
    @ApiBody({
        type: CreatePaymentReceivedDto,
        description:
            "How to create a receipt with body?... here is the example given below!",
        examples: {
            a: {
                summary: "enter receipt",
                value: {
                    voucher: "jsdhfdo",
                    date: "2/9/23",
                    dueAmount: 283,
                    transactionNo: 34355,
                    refDoc: "syedpur",
                    paymentMethod: 1,
                    narration: 6,
                    customerId: 2,
                    accountId: 2
                } as unknown as CreatePaymentReceivedDto
            }
        }
    })
    @ApiConsumes("multipart/form-data")
    @PaymentReceivedApiDoc("file")
    @UseInterceptors(FileInterceptor("file"))
    @Post()
    async create(
        @Body() createReceiptDto: CreatePaymentReceivedDto,
        @UploadedFile() file: any,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface,
        @UserPayload() userPayload: UserInterface
    ) {
        createReceiptDto["file"] = file;
        createReceiptDto["ipPayload"] = ipClientPayload;

        const data = await this.paymentReceivedService.createReceipt(
            createReceiptDto,
            userPayload
        );

        return { message: "successful!", result: data };
    }

    // update a receipt by id
    @ApiOperation({
        summary: "update receipt by id",
        description: "this route is responsible for update receipt by id"
    })
    @ApiBody({
        type: UpdatePaymentReceivedDto,
        description:
            "How to update a receipt by id?... here is the example given below!",
        examples: {
            a: {
                summary: "default",
                value: {
                    voucher: "jsdhfdo",
                    date: "2/9/23",
                    dueAmount: 283,
                    transactionNo: 34355,
                    refDoc: "syedpur",
                    paymentMethod: 1,
                    narration: 6,
                    customerId: 2,
                    accountId: 2
                }
            }
        }
    })
    @ApiParam({
        name: "id",
        type: Number,
        description: "for update a receipt required id",
        required: true
    })
    @ApiConsumes("multipart/form-data")
    @PaymentReceivedApiDoc("file")
    @UseInterceptors(FileInterceptor("file"))
    @Patch(":id")
    async update(
        @Body() updateReceiptDto: UpdatePaymentReceivedDto,
        @UserPayload() userPayload: UserInterface,
        @UploadedFile() file: any,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface,
        @Param("id") id: number
    ) {
        updateReceiptDto["file"] = file;

        updateReceiptDto["ipPayload"] = ipClientPayload;

        const data = await this.paymentReceivedService.updateReceipt(
            updateReceiptDto,
            userPayload,
            id
        );
        return { message: "successful!", result: data };
    }

    // find single receipt
    @ApiOperation({
        summary: "find single receipt by id",
        description: "this route is responsible for find single receipt by id"
    })
    @ApiParam({
        name: "id",
        type: Number,
        description: "find single receipt required id",
        required: true
    })
    @Get(":id")
    async findSingle(
        @Param("id") id: number,
        @UserPayload() userPayload: UserInterface,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface
    ) {
        const data = await this.paymentReceivedService.findSingleReceiptData(
            id,
            userPayload,
            ipClientPayload
        );
        return { message: "successful!", result: data };
    }

    // get all sale receipt data with paginaiton
    @ApiOperation({
        summary: "get all receipt data with pagination",
        description:
            "this route is responsible for getting all receipt data with pagination"
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
        const result = await this.paymentReceivedService.findAllReceiptData(
            listQueryParam,
            filter,
            ipClientPayload,
            userPayload
        );

        return { message: "successful", result: result };
    }

    // delete single receipt
    @ApiOperation({
        summary: "delete single receipt by id",
        description: "this route is responsible for delete single receipt by id"
    })
    @ApiParam({
        name: "id",
        type: Number,
        description: "delete single receipt required id",
        required: true
    })
    @Delete(":id")
    async delete(
        @Param("id") id: number,
        @UserPayload() userPayload: UserInterface,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface
    ) {
        const data = await this.paymentReceivedService.deleteReceipt(
            id,
            userPayload,
            ipClientPayload
        );
        return { message: "successful!", result: data };
    }

    //#region Create payment Received
    @ApiOperation({
        summary: "create receipt by a user",
        description: "this route is responsible for create a receipt"
    })
    @ApiBody({
        type: CreatePaymentReceivedDto,
        description:
            "How to create a receipt with body?... here is the example given below!",
        examples: {
            a: {
                summary: "enter receipt",
                value: {
                    voucher: "jsdhfdo",
                    date: "2/9/23",
                    dueAmount: 283,
                    transactionNo: 34355,
                    refDoc: "syedpur",
                    paymentMethod: 1,
                    narration: 6,
                    customerId: 2,
                    accountId: 2
                } as unknown as CreatePaymentReceivedDto
            }
        }
    })
    @ApiConsumes("multipart/form-data")
    @PaymentReceivedApiDoc("file")
    @UseInterceptors(FileInterceptor("file"))
    @Post('createPaymentReceipt')
    async createPayment(
        @Body() createReceiptDto: CreatePaymentReceivedDto,
        @UploadedFile() file: any,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface,
        @UserPayload() userPayload: UserInterface
    ) {
        createReceiptDto["file"] = file;
        createReceiptDto["ipPayload"] = ipClientPayload;

        const data = await this.paymentReceivedService.createPaymentReceipt(
            createReceiptDto,
            userPayload
        );

        return { message: "successful!", result: data };
    }

    //#endregion
}
