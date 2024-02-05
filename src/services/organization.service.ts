import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as randToken from "rand-token";
import { ErrorMessage, StatusField } from "src/authentication/common/enum";
import { Pagination, PaginationOptionsInterface, UserInterface } from "src/authentication/common/interfaces";
import { CreateOrganizationsDto, UpdateOrganizationsDto } from "src/dtos/configurations/organizations";
import { Brackets, DataSource } from "typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";
import { AccountingGroupEntity, AccountsEntity, OrganizationEntity, UserEntity, UserTypeEntity } from "../entities";
import * as path from "path";
import * as randomToken from "rand-token";
import { AccountingGroupService } from "./accounting-group.service";
import * as bcrypt from "bcrypt";
import { AuthService } from "src/authentication/auth/auth.service";
let exceptionmessage = "fialed";

@Injectable()
export class OrganizationsService {
    constructor(
        @InjectRepository(OrganizationEntity)
        private organizationsRepository: BaseRepository<OrganizationEntity>,
        private dataSource: DataSource
    ) { }

    //  create organizations
    async createOrg(createOrganizationsDto: CreateOrganizationsDto): Promise<any> {
        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();

        try {
            const org = await queryRunner.manager.findOne(OrganizationEntity, {
                where: {
                    organizationName: createOrganizationsDto.organizationName.trim()
                }
            });

            if (org) {
                throw new BadRequestException(`duplicate organization found. please insert a unique one.`);
            }

            let logoFile;
            let imgFile;
            if (createOrganizationsDto.logoFile) {
                logoFile = path.basename(createOrganizationsDto.logoFile.originalname, path.extname(createOrganizationsDto.logoFile.originalname));
            }
            if (createOrganizationsDto.profileImgFile) {
                imgFile = path.basename(createOrganizationsDto.profileImgFile.originalname, path.extname(createOrganizationsDto.profileImgFile.originalname));
            }

            let orgData = new OrganizationEntity();
            orgData.organizationName = createOrganizationsDto.organizationName;
            orgData.organizationType = createOrganizationsDto.organizationType;
            orgData.organizationLogo = logoFile ? logoFile : null;
            orgData.email = createOrganizationsDto.email;
            orgData.country = createOrganizationsDto.country;
            orgData.address = createOrganizationsDto.address;
            orgData.phone = createOrganizationsDto.phone;
            orgData.currency = createOrganizationsDto.currency;

            orgData.currencySymbol = createOrganizationsDto.currencySymbol;
            if (createOrganizationsDto.qbaccounts == 1) {
                orgData.qbaccounts = 1;
                orgData.qbClientKey = createOrganizationsDto.qbClientKey;
                orgData.qbClientSecret = createOrganizationsDto.qbClientSecret;
            } else {
                orgData.qbaccounts = 0;
                orgData.qbClientKey = null;
                orgData.qbClientSecret = null;
            }

            // save organization data
            const insertData = await queryRunner.manager.save(OrganizationEntity, orgData);

            const accountGroup = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Direct Overhead" } });

            if (insertData) {
                // user ledger data
                const ledgerObj = new AccountsEntity();
                const randomTokenString = randomToken.generate(7);
                ledgerObj.name = createOrganizationsDto.superAdminName;
                ledgerObj.accountType = accountGroup.groupHeadType;
                ledgerObj.ledgerParent = accountGroup.id;
                ledgerObj.nature = accountGroup.nature;
                ledgerObj.ledgerCode = "Emp-" + orgData.id + "-00001";
                ledgerObj.accountOpeningBalance = 0;
                ledgerObj.openingBalance = 0;
                ledgerObj.closingBalance = 0;
                ledgerObj.organizationId = insertData.id;
                ledgerObj.organization = insertData;
                // save ledger data
                const saveLedger = await queryRunner.manager.save(AccountsEntity, ledgerObj);

                if (saveLedger) {
                    let allledgers = [];

                    let ledgersen = new AccountsEntity();
                    ledgersen.name = "Cash Account";
                    let cashinhad = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Cash In Hand" } });
                    ledgersen.ledgerParent = cashinhad.id;
                    ledgersen.accountType = cashinhad.groupHeadType;
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
                    let vatac = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "VAT Current Account" } });

                    ledgervat.ledgerParent = vatac.id;
                    ledgervat.accountType = vatac.groupHeadType;
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
                    let profitloss = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Profit & Loss Account" } });

                    ledgercash.ledgerParent = profitloss.id;
                    ledgercash.accountType = profitloss.groupHeadType;
                    ledgercash.ledgerCode = "Ac-" + orgData.id + "-00002";
                    ledgercash.nature = "Cr";
                    ledgercash.accountOpeningBalance = 0;
                    ledgercash.openingBalance = 0;
                    ledgercash.closingBalance = 0;
                    ledgercash.organizationId = orgData.id;
                    ledgercash.organization = orgData;
                    allledgers.push(ledgercash);

                    let salesaccount = new AccountsEntity();
                    salesaccount.name = "Sales Account";
                    let sales = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Sales" } });

                    salesaccount.ledgerParent = sales.id;
                    salesaccount.accountType = sales.groupHeadType;
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
                    let CreditMemo = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Sales Return" } });

                    CreditMemoaccount.ledgerParent = CreditMemo.id;
                    CreditMemoaccount.accountType = CreditMemo.groupHeadType;
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
                    let admini = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Administrative Expenses" } });
                    director.ledgerParent = admini.id;
                    director.accountType = admini.groupHeadType;
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
                    let purchaseacc = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Purchase" } });

                    purchase.ledgerParent = purchaseacc.id;
                    purchase.accountType = purchaseacc.groupHeadType;
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
                    let ptr = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Purchase Return" } });
                    preturn.ledgerParent = ptr.id;
                    preturn.accountType = ptr.groupHeadType;
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
                    let cap = await queryRunner.manager.findOne(AccountingGroupEntity, { where: { groupName: "Capital and Reserve" } });
                    capitalew.ledgerParent = cap.id;
                    capitalew.accountType = cap.groupHeadType;
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
                            .findOne(AccountsEntity, { where: { name: allledgers[i].Name, organizationId: orgData.id } })
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

                    //let qbinformation =
                    let userdata = new UserEntity();
                    userdata.fullName = createOrganizationsDto.superAdminName;
                    userdata.email = createOrganizationsDto.superAdminEmail;
                    userdata.password = bcrypt.hashSync(createOrganizationsDto.password, 10);
                    userdata.mobile = createOrganizationsDto.superAdminPhone;
                    userdata.gender = createOrganizationsDto.superAdminGender;
                    userdata.profileImgSrc = imgFile;
                    var sadminutype = await queryRunner.manager.findOne(UserTypeEntity, { where: { userTypeName: "Super Admin" } });
                    userdata.userType = sadminutype;
                    userdata.userTypeId = sadminutype.id;
                    userdata.organizationId = insertData.id;
                    userdata.organization = insertData;
                    userdata.ledger = ledgerObj;
                    userdata.createdAt = new Date();
                    userdata.updatedAt = new Date();
                    userdata.createdBy = 0;
                    userdata.organizationId = insertData.id;
                    userdata.updatedBy = 0;
                    userdata.deletedBy = 0;

                    // save user data
                    const saveUser = await queryRunner.manager.save(UserEntity, userdata);
                    await queryRunner.commitTransaction();
                    return saveUser;
                }
            }

            exceptionmessage = "Failed";
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(exceptionmessage);
        } catch (e) {
            console.log(e);

            // if we have errors, rollback changes we made
            try {
                await queryRunner.rollbackTransaction();
            } catch { }
            throw new BadRequestException(exceptionmessage);
        } finally {
            // release query runner which is manually created:
            await queryRunner.release();
        }
    }

    // update org
    async updateOrg(updateOrganizationsDto: UpdateOrganizationsDto, id: number, userPayload: UserInterface) {
        //#region Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        // a new transaction:
        await queryRunner.startTransaction();
        try {
            const org = await queryRunner.manager.findOne(OrganizationEntity,{
                where: {
                    id: id
                }
            });

            if (!org) {
                throw new BadRequestException(`This data not exist in DB!!!`);
            }
            org.qbClientKey = updateOrganizationsDto.qbClientKey;
            org.qbClientSecret = updateOrganizationsDto.qbClientSecret;
            org.realmeID = updateOrganizationsDto.realmeID;
            org.accessToken = "";
            org.refreshToken = "";
            org.updatedAt = new Date();
            org.updatedBy = userPayload.id;

            const orgData = await queryRunner.manager.update(OrganizationEntity, { id: org.id }, org);
            await queryRunner.commitTransaction();

            return `organization data updated successfully!!!`;
        } catch (ex) {
            //console.log(ex)
            await queryRunner.rollbackTransaction();
            return "failed";
        }
        finally {
            //await queryRunner.release();
        }

    }

    // find all orgnaization data
    async findAllOrgnaizationData(listQueryParam: PaginationOptionsInterface, filter: any) {
        const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
        const page: number = listQueryParam.page ? (+listQueryParam.page == 1 ? 0 : listQueryParam.page) : 1;

        const [results, total] = await this.organizationsRepository
            .createQueryBuilder("org")
            .where(
                new Brackets((qb) => {
                    if (filter) {
                        qb.where(`org.organizationName LIKE ('%${filter}%')`);
                    }
                })
            )
            .orderBy("org.id", "DESC")
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

    // delete organization
    async deleteOrganization(id: number): Promise<any> {
        try {
            const orgData = await this.organizationsRepository.findOne({
                where: {
                    id: id
                }
            });

            if (!orgData) {
                throw new NotFoundException("orgData not found");
            }

            await this.organizationsRepository.remove(orgData);
        } catch (e) {
            throw new BadRequestException(ErrorMessage.DELETE_FAILED);
        }
    }

    /**
     * Get One organization
     */
    async findOneOrg(userPayload: UserInterface) {
        const data = await this.organizationsRepository.findOne({
            where: {
                id: userPayload.organizationId
            }
        });

        if (!data) {
            throw new NotFoundException(`organization data not exist in db!!`);
        }

        return data;
    }

    /**
     * DROPDOWN -> organization
     */
    async dropdown() {
        return await this.organizationsRepository
            .createQueryBuilder("organization")
            .where(`organization.status = '${StatusField.ACTIVE}'`)
            .select(["organization.id as value", "organization.organizationName as label"])
            .getRawMany();
    }
}
