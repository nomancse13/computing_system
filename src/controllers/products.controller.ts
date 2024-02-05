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
import {
    IpPlusClientAddress,
    UserPayload
} from "src/authentication/utils/decorators";
import { ProductService } from "../services/Product.service";
import { IpClientInterface } from "src/authentication/common/interfaces/ip-client.interface";
import { CreateProductsDto, UpdateProductsDto } from "../dtos/products";


@ApiTags("Products|Service")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
    path: "products",
    version: "1"
})
export class ProductsController {
    constructor(private ProductService: ProductService) { }

    /**
     * DROPDOWN ->Product data
     */
    
    @Get("dropdown/productbycategory/:id")
    @ApiParam({
        name: "id",
        type: Number,
        description: "for update a Product required id",
        required: true
    })
    @ApiOperation({
        summary: "Get Product dropdown data",
        description: "This api is responsible for fetching Product dropdown"
    })
    async dropdownProductByCategory(@Param("id") id: number,@UserPayload() userPayload: UserInterface
    ) {
        console.log(id);

        const data = await this.ProductService.dropdownCategory(id,userPayload);
        return { message: "successful", result: data };
    }

    /**
     * DROPDOWN ->Product data
     */
    @Get("dropdown/product")
    @ApiOperation({
        summary: "Get Product dropdown data",
        description: "This api is responsible for fetching Product dropdown"
    })
    async dropdown(@UserPayload() userPayload: UserInterface
    ) {
        const data = await this.ProductService.dropdown(userPayload);
        return { message: "successful", result: data };
    }
    //   create a new service
    @ApiOperation({
        summary: "create service by a user",
        description: "this route is responsible for create a service"
    })
    @ApiBody({
        type: CreateProductsDto,
        description:
            "How to create a Product with body?... here is the example given below!",
        examples: {
            a: {
                summary: "enter Product info",
                value: {
                    Name: "demo",
                    unitPrice: 1,
                    sellingPrice: 6,
                    openingStock: 0
                } as unknown as CreateProductsDto
            }
        }
    })
    @Post()
    async create(
        @Body() createProductDto: CreateProductsDto,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface,
        @UserPayload() userPayload: UserInterface
    ) {
        createProductDto["ipPayload"] = ipClientPayload;

        const data = await this.ProductService.createProduct(
            createProductDto,
            userPayload
        );

        return { message: "successful!", result: data };
    }

    // update an Product by id
    @ApiOperation({
        summary: "update Product by id",
        description: "this route is responsible for update Product by id"
    })
    @ApiBody({
        type: UpdateProductsDto,
        description:
            "How to update an Product by id?... here is the example given below!",
        examples: {
            a: {
                summary: "default",
                value: {
                    Name: "demo",
                    unitPrice: 1,
                    sellingPrice: 6,
                    openingStock: 0
                }
            }
        }
    })
    @ApiParam({
        name: "id",
        type: Number,
        description: "for update a Product required id",
        required: true
    })
    @Patch(":id")
    async update(
        @Body() updateProductsDto: UpdateProductsDto,
        @UserPayload() userPayload: UserInterface,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface,
        @Param("id") id: number
    ) {
        updateProductsDto["ipPayload"] = ipClientPayload;

        const data = await this.ProductService.updateProduct(
            updateProductsDto,
            userPayload,
            id
        );
        return { message: "successful!", result: data };
    }

    // find single service
    @ApiOperation({
        summary: "find single service by id",
        description: "this route is responsible for find single service by id"
    })
    @ApiParam({
        name: "id",
        type: Number,
        description: "find single service required id",
        required: true
    })
    @Get(":id")
    async findOne(
        @Param("id") id: number,
        @UserPayload() userPayload: UserInterface,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface
    ) {
        const data = await this.ProductService.findSingleProduct(
            id,
            userPayload,
            ipClientPayload
        );
        return { message: "successful!", result: data };
    }

    // get all service data with paginaiton
    @ApiOperation({
        summary: "get all service data with pagination",
        description:
            "this route is responsible for getting all service data with pagination"
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
        const result = await this.ProductService.findAllProduct(
            listQueryParam,
            filter,
            ipClientPayload,
            userPayload
        );

        return { message: "successful", result: result };
    }

    // delete single service
    @ApiOperation({
        summary: "delete single service by id",
        description: "this route is responsible for delete single service by id"
    })
    @ApiParam({
        name: "id",
        type: Number,
        description: "delete single service required id",
        required: true
    })
    @Delete(":id")
    async delete(
        @Param("id") id: number,
        @UserPayload() userPayload: UserInterface,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface
    ) {
        const data = await this.ProductService.deleteProduct(
            id,
            userPayload,
            ipClientPayload
        );
        return { message: "successful!", result: data };
    }

    //#region Purchase Rate
    @ApiOperation({
        summary: "find Purchase Rate by id",
        description: "this route is responsible for find Purchase Rate by id"
    })
    @ApiParam({
        name: "id",
        type: Number,
        description: "find Purchase Rate required id",
        required: true
    })
    @Get("purchaserate/:id")
    async findPurchaseRate(
        @Param("id") id: number,
        @UserPayload() userPayload: UserInterface,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface
    ) {
        const data = await this.ProductService.findProductunitPrice(
            id,
            userPayload
        );
        return { message: "successful!", result: data };
    }
    //#endregion

    //#region Sales Rate
    @ApiOperation({
        summary: "find Purchase Rate by id",
        description: "this route is responsible for find Purchase Rate by id"
    })
    @ApiParam({
        name: "id",
        type: Number,
        description: "find Purchase Rate required id",
        required: true
    })
    @Get("salerate/:id")
    async findSalesRate(
        @Param("id") id: number,
        @UserPayload() userPayload: UserInterface,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface
    ) {
        const data = await this.ProductService.findProductSellingPrice(
            id,
            userPayload
        );
        return { message: "successful!", result: data };
    }
    //#endregion

}
