'use client';

import React, { useState } from 'react';
import {
  ArrowUpRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  DollarSign,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';

export const PayablesWorkspace: React.FC = () => {
  const { accounts } = useLedger();

  const liquidCash = accounts
    .filter((a) => a.subType === 'CASH' || a.subType === 'BANK')
    .reduce((sum, a) => sum + a.balance, 0);

  const liabilities = [
    { id: 'p-1', payee: 'Staff Salaries (Month End)', category: 'Payroll', amount: 800000, dueDate: '2026-09-30', priority: 'MANDATORY_CRITICAL', discount: 'None' },
    { id: 'p-2', payee: 'Delta Electronics Ltd', category: 'Inventory Supply', amount: 500000, dueDate: '2026-10-05', priority: 'HIGH', discount: '2% if paid before Oct 01 (Save ₹10,000)' },
    { id: 'p-3', payee: 'Silicon Hardware Hub', category: 'Procurement', amount: 300000, dueDate: '2026-10-10', priority: 'MEDIUM', discount: 'None' },
    { id: 'p-4', payee: 'GST & TDS Statutory Dues', category: 'Taxes', amount: 200000, dueDate: '2026-10-20', priority: 'MANDATORY_STATUTORY', discount: 'Avoid 18% p.a. interest' },
    { id: 'p-5', payee: 'Office Lease & Facility Costs', category: 'Overheads', amount: 180000, dueDate: '2026-10-02', priority: 'HIGH', discount: 'None' },
  ];

  const totalObligations = liabilities.reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <ArrowUpRight className="h-4 w-4" />
            <span>Accounts Payable & Liquidity Optimization</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Payables & AI Payment Optimizer
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Calculates optimal disbursement timing to capture vendor early-payment cash discounts while safeguarding payroll reserves.
          </p>
        </div>

        <div className="card p-3 text-xs flex items-center space-x-3">
          <div>
            <span className="text-slate-500 block">Available Cash:</span>
            <span className="font-mono font-bold text-emerald-700 text-base">₹{liquidCash.toLocaleString('en-IN')}</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-slate-500 block">Total Obligations:</span>
            <span className="font-mono font-bold text-slate-900 text-base">₹{totalObligations.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* AI Proposed Payment Strategy Plan */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">AI Payment Schedule Proposal</h3>
          </div>
          <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 font-medium">
            Policy: Maximize Discounts + Retain ₹5L Buffer
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-sky-700 font-bold">
              <span>Tranche 1 (Immediate - Sep 30)</span>
              <span>₹8,00,000</span>
            </div>
            <p className="text-slate-600">
              Clear 100% of staff salaries (₹8,00,000). Statutory mandate & employee morale priority.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-emerald-700 font-bold">
              <span>Tranche 2 (Oct 01 - Early Pay)</span>
              <span>₹5,00,000</span>
            </div>
            <p className="text-slate-600">
              Disburse Delta Electronics (₹5,00,000) to capture 2% cash discount (₹10,000 net savings).
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-amber-700 font-bold">
              <span>Tranche 3 (Oct 10 - Deferred)</span>
              <span>₹4,80,000</span>
            </div>
            <p className="text-slate-600">
              Disburse Silicon Hub & Statutory GST after expected week-1 customer inflows of ₹6.2L.
            </p>
          </div>
        </div>
      </div>

      {/* Payables Roster Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scheduled Liabilities</span>
          <span className="text-xs text-slate-500 font-mono">5 Pending Disbursements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Payee / Beneficiary</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Amount Due</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Priority Class</th>
                <th className="py-3 px-4">Early Discount Opportunity</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {liabilities.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{item.payee}</td>
                  <td className="py-3 px-4 text-slate-500">{item.category}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{item.dueDate}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      item.priority.includes('CRITICAL') || item.priority.includes('STATUTORY')
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.priority.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-emerald-700 text-[11px] font-medium">
                    {item.discount}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => alert(`Generated proposed disbursement voucher for ${item.payee} (₹${item.amount.toLocaleString('en-IN')}). Requires Controller sign-off before API bank transfer.`)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition shadow-sm"
                    >
                      Authorize Payout
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
