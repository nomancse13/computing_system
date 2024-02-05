import { Injectable } from "@nestjs/common";
import * as OAuthClient from "intuit-oauth";
import * as QuickBooks from "node-quickbooks";
// const clientkey = 'AB3q66Ol9QRmEo0Zfcpk1hCrOCCIeCwn7hsOXjySjsHVmK1VuD';
// const clientsecret = 'KGF6OovhUUD2YbJelK3Zxl9EuB2oR2qxuwqhBchk';

const clientkey = "ABRoX6kGjKAjh12zpIoOn5h0qpWBweLeab2z5Q6TfTbMl8vwyz";
const clientsecret = "ZD7Uod6VHxnVekQST0rWmbzf7xBcROVTPfSx7i4A";

const oauthClient = new OAuthClient({
  clientId: clientkey,
  clientSecret: clientsecret,
  environment: "sandbox" || "production",
  redirectUri: "http://localhost:4000/api/v1/user/callback"
});

const qbo = new QuickBooks(
  "ABRoX6kGjKAjh12zpIoOn5h0qpWBweLeab2z5Q6TfTbMl8vwyz",
  "ZD7Uod6VHxnVekQST0rWmbzf7xBcROVTPfSx7i4A",
  "eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..fOM4pu7paS1kl-BelMnngw.sDjfzpOcgAgyaL9loPy9pXhHcko-lupvH0tdp9aS-NFNuF7kvGHigUSIy5AW5jq1YEC_Q_BaggwNpkmixin1cbruLOrXUGvtj43jRGzc4WCVJN7ECxVO7JR8ONXFb102l9MBWcWSWTL5tuUw7s0YIjSH4R7QEbajPp8-BiwjSdANBtsI9-UQkqKolo-vfYkkETqXiTh00jsayVdh6MWxZE07Q3Vl-Fgx2qEL35yxOj5g5YoMX6G4fyljoN5Lpobr_JtieLrjjAlZ6Ku4c2ABDUIYkgyDnSyjqgjcQ1jj0y08axaTjYvaz88pficZDGhmTSou3u69mu_YaRv6NpUESWzpR7mXIPe758ua2sA98sZWgOg1Gty_rCbkzP3H0XA3ql2WQ5so-u4b6W6f7N_tjU3tz4AmCSRoho6SNpa1iQI1_3YIPG4TlP7Q-gDK2l36q2CqBJFIwK1TWxUIPl4VzNsBKEYFp5a7ifbR34to-8EjjuIGcf4SM3EsEUJ2R0lksC1KUkth1PCm1QfWT2o7NsWyg7fjxehBrG_vWNbifmYyhC1kdg3HJCsyDEfwTJS9xlBU9k78olR3PiiegLPo7lWFoXcjC-wWI_S8C4IrHrVZ9r1-F6jInQL7Dyzr64beiwgpuibPJdf0wfbhHyVsH9yfo4Et0KUeNOHG65_VFss2dImwxJQX5D_CabdN7po1e7VrPpLpSqM9pNig6phVglIqPCD6sajIQUCyQ783h5kplpurNSsbd5N_CqFwjB-m.4n4aFJAaeAdbbhlQpdE-RQ",
  false, // no token secret for oAuth 2.0
  "4620816365323081980",
  true, // use the sandbox?
  true, // enable debugging?
  null, // set minorversion, or null for the latest version
  "2.0", //oAuth version
  "AB1170892115806tZJChWkXEBjTFmI7IHcNT87hrwngni29bbJ"
);

let qbtoken: any;
@Injectable()
export class BillQuickBooksService {
  constructor() {}
  async createBill(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createBillPayment(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  // end create module

  async getBill(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getBillPayment(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  //update module
  async updateBill(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateBillPayment(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  //delete module

  async deleteBillPayment(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  // Query Module Start

  async findBills(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findBillPayments(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }
}
