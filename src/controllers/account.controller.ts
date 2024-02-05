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
import {
    PaginationOptionsInterface,
    UserInterface
} from "src/authentication/common/interfaces";
import { IpPlusClientAddress, UserPayload } from "src/authentication/utils/decorators";
import { AccountService } from "../services/account.service";
import { CreateAccountDto, UpdateAccountDto } from "../dtos/account/accounts";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";

@ApiTags("Account|Account")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
    path: "account",
    version: "1"
})
export class AccountController {
    constructor(private accountService: AccountService) { }

    @Get("chartofaccounts")
    async chartofAccounts(
        @Query() listQueryParam: PaginationOptionsInterface,
        @Query("filter") filter: any,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface,
        @UserPayload() userPayload: UserInterface
    ) {
        const result = await this.accountService.chartOfAccount(
            ipClientPayload,
            userPayload
        );

        return { message: "successful", result: result };
    }


    @Get("currentEntryNo/:moduleName/:cdate")
    @ApiParam({
        name: "moduleName",
        type: String,
        description: "Module Name Required",
        required: true
    })
    @ApiParam({
        name: "cdate",
        type: Date,
        description: "date Required",
        required: true
    })
    async currentEntryNo(
        @Param("moduleName") moduleName: string,
        @Param("cdate") cdate: Date,
        @UserPayload() userPayload: UserInterface
    ) {
       
        const result = await this.accountService.generateAllNumbersbasedonDate(moduleName, cdate, userPayload);

        return { message: "successful", result: result };
    }

    @Get("dashboardData")
    async dashboardData(
        @UserPayload() userPayload: UserInterface
    ) {
        const result = await this.accountService.dashboard(userPayload);
        
        return { message: "successful", result: result };
    }

}
