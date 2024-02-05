// HumanResource controller

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import * as path from "path";
import * as randomToken from "rand-token";
import { StatusField } from "src/authentication/common/enum";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { QuickBookService } from "src/modules/quickbooks/quickbook.service";
import { Brackets, DataSource, Not } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { CreateEmployeesDto, UpdateEmployeesDto } from "../dtos/human-resource/employees";
import { AccountingGroupEntity, BankAccountEntity, DepartmentEntity, EmployeesEntity, AccountsEntity, OrganizationEntity, TransactionHistoryEntity, UserEntity, UserTypeEntity } from "../entities";
import { AccountService } from "./account.service";
import { AccountingGroupService } from "./accounting-group.service";
import { ActivityLogService } from "./activity-log.service";
import { BankingService } from "./banking.service";
import { LedgersService } from "./ledgers.service";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";
import { query } from "express";
let exceptionmessage = "Failed";

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(EmployeesEntity)
    private employeesRepository: BaseRepository<EmployeesEntity>,
    @InjectRepository(UserEntity)
    private userRepository: BaseRepository<UserEntity>,
    @InjectRepository(TransactionHistoryEntity)
    private transactionHistoryRepository: BaseRepository<TransactionHistoryEntity>,
    @InjectRepository(AccountsEntity)
    private ledgerRepository: BaseRepository<AccountsEntity>,
    @InjectRepository(BankAccountEntity)
    private bankingRepository: BaseRepository<BankAccountEntity>,
    private activityLogService: ActivityLogService,
    private bankingService: BankingService,
    private quickBookService: QuickBookService,
    private readonly accountingGroupService: AccountingGroupService,
    private readonly ledgersService: LedgersService,
    private accountService: AccountService,
    private authservice: AuthService,
    private dataSource: DataSource
  ) {}

  //  create Employees
  async createEmployees(createEmployeesDto: CreateEmployeesDto, userPayload: UserInterface): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      const findName = await this.employeesRepository.findOne({
        where: {
          email: createEmployeesDto.email.trim(),
          organizationId: userPayload.organizationId
        }
      });
      if (findName) {
        exceptionmessage = "duplicate email found. please insert a unique one.";

        throw new BadRequestException(`duplicate email found. please insert a unique one.`);
      }

      let fileNameData;
      if (createEmployeesDto.file) {
        fileNameData = path.basename(createEmployeesDto.file.originalname, path.extname(createEmployeesDto.file.originalname));
      }

      const ledgerObj = new AccountsEntity();

      const logInfo = createEmployeesDto?.ipPayload;

      ledgerObj.createdAt = new Date();
      ledgerObj.updatedAt = new Date();
      ledgerObj.createdBy = userPayload.id;
      ledgerObj.organizationId = userPayload.organizationId;
      ledgerObj.updatedBy = 0;
      ledgerObj.deletedBy = 0;
      // finding account group data
      const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Direct Overhead" } });

      ledgerObj.fullyQualifiedName = createEmployeesDto.displayName;
      ledgerObj.name = createEmployeesDto.displayName;
      ledgerObj.ledgerParent = accountGroup.id;
      ledgerObj.nature = accountGroup.nature;
      ledgerObj.accountType = accountGroup.groupHeadType;
      ledgerObj.accountSubType = accountGroup.groupName;
      ledgerObj.classification = accountGroup.groupName;
      ledgerObj.ledgerCode = await this.accountService.generateBaseNumbers("Employee", userPayload);
      const findOrg = await queryRunner.manager.findOne(OrganizationEntity, {
        where: {
          id: userPayload.organizationId
        }
      });
      ledgerObj.organization = findOrg;
      ledgerObj.accountOpeningBalance = 0;
      ledgerObj.openingBalance = 0;
      ledgerObj.closingBalance = 0;

      const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

      // prepare ledger data

      if (saveLedger) {
        const employee = new EmployeesEntity();
        employee.createdAt = new Date();
        employee.updatedAt = new Date();
        employee.createdBy = userPayload.id;
        employee.organizationId = userPayload.organizationId;
        employee.updatedBy = 0;
        employee.deletedBy = 0;
        employee.displayName = createEmployeesDto.displayName;
        employee.printOnCheckName = createEmployeesDto.displayName;
        employee.familyName = createEmployeesDto.familyName;
        employee.givenName = createEmployeesDto.givenName;
        employee.ssn = createEmployeesDto.ssn;
        employee.billingrate = createEmployeesDto.billingrate;
        employee.ledgerId = ledgerObj.id;
        employee.createdBy = userPayload.id;
        employee.profileImgSrc = fileNameData ? fileNameData : null;
        employee.employeeCode = ledgerObj.ledgerCode;
        employee.mobile = createEmployeesDto.mobile;
        employee.gender = createEmployeesDto.gender;
        employee.primaryAddr = createEmployeesDto.primaryAddr;
        employee.dob = new Date(createEmployeesDto.dob);
        employee.email = createEmployeesDto.email;
        employee.hireDate = new Date(createEmployeesDto.hireDate);
        employee.releaseDate = createEmployeesDto.releaseDate;
        employee.paymentMethod = createEmployeesDto.paymentMethod;
        employee.totalSalary = createEmployeesDto.totalSalary;
        employee.organizationId = userPayload.organizationId;
        employee.ledger = ledgerObj;
        employee.organization = findOrg;

        // save employee data
        const insertData = await queryRunner.manager.save(EmployeesEntity, employee);
        if (insertData) {
          const qbinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
            where: {
              id: userPayload.organizationId
            }
          });
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

              await qboobject.createEmployee(
                {
                  GivenName: employee.givenName,
                  SSN: employee.ssn,
                  PrimaryAddr: {
                    Line1: employee.primaryAddr
                  },
                  PrimaryPhone: {
                    FreeFormNumber: employee.mobile
                  },
                  FamilyName: employee.familyName
                },
                async function (err, Employee) {
                  if (err) {
                    throw new BadRequestException(err);
                  } else {
                    employee.qbRefId = Employee.Id;

                    const insertData = await queryRunner.manager.update(EmployeesEntity, { id: employee.id }, employee);

                    // prepare log data
                    const log = {
                      cLientIPAddress: logInfo.ip,
                      browser: logInfo.browser,
                      os: logInfo.os,
                      userId: userPayload.id,
                      messageDetails: {
                        tag: "Employee",
                        message: `New Employee created by ${decrypt(userPayload.hashType)}`
                      },
                      logData: insertData,
                      organizationId: userPayload.organizationId
                    };
                    // save log
                    //if (log) {
                    //    await this.activityLogService.createLog(log, queryRunner);
                    //}

                    await queryRunner.commitTransaction();

                    return insertData;
                  }
                }
              );
            }
          } else {
            // prepare log data
            const log = {
              cLientIPAddress: logInfo.ip,
              browser: logInfo.browser,
              os: logInfo.os,
              userId: userPayload.id,
              messageDetails: {
                tag: "Employee",
                message: `New Employee created by ${decrypt(userPayload.hashType)}`
              },
              logData: insertData,
              organizationId: userPayload.organizationId
            };
            // save log
            //if (log) {
            //    await this.activityLogService.createLog(log, queryRunner);
            //}

            await queryRunner.commitTransaction();

            return insertData;
          }
        }
        //throw new BadRequestException(exceptionmessage);
      }
    } catch (err) {
      console.log(err);

      // if we have errors, rollback changes we made
      try {
        await queryRunner.rollbackTransaction();
      } catch {}
      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      //await queryRunner.release();
    }
    //#endregion End Transaction

    // if (decrypt(userPayload.hashType) != UserTypesEnum.USER) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
  }

  // update Employees
  async updateEmployees(updateEmployeesDto: UpdateEmployeesDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      const findName = await queryRunner.manager.findOne(EmployeesEntity, { where: { email: updateEmployeesDto.email, id: Not(id), organizationId: userPayload.organizationId } });

      if (findName) {
        throw new BadRequestException(`duplicate email found. please insert a unique one.`);
      }
      const data = await queryRunner.manager.findOne(EmployeesEntity, { where: { id: id, organizationId: userPayload.organizationId } });

      if (!data) {
        throw new BadRequestException(`This data not exist in DB!!!`);
      }
      data.updatedAt = new Date();
      data.updatedBy = userPayload.id;
      data.email = updateEmployeesDto.email;
      data.mobile = updateEmployeesDto.mobile;
      data.paymentMethod = updateEmployeesDto.paymentMethod;
      data.displayName = updateEmployeesDto.displayName;
      data.primaryAddr = updateEmployeesDto.primaryAddr;
      data.totalSalary = updateEmployeesDto.totalSalary;
      data.releaseDate = updateEmployeesDto.releaseDate;

      let fileNameData;
      if (updateEmployeesDto.file) {
        fileNameData = path.basename(updateEmployeesDto.file.originalname, path.extname(updateEmployeesDto.file.originalname));
      }
      data.profileImgSrc = fileNameData ? fileNameData : null;

      const logInfo = updateEmployeesDto?.ipPayload;

      const employeesData = await queryRunner.manager.update(EmployeesEntity, { id: id }, data);
      if (employeesData.affected == 1) {
        const ledgerObj = await queryRunner.manager.findOne(AccountsEntity, { where: { id: data.ledgerId, organizationId: userPayload.organizationId } });

        ledgerObj.fullyQualifiedName = updateEmployeesDto.displayName;
        ledgerObj.name = updateEmployeesDto.displayName;

        await queryRunner.manager.update(AccountsEntity, { id: ledgerObj.id }, ledgerObj);
      }
      const log = {
        cLientIPAddress: logInfo.ip,
        browser: logInfo.browser,
        os: logInfo.os,
        userId: userPayload.id,
        organizationId: userPayload.organizationId,
        messageDetails: {
          tag: "Employee",
          message: `Employee updated by ${decrypt(userPayload.hashType)}`
        },
        logData: updateEmployeesDto
      };

      if (employeesData) {
        if (log) {
          await this.activityLogService.createLog(log, queryRunner);
        }
        await queryRunner.commitTransaction();
        return `employeesData updated successfully!!!`;

        //const qbinforamtion = await queryRunner.manager.findOne(OrganizationEntity, {
        //    where: {
        //        id: userPayload.organizationId
        //    }
        //});
        //if (qbinforamtion.qbaccounts == 1) {
        //    if (await this.authservice.isauthenticated(userPayload)) {
        //        const qboobject = new QuickBooks(
        //            qbinforamtion.qbClientKey,
        //            qbinforamtion.qbClientSecret,
        //            qbinforamtion.accessToken,
        //            false, // no token secret for oAuth 2.0
        //            qbinforamtion.realmeID,
        //            true, // use the sandbox?
        //            true, // enable debugging?
        //            null, // set minorversion, or null for the latest version
        //            "2.0", //oAuth version
        //            qbinforamtion.refreshToken
        //        );
        //        await qboobject.updateEmployee({
        //            SyncToken: "0",
        //            DisplayName: data.displayName,
        //            PrimaryPhone: {
        //                FreeFormNumber: data.mobile
        //            },
        //            Id: data.qbRefId,
        //            MetaData: {
        //                LastUpdatedTime: new Date()
        //            },
        //            async function(err, Employee) {
        //                if (err) {
        //                    throw new BadRequestException(err);
        //                } else {
        //                    // Save Activity Log
        //                    if (log) {
        //                        await this.activityLogService.createLog(log, queryRunner);
        //                    }
        //                    await queryRunner.commitTransaction();

        //                    return `employeesData updated successfully!!!`;
        //                }
        //            }
        //        });
        //    }
        //}
        //else {

        //    if (log) {
        //        await this.activityLogService.createLog(log, queryRunner);
        //    }
        //    await queryRunner.commitTransaction();
        //    return `employeesData updated successfully!!!`;

        //}
      }
    } catch (err) {
      console.log(err);

      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`failed`);
    } finally {
      // release query runner which is manually created:
      //await queryRunner.release();
    }
    //#endregion End Transaction

    // if (data.affected === 0) {
    //   throw new BadRequestException(ErrorMessage.UPDATE_FAILED);
    // }
  }

  // find all employees data
  async findAllEmployeesData(listQueryParam: PaginationOptionsInterface, keyword: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;
    await this.authservice.refreshtoken(userPayload);

    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Employee",
        message: `All Employee fetched by ${decrypt(userPayload.hashType)}`
      },
      logData: null,
      organizationId: userPayload.organizationId
    };

    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();
    try {
      const [results, total] = await queryRunner.manager.findAndCount(EmployeesEntity, {
        where: { organizationId: userPayload.organizationId, status: StatusField.ACTIVE },
        select: { id: true, displayName: true, mobile: true, email: true, hireDate: true, totalSalary: true },
        take: limit,
        skip: page > 0 ? page * limit - limit : page
      });

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

    const [results, total] = await this.employeesRepository
      .createQueryBuilder("employees")
      .where(`employees.organizationId = ${userPayload.organizationId}`)
      .andWhere(
        new Brackets((qb) => {
          if (keyword) {
            qb.where(`employees.fullName LIKE ('%${keyword}%')`);
          }
        })
      )
      .select([`employees.id`, `employees.fullName`, `employees.mobile`, `employees.email`, `employees.joiningDate`])
      .orderBy("employees.id", "DESC")
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    await this.activityLogService.createLogWithoutTransaction(log);

    return new Pagination<any>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit
    });
  }

  // delete employees
  async deleteEmployees(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      let employeeinforamtion = await queryRunner.manager.findOne(EmployeesEntity, { where: { id: id, organizationId: userPayload.organizationId } });
      if (employeeinforamtion) {
        let trancount = await queryRunner.manager.find(TransactionHistoryEntity, { where: { ledgerId: employeeinforamtion.ledgerId } });

        if (trancount.length == 0) {
          var deleteopening = await queryRunner.manager.findOne(TransactionHistoryEntity, { where: { ledgerId: employeeinforamtion.ledgerId } });
          if (deleteopening != null) {
            await queryRunner.manager.remove(TransactionHistoryEntity, deleteopening);
          }

          var ledgers = await queryRunner.manager.findOne(AccountsEntity, { where: { id: employeeinforamtion.ledgerId } });
          console.log("ledgers: ", ledgers);

          if (ledgers != null) {
            await queryRunner.manager.remove(EmployeesEntity, employeeinforamtion);
            await queryRunner.manager.remove(AccountsEntity, ledgers);

            await queryRunner.commitTransaction();

            return "Delete";
          }
        } else {
          employeeinforamtion.status = "false";
          await queryRunner.manager.update(EmployeesEntity, { id: employeeinforamtion.id }, employeeinforamtion);

          var ledgers = await queryRunner.manager.findOne(AccountsEntity, { where: { id: employeeinforamtion.ledgerId } });
          if (ledgers != null) {
            ledgers.status = "false";
            await queryRunner.manager.update(AccountsEntity, { id: employeeinforamtion.ledgerId }, ledgers);

            await queryRunner.commitTransaction();

            return "Delete";
          }
        }
      }

      await queryRunner.rollbackTransaction();
      return "Deletion Failed";
    } catch (err) {
      console.log(err);

      // if we have errors, rollback changes we made
      try {
        await queryRunner.rollbackTransaction();
      } catch {}
      exceptionmessage = "Employee Can not be Delete, Please contact Administraor";

      throw new BadRequestException(exceptionmessage);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  /**
   * Get One employeesData
   */
  async findSingleEmployeesData(id: number, userPayload: UserInterface, ipClientPayload: any) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    const data = await queryRunner.manager.findOne(EmployeesEntity, { where: { id: id, organizationId: userPayload.organizationId } });

    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Employee",
        message: `Single Employee fetched by ${decrypt(userPayload.hashType)}`
      },
      logData: data,
      organizationId: userPayload.organizationId
    };

    if (!data) {
      throw new NotFoundException(`employeesData not exist in db!!`);
    }

    await this.activityLogService.createLogWithoutTransaction(log);

    return data;
  }

  /**
   * Get One employeesData
   */
  async findOneEmployeesData(id: number) {
    const data = await this.employeesRepository.findOne({
      where: {
        id: id
      }
    });

    if (!data) {
      throw new NotFoundException(`employeesData not exist in db!!`);
    }

    return data;
  }

  /**
   * DROPDOWN -> employee
   */
  async dropdown(userPayload: UserInterface) {
    return await this.employeesRepository
      .createQueryBuilder("employee")
      .where(`employee.status = '${StatusField.ACTIVE}'`)
      .andWhere(`employee.organizationId = ${userPayload.organizationId}`)
      .leftJoinAndMapOne("employee.ledger", AccountsEntity, "ledger", "employee.ledgerId = ledger.id")
      .select(["employee.ledgerId as value", "ledger.Name as label"])
      .getRawMany();
  }
  /**
   * employee
   */
  async getEmployeeSalaryById(id: number, userPayload: UserInterface) {
    const data = await this.employeesRepository.findOne({
      where: {
        ledgerId: id,
        organizationId: userPayload.organizationId
      }
    });
    //console.log(data);
    return data.totalSalary;
  }
}
