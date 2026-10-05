'use client';

import React, { useState } from 'react';
import {
  ListTree,
  Plus,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { Account, AccountType, AccountSubType } from '@/lib/types';

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  ASSET: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  LIABILITY: 'text-red-700 bg-red-50 border-red-200',
  EQUITY: 'text-purple-700 bg-purple-50 border-purple-200',
  INCOME: 'text-sky-700 bg-sky-50 border-sky-200',
  EXPENSE: 'text-amber-700 bg-amber-50 border-amber-200',
};

const ACCOUNT_TYPES: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

const SUB_TYPES_BY_TYPE: Record<AccountType, AccountSubType[]> = {
  ASSET: ['CASH', 'BANK', 'ACCOUNTS_RECEIVABLE', 'INVENTORY', 'FIXED_ASSET'],
  LIABILITY: ['ACCOUNTS_PAYABLE', 'DUTIES_AND_TAXES', 'CURRENT_LIABILITY'],
  EQUITY: ['EQUITY'],
  INCOME: ['DIRECT_INCOME', 'INDIRECT_INCOME'],
  EXPENSE: ['DIRECT_EXPENSE', 'INDIRECT_EXPENSE'],
};

export const ChartWorkspace: React.FC = () => {
  const { accounts, addAccount } = useLedger();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<AccountType>>(new Set<AccountType>(ACCOUNT_TYPES));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // New account form
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<AccountType>('ASSET');
  const [newSubType, setNewSubType] = useState<AccountSubType>('CASH');
  const [newDescription, setNewDescription] = useState('');

  const filtered = searchQuery
    ? accounts.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : accounts;

  const grouped = ACCOUNT_TYPES.reduce((acc, type) => {
    acc[type] = filtered.filter((a) => a.type === type);
    return acc;
  }, {} as Record<AccountType, Account[]>);

  const toggleType = (type: AccountType) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const typeTotal = (type: AccountType) =>
    grouped[type].reduce((s, a) => s + a.balance, 0);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;
    const result = addAccount({
      name: newName.trim(),
      code: newCode.trim().toUpperCase(),
      type: newType,
      subType: newSubType,
      balance: 0,
      currency: 'INR',
      isActive: true,
      isSystem: false,
      description: newDescription.trim() || `${newSubType} account`,
    });
    if (result.success) {
      showToast(`Ledger "${newName}" created under ${newType}`, true);
      setNewName('');
      setNewCode('');
      setNewDescription('');
      setShowCreateModal(false);
    } else {
      showToast(result.error || 'Failed to create ledger', false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xs border shadow-lg text-xs font-semibold transition-all ${toast.ok ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#005a9e] text-[11px] font-bold uppercase tracking-wider">
            <ListTree className="h-3.5 w-3.5" />
            <span>General Ledger Masters</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 mt-0.5">Chart of Accounts</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Full double-entry account hierarchy · {accounts.length} ledgers across {ACCOUNT_TYPES.length} groups
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ledger name or code…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-[#b0c4de] rounded-xs text-xs bg-white focus:outline-none focus:border-[#005a9e] w-56"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005a9e] hover:bg-[#00477d] text-white text-xs font-bold rounded-xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Ledger (Alt+C)
          </button>
        </div>
      </div>

      {/* Account Groups */}
      <div className="space-y-2">
        {ACCOUNT_TYPES.map((type) => {
          const isExpanded = expandedTypes.has(type) || !searchQuery;
          const accs = grouped[type] || [];
          const total = typeTotal(type);
          const colorClass = ACCOUNT_TYPE_COLORS[type];

          return (
            <div key={type} className="border border-[#c2d4e5] rounded-xs overflow-hidden bg-white shadow-xs">
              {/* Group header */}
              <button
                onClick={() => toggleType(type)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-[#e8f0f8] hover:bg-[#dbe9f4] transition"
              >
                <div className="flex items-center gap-3">
                  {isExpanded && !searchQuery ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                  )}
                  <span className={`px-2 py-0.5 rounded-xs text-[10px] font-black uppercase border ${colorClass}`}>
                    {type}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{accs.length} Ledgers</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-500">Group Balance:</span>
                  <span className={`font-bold ${total >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    ₹{Math.abs(total).toLocaleString('en-IN')}
                  </span>
                </div>
              </button>

              {/* Account rows */}
              {(isExpanded || !!searchQuery) && accs.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#f4f8fc] border-b border-[#c2d4e5]">
                      <tr>
                        <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Code</th>
                        <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ledger Name</th>
                        <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sub-Group</th>
                        <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
                        <th className="py-2 px-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Balance (₹)</th>
                        <th className="py-2 px-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8f0f8]">
                      {accs.map((account) => (
                        <tr key={account.id} className="hover:bg-[#f7fafd] transition">
                          <td className="py-2 px-4 font-mono font-bold text-[#005a9e] text-[11px]">{account.code}</td>
                          <td className="py-2 px-4 font-semibold text-slate-900">{account.name}</td>
                          <td className="py-2 px-4 text-slate-500 text-[11px] font-mono">{account.subType.replace(/_/g, ' ')}</td>
                          <td className="py-2 px-4 text-slate-400 text-[11px] max-w-xs truncate">{account.description}</td>
                          <td className={`py-2 px-4 text-right font-mono font-bold text-sm ${account.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                            {account.balance < 0 ? '(' : ''}₹{Math.abs(account.balance).toLocaleString('en-IN')}{account.balance < 0 ? ')' : ''}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {account.isSystem ? (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-xs border border-slate-200 uppercase">System</span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-[#ffbe00]/20 text-[#7a5b00] text-[9px] font-bold rounded-xs border border-[#ffbe00]/40 uppercase">Custom</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Sub-total */}
                    <tfoot className="bg-[#f4f8fc] border-t border-[#c2d4e5]">
                      <tr>
                        <td colSpan={4} className="py-2 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          {type} Total
                        </td>
                        <td className={`py-2 px-4 text-right font-mono font-black text-sm ${total >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                          ₹{Math.abs(total).toLocaleString('en-IN')}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {(isExpanded || !!searchQuery) && accs.length === 0 && (
                <p className="text-xs text-slate-400 p-4 text-center">No {type} accounts found{searchQuery ? ' for this search' : ''}.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Ledger Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#b0c4de] rounded-xs shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-3 bg-[#005a9e] text-white rounded-t-xs">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="font-extrabold text-sm">Create New Ledger Account</span>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-white/20 rounded-xs transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Ledger Name *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Office Supplies Expense"
                    className="w-full border border-[#b0c4de] rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-[#005a9e] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Account Code *</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 6050"
                    className="w-full border border-[#b0c4de] rounded-xs px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#005a9e] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Account Group *</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      const t = e.target.value as AccountType;
                      setNewType(t);
                      setNewSubType(SUB_TYPES_BY_TYPE[t][0]);
                    }}
                    className="w-full border border-[#b0c4de] rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-[#005a9e] bg-white"
                  >
                    {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Sub-Group *</label>
                  <select
                    value={newSubType}
                    onChange={(e) => setNewSubType(e.target.value as AccountSubType)}
                    className="w-full border border-[#b0c4de] rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-[#005a9e] bg-white"
                  >
                    {SUB_TYPES_BY_TYPE[newType].map((st) => (
                      <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description or notes"
                  className="w-full border border-[#b0c4de] rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-[#005a9e] bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#c2d4e5]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xs border border-slate-200 transition font-semibold"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005a9e] hover:bg-[#00477d] text-white text-xs font-bold rounded-xs transition"
                >
                  Create Ledger (Enter)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
