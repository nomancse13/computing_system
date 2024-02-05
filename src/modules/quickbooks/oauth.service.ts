import { Injectable } from "@nestjs/common";
import * as OAuthClient from "intuit-oauth";
import * as QuickBooks from "node-quickbooks";
// const clientkey = 'AB3q66Ol9QRmEo0Zfcpk1hCrOCCIeCwn7hsOXjySjsHVmK1VuD';
// const clientsecret = 'KGF6OovhUUD2YbJelK3Zxl9EuB2oR2qxuwqhBchk';

const clientkey = "ABJ1OolGzbp9uYL16HO4oYoW061MsQx0OD54NVtpjxSnDE5fLg";
const clientsecret = "EeRADJ2JJt2H9RnHFIcXGiRJGgkoPRrgflpboIOm";

const oauthClient = new OAuthClient({
  clientId: clientkey,
  clientSecret: clientsecret,
  environment: "sandbox" || "production",
  redirectUri: "http://localhost:4000/api/v1/user/callback"
});

const qbo = new QuickBooks("ABJ1OolGzbp9uYL16HO4oYoW061MsQx0OD54NVtpjxSnDE5fLg",
    "EeRADJ2JJt2H9RnHFIcXGiRJGgkoPRrgflpboIOm",
    "eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..TAU8T1E7id9kQ_XT0vXFfg.rttSSzbcOKTh4fxVHuOooyQ33y3vGlcL4KEYIkzLsnbz0QOEYIPnZJDcETkIEA38tWvuEv9y9awgJlbjDJggEWEUCGfNzdiqvvNBOjzl5VNF5ar0f3PCeoegFrw-JHDDAGZHLevxI10Gsr67-0TDEu45O5IW8uJJQ2TXza7e2ubES2yt45pQKr2OmqGr4npolGeNG6D43mBjXS1NF9jWU5w3nY6MO2vl5mRc3hIyA0mUE2hjW_7hJamcatUeKigM2feUr3HQqwAmmFwVVFOO1-LfKSggKn6DmAyezIhbjvRysPnOB60fEBY5c7P3katHy0NkgZpynwHCibKseEmJGawlL1kkhxg0F4XcpZI4DobIJpmTNaYNTZX9rPNZ-S_5B3LIBL-aNajk7C4fuf5UUMSProsQ1IXYA8z5Pj-i_1kVjSXDaCqbB_YhpeJObW2zkn6ep3ZTobikz55jI1Z1255B5H51k6fnhlpLujBGKnb-5WBzJifRT05UCZSE8parSzeR-dtXMeRGiP248FpZWJ1faZBrUluMLIJ4PwWeHBcXLCxx_ocSKviBk3UcVj03EBDcW_mNKLLlE1onmCvuAT2c6YG_UGW-jkakefAL5vqjdqImUjFgXJve6g6t39WN7bGmiZdYfSjjoieHESBkjgJqeLADCetmWE_yQkSr97GDPXPX3lvTy-1eQ0FnqVzsEsG4ajYyUPD308MWAWjHkf4U3D7Uxkbr1ZjZvBrBxLa1Z984Z5EKjYXmsHbZ7ayJ.KcYz97FF-C3vkgOxM_-xBw",
    false, // no token secret for oAuth 2.0
    '4620816365359739210',
    true, // use the sandbox?
    true, // enable debugging?
    null, // set minorversion, or null for the latest version
    '2.0', //oAuth version
    "AB11710255665tLMcYJLA7MVhLcDkEXgx854BBuoeSikzwKhe8");

let qbtoken: any;
@Injectable()
export class QAuthService {
  constructor() {}
  async intuitAuthentication(req: any, res: any) {
    // AuthorizationUri
    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: "testState"
    }); // can be an array of multiple scopes ex : {scope:[OAuthClient.scopes.Accounting,OAuthClient.scopes.OpenId]}
    console.log(authUri);

    //res.redirect(authUri);
    res.send(authUri);
    // Exchange the auth code retrieved from the **req.url** on the redirectUri

    // oauthClient.refresh()
    //     .then(function (authResponse) {
    //         console.log('Tokens refreshed : ' + JSON.stringify(authResponse.json()));
    //     })
    //     .catch(function (e) {
    //         console.error("The error message is :" + e.originalMessage);
    //         console.error(e.intuit_tid);
    //     });
  }

  async callback(req: any, res: any) {
    const parseRedirect = req.url;
    console.log("parseRedirect: " + parseRedirect);
    oauthClient
      .createToken(parseRedirect)
      .then(function (authResponse) {
        //console.log()
        // console.log('The Token is  ' + JSON.stringify(authResponse.getJson()));
        res.send("Successfully connected to QuickBooks!");
        qbtoken = JSON.stringify(authResponse.getJson());
        console.log("qbtoken: ");
        const tokenvalue = JSON.parse(qbtoken);
        qbtoken = tokenvalue;

        console.log("qbtoken: " + tokenvalue.access_token);
      })
      .catch(function (e) {
        console.error("The error message is :" + e.originalMessage);
        console.error(e.intuit_tid);
        res.send("Error while getting the token");
      });
  }
  async refreshtoken(req: any, res: any) {
    oauthClient
      .refresh()
      .then(function (authResponse) {
        console.log(
          "Tokens refreshed : " + JSON.stringify(authResponse.json())
        );
        res.send("Tokens refreshed : " + JSON.stringify(authResponse.json()));
      })
      .catch(function (e) {
        console.error("The error message is :" + e.originalMessage);
        console.error(e.intuit_tid);
        res.send("The error message is :" + e.originalMessage);
      });
  }

  async invoicedata(req: any, res: any) {
    qbo.findInvoices(
      {
        fetchAll: true
      },
      (err, results) => {
        if (err) {
          console.error(err);
          res.send("Error while fetching data from QuickBooks");
        } else {
          res.json(results.QueryResponse.Invoice);
        }
      }
    );
  }

  async customerdata(req: any, res: any) {
    qbo.findCustomers(
      {
        fetchAll: true
      },
      function (e, customers) {
        res.json(customers);
      }
    );
  }

  async balancesheetreport(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createAccount(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createAttachable(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

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

  async createClass(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createCreditMemo(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createCustomer(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createDepartment(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createDeposit(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createEmployee(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createEstimate(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createInvoice(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createProduct(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createJournalCode(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createJournalEntry(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createPayment(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createPaymentMethod(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createPurchase(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createPurchaseOrder(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createRefundReceipt(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createSalesReceipt(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createTaxAgency(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createTaxService(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createTerm(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createTimeActivity(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createTransfer(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createVendor(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async createVendorCredit(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }
  // end create module

  // start read module

  async getAccount(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getAttachable(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getClass(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getCompanyInfo(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getCreditMemo(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getCustomer(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getDepartment(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getDeposit(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getEmployee(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getEstimate(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getExchangeRate(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getInvoice(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getProduct(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getJournalCode(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getJournalEntry(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getPayment(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getPaymentMethod(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getPreferences(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getPurchase(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getPurchaseOrder(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getRefundReceipt(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getReports(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getSalesReceipt(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getTaxAgency(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getTaxCode(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getTaxRate(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getTerm(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getTimeActivity(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getVendor(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getVendorCredit(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

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
  async updateAccount(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateAttachable(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

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

  async updateClass(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateCompanyInfo(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateCreditMemo(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateCustomer(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateDepartment(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateDeposit(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateEmployee(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateEstimate(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateInvoice(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateProduct(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateJournalCode(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateJournalEntry(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updatePayment(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updatePaymentMethod(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updatePreferences(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updatePurchase(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updatePurchaseOrder(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateRefundReceipt(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateSalesReceipt(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateTaxAgency(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateTaxCode(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateTaxRate(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateTerm(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateTimeActivity(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateTransfer(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateVendor(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateVendorCredit(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async updateExchangeRate(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  //delete module
  async deleteAttachable(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteBill(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteBillPayment(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteCreditMemo(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteDeposit(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteEstimate(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteInvoice(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteJournalCode(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteJournalEntry(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deletePayment(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deletePurchase(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deletePurchaseOrder(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteRefundReceipt(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteSalesReceipt(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteTimeActivity(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteTransfer(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async deleteVendorCredit(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  // Query Module Start
  async findAccounts(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findAttachables(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

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

  async findBudgets(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findClasses(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findCompanyInfos(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findCreditMemos(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findCustomers(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findDepartments(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findDeposits(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findEmployees(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findEstimates(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findInvoices(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findProducts(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findJournalCodes(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findJournalEntries(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findPayments(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findPaymentMethods(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findPreferenceses(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findPurchases(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findPurchaseOrders(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findRefundReceipts(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findSalesReceipts(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findTaxAgencies(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findTaxCodes(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findTaxRates(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findTerms(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findTimeActivities(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findVendors(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findVendorCredits(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async findExchangeRates(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  // Reports Module Start
  async reportBalanceSheet(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportProfitAndLoss(req: any, res: any) {
    qbo.reportProfitAndLoss(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportProfitAndLossDetail(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportTrialBalance(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportCashFlow(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportInventoryValuationSummary(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportCustomerSales(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportProductSales(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportCustomerIncome(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportCustomerBalance(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportCustomerBalanceDetail(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportAgedReceivables(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportAgedReceivableDetail(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportVendorBalance(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportVendorBalanceDetail(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportAgedPayables(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportAgedPayableDetail(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportVendorExpenses(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportTransactionList(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportGeneralLedgerDetail(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportDepartmentSales(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async reportClassSales(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  // all pdfs module
  async getInvoicePdf(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getCreditMemoPdf(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async getSalesReceiptPdf(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async sendInvoicePdf(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async sendCreditMemoPdf(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async sendEstimatePdf(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async sendSalesReceiptPdf(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  //Purchase Order Email
  async sendPurchaseOrder(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  //Miscellaneous
  async batch(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async changeDataCapture(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  async upload(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }
}
