import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StatusField } from "src/authentication/common/enum";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { Brackets, DataSource, Not } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { CreateDepartmentDto, UpdateDepartmentDto } from "../dtos/human-resource/department";
import { DepartmentEntity, OrganizationEntity } from "../entities";
import { ActivityLogService } from "./activity-log.service";
import { OrganizationsService } from "./organization.service";
import * as QuickBooks from "node-quickbooks";
import { async } from "rxjs";
import { AuthService } from "../authentication/auth/auth.service";
let checkvalue = 0;
let exceptionmessage = "fialed";
@Injectable()
export class DesignationService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private designationRepository: BaseRepository<DepartmentEntity>,
    private activityLogService: ActivityLogService,
    private organizationsService: OrganizationsService,
    private authservice: AuthService,
    private dataSource: DataSource
  ) {}

  async createdesignation(CreateDepartmentDto: CreateDepartmentDto, userPayload: UserInterface): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    const queryRunner1 = this.dataSource.createQueryRunner();

    try {
      const findName = await queryRunner.manager.findOne(DepartmentEntity, {
        where: {
          name: CreateDepartmentDto.name.trim(),
          organizationId: userPayload.organizationId
        }
      });

      if (findName) {
        //await queryRunner.rollbackTransaction();
        exceptionmessage = `duplicate name found. please insert a unique one.`;
        throw new BadRequestException(`duplicate name found. please insert a unique one.`);
      }
      const logInfo = CreateDepartmentDto?.ipPayload;
      checkvalue = 1;
      const createentry = new DepartmentEntity();
      createentry.name = CreateDepartmentDto.name;
      createentry.note = CreateDepartmentDto.note;
      createentry.createdAt = new Date();
      createentry.updatedAt = new Date();
      createentry.createdBy = userPayload.id;
      createentry.organizationId = userPayload.organizationId;
      createentry.updatedBy = 0;
      createentry.deletedBy = 0;

      const insertData = await queryRunner.manager.save(DepartmentEntity, createentry);
      if (insertData) {
        const qbinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
          where: {
            id: userPayload.organizationId
          }
        });
        if (qbinforamtion.qbaccounts == 1) {
          if (await this.authservice.isauthenticated(userPayload, queryRunner)) {
            await queryRunner.commitTransaction();
            await queryRunner1.startTransaction();
            const qboobject = new QuickBooks(
              qbinforamtion.qbClientKey,
              qbinforamtion.qbClientSecret,
              qbinforamtion.accessToken,
              false, // no token secret for oAuth 2.0
              qbinforamtion.realmeID,
              true, // use the sandbox?
              true, // enable debugging?
              null, // set minorversion, or null for the latest version
              "2.0", //oAuth version
              qbinforamtion.refreshToken
            );
            qboobject.createDepartment(
              {
                Name: createentry.name
              },
              async function (err, Department) {
                if (err) {
                  throw new BadRequestException(exceptionmessage);
                } else {
                  createentry.qbRefId = Department.Id;

                  const insertData = await queryRunner1.manager.update(DepartmentEntity, { id: createentry.id }, createentry);

                  await queryRunner1.commitTransaction();
                  return insertData;
                }
              }
            );
          }
        } else {
          // Prepare Activity Log
          const log = {
            cLientIPAddress: logInfo.ip,
            browser: logInfo.browser,
            os: logInfo.os,
            userId: userPayload.id,
            // organizationId: userPayload.organizationId,
            messageDetails: {
              tag: "Designation",
              message: `New Designation created by ${decrypt(userPayload.hashType)}`,
              date: new Date()
            },
            logData: insertData,
            organizationId: userPayload.organizationId
          };

          // Save Activity Log
          if (log) {
            await this.activityLogService.createLog(log, queryRunner);
          }

          // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
          //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
          // }

          await queryRunner.commitTransaction();
          return insertData;
        }
      }
      return insertData;
      throw new BadRequestException(exceptionmessage);
    } catch (err) {
      // if we have errors, rollback changes we made

      if (checkvalue == 1) {
        await queryRunner.rollbackTransaction();
      }
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      //await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // update designation
  async updatedesignation(UpdateDepartmentDto: UpdateDepartmentDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    let exceptionmessage = "fialed";
    try {
      const findName = await queryRunner.manager.findOne(DepartmentEntity, {
        where: {
          name: UpdateDepartmentDto.name.trim(),
          id: Not(id),
          organizationId: userPayload.organizationId
        }
      });

      if (findName) {
        exceptionmessage = `duplicate name found. please insert a unique one.`;
        throw new BadRequestException(`duplicate name found. please insert a unique one.`);
      }
      const department = await queryRunner.manager.findOne(DepartmentEntity, {
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });

      if (!department) {
        throw new BadRequestException(`This data not exist in DB!!!`);
      }
      department.updatedAt = new Date();
      department.updatedBy = userPayload.id;
      department.name = UpdateDepartmentDto.name;
      department.note = UpdateDepartmentDto.note;

      const logInfo = UpdateDepartmentDto?.ipPayload;

      // Prepare Activity Log
      const log = {
        cLientIPAddress: logInfo.ip,
        browser: logInfo.browser,
        os: logInfo.os,
        userId: userPayload.id,
        // organizationId: userPayload.organizationId,
        messageDetails: {
          tag: "Designation",
          message: `Designation updated by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: UpdateDepartmentDto,
        organizationId: userPayload.organizationId
      };

      const data = await queryRunner.manager.update(
        DepartmentEntity,
        {
          id: id
        },
        department
      );

      if (data) {
        const qbinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
          where: {
            id: userPayload.organizationId
          }
        });
        console.log(qbinforamtion, "qbinfo");
        if (qbinforamtion.qbaccounts == 1) {
          if (await this.authservice.isauthenticated(userPayload, queryRunner)) {
            const qboobject = new QuickBooks(
              qbinforamtion.qbClientKey,
              qbinforamtion.qbClientSecret,
              qbinforamtion.accessToken,
              false, // no token secret for oAuth 2.0
              qbinforamtion.realmeID,
              true, // use the sandbox?
              true, // enable debugging?
              null, // set minorversion, or null for the latest version
              "2.0", //oAuth version
              qbinforamtion.refreshToken
            );
            // await qboobject.updateDepartment({
            //   FullyQualifiedName: department.name,
            //   Name: department.name,
            //   SyncToken: "1",
            //   Id: department.qbRefId,
            //   MetaData: {
            //     LastUpdatedTime: department.updatedAt
            //   },
            //   async function(err, Department) {
            //     if (err) {
            //       throw new BadRequestException(err);
            //     } else {
            //       // Save Activity Log
            //       //if (log) {
            //       //    await this.activityLogService.createLog(log, queryRunner);
            //       //}
            //       await queryRunner.commitTransaction();

            //       return `department updated successfully!!!`;
            //     }
            //   }
            // });
          }
          await queryRunner.commitTransaction();

          return `department updated successfully!!!`;
        } else {
          // Save Activity Log
          //if (log) {
          //    await this.activityLogService.createLog(log, queryRunner);
          //}
          await queryRunner.commitTransaction();

          return `department updated successfully!!!`;
        }
      }
      throw new BadRequestException(exceptionmessage);
    } catch (err) {
      console.log(err);

      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // find all designation
  async findAlldesignation(listQueryParam: PaginationOptionsInterface, keyword: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      // organizationId: userPayload.organizationId,
      messageDetails: {
        tag: "Designation",
        message: `All Designation fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: null,
      organizationId: userPayload.organizationId
    };

    const [results, total] = await this.designationRepository
      .createQueryBuilder("designation")
      .where(`designation.organizationId = ${userPayload.organizationId}`)
      .andWhere(
        new Brackets((qb) => {
          if (keyword) {
            qb.where(`designation.name LIKE ('%${keyword}%')`);
          }
        })
      )
      .orderBy("designation.id", "DESC")
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    // Save Activity Log
    if (log) {
      await this.activityLogService.createLogWithoutTransaction(log);
    }

    return new Pagination<any>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit
    });
  }

  // delete designation
  async deletedesignation(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    let exceptionmessage = "Failed";
    try {
      const designation = await this.designationRepository.findOne({
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
        // organizationId: userPayload.organizationId,
        messageDetails: {
          tag: "Designation",
          message: `Designation deleted by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: designation,
        organizationId: userPayload.organizationId
      };

      if (!designation) {
        exceptionmessage = `Designation not exist in db!!`;
        throw new NotFoundException(`Designation not exist in db!!`);
      }

      // Save Activity Log
      await this.activityLogService.createLog(log, queryRunner);

      let data = await queryRunner.manager.remove(DepartmentEntity, designation);
      await queryRunner.commitTransaction();
      return data;
    } catch (err) {
      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  /**
   * Get One designation
   */
  async findSingleDesignation(id: number, userPayload: UserInterface, ipClientPayload: any) {
    const data = await this.designationRepository.findOne({
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
      // organizationId: userPayload.organizationId,
      messageDetails: {
        tag: "Designation",
        message: `Single Designation fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: data,
      organizationId: userPayload.organizationId
    };
    if (!data) {
      throw new NotFoundException(`this designation not exist in db!!`);
    }

    // Save Activity Log
    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }

  async findOnedesignation(id: number) {
    const data = await this.designationRepository.findOne({
      where: {
        id: id
      }
    });

    if (!data) {
      throw new NotFoundException(`this designation not exist in db!!`);
    }
    return data;
  }
  /**
   * DROPDOWN -> designaiton
   */
  async dropdown(userPayload: UserInterface) {
    const alldesignations = await this.designationRepository.find({
      where: { status: StatusField.ACTIVE, organizationId: userPayload.organizationId },
      select: {
        id: true,
        name: true
      }
    });
    let designationdata = [];

    alldesignations.map((ledger) => {
      designationdata.push({ label: ledger.name, value: ledger.id });
    });

    return designationdata;
  }
}
