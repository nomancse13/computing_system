import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ErrorMessage, StatusField } from "src/authentication/common/enum";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { Brackets, DataSource } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { CreateAccountingGroupDto, UpdateAccountingGroupDto } from "../dtos/account/accounting-group";
import { AccountingGroupEntity, AccountsEntity } from "../entities";

import { ActivityLogService } from "./activity-log.service";

@Injectable()
export class AccountingGroupService {
  constructor(
    @InjectRepository(AccountingGroupEntity)
    private accountingGroupRepository: BaseRepository<AccountingGroupEntity>,
    @InjectRepository(AccountsEntity)
    private AccountsEntity: BaseRepository<AccountsEntity>,

    private activityLogService: ActivityLogService,
    private dataSource: DataSource
  ) {}

  //  create group
  async createAccGroup(
    createAccountingGroupDto: CreateAccountingGroupDto,

    userPayload: UserInterface
  ): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      const accountGroup = await this.findOneGroup(createAccountingGroupDto.groupParentId);

      createAccountingGroupDto["createdBy"] = userPayload.id;

      const findChild = await this.countChild(accountGroup.id);

      const array = accountGroup.groupIdentifier.split(".");

      const findingIndex = array.indexOf("0");

      array[findingIndex] = String(findChild + 1);

      const updatedArray = array.join(".");
      let accountgroup = new AccountingGroupEntity();
      accountgroup.createdAt = new Date();
      accountgroup.updatedAt = new Date();
      accountgroup.createdBy = userPayload.id;
      accountgroup.organizationId = userPayload.organizationId;
      accountgroup.updatedBy = 0;
      accountgroup.deletedBy = 0;
      accountgroup.groupName = createAccountingGroupDto.groupName;
      accountgroup.groupParent = createAccountingGroupDto.groupParentId;
      accountgroup.groupIdentifier = updatedArray;
      accountgroup.groupType = accountGroup.groupType;
      accountgroup.nature = accountGroup.nature;
      accountgroup.postedTo = accountGroup.postedTo;
      accountgroup.groupHeadType = accountGroup.groupHeadType;

      const logInfo = createAccountingGroupDto?.ipPayload;

      delete createAccountingGroupDto.ipPayload;

      const insertData = await queryRunner.manager.save(AccountingGroupEntity, accountgroup);

      // Prepare Activity Log
      const log = {
        cLientIPAddress: logInfo.ip,
        browser: logInfo.browser,
        os: logInfo.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Account-Head",
          message: `New Account-Head created by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: accountgroup,
        organizationId: userPayload.organizationId
      };

      // Save Activity Log
      if (log) {
        await this.activityLogService.createLog(log, queryRunner);
      }

      await queryRunner.commitTransaction();
      return insertData;
    } catch (err) {
      console.log(err);
      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`failed`);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // count child
  async countChild(parentId: number) {
    const countChild = await this.accountingGroupRepository.createQueryBuilder("child").where(`child.groupParent = ${parentId}`).getCount();

    return countChild ? countChild : 0;
  }

  // update group
  async updateAccGroup(updateAccountingGroupDto: UpdateAccountingGroupDto, userPayload: UserInterface, id: number) {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      const group = await queryRunner.manager.find(AccountingGroupEntity, {
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });

      if (!group) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException(`This data not exist in DB!!!`);
      }
      updateAccountingGroupDto["updatedAt"] = new Date();
      updateAccountingGroupDto["updatedBy"] = userPayload.id;

      const logInfo = updateAccountingGroupDto?.ipPayload;

      delete updateAccountingGroupDto.ipPayload;

      // Prepare Activity Log
      const log = {
        cLientIPAddress: logInfo.ip,
        browser: logInfo.browser,
        os: logInfo.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Designation",
          message: `Designation updated by ${decrypt(userPayload.hashType)}`,
          date: new Date()
        },
        logData: updateAccountingGroupDto,
        organizationId: userPayload.organizationId
      };

      const data = await queryRunner.manager.update(
        AccountingGroupEntity,
        {
          id: id
        },
        updateAccountingGroupDto
      );

      // Save Activity Log
      if (log) {
        await this.activityLogService.createLog(log, queryRunner);
      }

      await queryRunner.commitTransaction();

      return `group updated successfully!!!`;
    } catch (err) {
      console.log(err);

      // if we have errors, rollback changes we made
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(ErrorMessage.UPDATE_FAILED);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  // find all group
  async findAllGroup(listQueryParam: PaginationOptionsInterface, filter: any, ipClientPayload: any, userPayload: UserInterface) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

    // Prepare Activity Log
    const log = {
      cLientIPAddress: ipClientPayload.ip,
      browser: ipClientPayload.browser,
      os: ipClientPayload.os,
      userId: userPayload.id,
      messageDetails: {
        tag: "Designation",
        message: `All Designation fetched by ${decrypt(userPayload.hashType)}`,
        date: new Date()
      },
      logData: null,
      organizationId: userPayload.organizationId
    };

    const [results, total] = await this.accountingGroupRepository
      .createQueryBuilder("group")
      .where(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`group.groupName LIKE ('%${filter}%')`);
          }
        })
      )
      .orWhere(`group.organizationId = null`)
      .andWhere(`group.organizationId = ${userPayload.organizationId}`)
      .orderBy("group.id", "DESC")
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

  // delete group
  async deleteGroup(id: number, userPayload: UserInterface, ipClientPayload: any): Promise<any> {
    //#region Start Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    // a new transaction:
    await queryRunner.startTransaction();

    try {
      const group = await queryRunner.manager.find(AccountingGroupEntity, {
        where: {
          id: id,
          organizationId: userPayload.organizationId
        }
      });

      let data = await queryRunner.manager.remove(AccountingGroupEntity, group);
      const log = {
        cLientIPAddress: ipClientPayload.ip,
        browser: ipClientPayload.browser,
        os: ipClientPayload.os,
        userId: userPayload.id,
        messageDetails: {
          tag: "Account Group",
          message: `Account Group deleted by ${decrypt(userPayload.hashType)}`
        },
        logData: group,
        organizationId: userPayload.organizationId
      };

      if (!group) {
        await queryRunner.rollbackTransaction();
        throw new NotFoundException("group not found");
      }

      await this.activityLogService.createLog(log, queryRunner);

      await queryRunner.commitTransaction();
      return data;
    } catch (err) {
      // if we have errors, rollback changes we made
      try {
        await queryRunner.rollbackTransaction();
      } catch {}
      throw new BadRequestException(`this group not found. can not deleted`);
    } finally {
      // release query runner which is manually created:
      await queryRunner.release();
    }
    //#endregion End Transaction
  }

  /**
   * Get One group
   */
  async findSingleGroup(id: number, userPayload: UserInterface) {
    const data = await this.accountingGroupRepository.findOne({
      where: {
        id: id,
        organizationId: userPayload.organizationId
      }
    });
    if (!data) {
      throw new NotFoundException(`this accounting group not exist in db!!`);
    }
    return data;
  }

  /**
   * Get One group
   */
  async findOneGroup(id: number) {
    const data = await this.accountingGroupRepository.findOne({
      where: {
        id: id
      }
    });
    if (!data) {
      throw new NotFoundException(`this accounting group not exist in db!!`);
    }
    return data;
  }
  // existing group check
  async isAccountGroupsExist(name: string) {
    const accGroup = await this.accountingGroupRepository.createQueryBuilder("group").where(`group.groupName LIKE ('%${name}%')`).getOne();

    if (!accGroup) {
      throw new NotFoundException(`this accounting group not exist in db!!`);
    }
    return accGroup;
  }

  /**
   * DROPDOWN -> account group
   */
  async dropdownGroup(userPayload: UserInterface) {
    return await this.accountingGroupRepository
      .createQueryBuilder("group")
      .where(`group.status = '${StatusField.ACTIVE}'`)
      .orWhere(`group.organizationId = null`)
      .andWhere(`group.organizationId = ${userPayload.organizationId}`)
      .select(["group.id as value", "group.groupName as label"])
      .getRawMany();
  }

  /**
   * DROPDOWN -> account Expense
   */
  async dropdownExpense(userPayload: UserInterface) {
    const result = await this.accountingGroupRepository.find({ where: { groupHeadType: "Expense", status: StatusField.ACTIVE } });
    let expensedropdowndata = [];
    //console.log(result);
    const allledgers = await this.AccountsEntity.find({ where: { status: StatusField.ACTIVE, organizationId: userPayload.organizationId } });
    await Promise.all(
      result.map(async (element) => {
        let singleallledgers = allledgers.filter((a) => a.ledgerParent == element.id);
        singleallledgers.map((ledger) => {
          expensedropdowndata.push({ label: ledger.name, value: ledger.id });
        });
      })
    );
    return expensedropdowndata;
  }
}
