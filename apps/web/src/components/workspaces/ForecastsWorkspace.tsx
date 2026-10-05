'use client';

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  ChevronRight,
  Download,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { AccountingEngine } from '@/lib/engine/accounting-engine';

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

export const ForecastsWorkspace: React.FC = () => {
  const { accounts, journalEntries, invoices } = useLedger();
  const [horizon, setHorizon] = useState<3 | 6 | 12>(6);
  const [growthRate, setGrowthRate] = useState(8); // % YoY

  const statements = useMemo(
    () => AccountingEngine.computeFinancialStatements(accounts, journalEntries),
    [accounts, journalEntries]
  );

  const monthlyRevenue = (statements.profitAndLoss.totalRevenue || 0) / 12;
  const monthlyExpenses = (statements.profitAndLoss.totalExpenses || 0) / 12;
  const monthlyNetIncome = monthlyRevenue - monthlyExpenses;
  const cash = accounts.filter((a) => a.subType === 'CASH' || a.subType === 'BANK').reduce((s, a) => s + a.balance, 0);

  // Generate forecast months
  const forecastMonths = useMemo(() => {
    const now = new Date();
    const months = [];
    let runningCash = cash;
    const monthlyGrowth = growthRate / 100 / 12;

    for (let i = 0; i < horizon; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      const growth = Math.pow(1 + monthlyGrowth, i + 1);
      const rev = Math.round(monthlyRevenue * growth);
      const exp = Math.round(monthlyExpenses * growth * 0.95); // expenses grow slightly less
      const net = rev - exp;
      runningCash += net;

      months.push({
        label: MONTHS[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2),
        revenue: rev,
        expenses: exp,
        netIncome: net,
        cashPosition: runningCash,
      });
    }
    return months;
  }, [horizon, growthRate, monthlyRevenue, monthlyExpenses, cash]);

  const totalForecastRevenue = forecastMonths.reduce((s, m) => s + m.revenue, 0);
  const totalForecastExpenses = forecastMonths.reduce((s, m) => s + m.expenses, 0);
  const totalForecastNet = forecastMonths.reduce((s, m) => s + m.netIncome, 0);
  const endingCash = forecastMonths[forecastMonths.length - 1]?.cashPosition || cash;

  const maxRevenue = Math.max(...forecastMonths.map((m) => m.revenue));

  // Invoice pipeline
  const pendingInvoices = invoices.filter((i) => i.status === 'ISSUED');
  const pipelineAmount = pendingInvoices.reduce((s, i) => s + i.grandTotal, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#005a9e] text-[11px] font-bold uppercase tracking-wider">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>AI Cash Flow Projection Engine</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 mt-0.5">Business Forecasts</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Extrapolated from actual ledger data · Adjustable growth assumptions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-[#b0c4de] text-slate-700 text-xs font-semibold rounded-xs transition"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 p-4 bg-[#f0f5fa] border border-[#c2d4e5] rounded-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-[#005a9e]" />
          <span className="text-xs font-bold text-slate-700">Forecast Horizon:</span>
          {([3, 6, 12] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1 text-xs font-bold rounded-xs border transition ${horizon === h ? 'bg-[#005a9e] text-white border-[#005a9e]' : 'bg-white text-slate-700 border-[#b0c4de] hover:border-[#005a9e]'}`}
            >
              {h} Months
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-[#b0c4de]" />
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-[#005a9e]" />
          <span className="text-xs font-bold text-slate-700">Revenue Growth Rate:</span>
          <input
            type="range"
            min={-20}
            max={50}
            step={1}
            value={growthRate}
            onChange={(e) => setGrowthRate(Number(e.target.value))}
            className="w-32 accent-[#005a9e]"
          />
          <span className={`font-mono font-bold text-xs w-12 ${growthRate < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {growthRate > 0 ? '+' : ''}{growthRate}% p.a.
          </span>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: `${horizon}M Forecast Revenue`, value: totalForecastRevenue, color: 'text-emerald-700', sub: 'Projected sales' },
          { label: `${horizon}M Forecast Expenses`, value: totalForecastExpenses, color: 'text-amber-700', sub: 'Operating costs' },
          { label: `${horizon}M Net P&L`, value: totalForecastNet, color: totalForecastNet >= 0 ? 'text-emerald-700' : 'text-red-700', sub: 'Projected profit' },
          { label: `Ending Cash (${horizon}M)`, value: endingCash, color: endingCash >= 0 ? 'text-slate-900' : 'text-red-700', sub: 'Closing bank balance' },
        ].map((kpi) => (
          <div key={kpi.label} className="border border-[#c2d4e5] rounded-xs bg-white p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-xl font-black font-mono mt-1 ${kpi.color}`}>
              {kpi.value < 0 ? '(' : ''}₹{Math.abs(kpi.value).toLocaleString('en-IN')}{kpi.value < 0 ? ')' : ''}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart visualization */}
      <div className="border border-[#c2d4e5] rounded-xs overflow-hidden bg-white">
        <div className="bg-[#e8f0f8] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#005a9e] border-b border-[#c2d4e5] flex items-center gap-2">
          <BarChart2 className="h-3.5 w-3.5" />
          Monthly Revenue vs Expenses Projection
        </div>
        <div className="p-4">
          <div className="flex items-end gap-2 h-40">
            {forecastMonths.map((m, i) => {
              const revPct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
              const expPct = maxRevenue > 0 ? (m.expenses / maxRevenue) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group cursor-pointer">
                  <div className="w-full flex gap-0.5 items-end" style={{ height: '140px' }}>
                    <div
                      className="flex-1 bg-[#005a9e]/80 rounded-t-xs transition-all group-hover:bg-[#005a9e]"
                      style={{ height: `${revPct}%` }}
                      title={`Revenue: ₹${m.revenue.toLocaleString('en-IN')}`}
                    />
                    <div
                      className="flex-1 bg-amber-400/80 rounded-t-xs transition-all group-hover:bg-amber-500"
                      style={{ height: `${expPct}%` }}
                      title={`Expenses: ₹${m.expenses.toLocaleString('en-IN')}`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">{m.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-600">
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-xs bg-[#005a9e]" />Revenue</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-xs bg-amber-400" />Expenses</span>
          </div>
        </div>
      </div>

      {/* Monthly Forecast Table */}
      <div className="border border-[#c2d4e5] rounded-xs overflow-hidden">
        <div className="bg-[#e8f0f8] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#005a9e] border-b border-[#c2d4e5]">
          Monthly Forecast Detail
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#f4f8fc] border-b border-[#c2d4e5]">
              <tr>
                <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Month</th>
                <th className="py-2 px-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Revenue</th>
                <th className="py-2 px-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expenses</th>
                <th className="py-2 px-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Income</th>
                <th className="py-2 px-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cash Position</th>
                <th className="py-2 px-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8f0f8]">
              {forecastMonths.map((m, i) => (
                <tr key={i} className="hover:bg-[#f7fafd] transition">
                  <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">{m.label}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-700 font-semibold">₹{m.revenue.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-amber-700 font-semibold">₹{m.expenses.toLocaleString('en-IN')}</td>
                  <td className={`py-2.5 px-4 text-right font-mono font-bold ${m.netIncome >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {m.netIncome >= 0 ? '+' : ''}₹{Math.abs(m.netIncome).toLocaleString('en-IN')}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-mono font-black ${m.cashPosition >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                    ₹{m.cashPosition.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {m.netIncome >= 0 && m.cashPosition >= 0 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mx-auto" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Pipeline */}
      {pendingInvoices.length > 0 && (
        <div className="border border-[#c2d4e5] rounded-xs overflow-hidden">
          <div className="bg-[#e8f0f8] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#005a9e] border-b border-[#c2d4e5] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5" />
              Confirmed Revenue Pipeline (Issued Invoices)
            </span>
            <span className="font-mono text-[#005a9e]">₹{pipelineAmount.toLocaleString('en-IN')} pending collection</span>
          </div>
          <div className="divide-y divide-[#e8f0f8]">
            {pendingInvoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-[#f7fafd] transition">
                <div>
                  <p className="font-bold text-slate-900">{inv.partyName}</p>
                  <p className="text-slate-500">{inv.invoiceNumber} · Due {inv.dueDate}</p>
                </div>
                <span className="font-mono font-bold text-emerald-700">₹{inv.grandTotal.toLocaleString('en-IN')}</span>
              </div>
            ))}
            {pendingInvoices.length > 5 && (
              <p className="text-xs text-slate-400 px-4 py-2 text-center">
                +{pendingInvoices.length - 5} more invoices in pipeline
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
