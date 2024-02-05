import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
    BadRequestException
} from "@nestjs/common";
import {
    Pagination,
    PaginationOptionsInterface,
    UserInterface
} from "src/authentication/common/interfaces";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { InjectRepository } from "@nestjs/typeorm";
import { decrypt } from "src/helper/crypto.helper";
import {
    ErrorMessage,
    StatusField,
    UserTypesEnum
} from "src/authentication/common/enum";
import { Brackets, DataSource } from "typeorm";
import * as randToken from "rand-token";
import { ModuleEntity } from "../entities";
import { CreateModuleDto, UpdateModuleDto } from "../dtos/administrator/module";
import slugGenerator from "src/helper/slugify.helper";
import { ActivityLogService } from "./activity-log.service";

@Injectable()
export class ModuleService {
    constructor(
        @InjectRepository(ModuleEntity)
        private moduleRepository: BaseRepository<ModuleEntity>,
        private activityLogService: ActivityLogService,
        private dataSource: DataSource
    ) { }

    //  create module
    async createmodule(
        createModuleDto: CreateModuleDto,
        userPayload: UserInterface
    ): Promise<any> {
        // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
        //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
        // }
        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();

        try {

        } catch (err) {
            // if we have errors, rollback changes we made
            await queryRunner.rollbackTransaction()
            throw new BadRequestException(`failed`);

        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
        //#endregion End Transaction

        createModuleDto["createdBy"] = userPayload.id;

        const logInfo = createModuleDto?.ipPayload;

        // Prepare Activity Log
        const log = {
            cLientIPAddress: logInfo.ip,
            browser: logInfo.browser,
            os: logInfo.os,
            userId: userPayload.id,
            messageDetails: {
                tag: "Module",
                message: `New Module created by ${decrypt(userPayload.hashType)}`,
                date: new Date()
            },
            logData: createModuleDto,
            organizationId: userPayload.organizationId
        };

        const insertData = await this.moduleRepository.save(createModuleDto);

        // Save Activity Log
        if (log) {
            await this.activityLogService.createLogWithoutTransaction(log);
        }
        return insertData;
    }

    // update module
    async updatemodule(
        updateModuleDto: UpdateModuleDto,
        userPayload: UserInterface,
        id: number
    ) {
        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();

        try {

        } catch (err) {
            // if we have errors, rollback changes we made
            await queryRunner.rollbackTransaction()
            throw new BadRequestException(`failed`);

        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
        //#endregion End Transaction


        try {
            const module = await this.moduleRepository.findOne({
                where: {
                    id: id,
                    organizationId: userPayload.organizationId
                }
            });

            if (!module) {
                throw new BadRequestException(`This data not exist in DB!!!`);
            }
            updateModuleDto["updatedAt"] = new Date();
            updateModuleDto["updatedBy"] = userPayload.id;

            const moduleData = await this.findOnemodule(id);

            const logInfo = updateModuleDto?.ipPayload;

            delete updateModuleDto.ipPayload;
            //check slug
            
            const data = await this.moduleRepository
                .createQueryBuilder()
                .update(ModuleEntity, updateModuleDto)
                .where(`id = '${id}'`)
                .execute();

            // Prepare Activity Log
            const log = {
                cLientIPAddress: logInfo.ip,
                browser: logInfo.browser,
                os: logInfo.os,
                userId: userPayload.id,
                messageDetails: {
                    tag: "Module",
                    message: `Module updated by ${decrypt(userPayload.hashType)}`,
                    date: new Date()
                },
                logData: updateModuleDto,
                organizationId: userPayload.organizationId
            };

            // Save Activity Log
            if (log) {
                await this.activityLogService.createLogWithoutTransaction(log);
            }

            return `module updated successfully!!!`;
        } catch (e) {
            throw new BadRequestException(ErrorMessage.UPDATE_FAILED);
        }

        // if (data.affected === 0) {
        //   throw new BadRequestException(ErrorMessage.UPDATE_FAILED);
        // }
    }

    // find all module
    async findAllmodule(
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
                tag: "Module",
                message: `All Module fetched by ${decrypt(userPayload.hashType)}`,
                date: new Date()
            },
            logData: null,
            organizationId: userPayload.organizationId
        };

        const [results, total] = await this.moduleRepository
            .createQueryBuilder("module")
            .where(
                new Brackets((qb) => {
                    if (filter) {
                        qb.where(`module.name LIKE ('%${filter}%')`);
                    }
                })
            )
            .andWhere(`module.organizationId = ${userPayload.organizationId}`)
            .orderBy("module.id", "DESC")
            .take(limit)
            .skip(page > 0 ? page * limit - limit : page)
            .getManyAndCount();

        // Save Activity Log
        await this.activityLogService.createLogWithoutTransaction(log);

        return new Pagination<any>({
            results,
            total,
            currentPage: page === 0 ? 1 : page,
            limit
        });
    }

    // delete module
    async deletemodule(
        id: number,
        userPayload: UserInterface,
        ipClientPayload: any
    ): Promise<any> {

        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();

        try {

        } catch (err) {
            // if we have errors, rollback changes we made
            await queryRunner.rollbackTransaction()
            throw new BadRequestException(`failed`);

        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
        //#endregion End Transaction


        try {
            const designation = await this.moduleRepository.findOne({
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
                    tag: "Module",
                    message: `Module deleted by ${decrypt(userPayload.hashType)}`,
                    date: new Date()
                },
                logData: designation,
                organizationId: userPayload.organizationId
            };

            if (!designation) {
                throw new NotFoundException("module not found");
            }

            // Save Activity Log
            await this.activityLogService.createLogWithoutTransaction(log);

            return await this.moduleRepository.remove(designation);
        } catch (e) {
            throw new BadRequestException(`this module not found. can not deleted`);
        }
    }

    /**
     * Get Single module
     */
    async findSingleModule(
        id: number,
        userPayload: UserInterface,
        ipClientPayload: any
    ) {
        const data = await this.moduleRepository.findOne({
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
                tag: "Module",
                message: `Single Module fetched by ${decrypt(userPayload.hashType)}`,
                date: new Date()
            },
            logData: data,
            organizationId: userPayload.organizationId
        };

        if (!data) {
            throw new NotFoundException(`this module not exist in db!!`);
        }

        // Save Activity Log
        await this.activityLogService.createLogWithoutTransaction(log);

        return data;
    }
    /**
     * Get One module
     */
    async findOnemodule(id: number) {
        const data = await this.moduleRepository.findOne({
            where: {
                id: id,
                
            }
        });

        if (!data) {
            throw new NotFoundException(`this module not exist in db!!`);
        }

        return data;
    }
}
