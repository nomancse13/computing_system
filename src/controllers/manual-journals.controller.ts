import { UserGuard } from "src/authentication/auth/guards";
import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors, UploadedFile, Param, Patch, Delete } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";
import { ManualJournalsService } from "../services/manual-journals.service";
import { CreateManualJounalsDto, UpdateManualJounalsDto } from "../dtos/account/manual-journal";
import { FileInterceptor } from "@nestjs/platform-express";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
import { ManualJournalApiDoc } from "src/authentication/utils/decorators/manual-journal.decorator";

@ApiTags("Account|Manual Journals")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
  path: "manual/journals",
  version: "1"
})
export class ManualJournalsController {
  constructor(private manualJournalsService: ManualJournalsService) {}

  //   create a new manual journals
  @ApiOperation({
    summary: "create manual journals by a user",
    description: "this route is responsible for create a new manual journals"
  })
  @ApiBody({
    type: CreateManualJounalsDto,
    description: "How to create a manual journals with body?... here is the example given below!",
    examples: {
      a: {
        summary: "enter manual journals",
        value: {
          txnDate: "2023-12-12",
          adjustment: true,
          totalAmt: 100,
          privateNote: "This is test",
          journalDetails: [
            {
              accountId: 1,
              amount: 100,
              description: "this is for test",
              detailType: "Debit",
              postingType: "Debit"
            },
            {
              accountId: 1,
              amount: 100,
              description: "this is for test",
              detailType: "Debit",
              postingType: "Credit"
            }
          ]
        } as unknown as CreateManualJounalsDto
      }
    }
  })
  @Post()
  async create(
    @Body() createManualJounalsDto: CreateManualJounalsDto,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UploadedFile() file: any,
    @UserPayload() userPayload: UserInterface
  ) {
    createManualJounalsDto["file"] = file;

    const data = await this.manualJournalsService.createManualJournals(createManualJounalsDto, userPayload);

    return { message: "successful!", result: data };
  }

  // update a manual Journals by id
  @ApiOperation({
    summary: "update manual Journals by id",
    description: "this route is responsible for update manual Journals by id"
  })
  @ApiBody({
    type: UpdateManualJounalsDto,
    description: "How to update a manual Journals by id?... here is the example given below!",
    examples: {
      a: {
        summary: "default",
        value: {
          txnDate: "2023-12-12",
          adjustment: true,
          debitAmount: 100,
          creditAmount: 100,
          privateNote: "This is Nasir",
          journalDetails: [
            {
              id: 10,
              accountId: 1,
              amount: 100,
              description: "this is for Jaman",
              detailType: "Debit",
              postingType: "Debit"
            },
            {
              accountId: 1,
              amount: 100,
              description: "this is for s.alam",
              detailType: "Credit",
              postingType: "Credit"
            }
          ]
        }
      }
    }
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "for update a manual Journals required id",
    required: true
  })
  // @ApiConsumes("multipart/form-data")
  // @ManualJournalApiDoc("file")
  // @UseInterceptors(FileInterceptor("file"))
  @Patch(":id")
  async update(
    @Body() updateManualJounalsDto: UpdateManualJounalsDto,
    @UserPayload() userPayload: UserInterface,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
    @UploadedFile() file: any,
    @Param("id") id: number
  ) {
    updateManualJounalsDto["file"] = file;

    const data = await this.manualJournalsService.updateManualJournals(updateManualJounalsDto, userPayload, id);
    return { message: "successful!", result: data };
  }

  // find  manual journals details
  @ApiOperation({
    summary: "find single manual journals details by id",
    description: "this route is responsible for find  manual journals details by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single manual journals required id",
    required: true
  })
  @Get("journaldetails/:id")
  async findJournalDetails(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.manualJournalsService.findOneManualJournalDetailData(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }

  // find single manual journals
  @ApiOperation({
    summary: "find single manual journals by id",
    description: "this route is responsible for find single manual journals by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "find single manual journals required id",
    required: true
  })
  @Get(":id")
  async findOne(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.manualJournalsService.findOneManualJournalData(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }

  // get all manual journals data with paginaiton
  @ApiOperation({
    summary: "get all manual journals data with pagination",
    description: "this route is responsible for getting all manual journals data with pagination"
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
    const result = await this.manualJournalsService.findAllManualjournalData(listQueryParam, filter, ipClientPayload, userPayload);

    return { message: "successful", result: result };
  }

  // delete single manual journals
  @ApiOperation({
    summary: "delete single manual journals by id",
    description: "this route is responsible for delete single manual journals by id"
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "delete single manual journals required id",
    required: true
  })
  @Delete(":id")
  async delete(@Param("id") id: number, @UserPayload() userPayload: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface) {
    const data = await this.manualJournalsService.deleteManuaJournal(id, userPayload, ipClientPayload);
    return { message: "successful!", result: data };
  }
}
