'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Plus,
  FileText,
  Send,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Clock,
  Receipt,
  ChevronRight,
  X,
  Building2,
  UploadCloud,
  DollarSign,
  Briefcase,
  Layers,
  Search,
  LayoutGrid,
  ListFilter,
  BarChart2,
  Calendar,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { AccountingEngine } from '@/lib/engine/accounting-engine';
import { QuickTransactionModal } from '@/components/modals/QuickTransactionModal';
import { AgentOrchestrator, CommandExecutionResult } from '@/lib/ai/agent-orchestrator';

interface DashboardProps {
  setActiveView: (view: string) => void;
  onOpenAskAI?: (query?: string) => void;
}

export const DashboardWorkspace: React.FC<DashboardProps> = ({ setActiveView, onOpenAskAI }) => {
  const {
    org,
    accounts,
    journalEntries,
    invoices,
    products,
    bankTransactions,
    activityFeed,
    addInvoice,
    addJournalEntry,
    approveTransaction,
    runReconciliation,
  } = useLedger();

  // Mode: 'DASHBOARD' (Modern Financial OS) or 'GATEWAY' (Structured Gateway Matrix)
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'GATEWAY'>('DASHBOARD');

  // Quick Action Modal
  const [showQuickTxModal, setShowQuickTxModal] = useState(false);
  const [quickTxDefaultTab, setQuickTxDefaultTab] = useState<'ai' | 'sales' | 'purchase' | 'receipt' | 'payment'>('ai');

  // Top Natural Language Prompt Bar
  const [naturalInput, setNaturalInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiExecutionResult, setAiExecutionResult] = useState<CommandExecutionResult | null>(null);

  // Compute live financial statements from real state
  const statements = AccountingEngine.computeFinancialStatements(accounts, journalEntries);
  const pnl = statements.profitAndLoss;
  const bs = statements.balanceSheet;

  const bankAccounts = accounts.filter((a) => a.subType === 'CASH' || a.subType === 'BANK');
  const liquidCash = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

  const totalReceivables = accounts
    .filter((a) => a.subType === 'ACCOUNTS_RECEIVABLE')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalPayables = accounts
    .filter((a) => a.subType === 'ACCOUNTS_PAYABLE')
    .reduce((sum, a) => sum + a.balance, 0);

  const pendingAttentionItems = activityFeed.filter(
    (item) => item.status === 'PENDING_APPROVAL' || item.status === 'ATTENTION_REQUIRED'
  );

  const handleRunNaturalCommand = async (customText?: string) => {
    const textToRun = customText || naturalInput;
    if (!textToRun.trim()) return;

    setIsAiProcessing(true);
    setAiExecutionResult(null);

    try {
      const res = await AgentOrchestrator.executeCommand(textToRun, {
        organizationName: org.name,
        accounts,
        invoices,
        bankTransactions,
        products,
        journalEntries,
      });
      setAiExecutionResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApproveAiAction = () => {
    if (!aiExecutionResult?.proposedAction) return;
    const action = aiExecutionResult.proposedAction;

    if (action.type === 'POST_SALES_INVOICE' && action.payload?.invoice) {
      addInvoice(action.payload.invoice);
      alert('✓ Sales Invoice posted to General Ledger!');
    } else if (action.type === 'POST_PURCHASE_BILL' && action.payload?.journalEntry) {
      addJournalEntry(action.payload.journalEntry);
      alert('✓ Purchase bill recorded in General Ledger!');
    } else if (action.type === 'POST_RECEIPT' && action.payload?.journalEntry) {
      addJournalEntry(action.payload.journalEntry);
      alert('✓ Bank receipt recorded & customer balance updated!');
    } else if (action.type === 'POST_PAYMENT' && action.payload?.journalEntry) {
      addJournalEntry(action.payload.journalEntry);
      alert('✓ Payment voucher posted & bank balance updated!');
    } else if (action.type === 'POST_RECONCILIATION') {
      runReconciliation();
      alert('✓ Bank reconciliation completed!');
    } else {
      alert(`✓ ${action.description}`);
    }

    setAiExecutionResult(null);
    setNaturalInput('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* ── Top Bar: Greeting & View Switcher ────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Welcome back, {org.name}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic Financial OS · FY 2026-27 · All systems nominal
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-slate-200/60 rounded-lg text-xs font-medium border border-slate-200">
            <button
              onClick={() => setViewMode('DASHBOARD')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'DASHBOARD'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Executive View
            </button>
            <button
              onClick={() => setViewMode('GATEWAY')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'GATEWAY'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gateway Matrix
            </button>
          </div>

          <button
            onClick={() => {
              setQuickTxDefaultTab('sales');
              setShowQuickTxModal(true);
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Voucher</span>
          </button>
        </div>
      </div>

      {/* ── Hero: "Tell Vahi What Happened" AI Command Card ────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Tell Vahi what happened in your business
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunNaturalCommand()}
              placeholder="e.g. Sold 5 Laptops to Acme Corp for 4.5L with 18% GST, or Paid rent 45,000 from HDFC..."
              className="w-full pl-4 pr-24 py-3.5 text-xs sm:text-sm bg-white/10 hover:bg-white/15 focus:bg-white text-slate-100 focus:text-slate-900 placeholder-slate-400 focus:placeholder-slate-400 rounded-xl border border-white/15 focus:border-indigo-400 outline-none transition backdrop-blur-md shadow-inner"
            />
            <button
              onClick={() => handleRunNaturalCommand()}
              disabled={isAiProcessing || !naturalInput.trim()}
              className="absolute right-2 px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 disabled:opacity-40 shadow-xs"
            >
              {isAiProcessing ? 'Thinking…' : 'Post Entry'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Preset Prompts Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Quick Actions:</span>
            <button
              onClick={() => {
                const q = 'Who owes me money and why?';
                setNaturalInput(q);
                handleRunNaturalCommand(q);
              }}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition text-[11px]"
            >
              💰 Who owes me money?
            </button>
            <button
              onClick={() => {
                const q = 'Sold 3 MacBooks to Acme Corp for 3,75,000 with 18% GST';
                setNaturalInput(q);
                handleRunNaturalCommand(q);
              }}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition text-[11px]"
            >
              ⚡ Record ₹3.75L Sale (F8)
            </button>
            <button
              onClick={() => {
                const q = 'Paid office rent ₹45,000 from HDFC bank';
                setNaturalInput(q);
                handleRunNaturalCommand(q);
              }}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition text-[11px]"
            >
              ⚡ Paid Rent ₹45K (F5)
            </button>
            <button
              onClick={() => {
                const q = 'Why did gross margin decline this month?';
                setNaturalInput(q);
                handleRunNaturalCommand(q);
              }}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition text-[11px]"
            >
              📊 Why did profit change?
            </button>
          </div>

          {/* AI Result Proposal Card inside Hero */}
          {aiExecutionResult && (
            <div className="mt-4 p-4 rounded-xl bg-white text-slate-900 border border-slate-200 shadow-xl space-y-3 animate-fade-slide">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    {aiExecutionResult.run.agentType} AGENT PROPOSAL
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Score: {aiExecutionResult.run.confidence.overallScore}%
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {aiExecutionResult.speechSummary}
              </p>

              {aiExecutionResult.proposedAction && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleApproveAiAction}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>✓ 1-Click Approve & Post to General Ledger</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setAiExecutionResult(null)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Proactive AI Attention Alerts (If any) ───────────────────── */}
      {pendingAttentionItems.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  {pendingAttentionItems.length} Operational Items Require Your Review
                </h3>
                <p className="text-[11px] text-amber-800/80">
                  Autonomous agents pre-validated these workflows. Click Approve to commit to the financial ledger.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('approvals')}
              className="text-xs font-bold text-amber-900 hover:underline flex items-center gap-1"
            >
              <span>View All Approvals</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingAttentionItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold uppercase text-amber-700">{item.category}</span>
                    <span className="font-mono">{item.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">{item.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{item.summary}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {item.amount ? `₹${item.amount.toLocaleString('en-IN')}` : 'Action Required'}
                  </span>
                  <button
                    onClick={() => {
                      approveTransaction(item.id);
                      alert('✓ Approved & Posted!');
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md shadow-2xs transition"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Executive Metric Cards Grid ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue MTD */}
        <div
          onClick={() => setActiveView('sales')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Revenue (MTD)</span>
            <Receipt className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">
            ₹{pnl.totalRevenue.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+12.4% vs last month</span>
          </div>
        </div>

        {/* Card 2: Net Operating Profit */}
        <div
          onClick={() => setActiveView('reports')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Net Operating Profit</span>
            <Activity className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">
            ₹{pnl.netOperatingProfit.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-600 font-medium">
            <span className="font-mono text-indigo-600 font-bold">{pnl.netProfitMarginPercent.toFixed(1)}%</span>
            <span>net profit margin</span>
          </div>
        </div>

        {/* Card 3: Liquid Cash & Banks */}
        <div
          onClick={() => setActiveView('banking')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Liquid Cash in Banks</span>
            <Landmark className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">
            ₹{liquidCash.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
            <span>2 connected bank accounts</span>
          </div>
        </div>

        {/* Card 4: Accounts Receivable */}
        <div
          onClick={() => setActiveView('receivables')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Outstanding Receivables</span>
            <ArrowDownLeft className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">
            ₹{totalReceivables.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-600 font-medium">
            <span>₹2.4L overdue &gt; 30 days</span>
          </div>
        </div>
      </div>

      {/* ── Main Operations Split: Live Daybook Register & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Daybook Journal Entries */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Daybook & Voucher Register</h3>
              <p className="text-xs text-slate-500">Latest immutable double-entry transactions</p>
            </div>
            <button
              onClick={() => setActiveView('accounting')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View Full Daybook (F7)</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-2 font-mono">Date</th>
                  <th className="pb-2">Voucher No</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Particulars / Narration</th>
                  <th className="pb-2 text-right">Amount (₹)</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journalEntries.slice(0, 7).map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 font-mono text-slate-500">{entry.entryDate}</td>
                    <td className="py-2.5 font-mono font-bold text-slate-900">{entry.entryNumber}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {entry.voucherType}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-700 max-w-[200px] truncate">{entry.narration}</td>
                    <td className="py-2.5 font-mono font-bold text-slate-900 text-right">
                      ₹{entry.totalDebit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                        POSTED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Quick Workflow Tiles & Bank Overview */}
        <div className="space-y-6">
          {/* Quick Operations Launchpad */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Operations Launchpad
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setQuickTxDefaultTab('sales');
                  setShowQuickTxModal(true);
                }}
                className="p-3 rounded-xl border border-slate-200/80 hover:bg-indigo-50/40 hover:border-indigo-200 transition text-left group"
              >
                <Receipt className="h-4 w-4 text-indigo-600 mb-1.5" />
                <p className="text-xs font-bold text-slate-900">Sales Invoice</p>
                <p className="text-[10px] text-slate-500 font-mono">F8 Hotkey</p>
              </button>

              <button
                onClick={() => {
                  setQuickTxDefaultTab('purchase');
                  setShowQuickTxModal(true);
                }}
                className="p-3 rounded-xl border border-slate-200/80 hover:bg-indigo-50/40 hover:border-indigo-200 transition text-left group"
              >
                <Plus className="h-4 w-4 text-emerald-600 mb-1.5" />
                <p className="text-xs font-bold text-slate-900">Purchase Bill</p>
                <p className="text-[10px] text-slate-500 font-mono">F9 Hotkey</p>
              </button>

              <button
                onClick={() => {
                  setQuickTxDefaultTab('receipt');
                  setShowQuickTxModal(true);
                }}
                className="p-3 rounded-xl border border-slate-200/80 hover:bg-indigo-50/40 hover:border-indigo-200 transition text-left group"
              >
                <ArrowDownLeft className="h-4 w-4 text-blue-600 mb-1.5" />
                <p className="text-xs font-bold text-slate-900">Record Receipt</p>
                <p className="text-[10px] text-slate-500 font-mono">F6 Hotkey</p>
              </button>

              <button
                onClick={() => {
                  setQuickTxDefaultTab('payment');
                  setShowQuickTxModal(true);
                }}
                className="p-3 rounded-xl border border-slate-200/80 hover:bg-indigo-50/40 hover:border-indigo-200 transition text-left group"
              >
                <ArrowUpRight className="h-4 w-4 text-rose-600 mb-1.5" />
                <p className="text-xs font-bold text-slate-900">Pay Expense</p>
                <p className="text-[10px] text-slate-500 font-mono">F5 Hotkey</p>
              </button>
            </div>
          </div>

          {/* Connected Bank Balances */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Connected Bank Accounts
              </h3>
              <button
                onClick={() => setActiveView('banking')}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Reconcile (F4)
              </button>
            </div>

            <div className="space-y-2">
              {bankAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{acc.name}</p>
                    <p className="text-[10px] font-mono text-slate-500">{acc.code} · Primary Operating</p>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-900">
                    ₹{acc.balance.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Transaction Modal */}
      {showQuickTxModal && (
        <QuickTransactionModal
          isOpen={showQuickTxModal}
          onClose={() => setShowQuickTxModal(false)}
          defaultTab={quickTxDefaultTab}
        />
      )}
    </div>
  );
};
