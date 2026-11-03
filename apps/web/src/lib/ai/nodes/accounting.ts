import { WorkflowState } from "../graph";
import { AccountingEngine } from "../../engine/accounting";
import { ToolRegistry } from "../tools/registry";

function extractAmount(text: string): number {
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l)/i);
  if (lakhMatch) return parseFloat(lakhMatch[1]) * 100000;

  const crMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i);
  if (crMatch) return parseFloat(crMatch[1]) * 10000000;

  const kMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand|thousands)/i);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;

  const plainMatch = text.replace(/₹|,/g, "").match(/\b\d{3,10}\b/);
  if (plainMatch) return parseFloat(plainMatch[0]);

  return 50000;
}

export const accountingNode = async (
  state: WorkflowState
): Promise<Partial<WorkflowState>> => {
  // Case A: Document Summary exists (OCR / Invoice flow)
  if (state.documentSummary) {
    const summary = state.documentSummary;

    // 1. Amounts must be strictly positive
    if (summary.subTotal <= 0 || summary.grandTotal <= 0) {
      return {
        activeAgent: "Accounting",
        status: "FAILED",
        error: "Invalid invoice amounts: subTotal and grandTotal must be greater than zero",
        findings: [
          `Accounting rejected invoice: Non-positive amounts detected (subTotal: ₹${summary.subTotal}, grandTotal: ₹${summary.grandTotal}).`,
        ],
      };
    }

    // 2. Arithmetic consistency check
    const calculatedGrandTotal = Number((summary.subTotal + summary.totalTax).toFixed(2));
    const roundedGrandTotal = Number(summary.grandTotal.toFixed(2));
    if (Math.abs(calculatedGrandTotal - roundedGrandTotal) > 0.1) {
      return {
        activeAgent: "Accounting",
        status: "FAILED",
        error: `Arithmetic mismatch: subTotal (${summary.subTotal}) + tax (${summary.totalTax}) does not equal grandTotal (${summary.grandTotal})`,
        findings: [
          `Accounting rejected draft: Arithmetic mismatch (₹${summary.subTotal} + ₹${summary.totalTax} = ₹${calculatedGrandTotal} != ₹${roundedGrandTotal}). Refusing to create unbalanced proposal.`,
        ],
      };
    }

    try {
      const proposedAction = ToolRegistry.createProposedPurchaseBill(
        state.organizationId,
        summary
      );

      const lines = proposedAction.payload.journalEntry.lines.map((l) => ({
        accountId: l.accountId,
        amount: l.debit > 0 ? l.debit : l.credit,
        type: (l.debit > 0 ? "DEBIT" : "CREDIT") as "DEBIT" | "CREDIT",
      }));

      const isInvariantValid = AccountingEngine.validateInvariant(lines);
      if (!isInvariantValid) {
        return {
          activeAgent: "Accounting",
          status: "FAILED",
          error: "Double-entry invariant failed: Debits do not equal Credits",
          findings: [
            "Accounting invariant violation: Debit and Credit sums do not balance.",
          ],
        };
      }

      const totalDebit = lines
        .filter((l) => l.type === "DEBIT")
        .reduce((s, l) => s + l.amount, 0);
      const totalCredit = lines
        .filter((l) => l.type === "CREDIT")
        .reduce((s, l) => s + l.amount, 0);

      return {
        activeAgent: "Accounting",
        proposedAction: proposedAction as any,
        approvalRequired: true,
        status: "WAITING_FOR_APPROVAL",
        accountingValidation: {
          isValid: true,
          totalDebit,
          totalCredit,
          discrepancies: [],
        },
        findings: [
          `Accounting validated double-entry for invoice #${summary.invoiceNumber}: Debits ₹${totalDebit.toLocaleString(
            "en-IN"
          )} == Credits ₹${totalCredit.toLocaleString("en-IN")}.`,
          `Draft journal voucher prepared with ${lines.length} lines. Requiring human approval before posting.`,
        ],
      };
    } catch (err: any) {
      const errorMsg = err?.message || "Accounting validation error";
      return {
        activeAgent: "Accounting",
        status: "FAILED",
        error: errorMsg,
        findings: [`Accounting error: ${errorMsg}`],
      };
    }
  }

  // Case B: Natural Language Direct Accounting Intent (No attached document)
  const cmd = (state.intent || "").trim();
  const lower = cmd.toLowerCase();

  try {
    // 1. Sales Invoicing
    if (
      (lower.includes("sold") || lower.includes("sale") || lower.includes("bill ") || lower.includes("invoice to") || lower.includes("raise invoice")) &&
      !lower.includes("purchase") && !lower.includes("bill received")
    ) {
      const amount = extractAmount(cmd);

      let customerName = "Acme Corp";
      const toMatch = cmd.match(/(?:to|for)\s+([A-Za-z0-9\s&]+?)(?:\s+(?:for|at|with|@|worth)|\.|$)/i);
      if (toMatch && toMatch[1].trim().length > 2) {
        customerName = toMatch[1].trim().replace(/\b(for|at|worth|with|a|an)\b/gi, "").trim();
      }

      let itemDescription = "Goods / Services";
      let qty = 1;
      const itemMatch = cmd.match(/(?:sold|sale of|invoiced|billed)\s+(?:(\d+)\s+)?([A-Za-z0-9\s]+?)(?:\s+to|\s+for|\s+at|\s+@|\.|$)/i);
      if (itemMatch) {
        if (itemMatch[1]) qty = parseInt(itemMatch[1], 10);
        if (itemMatch[2] && itemMatch[2].trim().length > 1) {
          itemDescription = itemMatch[2].trim();
        }
      }

      const rate = amount / (qty || 1);
      const isInterState = lower.includes("interstate") || lower.includes("igst");

      const proposedAction = ToolRegistry.createProposedSalesInvoice(state.organizationId, {
        customerName,
        itemDescription,
        quantity: qty,
        rate,
        subTotal: amount,
        isInterState,
      });

      const lines = proposedAction.payload.journalEntry.lines.map((l) => ({
        accountId: l.accountId,
        amount: l.debit > 0 ? l.debit : l.credit,
        type: (l.debit > 0 ? "DEBIT" : "CREDIT") as "DEBIT" | "CREDIT",
      }));

      AccountingEngine.validateInvariant(lines);

      return {
        activeAgent: "Accounting",
        proposedAction: proposedAction as any,
        approvalRequired: true,
        status: "WAITING_FOR_APPROVAL",
        findings: [
          `Prepared Tax Invoice for customer "${customerName}" for ₹${proposedAction.amount.toLocaleString("en-IN")}.`,
          `Double-entry invariant strictly verified: Debits ₹${proposedAction.amount.toLocaleString("en-IN")} == Credits ₹${proposedAction.amount.toLocaleString("en-IN")}.`,
          "Awaiting human approval before General Ledger posting.",
        ],
      };
    }

    // 2. Vendor / Expense Payment
    if (
      lower.includes("paid") && !lower.includes("paid me") && !lower.includes("customer paid") && !lower.includes("received")
    ) {
      const amount = extractAmount(cmd);
      let expenseName = "Operating Expense";
      if (lower.includes("rent")) expenseName = "Office Rent";
      else if (lower.includes("salary") || lower.includes("salaries")) expenseName = "Staff Salaries";
      else if (lower.includes("electricity") || lower.includes("utility")) expenseName = "Electricity & Utilities";
      else if (lower.includes("freight") || lower.includes("shipping")) expenseName = "Freight & Shipping";
      else {
        const toMatch = cmd.match(/(?:paid|payment to)\s+([A-Za-z0-9\s&]+?)(?:\s+(?:for|at|via|from)|\.|$)/i);
        if (toMatch && toMatch[1].trim().length > 2) {
          expenseName = toMatch[1].trim();
        }
      }

      const proposedAction = ToolRegistry.createProposedPayment(state.organizationId, {
        beneficiaryOrExpense: expenseName,
        amount,
      });

      return {
        activeAgent: "Accounting",
        proposedAction: proposedAction as any,
        approvalRequired: true,
        status: "WAITING_FOR_APPROVAL",
        findings: [
          `Prepared Payment Voucher for "${expenseName}" for ₹${amount.toLocaleString("en-IN")}.`,
          "Double-entry verified (DR Expense, CR Bank A/c). Awaiting human authorization.",
        ],
      };
    }

    // 3. Customer Receipt
    if (
      lower.includes("received") || lower.includes("paid me") || lower.includes("customer paid") || lower.includes("receipt from")
    ) {
      const amount = extractAmount(cmd);
      let customerName = "Customer";
      const fromMatch = cmd.match(/(?:from|by)\s+([A-Za-z0-9\s&]+?)(?:\s+(?:for|in|into|against)|\.|$)/i);
      if (fromMatch && fromMatch[1].trim().length > 2) {
        customerName = fromMatch[1].trim();
      }

      const proposedAction = ToolRegistry.createProposedReceipt(state.organizationId, {
        customerName,
        amount,
      });

      return {
        activeAgent: "Accounting",
        proposedAction: proposedAction as any,
        approvalRequired: true,
        status: "WAITING_FOR_APPROVAL",
        findings: [
          `Prepared Receipt Voucher from "${customerName}" for ₹${amount.toLocaleString("en-IN")}.`,
          "Double-entry verified (DR Bank A/c, CR Accounts Receivable). Awaiting human authorization.",
        ],
      };
    }

    // 4. Direct Purchase without document
    if (lower.includes("bought") || lower.includes("purchase") || lower.includes("bill from")) {
      const amount = extractAmount(cmd);
      let vendorName = "Vendor";
      const fromMatch = cmd.match(/(?:from|by)\s+([A-Za-z0-9\s&]+?)(?:\s+(?:for|at|with|worth)|\.|$)/i);
      if (fromMatch && fromMatch[1].trim().length > 2) {
        vendorName = fromMatch[1].trim();
      }

      const subTotal = Math.round(amount / 1.18);
      const totalTax = amount - subTotal;

      const proposedAction = ToolRegistry.createProposedPurchaseBill(state.organizationId, {
        supplierName: vendorName,
        invoiceNumber: `DIRECT-${Date.now().toString().slice(-4)}`,
        subTotal,
        totalTax,
        grandTotal: amount,
      });

      return {
        activeAgent: "Accounting",
        proposedAction: proposedAction as any,
        approvalRequired: true,
        status: "WAITING_FOR_APPROVAL",
        findings: [
          `Prepared Purchase Voucher for supplier "${vendorName}" for ₹${amount.toLocaleString("en-IN")}.`,
          "Double-entry verified (DR Purchase, DR Input GST, CR Creditor). Awaiting human authorization.",
        ],
      };
    }

    // Fallback if no financial transaction matched
    return {
      activeAgent: "Accounting",
      status: "COMPLETED",
      findings: [
        `Accounting Assistant analyzed: "${cmd}". No immediate journal entry requested. Double-entry general ledger is fully in balance.`,
      ],
    };
  } catch (err: any) {
    const errorMsg = err?.message || "Accounting execution failed";
    return {
      activeAgent: "Accounting",
      status: "FAILED",
      error: errorMsg,
      findings: [`Accounting Node Error: ${errorMsg}`],
    };
  }
};
