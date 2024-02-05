import { Injectable } from "@nestjs/common";
import * as OAuthClient from "intuit-oauth";
import * as QuickBooks from "node-quickbooks";
import { UserInterface } from "src/authentication/common/interfaces";
import { OrganizationEntity } from "src/entities";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseRepository } from "typeorm-transactional-cls-hooked";

const clientkey = "ABJ1OolGzbp9uYL16HO4oYoW061MsQx0OD54NVtpjxSnDE5fLg";
const clientsecret = "EeRADJ2JJt2H9RnHFIcXGiRJGgkoPRrgflpboIOm";
const oauthClient = new OAuthClient({
    clientId: clientkey,
    clientSecret: clientsecret,
    environment: "sandbox" || "production",
    redirectUri: "http://localhost:4000/api/v1/quickbook/callback"
});

@Injectable()
export class QuickBookService {
    

    constructor(
        @InjectRepository(OrganizationEntity)
        private organizationEntityRepository: BaseRepository<OrganizationEntity>
    ) { }


    //#region Products
    async createProduct(req: any, res: any, userPayload: UserInterface, Productcreateobject) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        return new Promise((resolve, reject) => {
            qboobject.createProduct(
                Productcreateobject,
                function (err, Product) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(Product);
                    }
                }
            );
        });
    }

    async updateProduct(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        return new Promise((resolve, reject) => {
            qboobject.updateProduct(
                {
                    FullyQualifiedName: req.name,
                    Name: req.name,
                    Description: "Update",
                    Id: req.qbRefId,
                    SyncToken: "0",
                    MetaData: {
                        LastUpdatedTime: new Date()
                    }
                },
                function (err, Product) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(Product);
                    }
                }
            );
        });
    }

    async findProducts(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findProducts(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }

    //#endregion

    //#region Customer
    async createCustomer(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        return new Promise((resolve, reject) => {
            qboobject.createCustomer(
                {
                    domain: "QBO",
                    PrimaryEmailAddr: {
                        Address: req.email
                    },
                    DisplayName: req.name,
                    PreferredDeliveryMethod: "Print",
                    GivenName: "Bill",
                    FullyQualifiedName: req.name,
                    BillWithParent: false,
                    Job: false,
                    BalanceWithJobs: 85.0,
                    PrimaryPhone: {
                        FreeFormNumber: req.mobile
                    },
                    Active: true,
                    MetaData: {
                        CreateTime: new Date(),
                        LastUpdatedTime: new Date()
                    },
                    BillAddr: {
                        City: "Half Moon Bay",
                        Line1: "12 Ocean Dr.",
                        PostalCode: "94213",
                        Lat: "37.4307072",
                        Long: "-122.4295234",
                        CountrySubDivisionCode: "CA",
                        Id: "3"
                    },
                    MiddleName: "Mac",
                    Taxable: false,
                    Balance: 85.0,
                    SyncToken: "3",
                    CompanyName: "Bill's Windsurf Shop",
                    FamilyName: "Lucchini",
                    PrintOnCheckName: "Bill's Wind Surf Shop",
                    sparse: false
                },
                function (err, Product) {
                    // const test = res.json(Product);
                    // console.log(test);
                    if (err) {
                        reject(err);
                    } else {
                        resolve(Product);
                    }
                }
            );
        });
    }

    async updateCustomer(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        return new Promise((resolve, reject) => {
            qboobject.updateCustomer(
                {
                    domain: "QBO",
                    PrimaryEmailAddr: {
                        Address: req.email
                    },
                    DisplayName: req.name,
                    PreferredDeliveryMethod: "Print",
                    GivenName: "Bill",
                    FullyQualifiedName: req.name,
                    BillWithParent: false,
                    Job: false,
                    BalanceWithJobs: 85.0,
                    PrimaryPhone: {
                        FreeFormNumber: req.mobile
                    },
                    Active: true,
                    MetaData: {
                        CreateTime: new Date(),
                        LastUpdatedTime: new Date()
                    },
                    BillAddr: {
                        City: "Half Moon Bay",
                        Line1: "12 Ocean Dr.",
                        PostalCode: "94213",
                        Lat: "37.4307072",
                        Long: "-122.4295234",
                        CountrySubDivisionCode: "CA",
                        Id: "3"
                    },
                    MiddleName: "Mac",
                    Taxable: false,
                    Balance: 85.0,
                    SyncToken: "3",
                    CompanyName: "Bill's Windsurf Shop",
                    FamilyName: "Lucchini",
                    PrintOnCheckName: "Bill's Wind Surf Shop",
                    sparse: false,
                    Id: req.qbRefId
                },
                function (err, Product) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(Product);
                    }
                }
            );
        });
    }

    async getCustomer(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getCustomers(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    async findCustomers(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findCustomers(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Employee
    async createEmployee(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        return new Promise((resolve, reject) => {
            qboobject.createEmployee(
                {
                    Employee: {
                        SyncToken: "0",
                        domain: "QBO",
                        DisplayName: req.name,
                        PrimaryPhone: {
                            FreeFormNumber: req.phone
                        },
                        PrintOnCheckName: "Bill Millerxx",
                        FamilyName: "Millerxx",
                        Active: true,
                        SSN: "XXX-XX-XXXX",
                        PrimaryAddr: {
                            CountrySubDivisionCode: "CA",
                            City: "Middlefield",
                            PostalCode: "93242",
                            Id: "116",
                            Line1: "45 N. Elm Street"
                        },
                        sparse: false,
                        BillableTime: false,
                        GivenName: "Bill",
                        MetaData: {
                            CreateTime: new Date(),
                            LastUpdatedTime: new Date()
                        }
                    },
                    time: new Date()
                },
                function (err, Product) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(Product);
                    }
                }
            );
        });
    }

    async updateEmployee(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        return new Promise((resolve, reject) => {
            qboobject.updateEmployee(
                {
                    SyncToken: "0",
                    domain: "QBO",
                    DisplayName: req.name,
                    PrimaryPhone: {
                        FreeFormNumber: req.phone
                    },
                    PrintOnCheckName: "Bill Lee Miller",
                    FamilyName: "Miller",
                    Active: true,
                    SSN: "XXX-XX-XXXX",
                    PrimaryAddr: {
                        CountrySubDivisionCode: "CA",
                        City: "Middlefield",
                        PostalCode: "93242",
                        Id: "116",
                        Line1: "45 N. Elm Street"
                    },
                    sparse: false,
                    BillableTime: false,
                    GivenName: "Bill",
                    Id: req.qbRefId,
                    MetaData: {
                        CreateTime: new Date(),
                        LastUpdatedTime: new Date()
                    }
                },
                function (err, Product) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(Product);
                    }
                }
            );
        });
    }

    async getEmployee(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getEmployee(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findEmployees(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findEmployees(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Employee);
                    console.log(results.QueryResponse.Employee);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Vendor
    async createVendor(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        return new Promise((resolve, reject) => {
            qboobject.createVendor(
                {
                    PrimaryEmailAddr: {
                        Address: "demo@gmail.com"
                    },
                    WebAddr: {
                        URI: "http://DiannesAutxxxxoShop.com"
                    },
                    PrimaryPhone: {
                        FreeFormNumber: req.mobile
                    },
                    DisplayName: req.name,
                    Suffix: "Sr.",
                    Title: "Ms.",
                    Mobile: {
                        FreeFormNumber: req.mobile
                    },
                    MiddleName: "Mohammadddd",
                    FamilyName: "Bradlddddey",
                    TaxIdentifier: "99-5688293",
                    AcctNum: "35372649",
                    CompanyName: "Dianddddne's Auto Shop",
                    BillAddr: {
                        City: "Millbrae",
                        Country: "U.S.A",
                        Line3: req.address,
                        Line2: "Dianne Bradley",
                        Line1: "Dianne's Auto Shop",
                        PostalCode: "94030",
                        CountrySubDivisionCode: "CA"
                    },
                    GivenName: "Dianne",
                    PrintOnCheckName: "Dianne's Auto Shop"
                },
                function (err, Product) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(Product);
                    }
                }
            );
        });
    }

    async updateVendor(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        return new Promise((resolve, reject) => {
            qboobject.updateVendor(
                {
                    PrimaryEmailAddr: {
                        Address: "demo@gmail.com"
                    },
                    Vendor1099: false,
                    domain: "QBO",
                    GivenName: "Bessie",
                    DisplayName: req.name,
                    BillAddr: {
                        City: "Palo Alto",
                        Line1: "15 Main St.",
                        PostalCode: "94303",
                        Lat: "37.445013",
                        Long: "-122.1391443",
                        CountrySubDivisionCode: "CA",
                        Id: "31"
                    },
                    SyncToken: "1",
                    PrintOnCheckName: "Books by Bessie and Joan",
                    FamilyName: "Williams",
                    PrimaryPhone: {
                        FreeFormNumber: req.phone
                    },
                    AcctNum: "13451234",
                    CompanyName: "Books by Bessie",
                    WebAddr: {
                        URI: "http://www.booksbybessie.co"
                    },
                    sparse: false,
                    Active: true,
                    Balance: 0,
                    Id: req.qbRefId,
                    MetaData: {
                        CreateTime: new Date(),
                        LastUpdatedTime: new Date()
                    }
                },
                function (err, Product) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(Product);
                    }
                }
            );
        });
    }

    async findVendors(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findVendors(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Vendor);
                    console.log(results.QueryResponse.Vendor);
                }
            }
        );
    }
    async getVendor(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getVendor(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Payment Method
    async createPaymentMethod(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createPaymentMethod(
            {
                Name: "Business Check"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updatePaymentMethod(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updatePaymentMethod({
            SyncToken: "2",
            domain: "QBO",
            Name: "Platinum Diners Club",
            sparse: false,
            Active: true,
            Type: "CREDIT_CARD",
            Id: "7",
            MetaData: {
                CreateTime: "2014-09-11T14:42:05-07:00",
                LastUpdatedTime: "2014-09-11T14:42:05-07:00"
            }
        });
    }

    async getPaymentMethod(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getPaymentMethod(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findPaymentMethods(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findPaymentMethods(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Class
    async createClass(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createClass(
            {
                Name: "Bangladesh"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateClass(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateClass({
            FullyQualifiedName: "France",
            domain: "QBO",
            Name: "France",
            SyncToken: "1",
            SubClass: false,
            sparse: false,
            Active: true,
            Id: "5000000000000007280",
            MetaData: {
                CreateTime: "2015-07-22T13:57:27-07:00",
                LastUpdatedTime: "2015-07-22T13:57:27-07:00"
            }
        });
    }

    async getClass(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getClass(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findClasses(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findClasses(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    console.log(results.QueryResponse);
                    res.json(results.QueryResponse.Class);
                    console.log(results.QueryResponse.Class);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   quickbooks.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Account
    async createAccount(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createAccount(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateAccount(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateAccount({
            FullyQualifiedName: "Accounts Payable (A/P)",
            domain: "QBO",
            SubAccount: false,
            Description: "Description added during update.",
            Classification: "Liability",
            AccountSubType: "AccountsPayable",
            CurrentBalanceWithSubAccounts: -1091.23,
            sparse: false,
            MetaData: {
                CreateTime: "2014-09-12T10:12:02-07:00",
                LastUpdatedTime: "2015-06-30T15:09:07-07:00"
            },
            AccountType: "Accounts Payable",
            CurrentBalance: -1091.23,
            Active: true,
            SyncToken: "0",
            Id: "33",
            Name: "Accounts Payable (A/P)"
        });
    }

    async getAccount(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getAccount(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findAccounts(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findAccounts(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Account);
                    console.log(results.QueryResponse.Account);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   quickbooks.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Attachable
    async createAttachable(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createAttachable(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateAttachable(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateAttachable({
            SyncToken: "1",
            domain: "QBO",
            AttachableRef: [
                {
                    IncludeOnSend: false,
                    EntityRef: {
                        type: "Invoice",
                        value: "95"
                    }
                }
            ],
            Note: "This is an updated attached note.",
            sparse: false,
            Id: "5000000000000010341",
            MetaData: {
                CreateTime: "2015-11-17T11:05:15-08:00",
                LastUpdatedTime: "2015-11-17T11:05:15-08:00"
            }
        });
    }

    async getAttachable(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getAttachable(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findAttachables(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findAttachables(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    async deleteAttachable(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteAttachable(
            {
                SyncToken: "0",
                domain: "QBO",
                AttachableRef: [
                    {
                        IncludeOnSend: false,
                        EntityRef: {
                            type: "Invoice",
                            value: "95"
                        }
                    }
                ],
                Note: "This is an attached note.",
                sparse: false,
                Id: "200900000000000008541",
                MetaData: {
                    CreateTime: "2015-11-17T11:05:15-08:00",
                    LastUpdatedTime: "2015-11-17T11:05:15-08:00"
                }
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Bill
    async createBill(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createAttachable(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateBill(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateBill({
            DocNumber: "56789",
            SyncToken: "1",
            domain: "QBO",
            APAccountRef: {
                name: "Accounts Payable",
                value: "49"
            },
            VendorRef: {
                name: "Bayshore CalOil Service",
                value: "81"
            },
            TxnDate: "2014-04-04",
            TotalAmt: 200.0,
            CurrencyRef: {
                name: "United States Dollar",
                value: "USD"
            },
            PrivateNote: "This is a updated memo.",
            SalesTermRef: {
                value: "12"
            },
            DepartmentRef: {
                name: "Garden Services",
                value: "1"
            },
            DueDate: "2013-06-09",
            sparse: false,
            Line: [
                {
                    Description: "Gasoline",
                    DetailType: "AccountBasedExpenseLineDetail",
                    ProjectRef: {
                        value: "39298034"
                    },
                    Amount: 200.0,
                    Id: "1",
                    AccountBasedExpenseLineDetail: {
                        TaxCodeRef: {
                            value: "TAX"
                        },
                        AccountRef: {
                            name: "Automobile",
                            value: "75"
                        },
                        BillableStatus: "Billable",
                        CustomerRef: {
                            name: "Blackwell, Edward",
                            value: "20"
                        },
                        MarkupInfo: {
                            Percent: 10
                        }
                    }
                }
            ],
            Balance: 200.0,
            Id: "890",
            MetaData: {
                CreateTime: "2014-04-04T12:38:01-07:00",
                LastUpdatedTime: "2014-04-04T12:48:56-07:00"
            }
        });
    }

    async getBill(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getBill(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findBills(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findBills(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Bill);
                    console.log(results.QueryResponse.Bill);
                }
            }
        );
    }

    async deleteBill(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteBill(
            {
                SyncToken: "0",
                Id: "108"
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   quickbooks.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region BillPayment
    async createBillPayment(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createBillPayment(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateBillPayment(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateBillPayment({
            SyncToken: "2",
            domain: "QBO",
            VendorRef: {
                name: "Bob's Burger Joint",
                value: "56"
            },
            TxnDate: "2015-07-14",
            TotalAmt: 200.0,
            PayType: "Check",
            PrivateNote: "A new private note",
            sparse: false,
            Line: [
                {
                    Amount: 200.0,
                    LinkedTxn: [
                        {
                            TxnId: "234",
                            TxnType: "Bill"
                        }
                    ]
                }
            ],
            Id: "236",
            CheckPayment: {
                PrintStatus: "NeedToPrint",
                BankAccountRef: {
                    name: "Checking",
                    value: "35"
                }
            },
            MetaData: {
                CreateTime: "2015-07-14T12:34:04-07:00",
                LastUpdatedTime: "2015-07-14T13:17:22-07:00"
            }
        });
    }

    async getBillPayment(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getBillPayment(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findBillPayments(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findBillPayments(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.BillPayment);
                    console.log(results.QueryResponse.BillPayment);
                }
            }
        );
    }

    async deleteBillPayment(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteBillPayment(
            {
                SyncToken: "0",
                Id: "117"
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region CreditMemo
    async createCreditMemo(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createCreditMemo(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateCreditMemo(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateCreditMemo({
            TxnDate: "2014-09-02",
            domain: "QBO",
            PrintStatus: "NeedToPrint",
            TotalAmt: 100.0,
            RemainingCredit: 0,
            Line: [
                {
                    Description: "Pest Control Services",
                    DetailType: "SalesProductLineDetail",
                    SalesProductLineDetail: {
                        TaxCodeRef: {
                            value: "NON"
                        },
                        Qty: 1,
                        UnitPrice: 100,
                        ProductRef: {
                            name: "Pest Control",
                            value: "10"
                        }
                    },
                    LineNum: 1,
                    Amount: 100.0,
                    Id: "1"
                },
                {
                    DetailType: "SubTotalLineDetail",
                    Amount: 100.0,
                    SubTotalLineDetail: {}
                }
            ],
            ApplyTaxAfterDiscount: false,
            DocNumber: "1026",
            sparse: false,
            CustomerMemo: {
                value: "Another memo update."
            },
            ProjectRef: {
                value: "39298045"
            },
            Balance: 0,
            CustomerRef: {
                name: "Amy's Bird Sanctuary",
                value: "1"
            },
            TxnTaxDetail: {
                TotalTax: 0
            },
            SyncToken: "4",
            CustomField: [
                {
                    DefinitionId: "1",
                    Type: "StringType",
                    Name: "Crew #"
                }
            ],
            ShipAddr: {
                CountrySubDivisionCode: "CA",
                City: "Bayshore",
                PostalCode: "94326",
                Id: "108",
                Line1: "4581 Finch St."
            },
            EmailStatus: "NotSet",
            BillAddr: {
                Line4: "Bayshore, CA  94326",
                Line3: "4581 Finch St.",
                Id: "79",
                Line1: "Amy Lauterbach",
                Line2: "Amy's Bird Sanctuary"
            },
            MetaData: {
                CreateTime: "2014-09-18T12:51:27-07:00",
                LastUpdatedTime: "2015-07-01T09:16:28-07:00"
            },
            BillEmail: {
                Address: "Birds@Intuit.com"
            },
            Id: "73"
        });
    }

    async getCreditMemo(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getCreditMemo(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.CreditMemo);
                    console.log(results.QueryResponse.CreditMemo);
                }
            }
        );
    }
    async findCreditMemos(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findCreditMemos(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.CreditMemo);
                    console.log(results.QueryResponse.CreditMemo);
                }
            }
        );
    }

    async deleteCreditMemo(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteCreditMemo(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Department
    async createDepartment(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createDepartment(
            {
                Name: "Software Development"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateDepartment(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateDepartment({
            FullyQualifiedName: "Marketing Department",
            domain: "QBO",
            Name: "Support Department",
            SyncToken: "1",
            SubDepartment: false,
            sparse: false,
            Active: true,
            Id: "2",
            MetaData: {
                CreateTime: "2013-08-13T11:52:48-07:00",
                LastUpdatedTime: "2013-08-13T11:52:48-07:00"
            }
        });
    }

    async getDepartment(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getDepartment(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findDepartments(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findDepartments(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Department);
                    console.log(results.QueryResponse.Department);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Deposit
    async createDeposit(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createDeposit(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateDeposit(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateDeposit({
            SyncToken: "1",
            domain: "QBO",
            DepositToAccountRef: {
                name: "Checking",
                value: "35"
            },
            TxnDate: "2014-12-15",
            TotalAmt: 1675.52,
            sparse: false,
            Line: [
                {
                    Amount: 1675,
                    LinkedTxn: [
                        {
                            TxnLineId: "0",
                            TxnId: "120",
                            TxnType: "Payment"
                        }
                    ]
                }
            ],
            Id: "148",
            MetaData: {
                CreateTime: "2014-12-22T12:46:52-08:00",
                LastUpdatedTime: "2014-12-22T12:46:52-08:00"
            }
        });
    }

    async getDeposit(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getDeposit(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findDeposits(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findDeposits(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Deposit);
                    console.log(results.QueryResponse.Deposit);
                }
            }
        );
    }

    async deleteDeposit(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteDeposit(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Estimate
    async createEstimate(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createEstimate(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateEstimate(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateEstimate({
            TxnDate: "2014-09-07",
            domain: "QBO",
            PrintStatus: "NeedToPrint",
            TxnStatus: "Closed",
            TotalAmt: 582.5,
            Line: [
                {
                    Description: "Rock Fountain",
                    DetailType: "SalesProductLineDetail",
                    SalesProductLineDetail: {
                        TaxCodeRef: {
                            value: "NON"
                        },
                        Qty: 1,
                        UnitPrice: 275,
                        ProductRef: {
                            name: "Rock Fountain",
                            value: "5"
                        }
                    },
                    LineNum: 1,
                    Amount: 275.0,
                    Id: "1"
                },
                {
                    Description: "Custom Design",
                    DetailType: "SalesProductLineDetail",
                    SalesProductLineDetail: {
                        TaxCodeRef: {
                            value: "NON"
                        },
                        Qty: 3.5,
                        UnitPrice: 75,
                        ProductRef: {
                            name: "Design",
                            value: "4"
                        }
                    },
                    LineNum: 2,
                    Amount: 262.5,
                    Id: "2"
                },
                {
                    Description: "Fountain Pump",
                    DetailType: "SalesProductLineDetail",
                    SalesProductLineDetail: {
                        TaxCodeRef: {
                            value: "NON"
                        },
                        Qty: 2,
                        UnitPrice: 22.5,
                        ProductRef: {
                            name: "Pump",
                            value: "11"
                        }
                    },
                    LineNum: 3,
                    Amount: 45.0,
                    Id: "3"
                },
                {
                    DetailType: "SubTotalLineDetail",
                    Amount: 582.5,
                    SubTotalLineDetail: {}
                }
            ],
            ApplyTaxAfterDiscount: false,
            DocNumber: "1001",
            sparse: false,
            CustomerMemo: {
                value: "An updated memo via full update."
            },
            ProjectRef: {
                value: "39298033"
            },
            CustomerRef: {
                name: "Geeta Kalapatapu",
                value: "10"
            },
            TxnTaxDetail: {
                TotalTax: 0
            },
            SyncToken: "2",
            LinkedTxn: [
                {
                    TxnId: "103",
                    TxnType: "Invoice"
                }
            ],
            CustomField: [
                {
                    DefinitionId: "1",
                    Type: "StringType",
                    Name: "Crew #"
                }
            ],
            ShipAddr: {
                CountrySubDivisionCode: "CA",
                City: "Middlefield",
                PostalCode: "94303",
                Id: "119",
                Line1: "1987 Main St."
            },
            EmailStatus: "NotSet",
            BillAddr: {
                Line3: "Middlefield, CA  94303",
                Id: "59",
                Line1: "Geeta Kalapatapu",
                Line2: "1987 Main St."
            },
            MetaData: {
                CreateTime: "2014-09-17T11:20:06-07:00",
                LastUpdatedTime: "2015-07-24T14:08:04-07:00"
            },
            BillEmail: {
                Address: "Geeta@Kalapatapu.com"
            },
            Id: "41"
        });
    }

    async getEstimate(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getEstimate(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findEstimates(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findEstimates(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Estimate);
                    console.log(results.QueryResponse.Estimate);
                }
            }
        );
    }

    async deleteEstimate(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteEstimate(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Invoice
    async createInvoice(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createInvoice(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateInvoice(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateInvoice({
            TxnDate: "2015-07-24",
            domain: "QBO",
            PrintStatus: "NeedToPrint",
            TotalAmt: 150.0,
            Line: [
                {
                    LineNum: 1,
                    Amount: 150.0,
                    SalesProductLineDetail: {
                        TaxCodeRef: {
                            value: "NON"
                        },
                        ProductRef: {
                            name: "Services",
                            value: "1"
                        }
                    },
                    Id: "1",
                    DetailType: "SalesProductLineDetail"
                },
                {
                    DetailType: "SubTotalLineDetail",
                    Amount: 150.0,
                    SubTotalLineDetail: {}
                }
            ],
            DueDate: "2015-08-23",
            ApplyTaxAfterDiscount: false,
            DocNumber: "1070",
            sparse: false,
            CustomerMemo: {
                value: "Added customer memo."
            },
            ProjectRef: {
                value: "39298045"
            },
            Balance: 150.0,
            CustomerRef: {
                name: "Amy's Bird Sanctuary",
                value: "1"
            },
            TxnTaxDetail: {
                TotalTax: 0
            },
            SyncToken: "0",
            LinkedTxn: [],
            ShipAddr: {
                City: "Bayshore",
                Line1: "4581 Finch St.",
                PostalCode: "94326",
                Lat: "INVALID",
                Long: "INVALID",
                CountrySubDivisionCode: "CA",
                Id: "109"
            },
            EmailStatus: "NotSet",
            BillAddr: {
                City: "Bayshore",
                Line1: "4581 Finch St.",
                PostalCode: "94326",
                Lat: "INVALID",
                Long: "INVALID",
                CountrySubDivisionCode: "CA",
                Id: "2"
            },
            MetaData: {
                CreateTime: "2015-07-24T10:35:08-07:00",
                LastUpdatedTime: "2015-07-24T10:35:08-07:00"
            },
            CustomField: [
                {
                    DefinitionId: "1",
                    Type: "StringType",
                    Name: "Crew #"
                }
            ],
            Id: "239"
        });
    }

    async getInvoice(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getInvoice(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findInvoices(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findInvoices(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Invoice);
                    console.log(results.QueryResponse.Invoice);
                }
            }
        );
    }

    async deleteInvoice(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteInvoice(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region JournalCode
    async createJournalCode(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createJournalCode(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateJournalCode(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateJournalCode({
            SyncToken: "0",
            domain: "QBO",
            Name: "VT",
            sparse: false,
            Active: true,
            MetaData: {
                CreateTime: "2015-10-30T11:06:19-07:00",
                LastUpdatedTime: "2015-10-30T11:06:19-07:00"
            },
            Type: "Sales",
            Id: "2",
            Description: "An updated description"
        });
    }

    async getJournalCode(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getJournalCode(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findJournalCodes(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findJournalCodes(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    async deleteJournalCode(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteJournalCode(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region JournalEntry
    async createJournalEntry(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createJournalEntry(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateJournalEntry(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateJournalEntry({
            SyncToken: "1",
            domain: "QBO",
            TxnDate: "2015-06-29",
            sparse: false,
            Line: [
                {
                    JournalEntryLineDetail: {
                        PostingType: "Debit",
                        AccountRef: {
                            name: "Job Expenses:Job Materials:Fountain and Garden Lighting",
                            value: "65"
                        }
                    },
                    DetailType: "JournalEntryLineDetail",
                    Amount: 25.54,
                    Id: "0",
                    Description: "Updated description"
                },
                {
                    JournalEntryLineDetail: {
                        PostingType: "Credit",
                        AccountRef: {
                            name: "Notes Payable",
                            value: "44"
                        }
                    },
                    DetailType: "JournalEntryLineDetail",
                    Amount: 25.54,
                    Id: "1",
                    Description: "Sprinkler Hds - Sprinkler Hds Inventory Adjustment"
                }
            ],
            Adjustment: false,
            Id: "227",
            TxnTaxDetail: {},
            MetaData: {
                CreateTime: "2015-06-29T12:33:57-07:00",
                LastUpdatedTime: "2015-06-29T12:33:57-07:00"
            }
        });
    }

    async getJournalEntry(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getJournalEntry(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findJournalEntries(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findJournalEntries(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    async deleteJournalEntry(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteJournalEntry(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Payment
    async createPayment(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createPayment(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updatePayment(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updatePayment({
            SyncToken: "0",
            PaymentMethodRef: {
                value: "16"
            },
            ProjectRef: {
                value: "39298045"
            },
            PaymentRefNum: "123456",
            sparse: false,
            Line: [
                {
                    Amount: 300,
                    LinkedTxn: [
                        {
                            TxnId: "67",
                            TxnType: "Invoice"
                        }
                    ]
                },
                {
                    Amount: 300,
                    LinkedTxn: [
                        {
                            TxnId: "68",
                            TxnType: "CreditMemo"
                        }
                    ]
                }
            ],
            CustomerRef: {
                value: "16"
            },
            Id: "69",
            MetaData: {
                CreateTime: "2013-03-13T14:49:21-07:00",
                LastUpdatedTime: "2013-03-13T14:49:21-07:00"
            }
        });
    }

    async getPayment(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getPayment(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findPayments(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findPayments(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Payment);
                    console.log(results.QueryResponse.Payment);
                }
            }
        );
    }

    async deletePayment(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deletePayment(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Purchase
    async createPurchase(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createPurchase(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updatePurchase(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updatePurchase({
            SyncToken: "1",
            domain: "QBO",
            PurchaseEx: {
                any: [
                    {
                        name: "{http://schema.intuit.com/finance/v3}NameValue",
                        nil: false,
                        value: {
                            Name: "TxnType",
                            Value: "54"
                        },
                        declaredType: "com.intuit.schema.finance.v3.NameValue",
                        scope: "javax.xml.bind.JAXBElement$GlobalScope",
                        globalScope: true,
                        typeSubstituted: false
                    }
                ]
            },
            TxnDate: "2015-07-27",
            TotalAmt: 10.0,
            PrivateNote: "Added an updated private note via update.",
            PaymentType: "Cash",
            sparse: false,
            Line: [
                {
                    DetailType: "AccountBasedExpenseLineDetail",
                    Amount: 10.0,
                    ProjectRef: {
                        value: "42991284"
                    },
                    Id: "1",
                    AccountBasedExpenseLineDetail: {
                        TaxCodeRef: {
                            value: "NON"
                        },
                        AccountRef: {
                            name: "Meals and Entertainment",
                            value: "13"
                        },
                        BillableStatus: "NotBillable"
                    }
                }
            ],
            AccountRef: {
                name: "Checking",
                value: "35"
            },
            CustomField: [],
            Id: "252",
            MetaData: {
                CreateTime: "2015-07-27T10:37:26-07:00",
                LastUpdatedTime: "2015-07-27T10:42:11-07:00"
            }
        });
    }

    async getPurchase(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getPurchase(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findPurchases(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findPurchases(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Purchase);
                    console.log(results.QueryResponse.Purchase);
                }
            }
        );
    }

    async deletePurchase(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deletePurchase(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region PurchaseOrder
    async createPurchaseOrder(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createPurchaseOrder(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updatePurchaseOrder(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updatePurchaseOrder({
            DocNumber: "1005",
            SyncToken: "0",
            POEmail: {
                Address: "send_email@intuit.com"
            },
            APAccountRef: {
                name: "Accounts Payable (A/P)",
                value: "33"
            },
            CurrencyRef: {
                name: "United States Dollar",
                value: "USD"
            },
            sparse: false,
            TxnDate: "2015-07-28",
            TotalAmt: 25.0,
            ShipAddr: {
                Line4: "Half Moon Bay, CA  94213",
                Line3: "65 Ocean Dr.",
                Id: "121",
                Line1: "Grace Pariente",
                Line2: "Cool Cars"
            },
            PrivateNote: "This is a private note added during update.",
            Id: "257",
            POStatus: "Open",
            domain: "QBO",
            VendorRef: {
                name: "Hicks Hardware",
                value: "41"
            },
            Line: [
                {
                    DetailType: "ProductBasedExpenseLineDetail",
                    Amount: 25.0,
                    ProjectRef: {
                        value: "39298034"
                    },
                    Id: "1",
                    ProductBasedExpenseLineDetail: {
                        ProductRef: {
                            name: "Garden Supplies",
                            value: "38"
                        },
                        CustomerRef: {
                            name: "Cool Cars",
                            value: "3"
                        },
                        Qty: 1,
                        TaxCodeRef: {
                            value: "NON"
                        },
                        BillableStatus: "NotBillable",
                        UnitPrice: 25
                    }
                }
            ],
            CustomField: [
                {
                    DefinitionId: "1",
                    Type: "StringType",
                    Name: "Crew #"
                },
                {
                    DefinitionId: "2",
                    Type: "StringType",
                    Name: "Sales Rep"
                }
            ],
            VendorAddr: {
                Line4: "Middlefield, CA  94303",
                Line3: "42 Main St.",
                Id: "120",
                Line1: "Geoff Hicks",
                Line2: "Hicks Hardware"
            },
            MetaData: {
                CreateTime: "2015-07-28T16:01:47-07:00",
                LastUpdatedTime: "2015-07-28T16:01:47-07:00"
            }
        });
    }

    async getPurchaseOrder(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getPurchaseOrder(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.PurchaseOrder);
                    console.log(results.QueryResponse.PurchaseOrder);
                }
            }
        );
    }
    async findPurchaseOrders(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findPurchaseOrders(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.PurchaseOrder);
                    console.log(results.QueryResponse.PurchaseOrder);
                }
            }
        );
    }

    async deletePurchaseOrder(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deletePurchaseOrder(
            {
                SyncToken: "0",
                Id: "125"
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region RefundReceipt
    async createRefundReceipt(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createRefundReceipt(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateRefundReceipt(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateRefundReceipt({
            TxnDate: "2014-09-17",
            domain: "QBO",
            PrintStatus: "NotSet",
            TotalAmt: 87.5,
            Line: [
                {
                    Description: "Refund - Pest control was ineffective",
                    DetailType: "SalesProductLineDetail",
                    SalesProductLineDetail: {
                        TaxCodeRef: {
                            value: "NON"
                        },
                        Qty: 2.5,
                        UnitPrice: 35,
                        ProductRef: {
                            name: "Pest Control",
                            value: "10"
                        }
                    },
                    LineNum: 1,
                    Amount: 87.5,
                    Id: "1"
                },
                {
                    DetailType: "SubTotalLineDetail",
                    Amount: 87.5,
                    SubTotalLineDetail: {}
                }
            ],
            ApplyTaxAfterDiscount: false,
            DocNumber: "1020",
            sparse: false,
            DepositToAccountRef: {
                name: "Checking",
                value: "35"
            },
            CustomerMemo: {
                value: "Updated customer memo"
            },
            ProjectRef: {
                value: "39298034"
            },
            Balance: 0,
            CustomerRef: {
                name: "Pye's Cakes",
                value: "15"
            },
            TxnTaxDetail: {
                TotalTax: 0
            },
            SyncToken: "0",
            PaymentMethodRef: {
                name: "Check",
                value: "2"
            },
            CustomField: [
                {
                    DefinitionId: "1",
                    Type: "StringType",
                    Name: "Crew #"
                }
            ],
            ShipAddr: {
                City: "South Orange",
                Line1: "350 Mountain View Dr.",
                PostalCode: "07079",
                Lat: "40.7633073",
                Long: "-74.2426072",
                CountrySubDivisionCode: "NJ",
                Id: "15"
            },
            BillAddr: {
                Line4: "South Orange, NJ  07079",
                Line3: "350 Mountain View Dr.",
                Line2: "Pye's Cakes",
                Line1: "Karen Pye",
                Long: "-74.2609903",
                Lat: "40.7489277",
                Id: "73"
            },
            MetaData: {
                CreateTime: "2014-09-17T15:35:07-07:00",
                LastUpdatedTime: "2014-09-17T15:35:07-07:00"
            },
            BillEmail: {
                Address: "pyescakes@intuit.com"
            },
            Id: "66"
        });
    }

    async getRefundReceipt(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getRefundReceipt(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findRefundReceipts(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findRefundReceipts(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    async deleteRefundReceipt(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteRefundReceipt(
            {
                SyncToken: "0",
                Id: "66"
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region SalesReceipt
    async createSalesReceipt(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createSalesReceipt(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateSalesReceipt(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateSalesReceipt({
            TxnDate: "2014-09-14",
            domain: "QBO",
            PrintStatus: "NotSet",
            PaymentRefNum: "10264",
            TotalAmt: 337.5,
            Line: [
                {
                    Description: "Custom Design",
                    DetailType: "SalesProductLineDetail",
                    SalesProductLineDetail: {
                        TaxCodeRef: {
                            value: "NON"
                        },
                        Qty: 4.5,
                        UnitPrice: 75,
                        ProductRef: {
                            name: "Design",
                            value: "4"
                        }
                    },
                    LineNum: 1,
                    Amount: 337.5,
                    Id: "1"
                },
                {
                    DetailType: "SubTotalLineDetail",
                    Amount: 337.5,
                    SubTotalLineDetail: {}
                }
            ],
            ApplyTaxAfterDiscount: false,
            DocNumber: "1003",
            sparse: false,
            DepositToAccountRef: {
                name: "Checking",
                value: "35"
            },
            CustomerMemo: {
                value: "An updated customer memo."
            },
            ProjectRef: {
                value: "39298243"
            },
            Balance: 0,
            CustomerRef: {
                name: "Dylan Sollfrank",
                value: "6"
            },
            TxnTaxDetail: {
                TotalTax: 0
            },
            SyncToken: "0",
            PaymentMethodRef: {
                name: "Check",
                value: "2"
            },
            EmailStatus: "NotSet",
            BillAddr: {
                Lat: "INVALID",
                Long: "INVALID",
                Id: "49",
                Line1: "Dylan Sollfrank"
            },
            MetaData: {
                CreateTime: "2014-09-16T14:59:48-07:00",
                LastUpdatedTime: "2014-09-16T14:59:48-07:00"
            },
            CustomField: [
                {
                    DefinitionId: "1",
                    Type: "StringType",
                    Name: "Crew #"
                }
            ],
            Id: "11"
        });
    }

    async getSalesReceipt(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getSalesReceipt(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findSalesReceipts(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findSalesReceipts(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    async deleteSalesReceipt(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteSalesReceipt(
            {
                SyncToken: "1",
                Id: "98"
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region TaxAgency
    async createTaxAgency(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createTaxAgency(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateTaxAgency(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateTaxAgency({
            FullyQualifiedName: "Accounts Payable (A/P)",
            domain: "QBO",
            SubAccount: false,
            Description: "Description added during update.",
            Classification: "Liability",
            AccountSubType: "AccountsPayable",
            CurrentBalanceWithSubAccounts: -1091.23,
            sparse: false,
            MetaData: {
                CreateTime: "2014-09-12T10:12:02-07:00",
                LastUpdatedTime: "2015-06-30T15:09:07-07:00"
            },
            AccountType: "Accounts Payable",
            CurrentBalance: -1091.23,
            Active: true,
            SyncToken: "0",
            Id: "33",
            Name: "Accounts Payable (A/P)"
        });
    }
    async updateTaxCode(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateTaxCode({
            FullyQualifiedName: "Accounts Payable (A/P)",
            domain: "QBO",
            SubAccount: false,
            Description: "Description added during update.",
            Classification: "Liability",
            AccountSubType: "AccountsPayable",
            CurrentBalanceWithSubAccounts: -1091.23,
            sparse: false,
            MetaData: {
                CreateTime: "2014-09-12T10:12:02-07:00",
                LastUpdatedTime: "2015-06-30T15:09:07-07:00"
            },
            AccountType: "Accounts Payable",
            CurrentBalance: -1091.23,
            Active: true,
            SyncToken: "0",
            Id: "33",
            Name: "Accounts Payable (A/P)"
        });
    }
    async updateTaxRate(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateTaxRate({
            FullyQualifiedName: "Accounts Payable (A/P)",
            domain: "QBO",
            SubAccount: false,
            Description: "Description added during update.",
            Classification: "Liability",
            AccountSubType: "AccountsPayable",
            CurrentBalanceWithSubAccounts: -1091.23,
            sparse: false,
            MetaData: {
                CreateTime: "2014-09-12T10:12:02-07:00",
                LastUpdatedTime: "2015-06-30T15:09:07-07:00"
            },
            AccountType: "Accounts Payable",
            CurrentBalance: -1091.23,
            Active: true,
            SyncToken: "0",
            Id: "33",
            Name: "Accounts Payable (A/P)"
        });
    }
    async getTaxAgency(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getTaxAgency(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findTaxAgencies(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findTaxAgencies(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    async findTaxCodes(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findTaxCodes(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    async findTaxRates(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findTaxRates(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region TaxService
    async createTaxService(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createTaxService(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async getTaxCode(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getTaxCode(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async getTaxRate(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getTaxRate(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }

    //#endregion

    //#region Term
    async createTerm(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createTerm(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateTerm(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateTerm({
            SyncToken: "0",
            domain: "QBO",
            Name: "Net 30",
            DiscountPercent: 0,
            DiscountDays: 10,
            Type: "STANDARD",
            sparse: false,
            Active: true,
            DueDays: 30,
            Id: "3",
            MetaData: {
                CreateTime: "2014-09-11T14:41:49-07:00",
                LastUpdatedTime: "2014-09-11T14:41:49-07:00"
            }
        });
    }

    async getTerm(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getTerm(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findTerms(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findTerms(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region TimeActivity
    async createTimeActivity(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createTimeActivity(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateTimeActivity(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateTimeActivity({
            TxnDate: "2014-09-16",
            domain: "QBO",
            NameOf: "Employee",
            Description: "Updated descirption",
            ProductRef: {
                name: "Design",
                value: "4"
            },
            Minutes: 0,
            ProjectRef: {
                value: "39298005"
            },
            Hours: 5,
            BillableStatus: "Billable",
            sparse: false,
            HourlyRate: 75,
            Taxable: false,
            EmployeeRef: {
                name: "John Johnson",
                value: "54"
            },
            SyncToken: "0",
            CustomerRef: {
                name: "Amy's Bird Sanctuary",
                value: "1"
            },
            Id: "3",
            MetaData: {
                CreateTime: "2014-09-17T11:53:15-07:00",
                LastUpdatedTime: "2014-09-17T11:53:15-07:00"
            }
        });
    }

    async getTimeActivity(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getTimeActivity(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findTimeActivities(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findTimeActivities(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    async deleteTimeActivity(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteTimeActivity(
            {
                SyncToken: "0",
                Id: "5"
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    // async findCustomers(req: any,res: any, userPayload: UserInterface) {
    //   qboobject.findCustomers([
    //     { field: 'fetchAll', value: true },
    //     { field: 'FamilyName', value: 'S%', operator: 'LIKE' }
    //   ], function (e, customers) {
    //     console.log(customers)
    //   })
    // }

    //#endregion

    //#region Transfer
    async createTransfer(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createTransfer(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateTransfer(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateTransfer({
            SyncToken: "0",
            domain: "QBO",
            TxnDate: "2015-02-06",
            ToAccountRef: {
                name: "Savings",
                value: "36"
            },
            Amount: 550.0,
            sparse: false,
            Id: "170",
            FromAccountRef: {
                name: "Checking",
                value: "35"
            },
            MetaData: {
                CreateTime: "2015-02-06T11:06:12-08:00",
                LastUpdatedTime: "2015-02-06T11:06:12-08:00"
            }
        });
    }

    async deleteTransfer(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteTransfer(
            {
                SyncToken: "2",
                domain: "QBO",
                TxnDate: "2015-02-06",
                ToAccountRef: {
                    name: "Savings",
                    value: "36"
                },
                Amount: 6600.0,
                sparse: false,
                Id: "170",
                FromAccountRef: {
                    name: "Checking",
                    value: "35"
                }
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    //#endregion

    //#region VendorCredit
    async createVendorCredit(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.createVendorCredit(
            {
                Name: "MyJobs_test sdfsdasd",
                AccountType: "Accounts Receivable"
            },
            function (err, Product) {
                res.json(Product);
                console.log(Product.Id);
            }
        );
    }

    async updateVendorCredit(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateVendorCredit({
            SyncToken: "1",
            domain: "QBO",
            VendorRef: {
                name: "Books by Bessie",
                value: "30"
            },
            TxnDate: "2014-12-23",
            TotalAmt: 140.0,
            APAccountRef: {
                name: "Accounts Payable (A/P)",
                value: "33"
            },
            sparse: false,
            Line: [
                {
                    DetailType: "AccountBasedExpenseLineDetail",
                    Amount: 140.0,
                    ProjectRef: {
                        value: "39298045"
                    },
                    Id: "1",
                    AccountBasedExpenseLineDetail: {
                        TaxCodeRef: {
                            value: "TAX"
                        },
                        AccountRef: {
                            name: "Bank Charges",
                            value: "8"
                        },
                        BillableStatus: "Billable",
                        CustomerRef: {
                            name: "Amy's Bird Sanctuary",
                            value: "1"
                        }
                    }
                }
            ],
            Id: "255",
            MetaData: {
                CreateTime: "2015-07-28T14:13:30-07:00",
                LastUpdatedTime: "2015-07-28T14:22:05-07:00"
            }
        });
    }

    async getVendorCredit(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getVendorCredit(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Product);
                    console.log(results.QueryResponse.Product);
                }
            }
        );
    }
    async findVendorCredits(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findVendorCredits(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.VendorCredit);
                    console.log(results.QueryResponse.VendorCredit);
                }
            }
        );
    }
    async deleteVendorCredit(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.deleteVendorCredit(
            {
                SyncToken: "0",
                Id: "13"
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    async findExchangeRates(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findExchangeRates(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    async getExchangeRate(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getExchangeRate(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    async updateExchangeRate(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updateExchangeRate(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    //#endregion

    //#region Prferences

    async findPreferenceses(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findPreferenceses(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    async getPreferences(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getPreferences(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }

    async updatePreferences(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.updatePreferences(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    //#endregion

    //#region Budgets

    async findBudgets(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.findBudgets(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    //#endregion

    //#region Reports

    async getReports(req: any,res: any, userPayload: UserInterface) {
        let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qboobject = new QuickBooks(
            clientkey,
            clientsecret,
            organizationinforamtion.accessToken,
            false, // no token secret for oAuth 2.0
            organizationinforamtion.realmeID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null for the latest version
            "2.0", //oAuth version
            organizationinforamtion.refreshToken
        );
        qboobject.getReports(
            {
                fetchAll: true
            },
            (err, results) => {
                if (err) {
                    console.error(err);
                    res.send("Error while fetching data from QuickBooks");
                } else {
                    res.json(results.QueryResponse.Customer);
                    console.log(results.QueryResponse.Customer);
                }
            }
        );
    }
    //#endregion
}
