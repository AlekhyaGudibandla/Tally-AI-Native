// ============================================================================
// LedgerOS Deterministic Double-Entry Accounting Engine
// Pure rule-based, mathematical financial core. No LLM mutations allowed here.
// ============================================================================

import {
  Account,
  JournalEntry,
  JournalLine,
  TransactionStatus,
  VoucherType,
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalDebit: number;
  totalCredit: number;
  difference: number;
}

export interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  netDebit: number;
  netCredit: number;
}

export interface FinancialStatements {
  profitAndLoss: {
    revenue: { name: string; amount: number }[];
    totalRevenue: number;
    costOfGoodsSold: { name: string; amount: number }[];
    totalCogs: number;
    grossProfit: number;
    grossMarginPercent: number;
    expenses: { name: string; amount: number }[];
    totalExpenses: number;
    netOperatingProfit: number;
    netProfitMarginPercent: number;
  };
  balanceSheet: {
    assets: { name: string; amount: number; subType: string }[];
    totalAssets: number;
    liabilities: { name: string; amount: number; subType: string }[];
    totalLiabilities: number;
    equity: { name: string; amount: number }[];
    totalEquity: number;
    retainedEarnings: number;
    isBalanced: boolean;
    difference: number;
  };
  keyMetrics: {
    workingCapital: number;
    currentRatio: number;
    debtToEquity: number;
    cashRunwayDays: number;
  };
}

export class AccountingEngine {
  /**
   * INVARIANT CHECK:
   * Total Debits must equal Total Credits to the exact cent / paisa.
   */
  public static validateDoubleEntry(lines: JournalLine[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!lines || lines.length < 2) {
      errors.push('A valid double-entry voucher must contain at least 2 lines (at least one Debit and one Credit).');
      return {
        isValid: false,
        errors,
        warnings,
        totalDebit: 0,
        totalCredit: 0,
        difference: 0,
      };
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.accountId) {
        errors.push(`Line ${i + 1} has no account specified.`);
      }
      if (line.debit < 0 || line.credit < 0) {
        errors.push(`Line ${i + 1} contains negative amounts. Debits and credits must be non-negative.`);
      }
      if (line.debit > 0 && line.credit > 0) {
        errors.push(`Line ${i + 1} has both debit and credit amounts. Each line must be either debit or credit.`);
      }
      if (line.debit === 0 && line.credit === 0) {
        warnings.push(`Line ${i + 1} has zero debit and zero credit.`);
      }

      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    // Rounding check to 2 decimal places to avoid floating point anomalies
    const roundedDebit = Math.round(totalDebit * 100) / 100;
    const roundedCredit = Math.round(totalCredit * 100) / 100;
    const difference = Math.round(Math.abs(roundedDebit - roundedCredit) * 100) / 100;

    if (difference !== 0) {
      errors.push(
        `Accounting Invariant Violation: Debits (₹${roundedDebit.toLocaleString()}) must equal Credits (₹${roundedCredit.toLocaleString()}). Imbalance: ₹${difference.toLocaleString()}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalDebit: roundedDebit,
      totalCredit: roundedCredit,
      difference,
    };
  }

  /**
   * Validate Transaction State Machine Transitions:
   * DRAFT -> AI_PROPOSED -> VALIDATING -> PENDING_APPROVAL -> APPROVED -> POSTED
   */
  public static canTransition(current: TransactionStatus, next: TransactionStatus): boolean {
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      DRAFT: ['AI_PROPOSED', 'VALIDATING'],
      AI_PROPOSED: ['VALIDATING', 'DRAFT'],
      VALIDATING: ['PENDING_APPROVAL', 'APPROVED', 'DRAFT'],
      PENDING_APPROVAL: ['APPROVED', 'DRAFT'],
      APPROVED: ['POSTED', 'DRAFT'],
      POSTED: ['RECONCILED', 'REVERSED'],
      RECONCILED: ['REVERSED'],
      REVERSED: [], // Terminal state
    };

    return validTransitions[current]?.includes(next) ?? false;
  }

  /**
   * Generate an exact reversal journal entry for a posted transaction.
   * NEVER mutate posted history silently.
   */
  public static createReversalEntry(
    original: JournalEntry,
    reason: string,
    reversedBy: string
  ): JournalEntry {
    if (original.status !== 'POSTED' && original.status !== 'RECONCILED') {
      throw new Error(`Cannot reverse transaction with status '${original.status}'. Only POSTED transactions can be reversed.`);
    }

    // Swap Debits and Credits
    const reversalLines: JournalLine[] = original.lines.map((line, idx) => ({
      id: `rev-line-${Date.now()}-${idx}`,
      accountId: line.accountId,
      accountName: line.accountName,
      debit: line.credit, // Invert
      credit: line.debit, // Invert
      description: `Reversal of line: ${line.description || original.entryNumber}`,
      costCenterId: line.costCenterId,
      hsnCode: line.hsnCode,
      gstRate: line.gstRate,
    }));

    return {
      id: `trx-rev-${Date.now()}`,
      entryNumber: `REV-${original.entryNumber}`,
      voucherType: 'JOURNAL',
      entryDate: new Date().toISOString().split('T')[0],
      status: 'POSTED',
      lines: reversalLines,
      totalDebit: original.totalCredit,
      totalCredit: original.totalDebit,
      narration: `[REVERSAL OF ${original.entryNumber}] ${reason}`,
      sourceType: 'SYSTEM',
      sourceDocumentId: original.id,
      createdBy: reversedBy,
      approvedBy: reversedBy,
      postedAt: new Date().toISOString(),
      tags: ['REVERSAL', 'AUDIT_CORRECTION'],
    };
  }

  /**
   * Deterministically compute Trial Balance from Accounts & Posted Entries
   */
  public static computeTrialBalance(
    accounts: Account[],
    postedEntries: JournalEntry[]
  ): { items: TrialBalanceItem[]; totalDebit: number; totalCredit: number; isBalanced: boolean } {
    const balances: Record<string, { debit: number; credit: number }> = {};

    accounts.forEach((acc) => {
      balances[acc.id] = { debit: 0, credit: 0 };
    });

    postedEntries
      .filter((e) => e.status === 'POSTED' || e.status === 'RECONCILED')
      .forEach((entry) => {
        entry.lines.forEach((line) => {
          if (!balances[line.accountId]) {
            balances[line.accountId] = { debit: 0, credit: 0 };
          }
          balances[line.accountId].debit += line.debit;
          balances[line.accountId].credit += line.credit;
        });
      });

    let totalTBDebit = 0;
    let totalTBCredit = 0;

    const items: TrialBalanceItem[] = accounts.map((acc) => {
      const b = balances[acc.id] || { debit: 0, credit: 0 };
      const net = b.debit - b.credit;
      const netDebit = net > 0 ? net : 0;
      const netCredit = net < 0 ? Math.abs(net) : 0;

      totalTBDebit += netDebit;
      totalTBCredit += netCredit;

      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        debit: b.debit,
        credit: b.credit,
        netDebit: Math.round(netDebit * 100) / 100,
        netCredit: Math.round(netCredit * 100) / 100,
      };
    });

    const diff = Math.abs(totalTBDebit - totalTBCredit);

    return {
      items,
      totalDebit: Math.round(totalTBDebit * 100) / 100,
      totalCredit: Math.round(totalTBCredit * 100) / 100,
      isBalanced: diff < 0.05,
    };
  }

  /**
   * Deterministically generate Profit & Loss and Balance Sheet.
   */
  public static computeFinancialStatements(
    accounts: Account[],
    postedEntries: JournalEntry[]
  ): FinancialStatements {
    const accountBalances: Record<string, number> = {};

    accounts.forEach((acc) => {
      if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
        accountBalances[acc.id] = acc.balance;
      } else {
        accountBalances[acc.id] = -acc.balance;
      }
    });

    postedEntries
      .filter((e) => e.status === 'POSTED' || e.status === 'RECONCILED')
      .forEach((entry) => {
        entry.lines.forEach((line) => {
          if (accountBalances[line.accountId] === undefined) {
            accountBalances[line.accountId] = 0;
          }
          // Debits increase Assets & Expenses; Credits increase Liabilities, Equity & Income
          accountBalances[line.accountId] += (line.debit - line.credit);
        });
      });

    // P&L Accounts
    const revenueItems: { name: string; amount: number }[] = [];
    const cogsItems: { name: string; amount: number }[] = [];
    const expenseItems: { name: string; amount: number }[] = [];

    // Balance Sheet Accounts
    const assetItems: { name: string; amount: number; subType: string }[] = [];
    const liabilityItems: { name: string; amount: number; subType: string }[] = [];
    const equityItems: { name: string; amount: number }[] = [];

    accounts.forEach((acc) => {
      const netMovement = accountBalances[acc.id] || 0;

      if (acc.type === 'INCOME') {
        // Income is normally credit (- movement)
        const amt = Math.max(0, -netMovement);
        if (amt > 0) revenueItems.push({ name: acc.name, amount: amt });
      } else if (acc.type === 'EXPENSE') {
        const amt = Math.max(0, netMovement);
        if (acc.subType === 'DIRECT_EXPENSE') {
          if (amt > 0) cogsItems.push({ name: acc.name, amount: amt });
        } else {
          if (amt > 0) expenseItems.push({ name: acc.name, amount: amt });
        }
      } else if (acc.type === 'ASSET') {
        const amt = netMovement;
        assetItems.push({ name: acc.name, amount: amt, subType: acc.subType });
      } else if (acc.type === 'LIABILITY') {
        const amt = -netMovement;
        liabilityItems.push({ name: acc.name, amount: amt, subType: acc.subType });
      } else if (acc.type === 'EQUITY') {
        const amt = -netMovement;
        equityItems.push({ name: acc.name, amount: amt });
      }
    });

    const totalRevenue = revenueItems.reduce((sum, item) => sum + item.amount, 0);
    const totalCogs = cogsItems.reduce((sum, item) => sum + item.amount, 0);
    const grossProfit = totalRevenue - totalCogs;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
    const netOperatingProfit = grossProfit - totalExpenses;
    const netProfitMarginPercent = totalRevenue > 0 ? (netOperatingProfit / totalRevenue) * 100 : 0;

    const totalAssets = assetItems.reduce((sum, a) => sum + a.amount, 0);
    const totalLiabilities = liabilityItems.reduce((sum, l) => sum + l.amount, 0);
    const baseEquity = equityItems.reduce((sum, e) => sum + e.amount, 0);
    const totalEquity = baseEquity + netOperatingProfit; // Retained earnings from P&L

    const diff = Math.abs(totalAssets - (totalLiabilities + totalEquity));

    // Current assets vs current liabilities
    const currentAssets = assetItems
      .filter((a) => ['CASH', 'BANK', 'ACCOUNTS_RECEIVABLE', 'INVENTORY'].includes(a.subType))
      .reduce((sum, a) => sum + a.amount, 0);

    const currentLiabilities = liabilityItems
      .filter((l) => ['ACCOUNTS_PAYABLE', 'DUTIES_AND_TAXES', 'CURRENT_LIABILITY'].includes(l.subType))
      .reduce((sum, l) => sum + l.amount, 0);

    const workingCapital = currentAssets - currentLiabilities;
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 1.0;
    const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;

    // Monthly burn assumption from expenses
    const monthlyBurn = (totalCogs + totalExpenses) / 3 || 100000;
    const cash = assetItems
      .filter((a) => ['CASH', 'BANK'].includes(a.subType))
      .reduce((sum, a) => sum + a.amount, 0);
    const cashRunwayDays = Math.round((cash / (monthlyBurn / 30)));

    return {
      profitAndLoss: {
        revenue: revenueItems,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        costOfGoodsSold: cogsItems,
        totalCogs: Math.round(totalCogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
        expenses: expenseItems,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netOperatingProfit: Math.round(netOperatingProfit * 100) / 100,
        netProfitMarginPercent: Math.round(netProfitMarginPercent * 10) / 10,
      },
      balanceSheet: {
        assets: assetItems,
        totalAssets: Math.round(totalAssets * 100) / 100,
        liabilities: liabilityItems,
        totalLiabilities: Math.round(totalLiabilities * 100) / 100,
        equity: equityItems,
        totalEquity: Math.round(totalEquity * 100) / 100,
        retainedEarnings: Math.round(netOperatingProfit * 100) / 100,
        isBalanced: diff < 1.0,
        difference: Math.round(diff * 100) / 100,
      },
      keyMetrics: {
        workingCapital: Math.round(workingCapital * 100) / 100,
        currentRatio: Math.round(currentRatio * 100) / 100,
        debtToEquity: Math.round(debtToEquity * 100) / 100,
        cashRunwayDays,
      },
    };
  }
}
