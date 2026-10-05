'use client';

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  Activity,
  DollarSign,
  ShieldCheck,
  Zap,
  Clock,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { AccountingEngine } from '@/lib/engine/accounting-engine';

export const HealthWorkspace: React.FC = () => {
  const { accounts, journalEntries, invoices, bankTransactions } = useLedger();

  const statements = useMemo(
    () => AccountingEngine.computeFinancialStatements(accounts, journalEntries),
    [accounts, journalEntries]
  );

  // Core financial KPIs
  const cash = accounts.filter((a) => a.subType === 'CASH' || a.subType === 'BANK').reduce((s, a) => s + a.balance, 0);
  const receivables = accounts.filter((a) => a.subType === 'ACCOUNTS_RECEIVABLE').reduce((s, a) => s + a.balance, 0);
  const payables = accounts.filter((a) => a.subType === 'ACCOUNTS_PAYABLE').reduce((s, a) => s + a.balance, 0);
  const inventory = accounts.filter((a) => a.subType === 'INVENTORY').reduce((s, a) => s + a.balance, 0);
  const loans = accounts.filter((a) => a.subType === 'CURRENT_LIABILITY').reduce((s, a) => s + a.balance, 0);
  const fixedAssets = accounts.filter((a) => a.subType === 'FIXED_ASSET').reduce((s, a) => s + a.balance, 0);

  const currentAssets = cash + receivables + inventory;
  const currentLiabilities = payables;
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 99;
  const quickRatio = currentLiabilities > 0 ? (cash + receivables) / currentLiabilities : 99;
  const debtToEquity = statements.balanceSheet.totalEquity > 0 ? loans / statements.balanceSheet.totalEquity : 0;

  const totalRev = statements.profitAndLoss.totalRevenue || 0;
  const grossProfit = totalRev - (accounts.find((a) => a.code === '5001')?.balance || 0);
  const grossMargin = totalRev > 0 ? (grossProfit / totalRev) * 100 : 0;
  const netMargin = totalRev > 0 ? (statements.profitAndLoss.netOperatingProfit / totalRev) * 100 : 0;

  const monthlyBurnRate = Math.abs((statements.profitAndLoss.totalExpenses || 0) / 12);
  const cashRunway = monthlyBurnRate > 0 ? Math.floor(cash / monthlyBurnRate) : 99;

  // Reconciled vs unmatched bank
  const reconciledPct = bankTransactions.length > 0
    ? Math.round((bankTransactions.filter((t) => t.reconciliationStatus === 'RECONCILED').length / bankTransactions.length) * 100)
    : 100;

  // Overdue invoices
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = invoices.filter((i) => i.status === 'ISSUED' && i.dueDate < today).length;
  const overdueAmount = invoices
    .filter((i) => i.status === 'ISSUED' && i.dueDate < today)
    .reduce((s, i) => s + i.grandTotal, 0);

  // Health score computation (0-100)
  let score = 100;
  if (currentRatio < 1) score -= 25;
  else if (currentRatio < 1.5) score -= 10;
  if (quickRatio < 0.8) score -= 15;
  if (debtToEquity > 2) score -= 15;
  else if (debtToEquity > 1) score -= 5;
  if (netMargin < 0) score -= 20;
  else if (netMargin < 5) score -= 5;
  if (cashRunway < 3) score -= 20;
  if (overdueCount > 5) score -= 10;
  if (reconciledPct < 80) score -= 10;
  score = Math.max(0, Math.min(100, score));

  const scoreColor = score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-red-700';
  const scoreBg = score >= 80 ? 'bg-emerald-50 border-emerald-300' : score >= 60 ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300';
  const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Moderate Risk' : 'Critical Attention Required';

  const metrics = [
    {
      label: 'Current Ratio',
      value: currentRatio.toFixed(2) + 'x',
      target: '> 1.5x',
      status: currentRatio >= 1.5 ? 'OK' : currentRatio >= 1 ? 'WARN' : 'ALERT',
      description: 'Current Assets ÷ Current Liabilities',
    },
    {
      label: 'Quick Ratio',
      value: quickRatio.toFixed(2) + 'x',
      target: '> 1.0x',
      status: quickRatio >= 1 ? 'OK' : quickRatio >= 0.8 ? 'WARN' : 'ALERT',
      description: '(Cash + Receivables) ÷ Current Liabilities',
    },
    {
      label: 'Gross Margin',
      value: grossMargin.toFixed(1) + '%',
      target: '> 30%',
      status: grossMargin >= 30 ? 'OK' : grossMargin >= 15 ? 'WARN' : 'ALERT',
      description: 'Revenue after direct costs',
    },
    {
      label: 'Net Profit Margin',
      value: netMargin.toFixed(1) + '%',
      target: '> 10%',
      status: netMargin >= 10 ? 'OK' : netMargin >= 0 ? 'WARN' : 'ALERT',
      description: 'Net profit after all expenses',
    },
    {
      label: 'Cash Runway',
      value: cashRunway >= 99 ? '∞' : cashRunway + ' months',
      target: '> 6 months',
      status: cashRunway >= 6 ? 'OK' : cashRunway >= 3 ? 'WARN' : 'ALERT',
      description: 'Months of cash at current burn rate',
    },
    {
      label: 'Debt-to-Equity',
      value: debtToEquity.toFixed(2) + 'x',
      target: '< 1.0x',
      status: debtToEquity <= 1 ? 'OK' : debtToEquity <= 2 ? 'WARN' : 'ALERT',
      description: 'Total Debt ÷ Total Equity',
    },
    {
      label: 'Bank Reconciled',
      value: reconciledPct + '%',
      target: '100%',
      status: reconciledPct === 100 ? 'OK' : reconciledPct >= 90 ? 'WARN' : 'ALERT',
      description: 'Of bank transactions reconciled to ledger',
    },
    {
      label: 'Overdue Invoices',
      value: overdueCount === 0 ? 'None' : overdueCount + ' (₹' + overdueAmount.toLocaleString('en-IN') + ')',
      target: '0 overdue',
      status: overdueCount === 0 ? 'OK' : overdueCount <= 3 ? 'WARN' : 'ALERT',
      description: 'Issued invoices past due date',
    },
  ];

  const statusColors: Record<string, string> = {
    OK: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    WARN: 'bg-amber-50 border-amber-200 text-amber-700',
    ALERT: 'bg-red-50 border-red-200 text-red-700',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    OK: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    WARN: <AlertTriangle className="h-4 w-4 text-amber-600" />,
    ALERT: <AlertTriangle className="h-4 w-4 text-red-600" />,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[#005a9e] text-[11px] font-bold uppercase tracking-wider">
          <Activity className="h-3.5 w-3.5" />
          <span>Real-Time Financial Diagnostics</span>
        </div>
        <h1 className="text-lg font-extrabold text-slate-900 mt-0.5">Business Health Monitor</h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Automatically computed from your live general ledger. No manual inputs.
        </p>
      </div>

      {/* Health Score Banner */}
      <div className={`flex items-center justify-between p-5 rounded-xs border ${scoreBg}`}>
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Overall Business Health Score</p>
          <p className={`text-5xl font-black font-mono mt-1 ${scoreColor}`}>{score}<span className="text-2xl">/100</span></p>
          <p className={`text-sm font-bold mt-1 ${scoreColor}`}>{scoreLabel}</p>
        </div>
        <div className="text-right space-y-2">
          <div className="text-xs text-slate-600">
            <p className="font-bold text-slate-900 text-base font-mono">₹{cash.toLocaleString('en-IN')}</p>
            <p>Liquid Cash & Bank</p>
          </div>
          <div className="text-xs text-slate-600">
            <p className={`font-bold text-base font-mono ${statements.profitAndLoss.netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {statements.profitAndLoss.netOperatingProfit >= 0 ? '+' : ''}₹{statements.profitAndLoss.netOperatingProfit.toLocaleString('en-IN')}
            </p>
            <p>Net P&L (YTD)</p>
          </div>
          <div className="text-xs text-slate-600">
            <p className="font-bold text-slate-900 text-base font-mono">₹{statements.profitAndLoss.totalRevenue.toLocaleString('en-IN')}</p>
            <p>Total Revenue (YTD)</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div>
        <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart2 className="h-3.5 w-3.5 text-[#005a9e]" />
          Financial Ratios & KPIs
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className={`p-3 rounded-xs border ${statusColors[m.status]}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{m.label}</span>
                {statusIcons[m.status]}
              </div>
              <p className="text-xl font-black font-mono">{m.value}</p>
              <p className="text-[10px] opacity-60 mt-1">Target: {m.target}</p>
              <p className="text-[10px] mt-1 opacity-80">{m.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Balance Sheet Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-[#c2d4e5] rounded-xs overflow-hidden">
          <div className="bg-[#e8f0f8] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#005a9e] border-b border-[#c2d4e5] flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5" />
            Asset Composition
          </div>
          <div className="divide-y divide-[#e8f0f8]">
            {[
              { label: 'Cash & Bank', value: cash },
              { label: 'Trade Receivables', value: receivables },
              { label: 'Inventory (Stock)', value: inventory },
              { label: 'Fixed Assets', value: fixedAssets },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="text-slate-700 font-semibold">{row.label}</span>
                <span className="font-mono font-bold text-slate-900">₹{row.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#c2d4e5] rounded-xs overflow-hidden">
          <div className="bg-[#e8f0f8] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#005a9e] border-b border-[#c2d4e5] flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Liability & Equity
          </div>
          <div className="divide-y divide-[#e8f0f8]">
            {[
              { label: 'Trade Payables', value: payables },
              { label: 'Loans & Borrowings', value: loans },
              { label: 'Total Equity', value: statements.balanceSheet.totalEquity },
              { label: 'Retained Earnings', value: statements.balanceSheet.retainedEarnings },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="text-slate-700 font-semibold">{row.label}</span>
                <span className={`font-mono font-bold ${row.value >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                  ₹{Math.abs(row.value).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="border border-[#c2d4e5] rounded-xs overflow-hidden">
        <div className="bg-[#e8f0f8] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#005a9e] border-b border-[#c2d4e5] flex items-center gap-2">
          <Zap className="h-3.5 w-3.5" />
          AI Diagnostic Alerts
        </div>
        <div className="divide-y divide-[#e8f0f8]">
          {metrics.filter((m) => m.status !== 'OK').length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-4 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-semibold">All health metrics are within acceptable ranges. Business is performing well.</span>
            </div>
          ) : (
            metrics
              .filter((m) => m.status !== 'OK')
              .map((m) => (
                <div key={m.label} className={`flex items-start gap-3 px-4 py-3 text-xs ${m.status === 'ALERT' ? 'bg-red-50/60' : 'bg-amber-50/60'}`}>
                  {statusIcons[m.status]}
                  <div>
                    <p className="font-bold text-slate-900">{m.label}: {m.value}</p>
                    <p className="text-slate-600 mt-0.5">{m.description} — Target is {m.target}</p>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};
