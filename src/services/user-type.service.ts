import {
    BadRequestException,
    NotFoundException
} from "@nestjs/common";
import { Injectable } from "@nestjs/common/decorators";
import { InjectRepository } from "@nestjs/typeorm";
import { Value } from "aws-sdk/clients/connect";
import {
    ErrorMessage,
    StatusField,
    SuccessMessage
} from "src/authentication/common/enum";
import {
    Pagination,
    PaginationOptionsInterface,
    UserInterface
} from "src/authentication/common/interfaces";
import slugGenerator from "src/helper/slugify.helper";
import { Brackets, DataSource, Like, Not } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { DeleteUserTypeDto } from "../dtos/administrator/user";
import {
    CreateUserTypeDto,
    UpdateUserTypeDto
} from "../dtos/administrator/user-type";
import { OrganizationEntity, UserEntity } from "../entities";
import { UserTypeEntity } from "../entities/user-type.entity";
import { ActivityLogService } from "./activity-log.service";
import { decrypt } from "src/helper/crypto.helper";
import { CreatePermissionDto } from "../dtos/administrator/permission";
@Injectable()
export class UserTypeService {
    constructor(
        @InjectRepository(UserTypeEntity)
        private userTypeRepository: BaseRepository<UserTypeEntity>,
        private activityLogService: ActivityLogService,
        private dataSource: DataSource
    ) { }

    /**
     * CREATE new user Type
     */
    async create(userTypeData: CreateUserTypeDto, userPayload: UserInterface) {
        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();


        try {
            const createentry = new UserTypeEntity();


            createentry.userTypeName = userTypeData.userTypeName;
            createentry.slug = slugGenerator(userTypeData.userTypeName);


            createentry.createdAt = new Date();
            createentry.updatedAt = new Date();
            createentry.createdBy = userPayload.id;
            createentry.organizationId = userPayload.organizationId;
            createentry.updatedBy = 0;
            createentry.permissions = {
                "quickbook": {
                    "human_resource": {
                        "view": false
                    },
                    "Products": {
                        "view": false
                    },
                    "receivables": {
                        "view": false
                    },
                    "payables": {
                        "view": false
                    },
                    "accountant": {
                        "view": false
                    },
                    "reports": {
                        "view": false
                    }
                },
                "dashboard": {
                    "dashboard": {
                        "view": false
                    }
                },
                "quickbooks_api": {
                    "quickbook_api": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    }
                },
                "human_resource": {
                    "manage_designation": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "manage_employee": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "salary_payment": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    }
                },
                "service": {
                    "manage_service": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    }
                },
                "banking": {
                    "manage_bank": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "statement": {
                        "view": false
                    }
                },
                "receivables": {
                    "manage_customer": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "manage_quotation": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "customer_invoice": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "paid_invoice": {
                        "view": false
                    },
                    "received_payment": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "sales_return": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "customer_statement": {
                        "view": false
                    }
                },
                "payables": {
                    "supplier": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "purchase_order": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "supplier_invoice": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "paid_invoice": {
                        "view": false
                    },
                    "payment_voucher": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "bookkeeping": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "purchase_return": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "expenses": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "supplier_statement": {
                        "view": false
                    }
                },
                "accountant": {
                    "manual_journal": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "account_head": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "accounts": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "chart_of_accounts": {
                        "view": false
                    },
                    "account_statement": {
                        "view": false
                    }
                },
                "administrator": {
                    "user_role": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "manage_permission": {
                        "add": false
                    },
                    "manage_user": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "login_history": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "activity": {
                        "view": false,
                        "add": false,
                        "edit": false,
                        "delete": false
                    },
                    "module": {
                        "view": false
                    }
                },
                "reports": {
                    "income_statement": {
                        "view": false
                    },
                    "trial_balance": {
                        "view": false
                    },
                    "balance_sheet": {
                        "view": false
                    }
                }
            };


            // const logInfo = userTypeData?.ipPayload;


            // delete userTypeData.ipPayload;


            // Prepare Activity Log
            // const log = {
            //   cLientIPAddress: logInfo.ip,
            //   browser: logInfo.browser,
            //   os: logInfo.os,
            //   userId: userPayload.id,
            //   messageDetails: {
            //     tag: "User-Type",
            //     message: `New User-Type created by ${decrypt(userPayload.hashType)}`,
            //     date: new Date()
            //   },
            //   logData: userTypeData
            // };
            const insertData = await this.userTypeRepository.save(createentry);


            // // Save Activity Log
            // if (log) {
            //   await this.activityLogService.createLog(log);
            // }


            return insertData;

        } catch (err) {
            // if we have errors, rollback changes we made
            await queryRunner.rollbackTransaction()
            throw new BadRequestException(`failed`);


        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
        //#endregion End Transaction

    }


    /**
     * GET all user type
     */
    async findAll(
        listQueryParam: PaginationOptionsInterface,
        filter: any,
        userPayload: UserInterface
    ) {
        //  if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
        //    throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
        //  }

        const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
        const page: number = listQueryParam.page
            ? +listQueryParam.page == 1
                ? 0
                : listQueryParam.page
            : 1;

        const [results, total] = await this.userTypeRepository
            .createQueryBuilder("usertype")
            .leftJoinAndMapOne(
                "usertype.user",
                UserEntity,
                "user",
                "usertype.createdBy = user.id"
            )
            .where(`usertype.organizationId = ${userPayload.organizationId}`)
            .andWhere(
                new Brackets((qb) => {
                    if (filter) {
                        qb.where(`usertype.userTypeName LIKE ('%${filter}%')`);
                    }
                })
            )

            .select([
                `usertype.id`,
                `usertype.userTypeName`,
                `usertype.createdAt`,
                `user.fullName`,
                `user.email`
            ])
            .orderBy("usertype.id", "DESC")
            .take(limit)
            .skip(page > 0 ? page * limit - limit : page)
            .getManyAndCount();

        return new Pagination<any>({
            results,
            total,
            currentPage: page === 0 ? 1 : page,
            limit
        });
    }

    /**
     * Get One user Type
     */
    async findOneResult(id: number, userPayload: UserInterface) {
        const data = await this.userTypeRepository.findOne({
            where: {
                id: id
            }
        });
        if (!data) {
            throw new NotFoundException(ErrorMessage.RECORD_NOT_FOUND);
        }
        return data;
    }

    // get permission by userId
    async getPermissionByUserId(userPayload: UserInterface) {

        // const getPermission = await this.userTypeRepository.findOne({where: {userTypeName: decrypt(userPayload.hashType), organizationId: null || userPayload.organizationId }})
        let returndata: any = {};

        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();
        try {
            const checkusertype = decrypt(userPayload.hashType);
            if (checkusertype == 'Super Admin') {

                returndata.permission = 'SuperAdmin';
                let userinfo = await queryRunner.manager.findOne(UserEntity,
                    {
                        where: { id: userPayload.id },
                        select: { fullName: true, email: true, mobile: true, profileImgSrc: true }
                    })
                returndata.user = userinfo;

                let organization = await queryRunner.manager.findOne(OrganizationEntity,
                    {
                        where: { id: userPayload.organizationId },
                        select: { organizationLogo: true, organizationName: true }
                    })
                returndata.organization = organization;

                return returndata;
            }
            else {
                const getPermission = await queryRunner.manager.findOne(UserTypeEntity, {
                    where: {
                        userTypeName: Like(`%${decrypt(userPayload.hashType)}%`),
                        status: StatusField.ACTIVE,
                        organizationId: userPayload.organizationId
                    }
                });

                returndata.permission = getPermission.permissions;
                let userinfo = await queryRunner.manager.findOne(UserEntity, { where: { id: userPayload.id } })
                returndata.user = userinfo;

                let organization = await queryRunner.manager.findOne(OrganizationEntity, { where: { id: userPayload.organizationId } })
                returndata.organization = organization;

                if (!getPermission) {
                    throw new BadRequestException(`Permission not found`);
                }

                return returndata;
            }
        } catch (err) {

        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
        //#endregion end Transaction

       

    }


    /**
* Update user permissions
*/
    async updatePermissions(
        id: number,
        updatePermissionDto: CreatePermissionDto,
        userPayload: UserInterface
    ) {
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:    
        await queryRunner.startTransaction();

        try {
            console.log('id: ', id);
            console.log('userPayload: ', userPayload);
            const userTYpe = await queryRunner.manager.findOne(UserTypeEntity, { where: { id: id, organizationId: userPayload.organizationId } });

            if (!userTYpe) {
                throw new BadRequestException(`This data not exist in DB!!!`);
            }
            userTYpe.updatedBy = userPayload.id;
            userTYpe.updatedAt = new Date();
            console.log('updatePermissionDto.permissions: ', updatePermissionDto.permissions);

            userTYpe.permissions = updatePermissionDto.permissions;

            const updateData = await await queryRunner.manager.update(UserTypeEntity, { id: id }, userTYpe)
            if (updateData) {
                await queryRunner.commitTransaction();
            }
            await queryRunner.rollbackTransaction()
            throw new BadRequestException('Update Failed');
        }
        catch (err) {
            // if we have errors, rollback changes we made
            await queryRunner.rollbackTransaction()
            throw new BadRequestException('Update Failed');

        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }


        return `updated successfully!!`;
    }


    /**
     * Update user type
     */
    async update(
        id: number,
        userTypeData: UpdateUserTypeDto,
        userPayload: UserInterface
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

        const userTYpe = await this.userTypeRepository.findOne({
            where: {
                id: id
            }
        });

        if (!userTYpe) {
            throw new BadRequestException(`This data not exist in DB!!!`);
        }
        if (userTypeData && userTypeData.userTypeName) {
            userTypeData["slug"] = slugGenerator(userTypeData.userTypeName);
        }
        userTypeData["updatedBy"] = userPayload.id;
        userTypeData["updatedAt"] = new Date();

        // const logInfo = userTypeData?.ipPayload;

        // delete userTypeData.ipPayload;

        const updateData = await this.userTypeRepository
            .createQueryBuilder()
            .update(UserTypeEntity, userTypeData)
            .where("id = :id", { id: id })
            .execute();

        if (!updateData.affected) {
            throw new NotFoundException(
                `User type data ${ErrorMessage.UPDATE_FAILED}`
            );
        }

        // Prepare Activity Log
        // const log = {
        //   cLientIPAddress: logInfo.ip,
        //   browser: logInfo.browser,
        //   os: logInfo.os,
        //   userId: userPayload.id,
        //   messageDetails: {
        //     tag: "User-Type",
        //     message: `User-Type updated by ${decrypt(userPayload.hashType)}`,
        //     date: new Date()
        //   },
        //   logData: updateData
        // };

        // Save Activity Log
        // if (log) {
        //   await this.activityLogService.createLog(log);
        // }

        return `updated successfully!!`;
    }

    /**
     * remove user Type
     */
    async remove(deletedData: DeleteUserTypeDto, userPayload: UserInterface) {
        const deletedInfo = {
            deletedAt: new Date(),
            deletedBy: userPayload.id,
            status: StatusField.INACTIVE
        };

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

        //update deleted data
        const deletedResult = await this.userTypeRepository
            .createQueryBuilder()
            .update(UserTypeEntity, deletedInfo)
            .where("userTypeId IN(:...ids)", { ids: deletedData.deleteIds })
            .execute();
        if (!deletedResult.affected) {
            throw new NotFoundException(ErrorMessage.DELETE_FAILED);
        }

        return deletedResult.raw;
    }

    /**
     * Hard delete a User Type
     */
    async delete(id: number, userPayload: UserInterface): Promise<any> {

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
            //update deleted data
            const deletedResult = await this.userTypeRepository.delete({
                id: id
            });
            if (!deletedResult.affected) {
                throw new NotFoundException(ErrorMessage.DELETE_FAILED);
            }

            return SuccessMessage.DELETE_SUCCESS;
        } catch (e) {
            throw new BadRequestException(
                `this ledger related as a foreign member. can not deleted`
            );
        }
    }

    /**
     * Get One user Type
     */
    async findOneType(id: number) {
        const data = await this.userTypeRepository.findOne({
            where: {
                id: id
            },
            relations: ["users"]
        });
        if (!data) {
            throw new NotFoundException(`User type not exist in db!!`);
        }
        return data;
    }

    /**
     * DROPDOWN -> user type
     */
    async dropdown(userPayload: UserInterface) {
        try {
            //const allusertype = await this.userTypeRepository.find({
            //    where: { status: StatusField.ACTIVE, organizationId: null, userTypeName: Not('Super Admin') },
            //    select: {
            //        id: true,
            //        userTypeName: true
            //    },

            //})
            const allusertype = await this.userTypeRepository
                .createQueryBuilder("userType")
                .where(`userType.status = '${StatusField.ACTIVE}'`)
                .andWhere(`userType.userTypeName Not Like '%Super Admin%'`)
                .orWhere(`userType.organizationId = '${userPayload.organizationId}'`)
                .select(["userType.id as value", "userType.userTypeName as label"])
                .getRawMany();

            return allusertype;
        } catch (ex) {
            console.log(ex);
        }

    }

}
