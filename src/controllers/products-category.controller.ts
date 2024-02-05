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
import { ProductCategoryService } from "../services/product-category.service";
import { CreateProductCategoryDto } from "../dtos/productcategory/create-product-category.dto";


@ApiTags("Product|Service Category")
@ApiBearerAuth("jwt")
@UseGuards(UserGuard)
@Controller({
    path: "productcategory",
    version: "1"
})
export class ProductCategoryController {
    constructor(private productCategoryService: ProductCategoryService) { }

    /**
     * DROPDOWN ->Product data
     */
    @Get("dropdown/productCategory")
    @ApiOperation({
        summary: "Get Product Category dropdown data",
        description: "This api is responsible for fetching Product Category dropdown"
    })
    async dropdown(@UserPayload() userPayload: UserInterface
    ) {
        const data = await this.productCategoryService.dropdown(userPayload);
        return { message: "successful", result: data };
    }
    //   create a new service
    @ApiOperation({
        summary: "create service by a user",
        description: "this route is responsible for create a service"
    })
    @ApiBody({
        type: CreateProductCategoryDto,
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
                } as unknown as CreateProductCategoryDto
            }
        }
    })
    @Post()
    async create(
        @Body() createProductCategoryDto: CreateProductCategoryDto,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface,
        @UserPayload() userPayload: UserInterface
    ) {
        createProductCategoryDto["ipPayload"] = ipClientPayload;

        const data = await this.productCategoryService.createProductCategory(
            createProductCategoryDto,
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
        type: CreateProductCategoryDto,
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
        @Body() createProductCategoryDto: CreateProductCategoryDto,
        @UserPayload() userPayload: UserInterface,
        @IpPlusClientAddress() ipClientPayload: IpClientInterface,
        @Param("id") id: number
    ) {
        createProductCategoryDto["ipPayload"] = ipClientPayload;

        const data = await this.productCategoryService.updateProductCategory(
            createProductCategoryDto,
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
        const data = await this.productCategoryService.findSingleProductCategory(
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
        const result = await this.productCategoryService.findAllProductCategory(
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
        const data = await this.productCategoryService.deleteProductCategory(
            id,
            userPayload,
            ipClientPayload
        );
        return { message: "successful!", result: data };
    }

}
