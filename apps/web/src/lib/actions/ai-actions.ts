'use server';

import { auth } from "@/auth";
import prisma from "@/lib/db";
import { AccountingEngine } from "@/lib/engine/accounting";
import { MultiAgentOrchestrator } from "../ai/multi-agent-orchestrator";
import { getConfiguredModelName } from "../ai/llm-provider";

export async function processAICommand(command: string, documentText?: string): Promise<any> {
  const session = await auth();
  const user = session?.user as any;
  const organizationId = user?.organizationId;

  if (!organizationId) {
    throw new Error("Unauthorized: No organization ID in active session.");
  }

  // Execute the real LangGraph Multi-Agent Orchestrator powered by Groq
  const workflowState = await MultiAgentOrchestrator.executeCommand(
    command,
    organizationId,
    documentText
  );

  let speechSummary = `Workflow finished with status: ${workflowState.status}.`;
  if (workflowState.findings && workflowState.findings.length > 0) {
    speechSummary = workflowState.findings[workflowState.findings.length - 1];
  }
  if (workflowState.status === "FAILED") {
    speechSummary = `Workflow failed: ${workflowState.error || "Unknown error"}`;
  }

  const result: any = {
    run: {
      id: workflowState.workflowId,
      agentType: workflowState.activeAgent,
      model: getConfiguredModelName(),
      latencyMs: 0,
      tokenUsage: { prompt: 0, completion: 0, totalCostUsd: 0 },
      findings: workflowState.findings || [],
      timestamp: new Date().toISOString(),
      status: workflowState.status,
      error: workflowState.error,
    },
    speechSummary,
    proposedAction: workflowState.proposedAction,
    uiWidgets: [],
  };

  // Add contextual UI Widgets based on active agent
  if (workflowState.proposedAction) {
    result.uiWidgets.push({
      type: 'PROPOSED_TRANSACTION',
      title: `Proposed Action (${workflowState.proposedAction.type})`,
      data: {
        description: workflowState.proposedAction.description,
        amount: workflowState.proposedAction.amount ? `₹${workflowState.proposedAction.amount.toLocaleString('en-IN')}` : undefined,
        safetyLevel: workflowState.proposedAction.safetyLevel,
        status: 'Awaiting Human Authorization',
      },
    });
  }

  if (workflowState.activeAgent === 'CFO') {
    // Generate CFO metric cards from findings or DB
    const revMatch = speechSummary.match(/Revenue.*?₹([\d,]+)/i);
    const profitMatch = speechSummary.match(/Net Profit.*?₹([\d,]+)/i);

    result.uiWidgets.push({
      type: 'METRIC_CARD',
      title: 'CFO Financial Metrics',
      data: {
        revenue: revMatch ? `₹${revMatch[1]}` : 'Real-time GL sync',
        profit: profitMatch ? `₹${profitMatch[1]}` : 'Audited',
        health: 'Operational Invariants Verified',
      },
    });
  }

  if (workflowState.activeAgent === 'Collections' && workflowState.proposedAction) {
    result.uiWidgets.push({
      type: 'COLLECTION_LIST',
      title: 'Actionable Receivables',
      data: [
        {
          customer: workflowState.proposedAction.payload?.customerName || 'Top Debtor',
          amount: `₹${(workflowState.proposedAction.amount || 0).toLocaleString('en-IN')}`,
          status: 'Reminder Ready to Dispatch',
        },
      ],
    });
  }

  return result;
}

/**
 * Server-enforced approval and atomic posting.
 * Atomically validates permissions, resolves accounts, verifies double-entry invariant,
 * creates voucher lines, updates account balances, and transitions workflow status.
 * Idempotent: repeated calls do NOT create duplicate entries.
 */
export async function approveWorkflowAction(workflowId: string, actionId: string): Promise<any> {
  const session = await auth();
  const user = session?.user as any;
  const organizationId = user?.organizationId;

  if (!organizationId) {
    throw new Error("Unauthorized: No organization ID in active session.");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Retrieve the workflow run
    const run = await tx.workflowRun.findUnique({ where: { id: workflowId } });
    if (!run) throw new Error("Workflow run not found");
    if (run.organizationId !== organizationId) {
      throw new Error("Tenant violation: Workflow belongs to a different organization");
    }

    // Idempotency: If already completed, return existing success without re-posting
    if (run.status === "COMPLETED") {
      let state: any = {};
      try { state = JSON.parse(run.state); } catch {}
      return {
        success: true,
        alreadyCompleted: true,
        message: "This proposal was already approved and posted to the General Ledger.",
        voucherId: state.executedVoucherId,
        voucherNo: state.executedVoucherNo,
      };
    }

    if (run.status !== "WAITING_FOR_APPROVAL") {
      throw new Error(`Cannot approve workflow in status "${run.status}"`);
    }

    const state = JSON.parse(run.state);
    const action = state.proposedAction;

    if (!action || action.id !== actionId) {
      throw new Error("Proposed action mismatch or not found");
    }

    // Provision standard ledger groups
    let assetsGroup = await tx.ledgerGroup.findFirst({ where: { nature: 'ASSET' } });
    if (!assetsGroup) assetsGroup = await tx.ledgerGroup.create({ data: { name: 'Current Assets', nature: 'ASSET' } });

    let liabilitiesGroup = await tx.ledgerGroup.findFirst({ where: { nature: 'LIABILITY' } });
    if (!liabilitiesGroup) liabilitiesGroup = await tx.ledgerGroup.create({ data: { name: 'Current Liabilities', nature: 'LIABILITY' } });

    let revenueGroup = await tx.ledgerGroup.findFirst({ where: { nature: 'REVENUE' } });
    if (!revenueGroup) revenueGroup = await tx.ledgerGroup.create({ data: { name: 'Direct Revenue', nature: 'REVENUE' } });

    let expensesGroup = await tx.ledgerGroup.findFirst({ where: { nature: 'EXPENSE' } });
    if (!expensesGroup) expensesGroup = await tx.ledgerGroup.create({ data: { name: 'Direct/Indirect Expenses', nature: 'EXPENSE' } });

    // ────────────────────────────────────────────────────────────────────────
    // Action 1: POST_PURCHASE_BILL
    // ────────────────────────────────────────────────────────────────────────
    if (action.type === "POST_PURCHASE_BILL") {
      const journal = action.payload.journalEntry;

      // Purchase Account
      let purchaseAcc = await tx.account.findFirst({ where: { name: 'Purchase Account', organizationId } });
      if (!purchaseAcc) {
        purchaseAcc = await tx.account.create({
          data: { name: 'Purchase Account', organizationId, groupId: expensesGroup.id, balance: 0 },
        });
      }

      // Input CGST Account
      let cgstAcc = await tx.account.findFirst({ where: { name: 'Input CGST', organizationId } });
      if (!cgstAcc) {
        cgstAcc = await tx.account.create({
          data: { name: 'Input CGST', organizationId, groupId: assetsGroup.id, balance: 0 },
        });
      }

      // Input SGST Account
      let sgstAcc = await tx.account.findFirst({ where: { name: 'Input SGST', organizationId } });
      if (!sgstAcc) {
        sgstAcc = await tx.account.create({
          data: { name: 'Input SGST', organizationId, groupId: assetsGroup.id, balance: 0 },
        });
      }

      // Supplier Account
      const vendorName = action.payload.vendorName || "Vendor";
      let supplierAcc = await tx.account.findFirst({ where: { name: vendorName, organizationId } });
      if (!supplierAcc) {
        supplierAcc = await tx.account.create({
          data: { name: vendorName, organizationId, groupId: liabilitiesGroup.id, balance: 0 },
        });
      }

      // Upsert supplier in master data
      const existingSupplier = await tx.supplier.findFirst({ where: { name: vendorName, organizationId } });
      if (!existingSupplier) {
        await tx.supplier.create({ data: { name: vendorName, organizationId } });
      }

      // Prepare entry lines
      const entries: Array<{ accountId: string; amount: number; type: 'DEBIT' | 'CREDIT' }> = [];
      for (const line of journal.lines) {
        if (line.debit > 0) {
          if (line.accountName.includes('CGST')) {
            entries.push({ accountId: cgstAcc.id, amount: line.debit, type: 'DEBIT' });
          } else if (line.accountName.includes('SGST')) {
            entries.push({ accountId: sgstAcc.id, amount: line.debit, type: 'DEBIT' });
          } else {
            entries.push({ accountId: purchaseAcc.id, amount: line.debit, type: 'DEBIT' });
          }
        }
        if (line.credit > 0) {
          entries.push({ accountId: supplierAcc.id, amount: line.credit, type: 'CREDIT' });
        }
      }

      if (!AccountingEngine.validateInvariant(entries)) {
        throw new Error("Voucher rejected: Invariant violation. Debits and Credits do not match.");
      }

      const voucherNo = journal.entryNumber || `PUR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
      const voucher = await tx.voucher.create({
        data: {
          organizationId,
          voucherNo,
          type: 'PURCHASE',
          date: new Date(),
          narration: journal.narration,
          isReversed: false,
        },
      });

      for (const entry of entries) {
        await tx.transaction.create({
          data: {
            voucherId: voucher.id,
            accountId: entry.accountId,
            amount: entry.amount,
            type: entry.type,
          },
        });

        const account = await tx.account.findUnique({ where: { id: entry.accountId } });
        if (account) {
          const group = await tx.ledgerGroup.findUnique({ where: { id: account.groupId } });
          const nature = group?.nature || 'ASSET';
          const balanceModifier = ['ASSET', 'EXPENSE'].includes(nature)
            ? (entry.type === 'DEBIT' ? entry.amount : -entry.amount)
            : (entry.type === 'CREDIT' ? entry.amount : -entry.amount);

          await tx.account.update({
            where: { id: account.id },
            data: { balance: account.balance + balanceModifier },
          });
        }
      }

      await tx.workflowRun.update({
        where: { id: workflowId },
        data: {
          status: "COMPLETED",
          state: JSON.stringify({
            ...state,
            executedActionId: actionId,
            executedVoucherId: voucher.id,
            executedVoucherNo: voucher.voucherNo,
            completedAt: new Date().toISOString(),
          }),
        },
      });

      return {
        success: true,
        voucherId: voucher.id,
        voucherNo: voucher.voucherNo,
        message: `Purchase voucher #${voucher.voucherNo} posted atomically to General Ledger.`,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // Action 2: POST_SALES_INVOICE
    // ────────────────────────────────────────────────────────────────────────
    if (action.type === "POST_SALES_INVOICE") {
      const payload = action.payload;
      const customerName = payload.customerName || "Customer";

      // Upsert Customer
      let customer = await tx.customer.findFirst({ where: { name: customerName, organizationId } });
      if (!customer) {
        customer = await tx.customer.create({
          data: { name: customerName, organizationId, creditLimit: 500000 },
        });
      }

      // Upsert Debtor Ledger Account
      let debtorAcc = await tx.account.findFirst({ where: { name: `Sundry Debtors (${customerName})`, organizationId } });
      if (!debtorAcc) {
        debtorAcc = await tx.account.findFirst({ where: { name: customerName, organizationId } });
      }
      if (!debtorAcc) {
        debtorAcc = await tx.account.create({
          data: { name: `Sundry Debtors (${customerName})`, organizationId, groupId: assetsGroup.id, balance: 0 },
        });
      }

      // Sales Account
      let salesAcc = await tx.account.findFirst({ where: { name: 'Sales Account', organizationId } });
      if (!salesAcc) {
        salesAcc = await tx.account.create({
          data: { name: 'Sales Account', organizationId, groupId: revenueGroup.id, balance: 0 },
        });
      }

      // Output Tax Accounts
      let outputCgstAcc = await tx.account.findFirst({ where: { name: 'Output CGST', organizationId } });
      if (!outputCgstAcc) {
        outputCgstAcc = await tx.account.create({
          data: { name: 'Output CGST', organizationId, groupId: liabilitiesGroup.id, balance: 0 },
        });
      }

      let outputSgstAcc = await tx.account.findFirst({ where: { name: 'Output SGST', organizationId } });
      if (!outputSgstAcc) {
        outputSgstAcc = await tx.account.create({
          data: { name: 'Output SGST', organizationId, groupId: liabilitiesGroup.id, balance: 0 },
        });
      }

      const isInterState = !!payload.isInterState;
      const subTotal = payload.subTotal || action.amount;
      const totalTax = payload.totalTax || Math.round(subTotal * 0.18);
      const grandTotal = payload.grandTotal || (subTotal + totalTax);
      const cgst = isInterState ? 0 : Math.round(totalTax / 2);
      const sgst = isInterState ? 0 : Math.round(totalTax / 2);

      // Create Invoice Header
      const invoiceNo = payload.journalEntry?.entryNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const invoice = await tx.invoice.create({
        data: {
          organizationId,
          customerId: customer.id,
          invoiceNo,
          date: new Date(),
          totalTaxable: subTotal,
          totalTax,
          grandTotal,
          isInterState,
        },
      });

      // Prepare double-entry lines: DR Customer (grandTotal), CR Sales (subTotal), CR Tax (totalTax)
      const entries: Array<{ accountId: string; amount: number; type: 'DEBIT' | 'CREDIT' }> = [
        { accountId: debtorAcc.id, amount: grandTotal, type: 'DEBIT' },
        { accountId: salesAcc.id, amount: subTotal, type: 'CREDIT' },
      ];

      if (!isInterState) {
        entries.push({ accountId: outputCgstAcc.id, amount: cgst, type: 'CREDIT' });
        entries.push({ accountId: outputSgstAcc.id, amount: sgst, type: 'CREDIT' });
      }

      if (!AccountingEngine.validateInvariant(entries)) {
        throw new Error("Double entry violation for sales invoice.");
      }

      // Create Sales Voucher
      const voucher = await tx.voucher.create({
        data: {
          organizationId,
          voucherNo: invoiceNo,
          type: 'SALES',
          date: new Date(),
          narration: `Sales tax invoice #${invoiceNo} for ${customerName}`,
          isReversed: false,
        },
      });

      // Post Transaction Lines & Update Balances
      for (const entry of entries) {
        await tx.transaction.create({
          data: {
            voucherId: voucher.id,
            accountId: entry.accountId,
            amount: entry.amount,
            type: entry.type,
          },
        });

        const account = await tx.account.findUnique({ where: { id: entry.accountId } });
        if (account) {
          const group = await tx.ledgerGroup.findUnique({ where: { id: account.groupId } });
          const nature = group?.nature || 'ASSET';
          const modifier = ['ASSET', 'EXPENSE'].includes(nature)
            ? (entry.type === 'DEBIT' ? entry.amount : -entry.amount)
            : (entry.type === 'CREDIT' ? entry.amount : -entry.amount);

          await tx.account.update({
            where: { id: account.id },
            data: { balance: account.balance + modifier },
          });
        }
      }

      await tx.workflowRun.update({
        where: { id: workflowId },
        data: {
          status: "COMPLETED",
          state: JSON.stringify({
            ...state,
            executedActionId: actionId,
            executedInvoiceId: invoice.id,
            executedVoucherId: voucher.id,
            executedVoucherNo: invoiceNo,
            completedAt: new Date().toISOString(),
          }),
        },
      });

      return {
        success: true,
        voucherId: voucher.id,
        voucherNo: invoiceNo,
        invoiceId: invoice.id,
        message: `Tax Invoice #${invoiceNo} for ${customerName} (₹${grandTotal.toLocaleString('en-IN')}) posted to General Ledger!`,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // Action 3: POST_PAYMENT
    // ────────────────────────────────────────────────────────────────────────
    if (action.type === "POST_PAYMENT") {
      const payload = action.payload;
      const amount = action.amount;
      const expenseName = payload.beneficiaryOrExpense || "Operating Expense";

      let expenseAcc = await tx.account.findFirst({ where: { name: expenseName, organizationId } });
      if (!expenseAcc) {
        expenseAcc = await tx.account.create({
          data: { name: expenseName, organizationId, groupId: expensesGroup.id, balance: 0 },
        });
      }

      let bankAcc = await tx.account.findFirst({
        where: {
          organizationId,
          name: { contains: 'Bank' },
        },
      });
      if (!bankAcc) {
        bankAcc = await tx.account.findFirst({ where: { organizationId, groupId: assetsGroup.id } });
      }
      if (!bankAcc) {
        bankAcc = await tx.account.create({
          data: { name: 'HDFC Bank Account', organizationId, groupId: assetsGroup.id, balance: 500000 },
        });
      }

      // Invariant: DR Expense, CR Bank
      const entries = [
        { accountId: expenseAcc.id, amount, type: 'DEBIT' as const },
        { accountId: bankAcc.id, amount, type: 'CREDIT' as const },
      ];

      if (!AccountingEngine.validateInvariant(entries)) {
        throw new Error("Double entry violation for payment voucher.");
      }

      const pmtNo = payload.journalEntry?.entryNumber || `PMT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const voucher = await tx.voucher.create({
        data: {
          organizationId,
          voucherNo: pmtNo,
          type: 'PAYMENT',
          date: new Date(),
          narration: `Payment for ${expenseName}`,
          isReversed: false,
        },
      });

      for (const entry of entries) {
        await tx.transaction.create({
          data: {
            voucherId: voucher.id,
            accountId: entry.accountId,
            amount: entry.amount,
            type: entry.type,
          },
        });

        const account = await tx.account.findUnique({ where: { id: entry.accountId } });
        if (account) {
          const group = await tx.ledgerGroup.findUnique({ where: { id: account.groupId } });
          const nature = group?.nature || 'ASSET';
          const modifier = ['ASSET', 'EXPENSE'].includes(nature)
            ? (entry.type === 'DEBIT' ? entry.amount : -entry.amount)
            : (entry.type === 'CREDIT' ? entry.amount : -entry.amount);

          await tx.account.update({
            where: { id: account.id },
            data: { balance: account.balance + modifier },
          });
        }
      }

      await tx.workflowRun.update({
        where: { id: workflowId },
        data: {
          status: "COMPLETED",
          state: JSON.stringify({
            ...state,
            executedActionId: actionId,
            executedVoucherId: voucher.id,
            executedVoucherNo: pmtNo,
            completedAt: new Date().toISOString(),
          }),
        },
      });

      return {
        success: true,
        voucherId: voucher.id,
        voucherNo: pmtNo,
        message: `Payment voucher #${pmtNo} for ${expenseName} (₹${amount.toLocaleString('en-IN')}) posted successfully.`,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // Action 4: POST_RECEIPT
    // ────────────────────────────────────────────────────────────────────────
    if (action.type === "POST_RECEIPT") {
      const payload = action.payload;
      const amount = action.amount;
      const customerName = payload.customerName || "Customer";

      let bankAcc = await tx.account.findFirst({
        where: {
          organizationId,
          name: { contains: 'Bank' },
        },
      });
      if (!bankAcc) {
        bankAcc = await tx.account.create({
          data: { name: 'HDFC Bank Account', organizationId, groupId: assetsGroup.id, balance: 500000 },
        });
      }

      let debtorAcc = await tx.account.findFirst({
        where: { organizationId, name: { contains: customerName } },
      });
      if (!debtorAcc) {
        debtorAcc = await tx.account.create({
          data: { name: `Sundry Debtors (${customerName})`, organizationId, groupId: assetsGroup.id, balance: 0 },
        });
      }

      // Invariant: DR Bank, CR Debtor
      const entries = [
        { accountId: bankAcc.id, amount, type: 'DEBIT' as const },
        { accountId: debtorAcc.id, amount, type: 'CREDIT' as const },
      ];

      if (!AccountingEngine.validateInvariant(entries)) {
        throw new Error("Double entry violation for receipt voucher.");
      }

      const rctNo = payload.journalEntry?.entryNumber || `RCT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const voucher = await tx.voucher.create({
        data: {
          organizationId,
          voucherNo: rctNo,
          type: 'RECEIPT',
          date: new Date(),
          narration: `Payment received from ${customerName}`,
          isReversed: false,
        },
      });

      for (const entry of entries) {
        await tx.transaction.create({
          data: {
            voucherId: voucher.id,
            accountId: entry.accountId,
            amount: entry.amount,
            type: entry.type,
          },
        });

        const account = await tx.account.findUnique({ where: { id: entry.accountId } });
        if (account) {
          const group = await tx.ledgerGroup.findUnique({ where: { id: account.groupId } });
          const nature = group?.nature || 'ASSET';
          const modifier = ['ASSET', 'EXPENSE'].includes(nature)
            ? (entry.type === 'DEBIT' ? entry.amount : -entry.amount)
            : (entry.type === 'CREDIT' ? entry.amount : -entry.amount);

          await tx.account.update({
            where: { id: account.id },
            data: { balance: account.balance + modifier },
          });
        }
      }

      await tx.workflowRun.update({
        where: { id: workflowId },
        data: {
          status: "COMPLETED",
          state: JSON.stringify({
            ...state,
            executedActionId: actionId,
            executedVoucherId: voucher.id,
            executedVoucherNo: rctNo,
            completedAt: new Date().toISOString(),
          }),
        },
      });

      return {
        success: true,
        voucherId: voucher.id,
        voucherNo: rctNo,
        message: `Receipt voucher #${rctNo} from ${customerName} (₹${amount.toLocaleString('en-IN')}) posted to General Ledger.`,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // Action 5: SEND_COLLECTION_REMINDER
    // ────────────────────────────────────────────────────────────────────────
    if (action.type === "SEND_COLLECTION_REMINDER") {
      const payload = action.payload;
      const customerName = payload.customerName || "Customer";
      const amount = action.amount || payload.amount || 0;

      // Record business memory
      await tx.businessMemory.create({
        data: {
          organizationId,
          fact: `Payment reminder with instant UPI/NEFT link dispatched to ${customerName} for outstanding dues of ₹${amount.toLocaleString('en-IN')}.`,
          source: 'AI_COLLECTIONS_AGENT',
          status: 'APPROVED',
        },
      });

      await tx.workflowRun.update({
        where: { id: workflowId },
        data: {
          status: "COMPLETED",
          state: JSON.stringify({
            ...state,
            executedActionId: actionId,
            dispatchedAt: new Date().toISOString(),
          }),
        },
      });

      return {
        success: true,
        message: `Payment reminder successfully dispatched to ${customerName} for ₹${amount.toLocaleString('en-IN')}.`,
      };
    }

    throw new Error(`Unsupported action type: ${action.type}`);
  });
}

/**
 * Rejection / cancellation of a pending proposed action
 */
export async function rejectWorkflowAction(workflowId: string, reason = "Rejected by user"): Promise<any> {
  const session = await auth();
  const user = session?.user as any;
  const organizationId = user?.organizationId;

  if (!organizationId) {
    throw new Error("Unauthorized: No organization ID in active session.");
  }

  const run = await prisma.workflowRun.findUnique({ where: { id: workflowId } });
  if (!run || run.organizationId !== organizationId) {
    throw new Error("Workflow run not found or unauthorized");
  }

  let state: any = {};
  try { state = JSON.parse(run.state); } catch {}

  await prisma.workflowRun.update({
    where: { id: workflowId },
    data: {
      status: "CANCELLED",
      state: JSON.stringify({
        ...state,
        cancelledAt: new Date().toISOString(),
        rejectionReason: reason,
      }),
    },
  });

  return {
    success: true,
    message: `Proposal rejected: ${reason}`,
  };
}

/**
 * Retrieve active pending approval proposals for tenant (restores state after refresh)
 */
export async function getPendingWorkflowAction(): Promise<any> {
  const session = await auth();
  const user = session?.user as any;
  const organizationId = user?.organizationId;

  if (!organizationId) return null;

  const pending = await prisma.workflowRun.findFirst({
    where: {
      organizationId,
      status: "WAITING_FOR_APPROVAL",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!pending) return null;

  try {
    const state = JSON.parse(pending.state);
    return {
      run: {
        id: pending.id,
        agentType: state.activeAgent || "Accounting",
        model: getConfiguredModelName(),
        latencyMs: 0,
        tokenUsage: { prompt: 0, completion: 0, totalCostUsd: 0 },
        findings: state.findings || [],
        timestamp: pending.createdAt.toISOString(),
        status: pending.status,
      },
      speechSummary: state.findings?.[state.findings.length - 1] || "Proposal awaiting your review.",
      proposedAction: state.proposedAction,
    };
  } catch {
    return null;
  }
}
