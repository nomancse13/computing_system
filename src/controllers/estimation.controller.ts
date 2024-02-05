import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { UserGuard } from "src/authentication/auth/guards";

import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";

import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
import { CreateEstimationDto, UpdateEstiamtionDto } from "../dtos/receivables/estiamtion";
import { EstimationService } from "../services/estiamtion.service";
@ApiTags("Sales|Estimation")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "estimation",
  version: "1"
})
export class EstimationController {
  constructor(private estiamtionService: EstimationService) {}

  //   create a new Estimation
  @ApiOperation({
    summary: "create Estimation by a user",
    description: "this route is responsible for create a Estimation"
  })
  @ApiBody({
    type: CreateEstimationDto,
    description: "How to create a Estimation with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter Estimation",
        value: {
          comment: "This is my first comment",
          subtotalAmount: 123,
          totalAmt: 19.68,
          taxid: 10,
          txnDate: "01-11-23",
          expirationDate: "03-11-23",
          txnType: "estimate",
          vat: true,
          reference: "noman",
          customerMemo: "noman",
          billAddr: "noman",
          shipAddr: "noman",
          billEmail: "noman@gmail.com",
          docNumber: 1122,
          txnId: 1232,
          totalTax: 123,
          applyTaxAfterDiscount: true,
          netAmountTaxable: 34,
          debitLedgerId: 2,
          items: [
            {
              productId: 4,
              qty: 3,
              unitPrice: 23,
              detailType: "Debit",
              totalAmount: 23,
              description: "this is for test",
              taxCodeRef: "noman"
            },
            {
              productId: 5,
              qty: 3,
              unitPrice: 23,
              detailType: "Debit",
              totalAmount: 23,
              description: "this is for test",
              taxCodeRef: "noman"
            }
          ]
        } as unknown as CreateEstimationDto
      }
    }
  })
  @Post()
  async create(@Body() createEstimationDto: CreateEstimationDto, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @UserPayload() userPayload: UserInterface) {
    createEstimationDto["ipPayload"] = ipClientPayload;

    const data = await this.estiamtionService.createEstimation(createEstimationDto, userPayload);

    return { message: "successful!", result: data };
  }

  // update a Estimation by id
  @ApiOperation({
    summary: "update Estimation by id",
    description: "this route is responsible for update Estimation by id"
  })
  @ApiBody({
    type: UpdateEstiamtionDto,
    description: "How to update a Estimation by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          estimationNo: "EST-0001",
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
    description: "for update a Estimation required id",
    required: true
  })
  @Patch(":id")
  @ApiConsumes("multipart/form-data")
  async update(@Body() updateEstimationDto: UpdateEstiamtionDto, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface, @Param("id") id: number) {
    updateEstimationDto["ipPayload"] = ipClientPayload;

    const data = await this.estiamtionService.updateEstimation(updateEstimationDto, userPayload, id);
    return { message: "successful!", result: data };
  }

  // find single Estimation
  @ApiOperation({
    summary: "find single Estimation by id",
    description: "this route is responsible for find single Estimation by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single Estimation required id",
    required: true
  })
  @Get(":id")
  async findSingleEstimation(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.estiamtionService.findSingleEstimation(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }

  // get all Estimation data with paginaiton
  @ApiOperation({
    summary: "get all Estimation data with pagination",
    description: "this route is responsible for getting all Estimation data with pagination"
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
  async getAllEstimation(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query("filter") filter: any,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UserPayload() userPayload: UserInterface
  ) {
    const result = await this.estiamtionService.findAllEstimationData(listQueryParam, filter, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }

  // delete single Estimation account
  @ApiOperation({
    summary: "delete single Estimation account by id",
    description: "this route is responsible for delete single Estimation account by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single Estimation account required id",
    required: true
  })
  @Delete(":id")
  async deleteEstimation(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.estiamtionService.deleteEstimation(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }
}
