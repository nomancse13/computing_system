// configuration controller

import {
    BadRequestException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StatusField } from "src/authentication/common/enum";
import {
    Pagination,
    PaginationOptionsInterface,
    UserInterface
} from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { DataSource, Not } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { CreateProductCategoryDto } from "../dtos/productcategory/create-product-category.dto";
import { ActivityLogService } from "./activity-log.service";
import { OrganizationEntity, ProductCategoryEntity } from "../entities";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";

@Injectable()
export class ProductCategoryService {
    constructor(
        @InjectRepository(ProductCategoryEntity)
        private ProductcategoryRepository: BaseRepository<ProductCategoryEntity>,
        private activityLogService: ActivityLogService,
        private dataSource: DataSource,
        private authservice: AuthService,
    ) { }

    //  create Product
    async createProductCategory(
        createProductCategoryDto: CreateProductCategoryDto,
        userPayload: UserInterface
    ): Promise<any> {

        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();
        let exceptionmessage = 'fialed';
        try {
          
            const findName = await queryRunner.manager.findOne(ProductCategoryEntity, { where: { Name: createProductCategoryDto.Name.trim(), organizationId: userPayload.organizationId } });

            if (findName) {
                exceptionmessage = `duplicate name found. please insert a unique one.`
                throw new BadRequestException(
                    `duplicate name found. please insert a unique one.`
                );
            }

            let serviceinfo = new ProductCategoryEntity();
            serviceinfo.createdAt = new Date();
            serviceinfo.updatedAt = new Date();
            serviceinfo.createdBy = userPayload.id;
            serviceinfo.organizationId = userPayload.organizationId;
            let organization = await queryRunner.manager.findOne(OrganizationEntity, { where: { id: userPayload.organizationId } });
            serviceinfo.organization = organization;
            serviceinfo.updatedBy = 0;
            serviceinfo.deletedBy = 0;
            serviceinfo.Name = createProductCategoryDto.Name;
            // save Product data
            const insertData = await queryRunner.manager.save(ProductCategoryEntity, serviceinfo);

            await queryRunner.commitTransaction();

            return insertData;  
          
        } catch (err) {
            console.log(err);
            // if we have errors, rollback changes we made
            await queryRunner.rollbackTransaction()
            throw new BadRequestException(exceptionmessage);

        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
        //#endregion End Transaction
    }

    // update Product
    async updateProductCategory(
        updatecategoryDto: CreateProductCategoryDto,
        userPayload: UserInterface,
        id: number
    ) {
        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();
        let exceptionmessage = 'failed';

        try {
            const Product = await queryRunner.manager.findOne(ProductCategoryEntity, {
                where: {
                    id: id,
                    organizationId: userPayload.organizationId
                }
            });

            if (!Product) {
                exceptionmessage = `This data not exist in DB!!!`;
                throw new BadRequestException(`This data not exist in DB!!!`);
            }
            const findName = await queryRunner.manager.findOne(ProductCategoryEntity, {
                where: {
                    Name: updatecategoryDto.Name.trim(),
                    id: Not(id),
                    organizationId: userPayload.organizationId
                }
            });

            if (findName) {
                exceptionmessage = `duplicate name found. please insert a unique one.`;

                throw new BadRequestException(
                    `duplicate name found. please insert a unique one.`
                );
            }

            Product.Name = updatecategoryDto.Name;
            Product.updatedAt = new Date();
            Product.updatedBy = userPayload.id;
            const data = await queryRunner.manager.update(ProductCategoryEntity, { id: id }, Product);


            const logInfo = updatecategoryDto?.ipPayload;

            // Prepare Activity Log
            const log = {
                cLientIPAddress: logInfo.ip,
                browser: logInfo.browser,
                os: logInfo.os,
                userId: userPayload.id,
                messageDetails: {
                    tag: "Service/Product",
                    message: `Service/Product updated by ${decrypt(userPayload.hashType)}`,
                    date: new Date()
                },
                logData: data,
                organizationId: userPayload.organizationId
            };

            // Save Activity Log
            if (log) {
                await this.activityLogService.createLog(log, queryRunner);
            }
            await queryRunner.commitTransaction();
            return `Product updated successfully!!!`;

        } catch (err) {
            // if we have errors, rollback changes we made
            await queryRunner.rollbackTransaction()
            throw new BadRequestException(exceptionmessage);

        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
        //#endregion End Transaction

    }

    // find all Product
    async findAllProductCategory(
        listQueryParam: PaginationOptionsInterface,
        filter: any,
        ipClientPayload: any,
        userPayload: UserInterface
    ) {
        const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
        const page: number = listQueryParam.page
            ? +listQueryParam.page == 1
                ? 0
                : listQueryParam.page
            : 1;

        // Prepare Activity Log
        const log = {
            cLientIPAddress: ipClientPayload.ip,
            browser: ipClientPayload.browser,
            os: ipClientPayload.os,
            userId: userPayload.id,
            messageDetails: {
                tag: "Service/Product",
                message: `All Service/Product fetched by ${decrypt(userPayload.hashType)}`,
                date: new Date()
            },
            logData: null,
            organizationId: userPayload.organizationId
        };

        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();
        try {
            const [results, total] = await queryRunner.manager.findAndCount(ProductCategoryEntity, {
                where: { organizationId: userPayload.organizationId },
                take: limit,
                skip: page > 0 ? page * limit - limit : page
            })
          
            await this.activityLogService.createLogWithoutTransaction(log);

            return new Pagination<any>({
                results,
                total,
                currentPage: page === 0 ? 1 : page,
                limit
            });
        } catch (err) {

        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
        //#endregion end Transaction
    }

    // delete Product
    async deleteProductCategory(
        id: number,
        userPayload: UserInterface,
        ipClientPayload: any
    ): Promise<any> {

        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();
        let message = 'failed';

        try {
            const Product = await queryRunner.manager.findOne(ProductCategoryEntity, {
                where: {
                    id: id,
                    organizationId: userPayload.organizationId
                }
            });
            // Prepare Activity Log
            const log = {
                cLientIPAddress: ipClientPayload.ip,
                browser: ipClientPayload.browser,
                os: ipClientPayload.os,
                userId: userPayload.id,
                messageDetails: {
                    tag: "Service/Product",
                    message: `Service/Product deleted by ${decrypt(userPayload.hashType)}`,
                    date: new Date()
                },
                logData: Product,
                organizationId: userPayload.organizationId
            };

            if (!Product) {
                message = "Product not found";
                throw new NotFoundException("Product not found");
            }
            // Save Activity Log
            await this.activityLogService.createLog(log, queryRunner);
            let data = await queryRunner.manager.remove(ProductCategoryEntity, Product);
            await queryRunner.commitTransaction();

            return data;
        } catch (err) {
            // if we have errors, rollback changes we made
            await queryRunner.rollbackTransaction()
            throw new BadRequestException(message);

        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
        //#endregion End Transaction

    }

    /**
     * Get Single Product
     */
    async findSingleProductCategory(
        id: number,
        userPayload: UserInterface,
        ipClientPayload: any
    ) {
        const data = await this.ProductcategoryRepository.findOne({
            where: {
                id: id,
                organizationId: userPayload.organizationId
            }
        });

        // Prepare Activity Log
        const log = {
            cLientIPAddress: ipClientPayload.ip,
            browser: ipClientPayload.browser,
            os: ipClientPayload.os,
            userId: userPayload.id,
            messageDetails: {
                tag: "Service/Product",
                message: `Single Service/Product fetched by ${decrypt(
                    userPayload.hashType
                )}`,
                date: new Date()
            },
            logData: data,
            organizationId: userPayload.organizationId
        };

        if (!data) {
            throw new NotFoundException(`this Product not exist in db!!`);
        }

        // Save Activity Log
        await this.activityLogService.createLogWithoutTransaction(log);

        return data;
    }

    /**
     * Get One Product
     */
    async findOneProductCategory(id: number) {
        const data = await this.ProductcategoryRepository.findOne({
            where: {
                id: id
            }
        });
        if (!data) {
            throw new NotFoundException(`this Product not exist in db!!`);
        }
        return data;
    }

    /**
     * DROPDOWN -> Product
     */
    async dropdown(userPayload: UserInterface) {

        //const results = await this.ProductcategoryRepository.find({
        //    where: { organizationId: userPayload.organizationId, status: StatusField.ACTIVE },
        //    select: { id: true, Name: true },
        //})

        //return results;
        return await this.ProductcategoryRepository
            .createQueryBuilder("product")
            .where(`Product.status = '${StatusField.ACTIVE}'`)
            .andWhere(`Product.organizationId = ${userPayload.organizationId}`)
            .select(["Product.id as value", "Product.Name as label"])
            .getRawMany();
    }

}