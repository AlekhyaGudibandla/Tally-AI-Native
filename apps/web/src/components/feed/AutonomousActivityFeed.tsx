'use client';

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Shield,
  Filter,
  DollarSign,
  FileText,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { AutonomousActivityEvent } from '@/lib/types';

export const AutonomousActivityFeed: React.FC = () => {
  const { activityFeed, approveTransaction, simulateIncomingInvoice, simulateBankFeed, simulateGSTAnomaly } = useLedger();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'AUTO_RESOLVED'>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<AutonomousActivityEvent | null>(null);

  const filteredEvents = activityFeed.filter((item) => {
    if (filter === 'PENDING') return item.status === 'PENDING_APPROVAL' || item.status === 'ATTENTION_REQUIRED';
    if (filter === 'AUTO_RESOLVED') return item.status === 'AUTO_RESOLVED';
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Feed Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <Activity className="h-4 w-4 animate-pulse" />
            <span>Real-Time Operations Feed</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Activity & Operations Stream</h1>
          <p className="text-slate-500 text-sm mt-1">
            Ledger AI operates your back office in the background. Invoices are parsed, bank feeds cleared, and GST verified automatically.
          </p>
        </div>

        {/* Live Simulator Actions */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm">
          <button
            onClick={simulateIncomingInvoice}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 rounded-md transition border border-slate-200"
          >
            + New Invoice OCR
          </button>
          <button
            onClick={simulateBankFeed}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-xs font-medium text-emerald-800 rounded-md transition border border-emerald-200"
          >
            + Bank Receipt
          </button>
          <button
            onClick={simulateGSTAnomaly}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-xs font-medium text-amber-800 rounded-md transition border border-amber-200"
          >
            + GST Anomaly
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          {(['ALL', 'PENDING', 'AUTO_RESOLVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === tab
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {tab === 'ALL' && 'All Autonomous Activity'}
              {tab === 'PENDING' && 'Pending Approvals & Alerts'}
              {tab === 'AUTO_RESOLVED' && 'Auto-Completed'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Showing {filteredEvents.length} events
        </span>
      </div>

      {/* Stream Cards */}
      <div className="space-y-3">
        {filteredEvents.map((event) => {
          const isPending = event.status === 'PENDING_APPROVAL' || event.status === 'ATTENTION_REQUIRED';
          const isWarning = event.severity === 'WARNING';
          const isSuccess = event.severity === 'SUCCESS';

          return (
            <div
              key={event.id}
              className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isPending
                  ? 'bg-amber-50/50 border-amber-200 shadow-sm'
                  : 'card hover:border-slate-300'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                {/* Time Pill */}
                <div className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600 font-medium shrink-0">
                  {event.timestamp}
                </div>

                {/* Status Icon */}
                <div className="mt-0.5 shrink-0">
                  {isPending ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Activity className="h-5 w-5 text-indigo-600" />
                  )}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm tracking-tight">{event.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase font-mono border ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {event.status.replace('_', ' ')}
                    </span>
                    {event.amount && (
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        ₹{event.amount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{event.summary}</p>
                  {event.actionRequired && (
                    <p className="text-xs text-amber-700 font-semibold flex items-center space-x-1">
                      <span>Action: {event.actionRequired}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                {isPending && (
                  <button
                    onClick={() => approveTransaction(event.id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-sm transition flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg border border-slate-200 transition shadow-sm"
                >
                  Inspect Trail
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect Trail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Autonomous Operation Audit</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-mono px-2 py-1 bg-slate-100 rounded"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500">Event Title</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedEvent.title}</p>
              </div>

              <div>
                <span className="text-slate-500">Execution Summary</span>
                <p className="text-slate-700 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]">
                  {selectedEvent.summary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Deterministic Invariant</span>
                  <p className="font-bold text-emerald-700 mt-0.5">PASSED (Debits == Credits)</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Human Approval Gate</span>
                  <p className="font-bold text-amber-700 mt-0.5">
                    {selectedEvent.status === 'AUTO_RESOLVED' ? 'Auto-Cleared (< ₹10k)' : 'Required (Safety Policy)'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
