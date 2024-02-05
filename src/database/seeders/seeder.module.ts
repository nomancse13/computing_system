/**dependencies */
import { Module } from "@nestjs/common";

import { SeederService } from "./seeder.service";
import { SeederController } from "src/controllers/seeder.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountingGroupEntity, AccountsEntity, OrganizationEntity, UserEntity, UserTypeEntity } from "src/entities";
/**controllers */
/**Authentication strategies */
@Module({
    imports: [
      TypeOrmModule.forFeature([
        AccountingGroupEntity,
        UserEntity,
        UserTypeEntity,
        AccountsEntity,
        OrganizationEntity
    ]),
  ],
  controllers: [
    SeederController,
    
  ],
  providers: [
    SeederService,
    
  ],
})
export class SeederModule {}
