import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AccountingGroupEntity, AccountsEntity, OrganizationEntity, UserEntity, UserTypeEntity } from "src/entities";
import { DataSource, Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import * as randomToken from "rand-token";
/**
 * Service dealing with language based operations.
 *
 * @class
 */
@Injectable()
export class SeederService {
    /**
     * Create an instance of class.
     *
     * @constructs
     *
     * @param
     */
    constructor(private dataSource: DataSource) { }
    /**
     * Seed all languages.
     *
     * @function
     */
    async create(): Promise<AccountingGroupEntity> {
        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();

        try {
            let accountgroups = [
                {
                    groupParent: null,
                    createdBy: 0,
                    groupName: "Assets",
                    groupIdentifier: "1.0.0.0",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Assets"
                },
                {
                    createdBy: 0,
                    groupName: "Fixed Assets",
                    groupParent: 1,
                    groupIdentifier: "1.1.0.0",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Fixed"
                },
                {
                    createdBy: 0,
                    groupName: "Office Equipment",
                    groupParent: 2,
                    groupIdentifier: "1.1.1.0",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Office"
                },
                {
                    createdBy: 0,
                    groupName: "Land & Building",
                    groupParent: 2,
                    groupIdentifier: "1.1.2.0",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Land"
                },
                {
                    createdBy: 0,
                    groupName: "Furniture & Fixture",
                    groupParent: 2,
                    groupIdentifier: "1.1.3.0",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Furniture"
                },
                {
                    createdBy: 0,
                    groupName: "Others Assets",
                    groupParent: 2,
                    groupIdentifier: "1.1.4.0",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Others"
                },
                {
                    createdBy: 0,
                    groupName: "Current Assets",
                    groupParent: 1,
                    groupIdentifier: "1.2.0.0",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Current"
                },
                {
                    createdBy: 0,
                    groupName: "Cash and Cash Equivalents",
                    groupParent: 1,
                    groupIdentifier: "1.2.1.0",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Current"
                },

                {
                    createdBy: 0,
                    groupName: "Cash In Hand",
                    groupParent: 1,
                    groupIdentifier: "1.2.1.1",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Cash"
                },
                {
                    createdBy: 0,
                    groupName: "Bank Accounts",
                    groupParent: 1,
                    groupIdentifier: "1.2.1.2",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Bank"
                },
                {
                    createdBy: 0,
                    groupName: "Credit Cards",
                    groupParent: 1,
                    groupIdentifier: "1.2.1.3",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Bank"
                },
                {
                    createdBy: 0,
                    groupName: "Mobile Banking",
                    groupParent: 1,
                    groupIdentifier: "1.2.1.4",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Mobile"
                },
                {
                    createdBy: 0,
                    groupName: "Agent Banking",
                    groupParent: 1,
                    groupIdentifier: "1.2.1.5",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Mobile"
                },
                {
                    createdBy: 0,
                    groupName: "Loan & Advance",
                    groupParent: 1,
                    groupIdentifier: "1.2.2.0",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Loan"
                },
                {
                    createdBy: 0,
                    groupName: "Accounts Receivable",
                    groupParent: 1,
                    groupIdentifier: "1.2.3.0",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Accounts"
                },
                {
                    createdBy: 0,
                    groupName: "Stock In Hand",
                    groupParent: 1,
                    groupIdentifier: "1.2.4.0",
                    groupType: 1,
                    nature: "Dr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Stock"
                },
                {
                    createdBy: 0,
                    groupName: "Liability",
                    groupParent: 2,
                    groupIdentifier: "2.0.0.0",
                    groupType: 2,
                    nature: "Cr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Liability"
                },
                {
                    createdBy: 0,
                    groupName: "Loans Account",
                    groupParent: 2,
                    groupIdentifier: "2.1.0.0",
                    groupType: 2,
                    nature: "Cr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Loans"
                },
                {
                    createdBy: 0,
                    groupName: "Current Liabilities",
                    groupParent: 2,
                    groupIdentifier: "2.2.0.0",
                    groupType: 2,
                    nature: "Cr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Liability"
                },
                {
                    createdBy: 0,
                    groupName: "Accounts Payable",
                    groupParent: 2,
                    groupIdentifier: "2.2.1.0",
                    groupType: 2,
                    nature: "Cr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Supplier"
                },
                {
                    createdBy: 0,
                    groupName: "Duties & Taxes",
                    groupParent: 2,
                    groupIdentifier: "2.2.2.0",
                    groupType: 2,
                    nature: "Cr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Taxes"
                },
                {
                    createdBy: 0,
                    groupName: "VAT Current Account",
                    groupParent: 2,
                    groupIdentifier: "2.2.3.0",
                    groupType: 2,
                    nature: "Cr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Supplier"
                },
                {
                    createdBy: 0,
                    groupName: "Profit & Loss Account",
                    groupParent: 2,
                    groupIdentifier: "2.3.0.0",
                    groupType: 2,
                    nature: "Cr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Profit & Loss"
                },
                {
                    createdBy: 0,
                    groupName: "Income",
                    groupParent: 2,
                    groupIdentifier: "3.0.0.0",
                    groupType: 3,
                    nature: "Cr",
                    postedTo: "Income Statement",
                    groupHeadType: "Income"
                },
                {
                    createdBy: 0,
                    groupName: "Direct Income",
                    groupParent: 2,
                    groupIdentifier: "3.1.0.0",
                    groupType: 3,
                    nature: "Cr",
                    postedTo: "Income Statement",
                    groupHeadType: "Income"
                },
                {
                    createdBy: 0,
                    groupName: "Indirect Income",
                    groupParent: 2,
                    groupIdentifier: "3.2.0.0",
                    groupType: 3,
                    nature: "Cr",
                    postedTo: "Income Statement",
                    groupHeadType: "Income"
                },
                {
                    createdBy: 0,
                    groupName: "Sales",
                    groupParent: 2,
                    groupIdentifier: "3.3.0.0",
                    groupType: 3,
                    nature: "Cr",
                    postedTo: "Income Statement",
                    groupHeadType: "Sales"
                },
                {
                    createdBy: 0,
                    groupName: "Sales Return",
                    groupParent: 2,
                    groupIdentifier: "3.4.0.0",
                    groupType: 3,
                    nature: "Dr",
                    postedTo: "Income Statement",
                    groupHeadType: "Sales Return"
                },
                {
                    createdBy: 0,
                    groupName: "Expense",
                    groupParent: 2,
                    groupIdentifier: "4.0.0.0",
                    groupType: 4,
                    nature: "Dr",
                    postedTo: "All Reports",
                    groupHeadType: "Expense"
                },
                {
                    createdBy: 0,
                    groupName: "Direct Overhead",
                    groupParent: 2,
                    groupIdentifier: "4.1.0.0",
                    groupType: 4,
                    nature: "Dr",
                    postedTo: "All Reports",
                    groupHeadType: "Expense"
                },
                {
                    createdBy: 0,
                    groupName: "Employee Salary",
                    groupParent: 4,
                    groupIdentifier: "4.1.1.0",
                    groupType: 4,
                    nature: "Dr",
                    postedTo: "All Reports",
                    groupHeadType: "Expense"
                },
                {
                    createdBy: 0,
                    groupName: "Indirect Expense",
                    groupParent: 4,
                    groupIdentifier: "4.2.0.0",
                    groupType: 4,
                    nature: "Dr",
                    postedTo: "All Reports",
                    groupHeadType: "Expense"
                },
                {
                    createdBy: 0,
                    groupName: "Discount",
                    groupParent: 4,
                    groupIdentifier: "4.2.1.0",
                    groupType: 4,
                    nature: "Dr",
                    postedTo: "All Reports",
                    groupHeadType: "Expense"
                },
                {
                    createdBy: 0,
                    groupName: "Financial Expenses",
                    groupParent: 4,
                    groupIdentifier: "4.2.2.0",
                    groupType: 4,
                    nature: "Dr",
                    postedTo: "All Reports",
                    groupHeadType: "Expense"
                },
                {
                    createdBy: 0,
                    groupName: "Administrative Expenses",
                    groupParent: 4,
                    groupIdentifier: "4.2.3.0",
                    groupType: 4,
                    nature: "Dr",
                    postedTo: "All Reports",
                    groupHeadType: "Expense"
                },
                {
                    createdBy: 0,
                    groupName: "Selling & Marketing Expenses",
                    groupParent: 4,
                    groupIdentifier: "4.2.4.0",
                    groupType: 4,
                    nature: "Dr",
                    postedTo: "All Reports",
                    groupHeadType: "Expense"
                },
                {
                    createdBy: 0,
                    groupName: "Sponsor Expense",
                    groupParent: 4,
                    groupIdentifier: "4.2.5.0",
                    groupType: 4,
                    nature: "Dr",
                    postedTo: "All Reports",
                    groupHeadType: "Expense"
                },
                {
                    createdBy: 0,
                    groupName: "Purchase",
                    groupParent: 4,
                    groupIdentifier: "4.3.0.0",
                    groupType: 4,
                    nature: "Dr",
                    postedTo: "Goods Sold Statement",
                    groupHeadType: "Purchase"
                },
                {
                    createdBy: 0,
                    groupName: "Purchase Return",
                    groupParent: 4,
                    groupIdentifier: "4.4.0.0",
                    groupType: 4,
                    nature: "Cr",
                    postedTo: "Goods Sold Statement",
                    groupHeadType: "Purchase Return"
                },
                {
                    createdBy: 0,
                    groupName: "Equity and Capital",
                    groupParent: null,
                    groupIdentifier: "5.0.0.0",
                    groupType: 5,
                    nature: "Cr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Capital"
                },
                {
                    createdBy: 0,
                    groupName: "Capital and Reserve",
                    groupParent: 2,
                    groupIdentifier: "5.1.0.0",
                    groupType: 5,
                    nature: "Cr",
                    postedTo: "Balance Sheet",
                    groupHeadType: "Capital"
                }
            ];
            for (var i = 0; i < accountgroups.length; i++) {
                await queryRunner.manager
                    .findOne(AccountingGroupEntity, { where: { groupName: accountgroups[i].groupName } })
                    .then(async (dbLangauge) => {
                        // We check if a accountgroup already exists.
                        // If it does don't create a new one.
                        if (dbLangauge) {
                            return Promise.resolve(null);
                        }
                        let parentid = null;
                        if (accountgroups[i].groupName == "Fixed Assets" || accountgroups[i].groupName == "Current Assets") {
                            let findparent = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Assets" } });
                            parentid = findparent.id;
                        } else if (
                            accountgroups[i].groupName == "Office Equipment" ||
                            accountgroups[i].groupName == "Land & Building" ||
                            accountgroups[i].groupName == "Furniture & Fixture" ||
                            accountgroups[i].groupName == "Others Assets"
                        ) {
                            let findparent = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Fixed Assets" } });
                            parentid = findparent.id;
                        } else if (
                            accountgroups[i].groupName == "Cash and Cash Equivalents" ||
                            accountgroups[i].groupName == "Loan & Advance" ||
                            accountgroups[i].groupName == "Accounts Receivable" ||
                            accountgroups[i].groupName == "Stock In Hand"
                        ) {
                            let findparent = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Current Assets" } });
                            parentid = findparent.id;
                        } else if (
                            accountgroups[i].groupName == "Cash In Hand" ||
                            accountgroups[i].groupName == "Cash Account" ||
                            accountgroups[i].groupName == "Bank Accounts" ||
                            accountgroups[i].groupName == "Credit Cards" ||
                            accountgroups[i].groupName == "Mobile Banking" ||
                            accountgroups[i].groupName == "Agent Banking"
                        ) {
                            let findparent = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Cash and Cash Equivalents" } });
                            parentid = findparent.id;
                        } else if (accountgroups[i].groupName == "Loans Account" || accountgroups[i].groupName == "Current Liabilities") {
                            let findparent = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Liability" } });
                            parentid = findparent.id;
                        } else if (
                            accountgroups[i].groupName == "Accounts Payable" ||
                            accountgroups[i].groupName == "Duties & Taxes" ||
                            accountgroups[i].groupName == "VAT Current Account" ||
                            accountgroups[i].groupName == "Profit & Loss Account"
                        ) {
                            let findparent = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Current Liabilities" } });
                            parentid = findparent.id;
                        } else if (
                            accountgroups[i].groupName == "Direct Income" ||
                            accountgroups[i].groupName == "Indirect Income" ||
                            accountgroups[i].groupName == "Sales" ||
                            accountgroups[i].groupName == "Sales Return"
                        ) {
                            let findparent = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Income" } });
                            parentid = findparent.id;
                        } else if (
                            accountgroups[i].groupName == "Direct Overhead" ||
                            accountgroups[i].groupName == "Indirect Expense" ||
                            accountgroups[i].groupName == "Purchase" ||
                            accountgroups[i].groupName == "Purchase Return" ||
                            accountgroups[i].groupName == "Transport Expense"
                        ) {
                            let findparent = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Expense" } });
                            parentid = findparent.id;
                        } else if (accountgroups[i].groupName == "Employee Salary") {
                            let findparent = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Direct Overhead" } });
                            parentid = findparent.id;
                        } else if (
                            accountgroups[i].groupName == "Discount" ||
                            accountgroups[i].groupName == "Financial Expenses" ||
                            accountgroups[i].groupName == "Administrative Expenses" ||
                            accountgroups[i].groupName == "Selling & Marketing Expenses" ||
                            accountgroups[i].groupName == "Sponsor Expense"
                        ) {
                            let findparent = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Indirect Expense" } });
                            parentid = findparent.id;
                        } else if (accountgroups[i].groupName == "Capital and Reserve") {
                            let findparent = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Equity and Capital" } });
                            parentid = findparent.id;
                        }
                        accountgroups[i].groupParent = parentid;

                        return Promise.resolve(
                            // or create(language).then(() => { ... });
                            await queryRunner.manager.save(AccountingGroupEntity, accountgroups[i])
                        );
                    })
                    .catch((error) => Promise.reject(error));
            }

            const permissionDataForSadmin = {
                quickbook: {
                    human_resource: {
                        view: true
                    },
                    Products: {
                        view: true
                    },
                    receivables: {
                        view: true
                    },
                    payables: {
                        view: true
                    },
                    accountant: {
                        view: true
                    },
                    reports: {
                        view: true
                    }
                },
                dashboard: {
                    dashboard: {
                        view: true
                    }
                },
                quickbooks_api: {
                    quickbook_api: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    }
                },
                human_resource: {
                    manage_designation: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    manage_employee: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    salary_payment: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    }
                },
                service: {
                    manage_service: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    }
                },
                banking: {
                    manage_bank: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    statement: {
                        view: true
                    }
                },
                receivables: {
                    manage_customer: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    manage_quotation: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    customer_invoice: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    paid_invoice: {
                        view: true
                    },
                    received_payment: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    sales_return: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    customer_statement: {
                        view: true
                    }
                },
                payables: {
                    supplier: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    purchase_order: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    supplier_invoice: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    paid_invoice: {
                        view: true
                    },
                    payment_voucher: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    bookkeeping: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    purchase_return: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    expenses: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    supplier_statement: {
                        view: true
                    }
                },
                accountant: {
                    manual_journal: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    account_head: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    accounts: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    chart_of_accounts: {
                        view: true
                    },
                    account_statement: {
                        view: true
                    }
                },
                administrator: {
                    user_role: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    manage_permission: {
                        add: true
                    },
                    manage_user: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    login_history: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    activity: {
                        view: true,
                        add: true,
                        edit: true,
                        delete: true
                    },
                    module: {
                        view: true
                    }
                },
                reports: {
                    income_statement: {
                        view: true
                    },
                    trial_balance: {
                        view: true
                    },
                    balance_sheet: {
                        view: true
                    }
                }
            };

            const permissionData = {
                quickbook: {
                    human_resource: {
                        view: false
                    },
                    Products: {
                        view: false
                    },
                    receivables: {
                        view: false
                    },
                    payables: {
                        view: false
                    },
                    accountant: {
                        view: false
                    },
                    reports: {
                        view: false
                    }
                },
                dashboard: {
                    dashboard: {
                        view: false
                    }
                },
                quickbooks_api: {
                    quickbook_api: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    }
                },
                human_resource: {
                    manage_designation: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    manage_employee: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    salary_payment: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    }
                },
                service: {
                    manage_service: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    }
                },
                banking: {
                    manage_bank: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    statement: {
                        view: false
                    }
                },
                receivables: {
                    manage_customer: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    manage_quotation: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    customer_invoice: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    paid_invoice: {
                        view: false
                    },
                    received_payment: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    sales_return: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    customer_statement: {
                        view: false
                    }
                },
                payables: {
                    supplier: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    purchase_order: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    supplier_invoice: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    paid_invoice: {
                        view: false
                    },
                    payment_voucher: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    bookkeeping: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    purchase_return: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    expenses: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    supplier_statement: {
                        view: false
                    }
                },
                accountant: {
                    manual_journal: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    account_head: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    accounts: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    chart_of_accounts: {
                        view: false
                    },
                    account_statement: {
                        view: false
                    }
                },
                administrator: {
                    user_role: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    manage_permission: {
                        add: false
                    },
                    manage_user: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    login_history: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    activity: {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false
                    },
                    module: {
                        view: false
                    }
                },
                reports: {
                    income_statement: {
                        view: false
                    },
                    trial_balance: {
                        view: false
                    },
                    balance_sheet: {
                        view: false
                    }
                }
            };

            // organization part

            let orgData = new OrganizationEntity();
            orgData.organizationName = "Digital Decoder Limited";
            orgData.email = "techno@gmail.org";
            orgData.organizationLogo = "src/logo.png";
            orgData.organizationType = "Tech based";
            orgData.address = "Male";
            orgData.country = "Bangladesh";
            orgData.qbaccounts = 1;
            orgData.qbClientKey = "ABJ1OolGzbp9uYL16HO4oYoW061MsQx0OD54NVtpjxSnDE5fLg";
            orgData.qbClientSecret = "EeRADJ2JJt2H9RnHFIcXGiRJGgkoPRrgflpboIOm";
            orgData.realmeID = "4620816365359739210";
            orgData.phone = "+385-(0) 21-388-951";
            orgData.currency = "BDT";
            orgData.currencySymbol = "BDT";

            const createOrg = await queryRunner.manager.save(OrganizationEntity, orgData);

            let usertypes = [
                {
                    userTypeName: "Super Admin",
                    slug: "sadmin",
                    permissions: permissionDataForSadmin,
                    organization: orgData,
                    organizationId: orgData.id
                },
                {
                    userTypeName: "Admin",
                    slug: "admin",
                    permissions: permissionData,
                    organization: orgData,
                    organizationId: orgData.id
                },
                {
                    userTypeName: "Accountant",
                    slug: "accountant",
                    permissions: permissionData,
                    organization: orgData,
                    organizationId: orgData.id
                }
            ];

            for (var i = 0; i < usertypes.length; i++) {
                await await queryRunner.manager
                    .findOne(UserTypeEntity, { where: { userTypeName: usertypes[i].userTypeName } })
                    .then(async (dbLangauge) => {
                        // We check if a accountgroup already exists.
                        // If it does don't create a new one.
                        if (dbLangauge) {
                            return Promise.resolve(null);
                        }

                        return Promise.resolve(await queryRunner.manager.save(UserTypeEntity, usertypes[i]));
                    })
                    .catch((error) => Promise.reject(error));
            }

            let allledgers = [];

            let ledgersen = new AccountsEntity();
            ledgersen.name = "Cash Account";
            ledgersen.fullyQualifiedName = "Cash Account";
            let cashinhad = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Cash In Hand" } });
            ledgersen.ledgerParent = cashinhad.id;
            ledgersen.accountType = cashinhad.groupHeadType;
            ledgersen.accountSubType = cashinhad.groupName;
            ledgersen.classification = cashinhad.groupHeadType;
            ledgersen.ledgerCode = "B-" + orgData.id + "-00001";
            ledgersen.nature = "Dr";
            ledgersen.accountOpeningBalance = 0;
            ledgersen.openingBalance = 0;
            ledgersen.closingBalance = 0;
            ledgersen.organizationId = orgData.id;
            ledgersen.organization = orgData;
            allledgers.push(ledgersen);

            let ledgervat = new AccountsEntity();
            ledgervat.name = "VAT Current Account";
            ledgervat.fullyQualifiedName = "VAT Current Account";
            let vatac = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "VAT Current Account" } });

            ledgervat.ledgerParent = vatac.id;
            ledgervat.accountType = vatac.groupHeadType;
            ledgervat.accountSubType = vatac.groupName;
            ledgervat.classification = vatac.groupHeadType;
            ledgervat.ledgerCode = "Ac-" + orgData.id + "-00001";
            ledgervat.nature = "Cr";
            ledgervat.accountOpeningBalance = 0;
            ledgervat.openingBalance = 0;
            ledgervat.closingBalance = 0;
            ledgervat.organizationId = orgData.id;
            ledgervat.organization = orgData;
            allledgers.push(ledgervat);

            let ledgercash = new AccountsEntity();
            ledgercash.name = "Profit & Loss Account";
            ledgercash.fullyQualifiedName = "Profit & Loss Account";
            let profitloss = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Profit & Loss Account" } });
            ledgercash.ledgerParent = profitloss.id;
            ledgercash.accountType = profitloss.groupHeadType;
            ledgercash.accountSubType = profitloss.groupName;
            ledgercash.classification = profitloss.groupHeadType;
            ledgercash.ledgerCode = "Ac-" + orgData.id + "-00002";
            ledgercash.nature = "Cr";
            ledgercash.accountOpeningBalance = 0;
            ledgercash.openingBalance = 0;
            ledgercash.closingBalance = 0;
            ledgercash.organizationId = orgData.id;
            ledgercash.organization = orgData;
            allledgers.push(ledgercash);

            let salesaccount = new AccountsEntity();
            salesaccount.fullyQualifiedName = "Sales Account";
            salesaccount.name = "Sales Account";
            let sales = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Sales" } });
            salesaccount.ledgerParent = sales.id;
            salesaccount.accountType = sales.groupHeadType;
            salesaccount.accountSubType = sales.groupName;
            salesaccount.classification = sales.groupHeadType;
            salesaccount.ledgerCode = "Ac-" + orgData.id + "-00003";
            salesaccount.nature = "Cr";
            salesaccount.accountOpeningBalance = 0;
            salesaccount.openingBalance = 0;
            salesaccount.closingBalance = 0;
            salesaccount.organizationId = orgData.id;
            salesaccount.organization = orgData;
            allledgers.push(salesaccount);

            let CreditMemoaccount = new AccountsEntity();
            CreditMemoaccount.name = "Sales Return Account";
            CreditMemoaccount.fullyQualifiedName = "Sales Return Account";
            let CreditMemo = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Sales Return" } });
            CreditMemoaccount.ledgerParent = CreditMemo.id;
            CreditMemoaccount.accountType = CreditMemo.groupHeadType;
            CreditMemoaccount.accountSubType = CreditMemo.groupName;
            CreditMemoaccount.classification = CreditMemo.groupHeadType;
            CreditMemoaccount.ledgerCode = "Ac-" + orgData.id + "-00004";
            CreditMemoaccount.nature = "Cr";
            CreditMemoaccount.accountOpeningBalance = 0;
            CreditMemoaccount.openingBalance = 0;
            CreditMemoaccount.closingBalance = 0;
            CreditMemoaccount.organizationId = orgData.id;
            CreditMemoaccount.organization = orgData;
            allledgers.push(CreditMemoaccount);

            let director = new AccountsEntity();
            director.name = "Director Allowance";
            director.fullyQualifiedName = "Director Allowance";
            let admini = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Administrative Expenses" } });
            director.ledgerParent = admini.id;
            director.accountType = admini.groupHeadType;
            director.accountSubType = admini.groupName;
            director.classification = admini.groupHeadType;
            director.ledgerCode = "Ac-" + orgData.id + "-00005";
            director.nature = "Dr";
            director.accountOpeningBalance = 0;
            director.openingBalance = 0;
            director.closingBalance = 0;
            director.organizationId = orgData.id;
            director.organization = orgData;
            allledgers.push(director);

            let purchase = new AccountsEntity();
            purchase.name = "Purchase Account";
            purchase.fullyQualifiedName = "Purchase Account";
            let purchaseacc = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Purchase" } });
            purchase.ledgerParent = purchaseacc.id;
            purchase.accountType = purchaseacc.groupHeadType;
            purchase.accountSubType = purchaseacc.groupName;
            purchase.classification = purchaseacc.groupHeadType;
            purchase.ledgerCode = "Ac-" + orgData.id + "-00006";
            purchase.nature = "Dr";
            purchase.accountOpeningBalance = 0;
            purchase.openingBalance = 0;
            purchase.closingBalance = 0;
            purchase.organizationId = orgData.id;
            purchase.organization = orgData;
            allledgers.push(purchase);

            let preturn = new AccountsEntity();
            preturn.name = "Purchase Return Account";
            preturn.fullyQualifiedName = "Purchase Return Account";
            let ptr = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Purchase Return" } });
            preturn.ledgerParent = ptr.id;
            preturn.accountType = ptr.groupHeadType;
            preturn.accountSubType = ptr.groupName;
            preturn.classification = ptr.groupHeadType;
            preturn.ledgerCode = "Ac-" + orgData.id + "-00007";
            preturn.nature = "Dr";
            preturn.accountOpeningBalance = 0;
            preturn.openingBalance = 0;
            preturn.closingBalance = 0;
            preturn.organizationId = orgData.id;
            preturn.organization = orgData;
            allledgers.push(preturn);

            let capitalew = new AccountsEntity();
            capitalew.name = "Capital Account";
            capitalew.fullyQualifiedName = "Capital Account";
            let cap = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Capital and Reserve" } });
            capitalew.ledgerParent = cap.id;
            capitalew.accountType = cap.groupHeadType;
            capitalew.accountSubType = cap.groupName;
            capitalew.classification = cap.groupHeadType;
            capitalew.ledgerCode = "Ac-" + orgData.id + "-00008";
            capitalew.nature = "Cr";
            capitalew.accountOpeningBalance = 0;
            capitalew.openingBalance = 0;
            capitalew.closingBalance = 0;
            capitalew.organizationId = orgData.id;
            capitalew.organization = orgData;
            allledgers.push(capitalew);

            for (var i = 0; i < allledgers.length; i++) {
                await queryRunner.manager
                    .findOne(AccountsEntity, { where: { name: allledgers[i].name } })
                    .then(async (dbLangauge) => {
                        // We check if a accountgroup already exists.
                        // If it does don't create a new one.
                        if (dbLangauge) {
                            return Promise.resolve(null);
                        }

                        return Promise.resolve(
                            // or create(language).then(() => { ... });
                            await queryRunner.manager.save(AccountsEntity, allledgers[i])
                        );
                    })
                    .catch((error) => Promise.reject(error));
            }

            let userled = new AccountsEntity();
            userled.name = "SuperAdmin";
            userled.fullyQualifiedName = "SuperAdmin";
            let emplosalla = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Employee Salary" } });
            userled.ledgerParent = emplosalla.id;
            userled.accountType = emplosalla.groupHeadType;
            userled.accountSubType = emplosalla.groupName;
            userled.classification = emplosalla.groupHeadType;
            userled.ledgerCode = "Emp-" + orgData.id + "-00001";
            userled.nature = "Dr";
            userled.accountOpeningBalance = 0;
            userled.openingBalance = 0;
            userled.closingBalance = 0;
            userled.organizationId = orgData.id;
            userled.organization = orgData;
            const createdled = await queryRunner.manager.save(AccountsEntity, userled);

            let userdata = new UserEntity();
            userdata.fullName = "SuperAdmin";
            userdata.email = "admin@gmail.com";
            userdata.password = bcrypt.hashSync("password", 10);
            userdata.mobile = "01719721908";
            userdata.gender = "Male";
            userdata.profileImgSrc = null;
            var sadminutype = await await queryRunner.manager.findOne(UserTypeEntity, { where: { userTypeName: "Super Admin" } });
            userdata.userType = sadminutype;
            userdata.organizationId = createOrg.id;
            userdata.organization = orgData;
            userdata.ledger = createdled;

            const createduser = await queryRunner.manager.save(UserEntity, userdata);

            await queryRunner.commitTransaction();
            return;
        } catch (err) {
            console.log(err);
            // if we have errors, rollback changes we made
            await queryRunner.rollbackTransaction();
            throw new BadRequestException("Failed");
        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
    }
}
