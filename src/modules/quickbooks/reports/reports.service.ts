import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as OAuthClient from "intuit-oauth";
import * as QuickBooks from "node-quickbooks";
import { UserInterface } from "src/authentication/common/interfaces";
import { OrganizationEntity } from "src/entities";
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
export class ReportService {
  constructor( @InjectRepository(OrganizationEntity)
        private organizationEntityRepository: BaseRepository<OrganizationEntity>) {}

  //{department: '1,4,7'},
  // Reports Module Start
  async reportBalanceSheet(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    
    qbo.reportBalanceSheet(function (err, balanceSheet) {
      res.json(balanceSheet);
    });
  }

  async reportProfitAndLoss(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportProfitAndLoss(function (err, reportProfitAndLoss) {
      res.json(reportProfitAndLoss);
    });
  }

  async reportProfitAndLossDetail(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportProfitAndLossDetail(function (err, reportProfitAndLossDetail) {
      res.json(reportProfitAndLossDetail);
    });
  }

  async reportTrialBalance(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportTrialBalance(function (err, reportTrialBalance) {
      res.json(reportTrialBalance);
    });
  }

  async reportCashFlow(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportCashFlow(function (err, reportCashFlow) {
      res.json(reportCashFlow);
    });
  }

  async reportInventoryValuationSummary(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportInventoryValuationSummary(
      function (err, reportInventoryValuationSummary) {
        res.json(reportInventoryValuationSummary);
      }
    );
  }

  async reportCustomerSales(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportCustomerSales(function (err, reportCustomerSales) {
      res.json(reportCustomerSales);
    });
  }

  async reportProductSales(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportProductSales(function (err, reportProductSales) {
      res.json(reportProductSales);
    });
  }

  async reportCustomerIncome(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportCustomerIncome(function (err, reportCustomerIncome) {
      res.json(reportCustomerIncome);
    });
  }

  async reportCustomerBalance(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportCustomerBalance(function (err, reportCustomerBalance) {
      res.json(reportCustomerBalance);
    });
  }

  async reportCustomerBalanceDetail(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportCustomerBalanceDetail(
      function (err, reportCustomerBalanceDetail) {
        res.json(reportCustomerBalanceDetail);
      }
    );
  }

  async reportAgedReceivables(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportAgedReceivables(function (err, reportAgedReceivables) {
      res.json(reportAgedReceivables);
    });
  }

  async reportAgedReceivableDetail(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportAgedReceivableDetail(function (err, reportAgedReceivableDetail) {
      res.json(reportAgedReceivableDetail);
    });
  }

  async reportVendorBalance(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportVendorBalance(function (err, reportVendorBalance) {
      res.json(reportVendorBalance);
    });
  }

  async reportVendorBalanceDetail(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportVendorBalanceDetail(function (err, reportVendorBalanceDetail) {
      res.json(reportVendorBalanceDetail);
    });
  }

  async reportAgedPayables(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportAgedPayables(function (err, reportAgedPayables) {
      res.json(reportAgedPayables);
    });
  }

  async reportAgedPayableDetail(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportAgedPayableDetail(function (err, reportAgedPayableDetail) {
      res.json(reportAgedPayableDetail);
    });
  }

  async reportVendorExpenses(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportVendorExpenses(function (err, reportVendorExpenses) {
      res.json(reportVendorExpenses);
    });
  }

  async reportTransactionList(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportTransactionList(function (err, reportTransactionList) {
      res.json(reportTransactionList);
    });
  }

  async reportGeneralLedgerDetail(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportGeneralLedgerDetail(function (err, reportGeneralLedgerDetail) {
      res.json(reportGeneralLedgerDetail);
    });
  }

  async reportDepartmentSales(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportDepartmentSales(function (err, reportDepartmentSales) {
      res.json(reportDepartmentSales);
    });
  }

  async reportClassSales(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportClassSales(function (err, reportClassSales) {
      res.json(reportClassSales);
    });
  }

  // all pdfs module
  async getInvoicePdf(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.getInvoicePdf(function (err, getInvoicePdf) {
      res.json(getInvoicePdf);
    });
  }

  async getCreditMemoPdf(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.getCreditMemoPdf(function (err, getCreditMemoPdf) {
      res.json(getCreditMemoPdf);
    });
  }

  async getSalesReceiptPdf(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.getSalesReceiptPdf(function (err, getSalesReceiptPdf) {
      res.json(getSalesReceiptPdf);
    });
  }

  async sendInvoicePdf(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.sendInvoicePdf(function (err, sendInvoicePdf) {
      res.json(sendInvoicePdf);
    });
  }

  async sendCreditMemoPdf(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.sendCreditMemoPdf(function (err, sendCreditMemoPdf) {
      res.json(sendCreditMemoPdf);
    });
  }

  async sendSalesReceiptPdf(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.sendSalesReceiptPdf(function (err, sendSalesReceiptPdf) {
      res.json(sendSalesReceiptPdf);
    });
  }

  async sendEstimatePdf(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  //Purchase Order Email
  async sendPurchaseOrder(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.sendPurchaseOrder(function (err, sendPurchaseOrder) {
      res.json(sendPurchaseOrder);
    });
  }

  //Miscellaneous
  async batch(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.batch(function (err, batch) {
      res.json(batch);
    });
  }

  async changeDataCapture(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.changeDataCapture(function (err, changeDataCapture) {
      res.json(changeDataCapture);
    });
  }

  async upload(req: any, res: any, userPayload: UserInterface) {
    let organizationinforamtion = await this.organizationEntityRepository.findOne({
            where: { id: userPayload.organizationId }
        })
        const qbo = new QuickBooks(
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
    qbo.upload(function (err, upload) {
      res.json(upload);
    });
  }
}
