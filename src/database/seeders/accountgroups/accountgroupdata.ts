export const accountgroups = () => {
  return [
    {
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
      groupType: 1,
      nature: "Cr",
      postedTo: "Balance Sheet",
      groupHeadType: "Liability"
    },
    {
      createdBy: 0,
      groupName: "Capital Account",
      groupParent: 2,
      groupIdentifier: "2.1.0.0",
      groupType: 1,
      nature: "Cr",
      postedTo: "Balance Sheet",
      groupHeadType: "Capital"
    },
    {
      createdBy: 0,
      groupName: "Loans Account",
      groupParent: 2,
      groupIdentifier: "2.2.0.0",
      groupType: 1,
      nature: "Cr",
      postedTo: "Balance Sheet",
      groupHeadType: "Loans"
    },
    {
      createdBy: 0,
      groupName: "Current Liabilities",
      groupParent: 2,
      groupIdentifier: "2.3.0.0",
      groupType: 1,
      nature: "Cr",
      postedTo: "Balance Sheet",
      groupHeadType: "Liability"
    },
    {
      createdBy: 0,
      groupName: "Accounts Payable",
      groupParent: 2,
      groupIdentifier: "2.3.1.0",
      groupType: 1,
      nature: "Cr",
      postedTo: "Balance Sheet",
      groupHeadType: "Supplier"
    },
    {
      createdBy: 0,
      groupName: "Duties & Taxes",
      groupParent: 2,
      groupIdentifier: "2.3.2.0",
      groupType: 1,
      nature: "Cr",
      postedTo: "Balance Sheet",
      groupHeadType: "Taxes"
    },
    {
      createdBy: 0,
      groupName: "VAT Current Account",
      groupParent: 2,
      groupIdentifier: "2.3.3.0",
      groupType: 1,
      nature: "Cr",
      postedTo: "Balance Sheet",
      groupHeadType: "Supplier"
    },
    {
      createdBy: 0,
      groupName: "Profit & Loss Account",
      groupParent: 2,
      groupIdentifier: "2.4.0.0",
      groupType: 1,
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
      groupType: 1,
      nature: "Cr",
      postedTo: "Income Statement",
      groupHeadType: "Sales"
    },
    {
      createdBy: 0,
      groupName: "Sales Return",
      groupParent: 2,
      groupIdentifier: "3.4.0.0",
      groupType: 1,
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
    }
  ];
};