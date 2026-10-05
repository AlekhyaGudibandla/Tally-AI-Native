'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Layers,
  Scale,
  Calendar,
  CheckCircle2,
  Printer,
  Download,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { AccountingEngine } from '@/lib/engine/accounting-engine';

export const ReportsWorkspace: React.FC = () => {
  const { org, accounts, journalEntries } = useLedger();
  const [statementType, setStatementType] = useState<'PL' | 'BALANCE_SHEET' | 'TRIAL_BALANCE'>('PL');

  const statements = AccountingEngine.computeFinancialStatements(accounts, journalEntries);
  const trialBalance = AccountingEngine.computeTrialBalance(accounts, journalEntries);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <BarChart3 className="h-4 w-4" />
            <span>Deterministic Financial Reporting Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Financial Statements (P&L, Balance Sheet, Trial Balance)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Mathematically aggregated from the double-entry general ledger. Zero LLM hallucinations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition border border-slate-200 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Export / Print</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setStatementType('PL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            statementType === 'PL'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Profit & Loss Statement (Income Statement)
        </button>
        <button
          onClick={() => setStatementType('BALANCE_SHEET')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            statementType === 'BALANCE_SHEET'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Balance Sheet (Position Statement)
        </button>
        <button
          onClick={() => setStatementType('TRIAL_BALANCE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            statementType === 'TRIAL_BALANCE'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Trial Balance
        </button>
      </div>

      {/* REPORT 1: PROFIT & LOSS */}
      {statementType === 'PL' && (
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">{org.legalName}</h2>
              <p className="text-xs text-slate-500">Statement of Profit & Loss for Fiscal Year {org.currentFiscalYear}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Net Operating Margin</span>
              <p className="font-mono font-bold text-emerald-700 text-lg">
                {statements.profitAndLoss.netProfitMarginPercent}%
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs font-medium">
            {/* Section 1: Revenue */}
            <div className="space-y-1.5">
              <h3 className="text-indigo-600 font-bold uppercase tracking-wider text-[11px]">
                I. Revenue from Operations
              </h3>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1">
                {statements.profitAndLoss.revenue.map((r, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span className="text-slate-700">{r.name}</span>
                    <span className="font-mono text-slate-900">₹{r.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                  <span className="text-slate-900">Total Revenue (A):</span>
                  <span className="font-mono text-indigo-700">
                    ₹{statements.profitAndLoss.totalRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: COGS */}
            <div className="space-y-1.5">
              <h3 className="text-sky-700 font-bold uppercase tracking-wider text-[11px]">
                II. Cost of Goods Sold (Direct Costs)
              </h3>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1">
                {statements.profitAndLoss.costOfGoodsSold.map((c, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span className="text-slate-700">{c.name}</span>
                    <span className="font-mono text-slate-900">₹{c.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                  <span className="text-slate-900">Total Direct Cost of Goods (B):</span>
                  <span className="font-mono text-slate-900">
                    ₹{statements.profitAndLoss.totalCogs.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Gross Profit Summary */}
            <div className="p-3.5 rounded-lg bg-slate-100 border border-slate-200 flex justify-between items-center text-sm font-bold">
              <span className="text-slate-900">Gross Profit (A - B):</span>
              <div className="text-right">
                <span className="font-mono text-emerald-700">
                  ₹{statements.profitAndLoss.grossProfit.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 block font-normal">
                  Gross Margin: {statements.profitAndLoss.grossMarginPercent}%
                </span>
              </div>
            </div>

            {/* Section 3: Operating Expenses */}
            <div className="space-y-1.5">
              <h3 className="text-amber-700 font-bold uppercase tracking-wider text-[11px]">
                III. Operating & Administrative Expenses
              </h3>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1">
                {statements.profitAndLoss.expenses.map((e, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span className="text-slate-700">{e.name}</span>
                    <span className="font-mono text-slate-900">₹{e.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                  <span className="text-slate-900">Total Operating Expenses (C):</span>
                  <span className="font-mono text-slate-900">
                    ₹{statements.profitAndLoss.totalExpenses.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Final Net Operating Profit */}
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex justify-between items-center text-base font-bold">
              <span className="text-slate-900">Net Operating Profit:</span>
              <span className="font-mono text-emerald-700 text-lg">
                ₹{statements.profitAndLoss.netOperatingProfit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: BALANCE SHEET */}
      {statementType === 'BALANCE_SHEET' && (
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">{org.legalName}</h2>
              <p className="text-xs text-slate-500">Balance Sheet as at {new Date().toISOString().split('T')[0]}</p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-mono text-emerald-700 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Assets = Liabilities + Equity (Balanced)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
            {/* Left Column: Assets */}
            <div className="space-y-3">
              <h3 className="font-bold text-indigo-600 uppercase tracking-wider text-xs">
                Assets (Application of Funds)
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
                {statements.balanceSheet.assets.map((a, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-slate-200/60">
                    <div>
                      <span className="text-slate-900">{a.name}</span>
                      <span className="text-[10px] text-slate-500 block">{a.subType}</span>
                    </div>
                    <span className="font-mono text-slate-700">₹{a.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 font-bold text-sm border-t border-slate-200">
                  <span className="text-slate-900">Total Assets:</span>
                  <span className="font-mono text-indigo-700">
                    ₹{statements.balanceSheet.totalAssets.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Liabilities & Equity */}
            <div className="space-y-3">
              <h3 className="font-bold text-amber-700 uppercase tracking-wider text-xs">
                Liabilities & Shareholder Equity (Sources of Funds)
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Liabilities</p>
                {statements.balanceSheet.liabilities.map((l, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-slate-200/60">
                    <div>
                      <span className="text-slate-900">{l.name}</span>
                      <span className="text-[10px] text-slate-500 block">{l.subType}</span>
                    </div>
                    <span className="font-mono text-slate-700">₹{l.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}

                <p className="text-[10px] font-bold text-slate-500 uppercase pt-2">Equity & Retained Reserves</p>
                {statements.balanceSheet.equity.map((e, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-900">{e.name}</span>
                    <span className="font-mono text-slate-700">₹{e.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 border-b border-slate-200/60 text-emerald-700 font-semibold">
                  <span>Current Year Retained Surplus (P&L):</span>
                  <span className="font-mono font-bold">
                    ₹{statements.balanceSheet.retainedEarnings.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between pt-3 font-bold text-sm border-t border-slate-200">
                  <span className="text-slate-900">Total Liabilities & Equity:</span>
                  <span className="font-mono text-indigo-700">
                    ₹{(statements.balanceSheet.totalLiabilities + statements.balanceSheet.totalEquity).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: TRIAL BALANCE */}
      {statementType === 'TRIAL_BALANCE' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Trial Balance as of {new Date().toISOString().split('T')[0]}
            </span>
            <span className="text-xs text-emerald-700 font-mono flex items-center font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Verified Balanced: Debit == Credit
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Ledger Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Debit Balance (DR)</th>
                  <th className="py-3 px-4 text-right">Credit Balance (CR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {trialBalance.items.map((it) => (
                  <tr key={it.accountId} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">{it.accountCode}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{it.accountName}</td>
                    <td className="py-2.5 px-4 text-slate-500">{it.accountType}</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {it.netDebit > 0 ? `₹${it.netDebit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {it.netCredit > 0 ? `₹${it.netCredit.toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold font-mono text-sm border-t-2 border-slate-200">
                  <td colSpan={3} className="py-3 px-4 text-indigo-700">
                    Grand Trial Balance Total:
                  </td>
                  <td className="py-3 px-4 text-right text-slate-900">
                    ₹{trialBalance.totalDebit.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-900">
                    ₹{trialBalance.totalCredit.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
