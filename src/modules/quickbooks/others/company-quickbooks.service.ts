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
  'ABRoX6kGjKAjh12zpIoOn5h0qpWBweLeab2z5Q6TfTbMl8vwyz',
  'ZD7Uod6VHxnVekQST0rWmbzf7xBcROVTPfSx7i4A',
  'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..3TI5mcuSBnVen_YiunBu6w.xHkvTJVDRB-dDWw8NroRf4GnVT7zxsXVf6PadQrFcgtiFtpnbD7bOjcT68L0gh5xieIr4w4gzNwd8E3lyfUQHoEhQw2ELHPE1kyf5HpusZpPGlkTJcEehPri1NAo79485uXFf8LCbrgDPnkhgCZwMUwDYuV18hLeZYQdOuGD5JZYNG8JIW2K0kNw9KUKw4RNb_21hhWybInfExGtatypHtmNr7aibGWHVFKKClPMnwYuKDgnbJdgvQu69sNrwFUZSNhh8SDsTCswg0UIlGHKXY2lBfD5YIbsa83LJ8jVCOJ6-IZxkdQYiQGDUrbqXW7J0vumZ3SE13HJbhbwDvfrhlzpoBsDlzyVkyARx6kxG6ClRZ6QXPUAHEZSdYot3aCxfw-ZRF6Kc18nRr847BnqWidWyBhSfXP-8fDTka64yaiGVcbhCo13skGg8dR5ObxNZcAMDTr5Tf9NjuQFvbO1EKN2cZlyUJi0Ipgm2RCz05uSFdNMUK7rSzjr9aI8D-eocOadluSLA0T9tCSNxwZmClUu9bBhfR8b78ePL2UknD2IRxpmjsNF2rak0kVu3XdVSKcHrded-x-0lnmpwqIYxQmwT33WDXwHqr_zBlTr5PsTbzu2iRo3paLBXwEjrKhHof3URvSjzIHmXY4BCmT7UJE-nonE-6HKrPTjBvVrxdpvtRxk7pjdtDdixY4vYcJF7LY9Wh63eqLxSz_Y2s8FKbKfhL-nhwcaKxpeRI9l5dYvsNGfPTB3xQA5lP-tvYCr.fWwWbNjgilqHuyjmP40-Tw',
  false, // no token secret for oAuth 2.0
  "4620816365323081980",
  true, // use the sandbox?
  true, // enable debugging?
  null, // set minorversion, or null for the latest version
  '2.0', //oAuth version
  'AB11710924192u5vWdZx2bAkfpGYUf5ra9aG4AMaVPmltNqGbu',
);

let qbtoken: any;
@Injectable()
export class CompanyQuickBooksService {
  constructor() {}

  // end create module

  // start read module

  async getCompanyInfo(req: any, res: any) {
    //         Arguments

    // id - The Id of persistent CompanyInfo
    // callback - Callback function which is called with any error and the persistent CompanyInfo

    qbo.getCompanyInfo("1", function (err, company) {
      res.json(company);
    });
  }

  async updateCompanyInfo(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }

  //   async getCompanyInfo(req: any, res: any) {
  //     qbo.reportBalanceSheet(
  //       { department: '1,4,7' },
  //       function (err, balanceSheet) {
  //         res.json(balanceSheet);
  //       },
  //     );
  //   }

  async findCompanyInfos(req: any, res: any) {
    qbo.reportBalanceSheet(
      { department: "1,4,7" },
      function (err, balanceSheet) {
        res.json(balanceSheet);
      }
    );
  }
}
