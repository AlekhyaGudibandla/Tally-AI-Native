import prisma from "../../db";
import { AccountingEngine, EntryParams, PostVoucherParams } from "../../engine/accounting";
import { RAGService } from "../rag";

export interface ToolDefinition<TParams, TResult> {
  name: string;
  description: string;
  isReadOnly: boolean;
  requiresApproval: boolean;
  execute: (organizationId: string, params: TParams) => Promise<TResult>;
}

export class ToolRegistry {
  /**
   * Search organization-scoped ledger accounts
   */
  public static async searchAccounts(organizationId: string, query?: string) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");
    return await prisma.account.findMany({
      where: {
        organizationId,
        ...(query ? { name: { contains: query } } : {}),
      },
      include: {
        group: true,
      },
      take: 20,
    });
  }

  /**
   * Search organization-scoped suppliers
   */
  public static async searchSuppliers(organizationId: string, query?: string) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");
    return await prisma.supplier.findMany({
      where: {
        organizationId,
        ...(query ? { name: { contains: query } } : {}),
      },
      take: 20,
    });
  }

  /**
   * Search organization-scoped customers
   */
  public static async searchCustomers(organizationId: string, query?: string) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");
    return await prisma.customer.findMany({
      where: {
        organizationId,
        ...(query ? { name: { contains: query } } : {}),
      },
      take: 20,
    });
  }

  /**
   * Retrieve ledger vouchers and lines for organization
   */
  public static async getLedgerEntries(organizationId: string, limit = 10) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");
    return await prisma.voucher.findMany({
      where: { organizationId },
      include: {
        transactions: {
          include: { account: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Search indexed business documents via organization-scoped RAG
   */
  public static async searchIndexedDocuments(organizationId: string, query: string) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");
    return await RAGService.retrieveContext(organizationId, query);
  }

  /**
   * Deterministically validate double-entry invariant without modifying DB
   */
  public static validateJournalEntry(entries: EntryParams[]) {
    return {
      isValid: AccountingEngine.validateInvariant(entries),
      totalDebit: entries.filter((e) => e.type === "DEBIT").reduce((s, e) => s + e.amount, 0),
      totalCredit: entries.filter((e) => e.type === "CREDIT").reduce((s, e) => s + e.amount, 0),
    };
  }

  /**
   * Retrieve aggregate financial metrics from the database for the organization (CFO Agent)
   */
  public static async getFinancialMetrics(organizationId: string) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");

    // Fetch accounts with groups
    const accounts = await prisma.account.findMany({
      where: { organizationId },
      include: { group: true },
    });

    const invoices = await prisma.invoice.findMany({
      where: { organizationId },
      include: { lines: true, customer: true },
    });

    const vouchers = await prisma.voucher.findMany({
      where: { organizationId },
      include: { transactions: true },
      take: 50,
    });

    // Compute key metrics
    let totalSalesRevenue = 0;
    let totalTaxCollected = 0;
    for (const inv of invoices) {
      totalSalesRevenue += inv.totalTaxable;
      totalTaxCollected += inv.totalTax;
    }

    let cashAndBankBalance = 0;
    let accountsReceivable = 0;
    let accountsPayable = 0;
    let totalExpenses = 0;

    for (const acc of accounts) {
      const nature = acc.group.nature;
      const lowerName = acc.name.toLowerCase();

      if (nature === "ASSET") {
        if (lowerName.includes("bank") || lowerName.includes("cash") || lowerName.includes("hdfc")) {
          cashAndBankBalance += acc.balance;
        } else if (lowerName.includes("receivable") || lowerName.includes("debtor")) {
          accountsReceivable += acc.balance;
        }
      } else if (nature === "LIABILITY") {
        if (lowerName.includes("creditor") || lowerName.includes("payable")) {
          accountsPayable += acc.balance;
        }
      } else if (nature === "EXPENSE") {
        totalExpenses += acc.balance;
      }
    }

    // Default reasonable fallback values if DB is freshly seeded
    if (totalSalesRevenue === 0 && accounts.length > 0) {
      const salesAcc = accounts.find((a) => a.name.toLowerCase().includes("sales"));
      if (salesAcc && salesAcc.balance !== 0) {
        totalSalesRevenue = Math.abs(salesAcc.balance);
      }
    }

    const grossProfit = totalSalesRevenue - (totalExpenses * 0.6);
    const netProfit = totalSalesRevenue - totalExpenses;
    const profitMargin = totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0;

    return {
      totalSalesRevenue,
      totalTaxCollected,
      cashAndBankBalance,
      accountsReceivable,
      accountsPayable,
      totalExpenses,
      grossProfit,
      netProfit,
      profitMargin: Number(profitMargin.toFixed(1)),
      invoiceCount: invoices.length,
      voucherCount: vouchers.length,
      accountCount: accounts.length,
    };
  }

  /**
   * Retrieve aging analysis of customer receivables for organization (Collections Agent)
   */
  public static async getReceivablesAging(organizationId: string) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");

    const customers = await prisma.customer.findMany({
      where: { organizationId },
      include: {
        invoices: {
          orderBy: { date: "desc" },
        },
      },
    });

    const now = Date.now();
    let totalOutstanding = 0;
    let totalOverdue = 0;

    const debtorsList: Array<{
      customerId: string;
      customerName: string;
      outstandingAmount: number;
      overdueAmount: number;
      invoiceCount: number;
      oldestInvoiceDays: number;
      hasOverdue: boolean;
    }> = [];

    for (const cust of customers) {
      let custTotal = 0;
      let custOverdue = 0;
      let maxDays = 0;

      for (const inv of cust.invoices) {
        custTotal += inv.grandTotal;
        const daysAgo = Math.floor((now - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo > maxDays) maxDays = daysAgo;
        if (daysAgo > 30) {
          custOverdue += inv.grandTotal;
        }
      }

      if (custTotal > 0) {
        totalOutstanding += custTotal;
        totalOverdue += custOverdue;
        debtorsList.push({
          customerId: cust.id,
          customerName: cust.name,
          outstandingAmount: custTotal,
          overdueAmount: custOverdue,
          invoiceCount: cust.invoices.length,
          oldestInvoiceDays: maxDays,
          hasOverdue: custOverdue > 0,
        });
      }
    }

    debtorsList.sort((a, b) => b.outstandingAmount - a.outstandingAmount);

    return {
      totalOutstanding,
      totalOverdue,
      debtorsList,
      debtorCount: debtorsList.length,
    };
  }

  /**
   * Formulate proposed purchase voucher with strict arithmetic verification
   */
  public static createProposedPurchaseBill(
    organizationId: string,
    invoiceSummary: {
      supplierName: string;
      invoiceNumber: string;
      subTotal: number;
      totalTax: number;
      grandTotal: number;
    }
  ) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");

    // Deterministic arithmetic checks
    const expectedTotal = Number((invoiceSummary.subTotal + invoiceSummary.totalTax).toFixed(2));
    const grandTotal = Number(invoiceSummary.grandTotal.toFixed(2));
    if (Math.abs(expectedTotal - grandTotal) > 0.05) {
      throw new Error(
        `Arithmetic invariant error: Subtotal (${invoiceSummary.subTotal}) + Tax (${invoiceSummary.totalTax}) != Grand Total (${invoiceSummary.grandTotal})`
      );
    }

    const cgst = Number((invoiceSummary.totalTax / 2).toFixed(2));
    const sgst = Number((invoiceSummary.totalTax - cgst).toFixed(2));
    const purNumber = `PUR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const journalEntry = {
      id: `trx-pur-${Date.now()}`,
      entryNumber: purNumber,
      voucherType: "PURCHASE",
      entryDate: new Date().toISOString().split("T")[0],
      status: "DRAFT_PROPOSAL",
      narration: `Purchase of goods/materials from ${invoiceSummary.supplierName} (Inv: ${invoiceSummary.invoiceNumber})`,
      lines: [
        { id: "p1", accountId: "acc-purchase", accountName: "Purchase Account", debit: invoiceSummary.subTotal, credit: 0 },
        { id: "p2", accountId: "acc-input-cgst", accountName: "Input CGST", debit: cgst, credit: 0 },
        { id: "p3", accountId: "acc-input-sgst", accountName: "Input SGST", debit: sgst, credit: 0 },
        { id: "p4", accountId: "acc-creditor", accountName: `Sundry Creditor (${invoiceSummary.supplierName})`, debit: 0, credit: grandTotal },
      ],
      totalDebit: grandTotal,
      totalCredit: grandTotal,
      sourceType: "DOCUMENT_AI",
      createdBy: "Ledger AI Purchase Agent",
      postedAt: new Date().toISOString(),
      tags: ["PURCHASE", "ITC", "VENDOR_BILL"],
    };

    return {
      id: `act-pur-${Date.now()}`,
      type: "POST_PURCHASE_BILL",
      description: `Post Purchase Bill #${purNumber} for ${invoiceSummary.supplierName} (₹${grandTotal.toLocaleString("en-IN")})`,
      amount: grandTotal,
      safetyLevel: grandTotal > 100000 ? "LEVEL_4_HIGH_RISK" : "LEVEL_3_LOW_RISK",
      needsApproval: true,
      executed: false,
      payload: { journalEntry, vendorName: invoiceSummary.supplierName },
    };
  }

  /**
   * Formulate proposed sales tax invoice with deterministic double-entry
   */
  public static createProposedSalesInvoice(
    organizationId: string,
    params: {
      customerName: string;
      itemDescription: string;
      quantity: number;
      rate: number;
      subTotal: number;
      isInterState?: boolean;
    }
  ) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");

    const subTotal = params.subTotal;
    const gstRate = 18;
    const totalTax = Math.round(subTotal * (gstRate / 100));
    const isInterState = !!params.isInterState;
    const cgst = isInterState ? 0 : Math.round(totalTax / 2);
    const sgst = isInterState ? 0 : Math.round(totalTax / 2);
    const igst = isInterState ? totalTax : 0;
    const grandTotal = subTotal + totalTax;

    const invNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const lines: Array<{ id: string; accountId: string; accountName: string; debit: number; credit: number }> = [
      { id: "s1", accountId: "acc-debtor", accountName: `Sundry Debtors (${params.customerName})`, debit: grandTotal, credit: 0 },
      { id: "s2", accountId: "acc-sales", accountName: "Sales Account", debit: 0, credit: subTotal },
    ];

    if (isInterState) {
      lines.push({ id: "s3", accountId: "acc-output-igst", accountName: "Output IGST", debit: 0, credit: igst });
    } else {
      lines.push({ id: "s3", accountId: "acc-output-cgst", accountName: "Output CGST", debit: 0, credit: cgst });
      lines.push({ id: "s4", accountId: "acc-output-sgst", accountName: "Output SGST", debit: 0, credit: sgst });
    }

    const journalEntry = {
      id: `trx-sales-${Date.now()}`,
      entryNumber: invNumber,
      voucherType: "SALES",
      entryDate: new Date().toISOString().split("T")[0],
      status: "DRAFT_PROPOSAL",
      narration: `Sales tax invoice for ${params.customerName} - ${params.quantity}x ${params.itemDescription}`,
      lines,
      totalDebit: grandTotal,
      totalCredit: grandTotal,
      sourceType: "AI_AGENT",
      createdBy: "Ledger AI Invoicing Agent",
      postedAt: new Date().toISOString(),
      tags: ["SALES", "GST_INVOICE"],
    };

    return {
      id: `act-sales-${Date.now()}`,
      type: "POST_SALES_INVOICE",
      description: `Create & Post Tax Invoice #${invNumber} for ${params.customerName} (₹${grandTotal.toLocaleString("en-IN")})`,
      amount: grandTotal,
      safetyLevel: grandTotal > 100000 ? "LEVEL_4_HIGH_RISK" : "LEVEL_3_LOW_RISK",
      needsApproval: true,
      executed: false,
      payload: {
        journalEntry,
        customerName: params.customerName,
        itemDescription: params.itemDescription,
        quantity: params.quantity,
        rate: params.rate,
        subTotal,
        totalTax,
        grandTotal,
        isInterState,
      },
    };
  }

  /**
   * Formulate proposed expense/vendor payment voucher
   */
  public static createProposedPayment(
    organizationId: string,
    params: {
      beneficiaryOrExpense: string;
      amount: number;
      bankAccountName?: string;
    }
  ) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");

    const amount = params.amount;
    const pmtNumber = `PMT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const bank = params.bankAccountName || "HDFC Bank Current Account";

    const journalEntry = {
      id: `trx-pmt-${Date.now()}`,
      entryNumber: pmtNumber,
      voucherType: "PAYMENT",
      entryDate: new Date().toISOString().split("T")[0],
      status: "DRAFT_PROPOSAL",
      narration: `Payment for ${params.beneficiaryOrExpense} via ${bank}`,
      lines: [
        { id: "p1", accountId: "acc-expense", accountName: params.beneficiaryOrExpense, debit: amount, credit: 0 },
        { id: "p2", accountId: "acc-bank", accountName: bank, debit: 0, credit: amount },
      ],
      totalDebit: amount,
      totalCredit: amount,
      sourceType: "AI_AGENT",
      createdBy: "Ledger AI Payment Agent",
      postedAt: new Date().toISOString(),
      tags: ["PAYMENT", "BANKING"],
    };

    return {
      id: `act-pmt-${Date.now()}`,
      type: "POST_PAYMENT",
      description: `Record Payment Voucher #${pmtNumber} for ${params.beneficiaryOrExpense} (₹${amount.toLocaleString("en-IN")})`,
      amount,
      safetyLevel: "LEVEL_3_LOW_RISK",
      needsApproval: true,
      executed: false,
      payload: { journalEntry, beneficiaryOrExpense: params.beneficiaryOrExpense, bank },
    };
  }

  /**
   * Formulate proposed customer receipt voucher
   */
  public static createProposedReceipt(
    organizationId: string,
    params: {
      customerName: string;
      amount: number;
      bankAccountName?: string;
    }
  ) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");

    const amount = params.amount;
    const recNumber = `RCT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const bank = params.bankAccountName || "HDFC Bank Current Account";

    const journalEntry = {
      id: `trx-rcpt-${Date.now()}`,
      entryNumber: recNumber,
      voucherType: "RECEIPT",
      entryDate: new Date().toISOString().split("T")[0],
      status: "DRAFT_PROPOSAL",
      narration: `Payment receipt from ${params.customerName} deposited into ${bank}`,
      lines: [
        { id: "r1", accountId: "acc-bank", accountName: bank, debit: amount, credit: 0 },
        { id: "r2", accountId: "acc-debtor", accountName: `Accounts Receivable (${params.customerName})`, debit: 0, credit: amount },
      ],
      totalDebit: amount,
      totalCredit: amount,
      sourceType: "AI_AGENT",
      createdBy: "Ledger AI Connected Banking Agent",
      postedAt: new Date().toISOString(),
      tags: ["RECEIPT", "BANKING", "COLLECTION"],
    };

    return {
      id: `act-rct-${Date.now()}`,
      type: "POST_RECEIPT",
      description: `Record Bank Receipt #${recNumber} from ${params.customerName} for ₹${amount.toLocaleString("en-IN")}`,
      amount,
      safetyLevel: "LEVEL_3_LOW_RISK",
      needsApproval: true,
      executed: false,
      payload: { journalEntry, customerName: params.customerName, bank },
    };
  }

  /**
   * Formulate proposed collection reminder action
   */
  public static createProposedCollectionReminder(
    organizationId: string,
    params: {
      customerName: string;
      amount: number;
    }
  ) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");

    return {
      id: `act-col-${Date.now()}`,
      type: "SEND_COLLECTION_REMINDER",
      description: `Send payment reminder with direct payment link to ${params.customerName} for ₹${params.amount.toLocaleString("en-IN")}`,
      amount: params.amount,
      safetyLevel: "LEVEL_3_LOW_RISK",
      needsApproval: true,
      executed: false,
      payload: { customerName: params.customerName, amount: params.amount },
    };
  }

  /**
   * Post approved transaction through the authoritative AccountingEngine
   * ONLY invoked after server-side approval verification.
   */
  public static async postApprovedTransaction(params: PostVoucherParams) {
    if (!params.organizationId) throw new Error("Tenant isolation violation: organizationId is required");
    return await AccountingEngine.postVoucher(params);
  }
}
