import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BankAccountEntity, DepartmentEntity, AccountsEntity, TransactionHistoryEntity } from "../entities";
import { DesignationService } from "../services/designation.service";
import { DesignationController } from "../controllers/designation.controller";
import { EmployeesEntity } from "../entities";
import { EmployeeController } from "../controllers/employee.controller";
import { EmployeeService } from "../services/employee.service";
import { SalaryEntity } from "../entities";
import { SalaryController } from "../controllers/salary.controller";
import { SalaryService } from "../services/salary.service";
import { UserModule } from "./user.module";
import { AdministratorModule } from "./administrator.module";
import { QuickBooksModule } from "src/modules/quickbooks/quickbook.module";
import { AccountModule } from "./account.module";
import { UserEntity } from "../entities";
import { AuthModule } from "../authentication/auth/auth.module";

/**Module */
@Module({
    imports: [
        TypeOrmModule.forFeature([
            DepartmentEntity,
            EmployeesEntity,
            SalaryEntity,
            UserEntity,
            TransactionHistoryEntity,
            AccountsEntity,
            BankAccountEntity
        ]),
        forwardRef(() => UserModule),
        AdministratorModule,
        QuickBooksModule,
        AccountModule,
        AuthModule
    ],
    controllers: [DesignationController, EmployeeController, SalaryController],
    providers: [DesignationService, EmployeeService, SalaryService],
    exports: [DesignationService, EmployeeService, SalaryService]
})
export class HumanResourceModule { }
