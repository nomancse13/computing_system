import {
    BadRequestException,
    Inject,
    Injectable,
    forwardRef
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
    Pagination,
    PaginationOptionsInterface,
    UserInterface
} from "src/authentication/common/interfaces";
import { Brackets, DataSource, QueryRunner } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { AuthService } from "../authentication/auth/auth.service";
import {
    CreateActivityLogDto,
    CreateLoginHistoryDto
} from "../dtos/administrator/activity-log";
import { ActivityLogEntity, LoginHistoryEntity } from "../entities";

@Injectable()
export class ActivityLogService {
    constructor(
        @InjectRepository(ActivityLogEntity)
        private activityLogRepository: BaseRepository<ActivityLogEntity>,
        @InjectRepository(LoginHistoryEntity)
        private loginRepository: BaseRepository<LoginHistoryEntity>,
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
        private dataSource: DataSource
    ) { }

    //  create log
    async createLog(createActivityLogDto: CreateActivityLogDto, queryRunner: QueryRunner): Promise<any> {
      
        createActivityLogDto["createdAt"] = new Date();
        createActivityLogDto["updatedAt"] = new Date();
        createActivityLogDto["createdBy"] = createActivityLogDto.userId;
        createActivityLogDto["organizationId"] = createActivityLogDto.organizationId? createActivityLogDto.organizationId: null;
        createActivityLogDto["updatedBy"] = 0;
        createActivityLogDto["deletedBy"] = 0;

        const userData = await this.authService.userById(
            createActivityLogDto.userId
        );
        createActivityLogDto['user'] = userData;
        const insertData = await queryRunner.manager.save(ActivityLogEntity,createActivityLogDto);

        return insertData;
    } 
    async createLogWithoutTransaction(createActivityLogDto: CreateActivityLogDto): Promise<any> {
      
       
        createActivityLogDto["createdAt"] = new Date();
        createActivityLogDto["updatedAt"] = new Date();
        createActivityLogDto["createdBy"] = createActivityLogDto.userId;
        createActivityLogDto["organizationId"] = createActivityLogDto.organizationId? createActivityLogDto.organizationId: null;
        createActivityLogDto["updatedBy"] = 0;
        createActivityLogDto["deletedBy"] = 0;

        const userData = await this.authService.userById(
            createActivityLogDto.userId
        );
        createActivityLogDto['user'] = userData;
        const insertData = await this.activityLogRepository.save(createActivityLogDto);

        return insertData;
    }

    // find all log
    async findAllLog(
        listQueryParam: PaginationOptionsInterface,
        filter: any,
        userPayload: UserInterface
    ) {
        const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
        const page: number = listQueryParam.page
            ? +listQueryParam.page == 1
                ? 0
                : listQueryParam.page
            : 1;

        const [results, total] = await this.activityLogRepository
            .createQueryBuilder("log")
            .leftJoinAndSelect("log.user", "user")
            .where(`log.organizationId = ${userPayload.organizationId}`)
            .andWhere(
                new Brackets((qb) => {
                    if (filter) {
                        qb.where(`user.email LIKE ('%${filter}%')`);
                    }
                })
            )
            .select([
                `log.id`,
                `log.cLientIPAddress`,
                `log.browser`,
                `log.os`,
                `log.messageDetails`,
                `user.fullName`,
                `user.email`
            ])
            .orderBy("log.id", "DESC")
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

    //  create login history
    async createLoginHistory(
        createLoginHistoryDto: CreateLoginHistoryDto
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

        
        createLoginHistoryDto["createdAt"] = new Date();
        createLoginHistoryDto["updatedAt"] = new Date();
        createLoginHistoryDto["createdBy"] = createLoginHistoryDto.userId;
        createLoginHistoryDto["organizationId"] = createLoginHistoryDto.organizationId ? createLoginHistoryDto.organizationId: null;
        createLoginHistoryDto["updatedBy"] = 0;
        createLoginHistoryDto["deletedBy"] = 0;

        const userData = await this.authService.userById(
            createLoginHistoryDto.userId
        );
        const insertData = await this.loginRepository.save(createLoginHistoryDto);

        insertData.user = userData;

        const savedLogin = await this.loginRepository.save(insertData);

        return savedLogin;
    }

    // find all login history
    async findAllLoginHistory(
        listQueryParam: PaginationOptionsInterface,
        filter: any, 
        userPayload: UserInterface 
    ) {
        const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
        const page: number = listQueryParam.page
            ? +listQueryParam.page == 1
                ? 0
                : listQueryParam.page
            : 1;

        const [results, total] = await this.loginRepository
            .createQueryBuilder("login")
            .leftJoinAndSelect("login.user", "user")
            .where(`login.organizationId = ${userPayload.organizationId}`)
            .andWhere(
                new Brackets((qb) => {
                    if (filter) {
                        qb.where(`user.email LIKE ('%${filter}%')`);
                    }
                })
            )
            
            .select([
                `login.id`,
                `login.cLientIPAddress`,
                `login.browser`,
                `login.os`,
                `login.loginTime`,
                `user.fullName`,
                `user.email`
            ])
            .orderBy("login.id", "DESC")
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
}
