import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "src/authentication/auth/auth.module";
import { ActivityLogController } from "../controllers/activity-log.controller";
import { ModuleController } from "../controllers/module.controller";
import { UserTypeController } from "../controllers/user-type.controller";
import { ActivityLogEntity, LoginHistoryEntity, ModuleEntity, PermissionEntity } from "../entities";
import { UserTypeEntity } from "../entities/user-type.entity";
import { ActivityLogService } from "../services/activity-log.service";
import { ModuleService } from "../services/module.service";
import { UserTypeService } from "../services/user-type.service";
import { UserModule } from "./user.module";

/**Module */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModuleEntity,
      PermissionEntity,
      ActivityLogEntity,
      LoginHistoryEntity,
      UserTypeEntity
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule)
  ],
  controllers: [
    ModuleController,
    ActivityLogController,
    UserTypeController
  ],
  providers: [
    ModuleService,
    ActivityLogService,
    UserTypeService
  ],
  exports: [
    ModuleService,
    ActivityLogService,
    UserTypeService
  ]
})
export class AdministratorModule {}
