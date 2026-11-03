'use client';

import React from 'react';
import {
  History,
  ShieldCheck,
  Lock,
  Cpu,
  User,
  CheckCircle2,
  AlertTriangle,
  FileCode,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';

export const AuditWorkspace: React.FC = () => {
  const { auditLogs } = useLedger();

  const safetyLevels = [
    { level: 'Level 0 — Read', desc: 'AI can inspect reports, query ledgers, and compute ratios.', policy: 'Auto-Granted' },
    { level: 'Level 1 — Suggest', desc: 'AI proposes optimizations (e.g. reorder levels, tax suggestions).', policy: 'Non-destructive' },
    { level: 'Level 2 — Draft', desc: 'AI prepares draft invoices, POs, and unposted vouchers.', policy: 'Draft Queue' },
    { level: 'Level 3 — Low-Risk', desc: 'Routine reconciled vouchers < ₹10,000 auto-execute.', policy: 'Threshold < ₹10k' },
    { level: 'Level 4 — High-Risk', desc: 'High value (> ₹1,00,000), bank edits, or external messages.', policy: 'Mandatory Human Sign-off' },
    { level: 'Level 5 — Prohibited', desc: 'Mutating historical posted entries or unbalancing debits/credits.', policy: 'STRICTLY BLOCKED' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <History className="h-4 w-4" />
            <span>Enterprise Audit Engine & AI Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Immutable Audit Trail & Security Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Complete cryptographic traceability. Every human click and AI tool execution is sealed with SHA-256 hashes.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-800 font-mono font-medium">
          <Lock className="h-4 w-4 text-emerald-700" />
          <span>Edit Log Status: IMMUTABLE</span>
        </div>
      </div>

      {/* Safety Level Governance Table */}
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          <span>Ledger AI Safety & Governance Model</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {safetyLevels.map((lvl, idx) => (
            <div key={idx} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{lvl.level}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                  idx === 5 ? 'bg-red-50 text-red-700 border border-red-200' : idx === 4 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {lvl.policy}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{lvl.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Cryptographic Event Ledger
          </span>
          <span className="text-xs text-slate-500 font-mono">{auditLogs.length} Events Recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Justification / Reason</th>
                <th className="py-3 px-4">AI Telemetry</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5">
                      {log.actor.type === 'AI_AGENT' ? (
                        <Cpu className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-slate-600" />
                      )}
                      <span className="font-semibold text-slate-900">{log.actor.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{log.action}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{log.entityId}</td>
                  <td className="py-3 px-4 max-w-xs text-slate-700 truncate">{log.reason}</td>
                  <td className="py-3 px-4">
                    {log.aiMetadata ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        {log.aiMetadata.confidence}% Conf
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[10px]">Manual</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400 max-w-[120px] truncate" title={log.immutableHash}>
                    {log.immutableHash.slice(0, 16)}...
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
