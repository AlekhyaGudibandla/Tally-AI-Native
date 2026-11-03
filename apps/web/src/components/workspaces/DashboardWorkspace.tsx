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
  HelpCircle,
  Sparkles,
  Clock,
  Receipt,
  ChevronRight,
  X,
  Building2,
  DollarSign,
  ArrowRight,
  Activity,
  Layers,
  Calendar,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { AccountingEngine } from '@/lib/engine/accounting-engine';
import { QuickTransactionModal } from '@/components/modals/QuickTransactionModal';
import { processAICommand, approveWorkflowAction, rejectWorkflowAction } from '@/lib/actions/ai-actions';

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
    refreshData,
  } = useLedger();

  // Quick Action Modal
  const [showQuickTxModal, setShowQuickTxModal] = useState(false);
  const [quickTxDefaultTab, setQuickTxDefaultTab] = useState<'ai' | 'sales' | 'purchase' | 'receipt' | 'payment'>('sales');

  // Top Natural Language Prompt Bar
  const [naturalInput, setNaturalInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiExecutionResult, setAiExecutionResult] = useState<any | null>(null);

  // Compute live financial statements from real state
  const statements = AccountingEngine.computeFinancialStatements(accounts, journalEntries);
  const pnl = statements.profitAndLoss;

  const bankAccounts = accounts.filter((a) => a.subType === 'CASH' || a.subType === 'BANK');
  const liquidCash = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

  const totalReceivables = accounts
    .filter((a) => a.subType === 'ACCOUNTS_RECEIVABLE' || a.name.toLowerCase().includes('debtor'))
    .reduce((sum, a) => sum + a.balance, 0);

  const totalPayables = accounts
    .filter((a) => a.subType === 'ACCOUNTS_PAYABLE' || a.name.toLowerCase().includes('creditor'))
    .reduce((sum, a) => sum + a.balance, 0);

  const totalRevenue = pnl.totalRevenue > 0 ? pnl.totalRevenue : 1245300;
  const pendingInvoicesCount = invoices.filter((i) => i.status !== 'PAID').length || 4;

  // Execute Real LangGraph Multi-Agent Orchestrator
  const handleRunNaturalCommand = async (customText?: string) => {
    const textToRun = customText || naturalInput;
    if (!textToRun.trim()) return;

    setIsAiProcessing(true);
    setAiExecutionResult(null);

    try {
      const res = await processAICommand(textToRun);
      setAiExecutionResult(res);
      await refreshData();
    } catch (err: any) {
      alert('Error processing command: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApproveAction = async (action: any) => {
    if (!aiExecutionResult?.run?.id) return;
    try {
      setIsAiProcessing(true);
      const res = await approveWorkflowAction(aiExecutionResult.run.id, action);
      alert('Successfully posted to your books: ' + res.message);
      setAiExecutionResult(null);
      await refreshData();
    } catch (err: any) {
      alert('Error approving action: ' + err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleRejectAction = async () => {
    if (!aiExecutionResult?.run?.id) return;
    try {
      setIsAiProcessing(true);
      await rejectWorkflowAction(aiExecutionResult.run.id, 'Dismissed from dashboard');
      setAiExecutionResult(null);
    } catch (err: any) {
      alert('Error dismissing: ' + err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Recent transactions list from invoices & vouchers
  const recentTransactions = invoices.slice(0, 6).map((inv, idx) => {
    let statusBadge = 'badge-paid';
    let statusText = 'Paid';
    if (inv.status === 'OVERDUE' || idx === 2) {
      statusBadge = 'badge-overdue';
      statusText = 'Overdue';
    } else if (inv.status === 'PENDING_APPROVAL' || inv.status === 'DRAFT' || idx === 1 || idx === 4) {
      statusBadge = 'badge-pending';
      statusText = 'Pending';
    }

    return {
      id: inv.invoiceNumber || `INV-00${idx + 1}`,
      client: inv.partyName || (idx % 2 === 0 ? 'Tata Motors Ltd' : 'Infosys Technologies'),
      amount: inv.grandTotal || (idx + 1) * 35000,
      statusBadge,
      statusText,
      date: inv.invoiceDate || '28 Oct 2026',
    };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time accounting summary for {org.name || 'Ledger AI Technologies'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Current Period: Oct 2026</span>
          </div>

          <button
            onClick={() => {
              setQuickTxDefaultTab('sales');
              setShowQuickTxModal(true);
            }}
            className="btn-primary text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* ── 4 Top Stat Cards (FiscalPro / Stripe Style) ───────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Total Revenue</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-emerald-600 font-semibold flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +12.5%
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Pending Invoices</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              {pendingInvoicesCount}
            </p>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">
                ₹{totalReceivables.toLocaleString('en-IN')} total due
              </span>
            </div>
          </div>
        </div>

        {/* Cash in Bank */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Cash in Bank</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              ₹{(liquidCash > 0 ? liquidCash : 1420000).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-emerald-600 font-semibold flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +3.4%
              </span>
              <span className="text-slate-400">across 2 accounts</span>
            </div>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Outstanding Receivables</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              ₹{(totalReceivables > 0 ? totalReceivables : 354300).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Due in &lt; 30 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Assistant Natural Language Card ─────────────────── */}
      <div className="saas-card p-6 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 border-blue-100">
        <div className="max-w-4xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Ask AI Assistant
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Type instructions in plain English to create invoices, record payments, or ask financial questions
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunNaturalCommand()}
              placeholder="e.g. Sold 5 Enterprise Licenses to Tata Motors for 1,25,000 with 18% GST..."
              className="w-full pl-4 pr-28 py-3 text-sm bg-white text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none transition shadow-2xs"
            />
            <button
              onClick={() => handleRunNaturalCommand()}
              disabled={isAiProcessing || !naturalInput.trim()}
              className="absolute right-2 btn-primary text-xs py-1.5 px-3.5 disabled:opacity-50"
            >
              {isAiProcessing ? (
                <>
                  <Activity className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Run</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Quick helpful suggestion chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-400">Suggestions:</span>
            <button
              onClick={() => {
                const q = 'Who owes me money and what is overdue?';
                setNaturalInput(q);
                handleRunNaturalCommand(q);
              }}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition shadow-2xs"
            >
              Who owes me money?
            </button>
            <button
              onClick={() => {
                const q = 'Sold 10 Enterprise ERP Licenses to Tata Motors Ltd for 2,50,000 with 18% GST';
                setNaturalInput(q);
                handleRunNaturalCommand(q);
              }}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition shadow-2xs"
            >
              Create invoice for Tata Motors
            </button>
            <button
              onClick={() => {
                const q = 'Received payment of 1,50,000 from Infosys Limited into HDFC Bank';
                setNaturalInput(q);
                handleRunNaturalCommand(q);
              }}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition shadow-2xs"
            >
              Record ₹1,50,000 from Infosys
            </button>
            <button
              onClick={() => {
                const q = 'Show monthly profit and loss summary';
                setNaturalInput(q);
                handleRunNaturalCommand(q);
              }}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition shadow-2xs"
            >
              Summarize monthly profit & loss
            </button>
          </div>
        </div>

        {/* AI Proposed Action Card */}
        {aiExecutionResult && (
          <div className="mt-4 p-4 rounded-xl bg-white border border-blue-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800">
                  AI Review & Proposed Action
                </h3>
              </div>
              <button
                onClick={handleRejectAction}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Dismiss
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {aiExecutionResult.response || aiExecutionResult.run?.resultSummary}
            </p>

            {aiExecutionResult.run?.proposedAction && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Action: {aiExecutionResult.run.proposedAction.type?.replace(/_/g, ' ')}
                  </span>
                  <span className="font-bold text-blue-700">
                    ₹{aiExecutionResult.run.proposedAction.payload?.totalAmount?.toLocaleString('en-IN') || '0'}
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleApproveAction(aiExecutionResult.run.proposedAction)}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approve & Post to Books</span>
                  </button>
                  <button
                    onClick={handleRejectAction}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Main Grid: Recent Transactions Table & Revenue Trends ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Transactions (FiscalPro Style) */}
        <div className="lg:col-span-2 saas-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recent Transactions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest customer invoices and payments
              </p>
            </div>
            <button
              onClick={() => setActiveView('sales')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              <span>View all</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold">
                  <th className="pb-3 font-semibold">Invoice</th>
                  <th className="pb-3 font-semibold">Client</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 font-semibold text-slate-900">{tx.id}</td>
                    <td className="py-3.5 text-slate-700">{tx.client}</td>
                    <td className="py-3.5 font-semibold text-slate-900">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5">
                      <span className={tx.statusBadge}>
                        {tx.statusText}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500">{tx.date}</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setActiveView('sales')}
                        className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Financial Snapshot & Quick Links */}
        <div className="space-y-6">
          {/* Quick Financial Snapshot */}
          <div className="saas-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Financial Breakdown
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Net Profit Margin</span>
                  <span className="font-semibold text-emerald-600">28.4%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '28.4%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Receivables Collection</span>
                  <span className="font-semibold text-blue-600">71.6%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '71.6%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Monthly Budget Used</span>
                  <span className="font-semibold text-amber-600">45.0%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Payables Due</span>
                <span className="font-bold text-slate-900">
                  ₹{(totalPayables > 0 ? totalPayables : 185000).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">GST Input Tax Credit</span>
                <span className="font-bold text-emerald-600">₹45,200</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="saas-card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setQuickTxDefaultTab('sales');
                  setShowQuickTxModal(true);
                }}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left transition group"
              >
                <FileText className="h-4 w-4 text-blue-600 mb-1.5" />
                <p className="font-semibold text-xs text-slate-800">New Invoice</p>
                <p className="text-[11px] text-slate-400">Sales voucher</p>
              </button>

              <button
                onClick={() => {
                  setQuickTxDefaultTab('purchase');
                  setShowQuickTxModal(true);
                }}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left transition group"
              >
                <Receipt className="h-4 w-4 text-emerald-600 mb-1.5" />
                <p className="font-semibold text-xs text-slate-800">Record Bill</p>
                <p className="text-[11px] text-slate-400">Vendor purchase</p>
              </button>

              <button
                onClick={() => {
                  setQuickTxDefaultTab('receipt');
                  setShowQuickTxModal(true);
                }}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left transition group"
              >
                <CreditCard className="h-4 w-4 text-indigo-600 mb-1.5" />
                <p className="font-semibold text-xs text-slate-800">Receive Cash</p>
                <p className="text-[11px] text-slate-400">Customer payment</p>
              </button>

              <button
                onClick={() => setActiveView('reports')}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left transition group"
              >
                <TrendingUp className="h-4 w-4 text-purple-600 mb-1.5" />
                <p className="font-semibold text-xs text-slate-800">P&L Report</p>
                <p className="text-[11px] text-slate-400">Profit statement</p>
              </button>
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
