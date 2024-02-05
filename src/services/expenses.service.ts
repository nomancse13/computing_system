// purchase controller

import {
    BadRequestException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as path from "path";
import {
    Pagination,
    PaginationOptionsInterface,
    UserInterface
} from "src/authentication/common/interfaces";
import { decrypt } from "src/helper/crypto.helper";
import { DataSource } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { StatusField } from "../authentication/common/enum";
import {
    CreateExpensesDto,
    UpdateExpensesDto
} from "../dtos/payables/expenses";
import { ExpensesEntity, AccountsEntity, TransactionHistoryEntity } from "../entities";
import { AccountService } from "./account.service";
import { ActivityLogService } from "./activity-log.service";
import { LedgersService } from "./ledgers.service";
import * as QuickBooks from "node-quickbooks";
import { AuthService } from "../authentication/auth/auth.service";
let exceptionmessage = 'Failed';

@Injectable()
export class ExpensesService {
    constructor(
        @InjectRepository(ExpensesEntity)
        private expensesRepository: BaseRepository<ExpensesEntity>,
        @InjectRepository(TransactionHistoryEntity)
        private transactionHistoryRepository: BaseRepository<TransactionHistoryEntity>,
        private readonly accountService: AccountService,
        private readonly ledgersService: LedgersService,
        private activityLogService: ActivityLogService,
        private dataSource: DataSource,
        private authservice: AuthService,
    ) { }

    //  create expense
    async createExpense(
        createExpensesDto: CreateExpensesDto,
        userPayload: UserInterface
    ): Promise<any> {
       
        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();

        try {
            if (createExpensesDto.creditLedgerId != 0 && createExpensesDto.debitLedgerId != 0 && createExpensesDto.expenseAmount != 0) {
                var TransactionID = await this.accountService.genderateTenDigitUniqueTransactionCode(new Date(createExpensesDto.expenseDate), userPayload);

                const debitLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createExpensesDto.debitLedgerId, organizationId: userPayload.organizationId } });
                const creditLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: createExpensesDto.creditLedgerId, organizationId: userPayload.organizationId } });

                const createentry = new ExpensesEntity();
                createentry.expenseNo = await this.accountService.generateAllNumbersbasedonDate("Expense", new Date(createExpensesDto.expenseDate), userPayload);
                createentry.debitLedgerId = createExpensesDto.debitLedgerId;
                createentry.debitLedger = debitLedger;
                createentry.creditLedgerId = createExpensesDto.creditLedgerId;
                createentry.creditLedger = creditLedger;
                createentry.transactionId = TransactionID;
                createentry.expenseDate = new Date(createExpensesDto.expenseDate);
                createentry.status = StatusField.ACTIVE;
                createentry.reference = createExpensesDto.reference;
                createentry.comment = createExpensesDto.comment;
                createentry.expenseAmount = createExpensesDto.expenseAmount;
                let fileNameData;
                if (createExpensesDto.file) {
                    fileNameData = path.basename(
                        createExpensesDto.file.originalname,
                        path.extname(createExpensesDto.file.originalname)
                    );
                }
                createentry.refDoc = fileNameData ? fileNameData : null;
                createentry.createdAt = new Date();
                createentry.updatedAt = new Date();
                createentry.createdBy = userPayload.id;
                createentry.organizationId = userPayload.organizationId;
                createentry.updatedBy = 0;
                createentry.deletedBy = 0;
                await queryRunner.manager.save(ExpensesEntity, createentry);

                console.log('createentry: ', createentry);

                const logInfo = createExpensesDto?.ipPayload;

                const log = {
                    cLientIPAddress: logInfo.ip,
                    browser: logInfo.browser,
                    os: logInfo.os,
                    userId: logInfo.id,
                    messageDetails: {
                        tag: "Expenses",
                        message: `Expenses created by ${decrypt(userPayload.hashType)}`
                    },
                    logData: createExpensesDto,
                    organizationId: userPayload.organizationId
                };

                // save log
                if (log) {
                    await this.activityLogService.createLog(log, queryRunner);
                }


                if (createentry.id > 0) {

                    //#region Accounts
                    const body = {
                        debitLedgerId: createentry.debitLedgerId,
                        creditLedgerId: createentry.creditLedgerId,
                        transactionDate: createentry.expenseDate,
                        debitAmount: createentry.expenseAmount,
                        creditAmount: createentry.expenseAmount,
                        referenceId: createentry.id,
                        transactionId: createentry.transactionId,
                        transactionSource: "Expense",
                        userId: userPayload.id,
                        remarks:
                            "Expense- " +
                            createentry.expenseAmount +
                            "-" +
                            createentry.reference,
                        transactionReference: createentry.expenseNo,
                        organizationId: userPayload.organizationId,
                    };
                  
                    const transaction = await this.accountService.addTransaction(body, queryRunner);
                   
                    if (transaction) {
                        //{
                        //    "PaymentType": "CreditCard",
                        //        "AccountRef": {
                        //        "name": "Visa",
                        //            "value": "42"
                        //    },
                        //    "Line": [
                        //        {
                        //            "DetailType": "AccountBasedExpenseLineDetail",
                        //            "Amount": 10.0,
                        //            "AccountBasedExpenseLineDetail": {
                        //                "AccountRef": {
                        //                    "name": "Meals and Entertainment",
                        //                    "value": "13"
                        //                },
                        //                "ProjectRef": {
                        //                    "value": "42991284"
                        //                }
                        //            }
                        //        }
                        //    ]
                        //}
                        await queryRunner.commitTransaction();
                        
                        return `insert successfully!!`;
                    }
                    else {
                        exceptionmessage = `Transaction filed!!`;

                        await queryRunner.rollbackTransaction();
                        //return `insert filed!!`;
                        throw new BadRequestException(`Transaction filed!!`);
                    }
                    //#endregion
                }
                exceptionmessage = `failed.`;

                throw new BadRequestException(
                    `duplicate invoice found. please insert a unique one.`
                );
            }
        } catch (err) {
            // if we have errors, rollback changes we made
            try {
                await queryRunner.rollbackTransaction()
            }
            catch {

            }
            throw new BadRequestException(exceptionmessage);

        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
        //#endregion End Transaction

    }

    // update expenses
    async updateExpenses(
        updateExpensesDto: UpdateExpensesDto,
        userPayload: UserInterface,
        id: number
    ) {
        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();

        try {
            if (updateExpensesDto.creditLedgerId != 0 && updateExpensesDto.debitLedgerId != 0 && updateExpensesDto.expenseAmount != 0) {
                var inforamtion = await queryRunner.manager.findOne(ExpensesEntity, { where: { id: id, organizationId: userPayload.organizationId } })
                if (inforamtion != null) {
                    var createentry = await queryRunner.manager.findOne(ExpensesEntity, { where: { id: id, organizationId: userPayload.organizationId } })

                    if (createentry != null) {

                        createentry.debitLedgerId = updateExpensesDto.debitLedgerId;
                        createentry.creditLedgerId = updateExpensesDto.creditLedgerId;
                        const debitLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: updateExpensesDto.debitLedgerId, organizationId: userPayload.organizationId } });
                        const creditLedger = await queryRunner.manager.findOne(AccountsEntity, { where: { id: updateExpensesDto.creditLedgerId, organizationId: userPayload.organizationId } });

                        createentry.debitLedger = debitLedger;
                        createentry.creditLedger = creditLedger;

                        createentry.expenseDate = new Date(updateExpensesDto.expenseDate);
                        createentry.reference = updateExpensesDto.reference;
                        createentry.comment = updateExpensesDto.comment;
                        createentry.expenseAmount = updateExpensesDto.expenseAmount;

                        createentry.updatedAt = new Date();
                        createentry.updatedBy = userPayload.id;


                        await queryRunner.manager.update(ExpensesEntity, { id: id }, createentry);
                        let checkothers = false;

                        let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, { where: { transactionId: inforamtion.transactionId, referenceID: inforamtion.id } })

                        if (transactioninforamtion.length != 0 && (inforamtion.expenseAmount != createentry.expenseAmount || inforamtion.comment != createentry.comment || inforamtion.reference != createentry.reference)) {

                            let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");
                            let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");

                            
                            //#region Accounts


                            const body = {
                                debitTransactionId: debittransaction.id,
                                creditTransactionId: credittransaction.id,
                                transactionDate: updateExpensesDto.expenseDate,
                                debitAmount: updateExpensesDto.expenseAmount,
                                creditAmount: updateExpensesDto.expenseAmount,
                                userId: userPayload.id,
                                remarks:
                                    "@ " +
                                    updateExpensesDto.comment +
                                    "-" +
                                    updateExpensesDto.reference,
                                transactionReference: inforamtion.expenseNo
                            };

                            let transaction = await this.accountService.UpdateTransactions(body, queryRunner);

                            if (transaction) {
                                checkothers = true;

                            }

                            //#endregion
                        }

                        if (inforamtion.debitLedgerId != createentry.debitLedgerId && inforamtion.creditLedgerId != createentry.creditLedgerId) {
                            let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");

                            //#region Accounts Debit Ledger Transactions

                            let bodydebit = {
                                trnasactionId: debittransaction.id,
                                trnasacitonDate: createentry.expenseDate,
                                ledgerId: createentry.debitLedgerId,
                                newAmount: createentry.expenseAmount,
                                userId: userPayload.id,
                                organizationId: userPayload.organizationId
                            };



                            let transaction = await this.accountService.UpdateDebitLedgerTransactions(bodydebit, queryRunner);

                            if (transaction) {
                                let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");

                                //#region Accounts Credit Ledger Transactions
                                let bodycredit = {
                                    trnasactionId: credittransaction.id,
                                    trnasacitonDate: createentry.expenseDate,
                                    ledgerId: createentry.creditLedgerId,
                                    newAmount: createentry.expenseAmount,
                                    userId: userPayload.id,
                                    organizationId: userPayload.organizationId
                                };

                                let transaction1 = await this.accountService.UpdateCreditLedgerTransactions(bodycredit, queryRunner);

                                if (transaction1) {
                                    await queryRunner.commitTransaction();
                                    return "Update";
                                }
                                checkothers = false;
                                //#endregion
                            }

                            //#endregion

                        }
                        else if (inforamtion.debitLedgerId != createentry.debitLedgerId && inforamtion.creditLedgerId == createentry.creditLedgerId) {

                            let debittransaction = transactioninforamtion.find((a) => a.transactionType == "Dr");

                            //#region Accounts Debit Ledger Transactions
                            let bodydebit = {
                                trnasactionId: debittransaction.id,
                                trnasacitonDate: createentry.expenseDate,
                                ledgerId: createentry.debitLedgerId,
                                newAmount: createentry.expenseAmount,
                                userId: userPayload.id,
                                organizationId: userPayload.organizationId
                            };


                            let transaction = await this.accountService.UpdateDebitLedgerTransactions(bodydebit, queryRunner);
                            if (transaction) {
                                await queryRunner.commitTransaction();
                                return "Update";
                            }
                            checkothers = false;
                            //#endregion

                        }
                        else if (inforamtion.debitLedgerId == createentry.debitLedgerId && inforamtion.creditLedgerId != createentry.creditLedgerId) {

                            let credittransaction = transactioninforamtion.find((a) => a.transactionType == "Cr");

                            //#region Accounts Credit Ledger Transactions
                            let bodycredit = {
                                trnasactionId: credittransaction.id,
                                trnasacitonDate: createentry.expenseDate,
                                ledgerId: createentry.creditLedgerId,
                                newAmount: createentry.expenseAmount,
                                userId: userPayload.id,
                                organizationId: userPayload.organizationId
                            };

                            let transaction = await this.accountService.UpdateCreditLedgerTransactions(bodycredit, queryRunner);

                            if (transaction) {
                                await queryRunner.commitTransaction();
                                return "Update";
                            }
                            checkothers = false;
                            //#endregion
                        }

                        if (checkothers) {
                            //{
                            //    "SyncToken": "1",
                            //        "domain": "QBO",
                            //            "PurchaseEx": {
                            //        "any": [
                            //            {
                            //                "name": "{http://schema.intuit.com/finance/v3}NameValue",
                            //                "nil": false,
                            //                "value": {
                            //                    "Name": "TxnType",
                            //                    "Value": "54"
                            //                },
                            //                "declaredType": "com.intuit.schema.finance.v3.NameValue",
                            //                "scope": "javax.xml.bind.JAXBElement$GlobalScope",
                            //                "globalScope": true,
                            //                "typeSubstituted": false
                            //            }
                            //        ]
                            //    },
                            //    "TxnDate": "2015-07-27",
                            //        "TotalAmt": 10.0,
                            //            "PrivateNote": "Added an updated private note via update.",
                            //                "PaymentType": "Cash",
                            //                    "sparse": false,
                            //                        "Line": [
                            //                            {
                            //                                "DetailType": "AccountBasedExpenseLineDetail",
                            //                                "Amount": 10.0,
                            //                                "ProjectRef": {
                            //                                    "value": "42991284"
                            //                                },
                            //                                "Id": "1",
                            //                                "AccountBasedExpenseLineDetail": {
                            //                                    "TaxCodeRef": {
                            //                                        "value": "NON"
                            //                                    },
                            //                                    "AccountRef": {
                            //                                        "name": "Meals and Entertainment",
                            //                                        "value": "13"
                            //                                    },
                            //                                    "BillableStatus": "NotBillable"
                            //                                }
                            //                            }
                            //                        ],
                            //                            "AccountRef": {
                            //        "name": "Checking",
                            //            "value": "35"
                            //    },
                            //    "CustomField": [],
                            //        "Id": "252",
                            //            "MetaData": {
                            //        "CreateTime": "2015-07-27T10:37:26-07:00",
                            //            "LastUpdatedTime": "2015-07-27T10:42:11-07:00"
                            //    }
                            //}

                            await queryRunner.commitTransaction();
                            return "Update";

                        }

                    }
                }
                await queryRunner.rollbackTransaction();
                return "Failed";
            }

        } catch (err) {
            // if we have errors, rollback changes we made
            try {
                await queryRunner.rollbackTransaction();
            }
            catch {

            }
            throw new BadRequestException(exceptionmessage);

        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
        //#endregion End Transaction

    }

    // find all expenses Data
    async findAllExpensesData(
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
                tag: "Expenses",
                message: `All Expenses fetched by ${decrypt(userPayload.hashType)}`,
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
            const [results, total] = await queryRunner.manager.findAndCount(ExpensesEntity, {
                where: { organizationId: userPayload.organizationId },
                relations: ['debitLedger','creditLedger'],
                order: { id: "DESC" },
                take: limit,
                skip: page > 0 ? page * limit - limit : page
            })

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

    // delete expenses
    async deleteExpenses(
        id: number,
        userPayload: UserInterface,
        ipClientPayload: any
    ): Promise<any> {

        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();

        try {
            let inforamtion = await queryRunner.manager.findOne(ExpensesEntity, { where: { id: id } })
            if (inforamtion != null) {
                let transactioninforamtion = await queryRunner.manager.find(TransactionHistoryEntity, { where: { transactionId: inforamtion.transactionId, referenceID: inforamtion.id } });
                if (transactioninforamtion.length != 0) {
                   
                    let debittransaction = transactioninforamtion.find(a => a.transactionType == "Dr");
                    let credittransaction = transactioninforamtion.find(a => a.transactionType == "Cr");

                    let stockBody = {
                        debitTransactionId: debittransaction.id,
                        creditTransactionId: credittransaction.id,
                        userId: userPayload.id
                    };
                    let deletetransaction = await this.accountService.DeleteTransactions(stockBody, queryRunner);
                    if (deletetransaction) {
                        await queryRunner.manager.remove(ExpensesEntity, inforamtion);


                        const log = {
                            cLientIPAddress: ipClientPayload.ip,
                            browser: ipClientPayload.browser,
                            os: ipClientPayload.os,
                            userId: userPayload.id,
                            messageDetails: {
                                tag: "Expenses",
                                message: `Expenses deleted by ${decrypt(userPayload.hashType)}`
                            },
                            logData: null,
                            organizationId: userPayload.organizationId
                        };
                        await this.activityLogService.createLog(log, queryRunner);

                        //{
                        //    "SyncToken": "2",
                        //        "Id": "595"
                        //}

                        await queryRunner.commitTransaction();
                        return "Deleted";
                    }
                }
            }
            exceptionmessage = "Expense not found";
            throw new NotFoundException("Expense not found");
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

    /**
     * Get Single expenses
     */
    async findSingleExpenses(
        id: number,
        userPayload: UserInterface,
        ipClientPayload: any
    ) {
        const data = await this.expensesRepository.findOne({
            where: {
                id: id,
                organizationId: userPayload.organizationId
            },
            relations: ["debitLedger", "creditLedger"]
        });

        // Prepare Activity Log
        const log = {
            cLientIPAddress: ipClientPayload.ip,
            browser: ipClientPayload.browser,
            os: ipClientPayload.os,
            userId: userPayload.id,
            messageDetails: {
                tag: "Expenses",
                message: `Single Expenses fetched by ${decrypt(userPayload.hashType)}`,
                date: new Date()
            },
            logData: null,
            organizationId: userPayload.organizationId
        };

        if (!data) {
            throw new NotFoundException(`expense id not exist in db!!`);
        }

        // Save Activity Log
        await this.activityLogService.createLogWithoutTransaction(log);

        return data;
    }

    /**
     * Get One expenses
     */
    async findOneExpenses(id: number) {
        const data = await this.expensesRepository.findOne({
            where: {
                id: id
            },
            relations: ["debitLedger", "creditLedger"]
        });
        if (!data) {
            throw new NotFoundException(`expense id not exist in db!!`);
        }
        return data;
    }
}