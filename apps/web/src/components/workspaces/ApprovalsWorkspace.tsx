'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  DollarSign,
  FileText,
  Lock,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';

export const ApprovalsWorkspace: React.FC = () => {
  const { activityFeed, approveTransaction } = useLedger();

  const pendingApprovals = activityFeed.filter(
    (a) => a.status === 'PENDING_APPROVAL' || a.status === 'ATTENTION_REQUIRED'
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" />
            <span>Human-in-the-Loop Governance Queue</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Financial Approvals & Review Gate
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            AI operates autonomously for low-risk routine items (&lt; ₹10,000), but halts at this gate for high-value disbursements (&gt; ₹1,00,000) and statutory anomalies.
          </p>
        </div>

        <div className="card p-3 text-xs flex items-center space-x-2">
          <span className="text-slate-500">Queue Depth:</span>
          <span className="font-mono font-bold text-amber-700 text-base">{pendingApprovals.length} Actions Awaiting Review</span>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {pendingApprovals.length === 0 ? (
          <div className="card p-12 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-lg">All Cleared! No Pending Approvals</h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Your autonomous finance team has processed all low-risk items. You will receive an instant notification when a high-value transaction requires your signature.
            </p>
          </div>
        ) : (
          pendingApprovals.map((item) => (
            <div
              key={item.id}
              className="card p-6 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                    <p className="text-xs text-slate-500 font-mono">Timestamp: {item.timestamp} • Category: {item.category}</p>
                  </div>
                </div>

                {item.amount && (
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">Transaction Value</span>
                    <p className="text-xl font-bold font-mono text-emerald-700">₹{item.amount.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-2">
                <p className="font-medium">{item.summary}</p>
                {item.actionRequired && (
                  <p className="text-amber-800 font-semibold text-[11px]">
                    Policy Requirement: {item.actionRequired}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 font-mono">
                  Governance Rule: Mandatory Controller Approval
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => alert(`Rejected action: ${item.title}. AI instructed to request revised invoice/documentation.`)}
                    className="px-4 py-2 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-lg text-xs font-medium border border-slate-200 transition shadow-sm"
                  >
                    Reject / Flag
                  </button>
                  <button
                    onClick={() => approveTransaction(item.id)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm flex items-center space-x-1.5 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Authorize & Execute</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
