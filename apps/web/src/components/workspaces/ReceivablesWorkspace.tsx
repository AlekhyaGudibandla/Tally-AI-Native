'use client';

import React, { useState } from 'react';
import {
  ArrowDownLeft,
  Sparkles,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';

export const ReceivablesWorkspace: React.FC = () => {
  const { invoices } = useLedger();

  const [selectedDebtor, setSelectedDebtor] = useState<any | null>(null);

  const debtors = [
    {
      id: 'd-1',
      name: 'Nexus Retailers Pvt Ltd',
      gstin: '27AABCN8831H1Z9',
      overdueAmount: 320000,
      daysOverdue: 42,
      risk: 'HIGH',
      phone: '+91 98200 12345',
      email: 'finance@nexusretail.in',
      invoices: ['INV-2026-2398'],
      aiRecommendation: 'Historical pattern: Client responds promptly to WhatsApp invoice link reminder sent on Thursday morning.',
      draftNotice: 'Dear Nexus Retailers team, warm greetings from Apex Technologies. Friendly reminder that Invoice #INV-2026-2398 for ₹3,20,000 is 42 days overdue. Kindly settle via our instant payment link: https://pay.ledgeros.io/inv-2398',
    },
    {
      id: 'd-2',
      name: 'Bright Solutions LLP',
      gstin: '27AABCB4412J1Z5',
      overdueAmount: 160000,
      daysOverdue: 35,
      risk: 'MEDIUM',
      phone: '+91 98199 54321',
      email: 'accounts@brightsolutions.co',
      invoices: ['INV-2026-2350'],
      aiRecommendation: 'Client pays 50% on receipt of consolidated statement.',
      draftNotice: 'Dear Accounts Team at Bright Solutions, statement reminder for outstanding ₹1,60,000 against INV-2350. Please find attached ledger statement.',
    },
    {
      id: 'd-3',
      name: 'Aero Dynamics Systems',
      gstin: '29AABCA7712M1Z0',
      overdueAmount: 100000,
      daysOverdue: 31,
      risk: 'LOW',
      phone: '+91 98450 67890',
      email: 'billing@aerodynamics.in',
      invoices: ['INV-2026-2311'],
      aiRecommendation: 'Standard courtesy reminder.',
      draftNotice: 'Dear Aero Dynamics, gentle reminder for ₹1,00,000 overdue by 31 days. Thank you for your continued partnership.',
    },
  ];

  const totalOverdue = debtors.reduce((sum, d) => sum + d.overdueAmount, 0);

  const handleSendReminder = (debtor: any) => {
    alert(`AI Collection notice dispatched via WhatsApp & Email to ${debtor.name} (${debtor.email}).`);
    setSelectedDebtor(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <ArrowDownLeft className="h-4 w-4" />
            <span>Working Capital & Credit Controls</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Accounts Receivable & AI Collections
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Aging analysis with automated AI collection assistant to accelerate cash realization without damaging client relationships.
          </p>
        </div>

        <div className="card p-3 text-xs">
          <span className="text-slate-500 block">Total Overdue (&gt; 30 Days):</span>
          <span className="font-mono font-bold text-amber-700 text-base">₹{totalOverdue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Aging Matrix Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="card p-4">
          <span className="text-xs text-slate-500 font-medium">Current (Not Due)</span>
          <p className="text-lg font-bold font-mono text-emerald-700 mt-1">₹12,65,000</p>
          <p className="text-[10px] text-slate-400 mt-0.5">8 Invoices</p>
        </div>
        <div className="card p-4">
          <span className="text-xs text-slate-500 font-medium">1 - 30 Days</span>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">₹3,40,000</p>
          <p className="text-[10px] text-slate-400 mt-0.5">3 Invoices</p>
        </div>
        <div className="card p-4 border-amber-200 bg-amber-50/30">
          <span className="text-xs text-amber-800 font-medium">31 - 60 Days</span>
          <p className="text-lg font-bold font-mono text-amber-700 mt-1">₹4,20,000</p>
          <p className="text-[10px] text-amber-600 mt-0.5">Priority follow-up</p>
        </div>
        <div className="card p-4 border-red-200 bg-red-50/30">
          <span className="text-xs text-red-800 font-medium">61 - 90 Days</span>
          <p className="text-lg font-bold font-mono text-red-700 mt-1">₹1,60,000</p>
          <p className="text-[10px] text-red-600 mt-0.5">High Default Risk</p>
        </div>
        <div className="card p-4">
          <span className="text-xs text-slate-500 font-medium">90+ Days</span>
          <p className="text-lg font-bold font-mono text-slate-400 mt-1">₹0</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Zero bad debts</p>
        </div>
      </div>

      {/* Overdue Debtors & AI Actions */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Prioritized Collection Roster
          </span>
          <span className="text-xs text-indigo-600 font-mono flex items-center font-medium">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            AI Collection Agent Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Overdue Balance</th>
                <th className="py-3 px-4">Aging</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">AI Recommended Strategy</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {debtors.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{d.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{d.gstin}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    <p>{d.phone}</p>
                    <p className="text-slate-400">{d.email}</p>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-sm">
                    ₹{d.overdueAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-mono text-amber-700 font-bold">
                    {d.daysOverdue} days
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      d.risk === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {d.risk}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px]">
                    {d.aiRecommendation}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedDebtor(d)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition flex items-center space-x-1 ml-auto"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>Review Notice</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Collection Draft Notice Modal */}
      {selectedDebtor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  AI Collection Notice: {selectedDebtor.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDebtor(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-mono px-2 py-1 bg-slate-100 rounded"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Target Amount:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    ₹{selectedDebtor.overdueAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Channel:</span>
                  <span className="text-slate-900 font-semibold">WhatsApp Business & Verified Email</span>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Tailored Message Preview:</label>
                <textarea
                  readOnly
                  value={selectedDebtor.draftNotice}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-xs leading-relaxed font-sans"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Policy Gate: Communications to external clients require human-in-the-loop authorization.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedDebtor(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendReminder(selectedDebtor)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm flex items-center space-x-1.5"
              >
                <Send className="h-4 w-4" />
                <span>Authorize & Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
