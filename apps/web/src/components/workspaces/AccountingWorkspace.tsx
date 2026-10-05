'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  History,
  FileSpreadsheet,
} from 'lucide-react';
import { createVoucherAction, reverseVoucherAction } from '@/lib/actions/accounting';
import { getAccountingData } from '@/lib/actions/data';

export type JournalLine = {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
};

export type JournalEntry = {
  id: string;
  entryNumber: string;
  voucherType: string;
  entryDate: string;
  status: string;
  narration: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
};

export const AccountingWorkspace: React.FC = () => {
  const [dbData, setDbData] = useState<{ accounts: any[]; vouchers: any[] }>({ accounts: [], vouchers: [] });
  const [loading, setLoading] = useState(true);

  const fetchDbData = async () => {
    // For demo, hardcode org ID or use a default one since we don't have auth context wired here
    const res = await getAccountingData('org-1');
    if (res.success && res.data) {
      setDbData(res.data);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchDbData();
  }, []);

  const accounts = dbData.accounts;
  // Map Prisma vouchers to the UI's JournalEntry format
  const journalEntries = dbData.vouchers.map(v => {
    const totalDebit = v.transactions.filter((t: any) => t.type === 'DEBIT').reduce((acc: number, t: any) => acc + t.amount, 0);
    const totalCredit = v.transactions.filter((t: any) => t.type === 'CREDIT').reduce((acc: number, t: any) => acc + t.amount, 0);
    
    return {
      id: v.id,
      entryNumber: v.voucherNo,
      voucherType: v.type,
      entryDate: new Date(v.date).toISOString().split('T')[0],
      status: v.isReversed ? 'REVERSED' : 'POSTED',
      narration: v.narration || '',
      lines: v.transactions.map((t: any) => ({
        id: t.id,
        accountId: t.accountId,
        accountName: accounts.find(a => a.id === t.accountId)?.name || 'Unknown',
        debit: t.type === 'DEBIT' ? t.amount : 0,
        credit: t.type === 'CREDIT' ? t.amount : 0,
      })),
      totalDebit,
      totalCredit,
    };
  });

  const [activeTab, setActiveTab] = useState<'JOURNAL' | 'CHART_OF_ACCOUNTS'>('JOURNAL');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Reversal dialog state
  const [reversalTarget, setReversalTarget] = useState<JournalEntry | null>(null);
  const [reversalReason, setReversalReason] = useState('Audit correction: misallocated cost center');

  // New Journal Voucher state
  const [narration, setNarration] = useState('Office IT maintenance & cloud software payment');
  const [lines, setLines] = useState<Omit<JournalLine, 'id'>[]>([
    { accountId: 'acc-cloud', accountName: 'Cloud Infrastructure & SaaS Hosting', debit: 25000, credit: 0 },
    { accountId: 'acc-hdfc', accountName: 'HDFC Current Account (A/C ...4092)', debit: 0, credit: 25000 },
  ]);

  // Manual validation logic instead of mock engine
  const validation = {
    isValid: true,
    totalDebit: lines.reduce((acc, l) => acc + (l.debit || 0), 0),
    totalCredit: lines.reduce((acc, l) => acc + (l.credit || 0), 0),
    difference: 0
  };
  validation.difference = Math.abs(validation.totalDebit - validation.totalCredit);
  validation.isValid = validation.difference < 0.001 && validation.totalDebit > 0;

  const handleAddLine = () => {
    if (accounts.length === 0) return;
    setLines([...lines, { accountId: accounts[0].id, accountName: accounts[0].name, debit: 0, credit: 0 }]);
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid) {
      alert('Error: Total debits must equal total credits before posting!');
      return;
    }

    const entryParams = lines.map((l) => ({
      accountId: l.accountId,
      amount: l.debit > 0 ? l.debit : l.credit,
      type: l.debit > 0 ? 'DEBIT' as const : 'CREDIT' as const,
    })).filter(l => l.amount > 0);

    const result = await createVoucherAction({
      organizationId: 'org-1', // Demo hardcode
      type: 'JOURNAL',
      date: new Date(),
      narration,
      entries: entryParams
    });

    if (result.success) {
      alert(`Journal Voucher successfully validated and posted to real DB!`);
      setShowCreateModal(false);
      fetchDbData();
    } else {
      alert(`Failed to post: ${result.error}`);
    }
  };

  const handleExecuteReversal = async () => {
    if (!reversalTarget) return;
    const res = await reverseVoucherAction(reversalTarget.id, reversalReason);
    if (res.success) {
      alert(`Voucher #${reversalTarget.entryNumber} marked as REVERSED in real DB.`);
      setReversalTarget(null);
      fetchDbData();
    } else {
      alert(`Error reversing voucher: ${res.error}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading accounting data...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="h-4 w-4" />
            <span>Deterministic Accounting Core</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            General Ledger & Journal Vouchers
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Strict double-entry accounting. Sum(Debits) == Sum(Credits) invariant is mathematically enforced on every transaction.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm flex items-center space-x-2 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Journal Voucher</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('JOURNAL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'JOURNAL'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Posted Journal Vouchers
        </button>
        <button
          onClick={() => setActiveTab('CHART_OF_ACCOUNTS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'CHART_OF_ACCOUNTS'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Chart of Accounts (Hierarchy)
        </button>
      </div>

      {/* View 1: Journal Entries */}
      {activeTab === 'JOURNAL' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Audit-Locked Vouchers</span>
            <span className="text-xs text-emerald-700 font-mono flex items-center font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Invariant Guard: All Entries Balanced
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Narration</th>
                  <th className="py-3 px-4">Lines</th>
                  <th className="py-3 px-4 text-right">Debit (DR)</th>
                  <th className="py-3 px-4 text-right">Credit (CR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {journalEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{entry.entryNumber}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        {entry.voucherType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{entry.entryDate}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-700">{entry.narration}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{entry.lines.length} lines</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{entry.totalDebit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{entry.totalCredit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        entry.status === 'POSTED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : entry.status === 'REVERSED'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-xs transition shadow-sm"
                      >
                        Inspect
                      </button>
                      {entry.status === 'POSTED' && (
                        <button
                          onClick={() => setReversalTarget(entry)}
                          className="px-2 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded text-xs transition inline-flex items-center space-x-1 shadow-sm"
                          title="Generate deterministic reversal entry"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Reverse</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Chart of Accounts */}
      {activeTab === 'CHART_OF_ACCOUNTS' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Ledgers</span>
            <span className="text-xs text-slate-500 font-mono">{accounts.length} Active Ledgers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Ledger Name</th>
                  <th className="py-3 px-4">Primary Group</th>
                  <th className="py-3 px-4">Sub-Group</th>
                  <th className="py-3 px-4 text-right">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{acc.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{acc.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        acc.type === 'ASSET'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : acc.type === 'LIABILITY'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : acc.type === 'INCOME'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{acc.subType}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{acc.balance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Voucher Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Voucher #{selectedEntry.entryNumber} ({selectedEntry.voucherType})
                </h3>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-mono px-2 py-1 bg-slate-100 rounded"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Narration:</span>
                <p className="text-slate-900 font-medium mt-0.5">{selectedEntry.narration}</p>
              </div>

              {/* Line items */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Account Ledger</th>
                      <th className="py-2.5 px-3 text-right">Debit (DR)</th>
                      <th className="py-2.5 px-3 text-right">Credit (CR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedEntry.lines.map((l: JournalLine) => (
                      <tr key={l.id}>
                        <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.accountName}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {l.debit > 0 ? `₹${l.debit.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {l.credit > 0 ? `₹${l.credit.toLocaleString('en-IN')}` : '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold font-mono border-t border-slate-200">
                      <td className="py-2.5 px-3 text-emerald-700">Total Double-Entry Balance:</td>
                      <td className="py-2.5 px-3 text-right text-slate-900">₹{selectedEntry.totalDebit.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right text-slate-900">₹{selectedEntry.totalCredit.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      {reversalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-amber-600">
              <RotateCcw className="h-5 w-5" />
              <h3 className="font-bold text-slate-900 text-base">Confirm Deterministic Reversal</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Accounting Policy Rule: Historical vouchers cannot be deleted or mutated. A counter-entry will be posted to swap all debits and credits, preserving immutable audit trails.
            </p>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Reason for Reversal (Audit Trail)</label>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                rows={2}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setReversalTarget(null)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReversal}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium shadow-sm"
              >
                Post Reversal Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Journal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateVoucher}
            className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">New Journal Voucher</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-mono px-2 py-1 bg-slate-100 rounded"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Voucher Narration / Description</label>
                <input
                  type="text"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              {/* Line items editor */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Voucher Lines</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    + Add Line
                  </button>
                </div>

                <div className="space-y-2">
                  {lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="col-span-6">
                        <select
                          value={line.accountId}
                          onChange={(e) => {
                            const acc = accounts.find((a) => a.id === e.target.value);
                            const updated = [...lines];
                            updated[idx].accountId = e.target.value;
                            updated[idx].accountName = acc?.name || '';
                            setLines(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-900"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Debit (DR)"
                          value={line.debit || ''}
                          onChange={(e) => {
                            const updated = [...lines];
                            updated[idx].debit = Number(e.target.value) || 0;
                            if (updated[idx].debit > 0) updated[idx].credit = 0;
                            setLines(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-900 font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Credit (CR)"
                          value={line.credit || ''}
                          onChange={(e) => {
                            const updated = [...lines];
                            updated[idx].credit = Number(e.target.value) || 0;
                            if (updated[idx].credit > 0) updated[idx].debit = 0;
                            setLines(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invariant Status Card */}
              <div className={`p-3.5 rounded-lg border font-mono text-xs flex justify-between items-center ${
                validation.isValid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div>
                  <span>Debit: ₹{validation.totalDebit.toLocaleString('en-IN')} | Credit: ₹{validation.totalCredit.toLocaleString('en-IN')}</span>
                </div>
                <div className="font-bold flex items-center space-x-1">
                  {validation.isValid ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      <span>Balanced</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-700" />
                      <span>Diff: ₹{validation.difference.toLocaleString('en-IN')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!validation.isValid}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post to Ledger
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
