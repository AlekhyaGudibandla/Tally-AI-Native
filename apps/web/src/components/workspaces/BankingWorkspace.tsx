'use client';

import React, { useState } from 'react';
import {
  Landmark,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';

export const BankingWorkspace: React.FC = () => {
  const { bankTransactions, runReconciliation, simulateBankFeed, importBankStatementCSV } = useLedger();

  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState(
    `Date,Description,Reference,Amount,Type\n2026-09-25,NEFT-APEX-CLIENT-PAYMENT,CMS992014,145000,CREDIT\n2026-09-25,ACH-OFFICE-RENT-MUMBAI,RENT2026,180000,DEBIT`
  );

  const reconciledCount = bankTransactions.filter((t) => t.reconciliationStatus === 'RECONCILED').length;
  const unmatchedCount = bankTransactions.filter((t) => t.reconciliationStatus === 'UNMATCHED').length;
  const suspiciousCount = bankTransactions.filter((t) => t.reconciliationStatus === 'SUSPICIOUS_ANOMALY').length;

  const handleImportCSV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    const res = importBankStatementCSV(csvText);
    alert(`Successfully imported ${res.importedCount} transactions! (${res.matchedCount} auto-matched to ledger)`);
    setShowImportModal(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <Landmark className="h-4 w-4" />
            <span>Connected Banking & Cash Flow</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Smart Bank Reconciliation
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Automated multi-tier matching: Exact match, semantic vendor alias resolution, partial TDS split match, and fraud anomaly detection.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-sm transition flex items-center space-x-1.5"
          >
            <Landmark className="h-4 w-4 text-[#005a9e]" />
            <span>Import Bank Statement CSV</span>
          </button>
          <button
            onClick={simulateBankFeed}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-sm transition"
          >
            + Mock Inward Feed
          </button>
          <button
            onClick={runReconciliation}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm flex items-center space-x-2 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Auto Reconcile</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <span className="text-xs text-slate-500 font-medium">Total Feed Items</span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{bankTransactions.length} lines</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Real-time Open Banking API</p>
        </div>
        <div className="card p-4">
          <span className="text-xs text-slate-500 font-medium">Auto-Reconciled</span>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">{reconciledCount} items</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Cleared with 99%+ confidence</p>
        </div>
        <div className="card p-4">
          <span className="text-xs text-slate-500 font-medium">Unmatched / Pending</span>
          <p className="text-xl font-bold font-mono text-amber-700 mt-1">{unmatchedCount} items</p>
          <p className="text-[10px] text-amber-600 mt-0.5">Needs receipt allocation</p>
        </div>
        <div className="card p-4">
          <span className="text-xs text-slate-500 font-medium">Suspicious Anomalies</span>
          <p className="text-xl font-bold font-mono text-red-700 mt-1">{suspiciousCount} alert</p>
          <p className="text-[10px] text-red-600 mt-0.5">Held by Anomaly Agent</p>
        </div>
      </div>

      {/* Connected Accounts Pill */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm">HDFC Bank Current Account</span>
            <p className="text-xs text-slate-500 font-mono">A/C: **** **** 4092 • IFSC: HDFC0000240</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">Available Book Balance</span>
          <p className="text-lg font-bold font-mono text-emerald-700">₹19,80,000</p>
        </div>
      </div>

      {/* Transactions Feed */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bank Statement Transactions</span>
          <span className="text-xs text-slate-500 font-mono">Synced via ISO-20022 Open Banking</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Bank Narration / Raw Ref</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Match Tier</th>
                <th className="py-3 px-4">Matched Party / Ledger</th>
                <th className="py-3 px-4">AI Explanation</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {bankTransactions.map((tx) => {
                const isCredit = tx.type === 'CREDIT';
                const isAnomaly = tx.reconciliationStatus === 'SUSPICIOUS_ANOMALY';
                const isReconciled = tx.reconciliationStatus === 'RECONCILED';

                return (
                  <tr key={tx.id} className={`transition ${isAnomaly ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}>
                    <td className="py-3 px-4 font-mono text-slate-500">{tx.date}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{tx.description}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Ref: {tx.rawReference}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center w-max ${
                        isCredit ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {isCredit ? <ArrowDownLeft className="h-3 w-3 mr-0.5" /> : <ArrowUpRight className="h-3 w-3 mr-0.5" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${
                      isCredit ? 'text-emerald-700' : 'text-slate-900'
                    }`}>
                      {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      {tx.matchType && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.matchType}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {tx.matchedPartyName || '-'}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-500 text-[11px] truncate">
                      {tx.aiExplanation}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        isReconciled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isAnomaly
                          ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {tx.reconciliationStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleImportCSV}
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl text-xs text-slate-800"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Landmark className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Import Bank Statement (CSV)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-mono px-2 py-1 bg-slate-100 rounded"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-slate-600">
              Paste raw CSV text or bank statement rows from HDFC, ICICI, SBI, or Axis bank online portal. Format: <code>Date, Description, Reference, Amount, Type</code>
            </p>

            <div>
              <label className="font-bold text-slate-700 block mb-1">CSV Statement Data</label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={6}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 font-mono text-slate-900"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm"
              >
                Parse & Reconcile CSV
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
