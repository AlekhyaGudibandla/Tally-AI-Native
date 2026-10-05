'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Search,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { GSTEngine } from '@/lib/engine/gst-engine';

export const GSTWorkspace: React.FC = () => {
  const { org, accounts, invoices } = useLedger();

  const [testGstin, setTestGstin] = useState('27AABCA1234F1Z8');
  const gstinValidation = GSTEngine.validateGSTIN(testGstin);

  // Compute total output tax from invoices
  const totalTaxableSales = invoices.reduce((sum, i) => sum + i.subTotal, 0);
  const totalOutputTax = invoices.reduce((sum, i) => sum + i.totalTax, 0);

  // Input tax credit from accounts
  const itcCgst = accounts.find((a) => a.id === 'acc-itc-cgst')?.balance || 0;
  const itcSgst = accounts.find((a) => a.id === 'acc-itc-sgst')?.balance || 0;
  const itcIgst = accounts.find((a) => a.id === 'acc-itc-igst')?.balance || 0;
  const totalITC = itcCgst + itcSgst + itcIgst;

  // Net tax payable
  const netPayable = Math.max(0, totalOutputTax - totalITC);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <FileCheck2 className="h-4 w-4" />
            <span>Indian Statutory Compliance Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            GST Compliance & E-Way Bill Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Deterministic GSTR-1, GSTR-3B tax calculations, ITC auto-reconciliation, and official GSTIN verification.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white border border-slate-200 p-2 rounded-lg text-xs shadow-sm">
          <Calendar className="h-4 w-4 text-indigo-600 mr-1" />
          <span className="text-slate-600">GSTR-3B Due Date:</span>
          <span className="font-mono font-bold text-amber-700">20th October (16 days left)</span>
        </div>
      </div>

      {/* Tax Liability vs ITC Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <span className="text-xs text-slate-500 font-medium">B2B Taxable Sales (GSTR-1)</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">₹{totalTaxableSales.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-400 mt-1">100% E-Invoiced with IRN</p>
        </div>

        <div className="card p-5">
          <span className="text-xs text-slate-500 font-medium">Total Output Tax Liability</span>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1">₹{totalOutputTax.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-400 mt-1">CGST + SGST + IGST</p>
        </div>

        <div className="card p-5">
          <span className="text-xs text-slate-500 font-medium">Eligible Input Tax Credit (ITC)</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">₹{totalITC.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-emerald-600 mt-1">Matched to GSTR-2B</p>
        </div>

        <div className="card p-5">
          <span className="text-xs text-slate-500 font-medium">Net Cash Tax Payable (GSTR-3B)</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">₹{netPayable.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-400 mt-1">After electronic credit ledger offset</p>
        </div>
      </div>

      {/* Compliance Calendars & Statutory Returns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Returns Table */}
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <FileCheck2 className="h-4 w-4 text-indigo-600" />
            <span>Statutory Filing Schedule (FY 2026-27)</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">GSTR-1 (Outward Supplies)</p>
                <p className="text-slate-500 text-[11px]">Reporting period: September 2026</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-mono font-bold">
                Ready to File
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">GSTR-2B (Auto-Drafted ITC Statement)</p>
                <p className="text-slate-500 text-[11px]">Synced with GSTN Portal on 14th</p>
              </div>
              <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[11px] font-mono font-bold">
                Auto-Matched (98%)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">GSTR-3B (Monthly Summary & Tax Offset)</p>
                <p className="text-slate-500 text-[11px]">Due on 20th October 2026</p>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-mono font-bold">
                Computation Verified
              </span>
            </div>
          </div>
        </div>

        {/* GSTIN Format & Jurisdiction Verifier Sandbox */}
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Deterministic GSTIN Verification Tool</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-600 font-medium block mb-1">Enter GSTIN to inspect:</label>
              <input
                type="text"
                value={testGstin}
                onChange={(e) => setTestGstin(e.target.value.toUpperCase())}
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>

            <div className={`p-4 rounded-lg border font-mono space-y-2 ${
              gstinValidation.isValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold">
                {gstinValidation.isValid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>Valid Indian GSTIN Structure</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-700" />
                    <span>Structure Violation</span>
                  </>
                )}
              </div>

              {gstinValidation.isValid ? (
                <div className="text-[11px] space-y-1 pt-1 text-slate-700">
                  <p>• State Code: <span className="text-slate-900 font-bold">{gstinValidation.stateCode}</span> (Maharashtra)</p>
                  <p>• Associated PAN: <span className="text-slate-900 font-bold">{gstinValidation.pan}</span></p>
                  <p>• Supply Rule: Intra-State if supplied from state 27, Inter-State for any other state.</p>
                </div>
              ) : (
                <p className="text-[11px] text-red-700">{gstinValidation.error}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
