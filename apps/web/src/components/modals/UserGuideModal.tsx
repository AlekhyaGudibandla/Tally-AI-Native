'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Search,
  Sparkles,
  CheckCircle2,
  Keyboard,
  ShieldCheck,
  FileText,
  Building2,
  DollarSign,
  Package,
  Landmark,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveView?: (view: string) => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose, setActiveView }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'WORKFLOWS' | 'SHORTCUTS' | 'TALLY_MAP'>('OVERVIEW');

  if (!isOpen) return null;

  const navigateTo = (viewName: string) => {
    if (setActiveView) setActiveView(viewName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#b0c4de] rounded-lg max-w-4xl w-full flex flex-col shadow-2xl overflow-hidden h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#005a9e] text-white">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-[#ffbe00]" />
            <div>
              <h2 className="font-bold text-base">Vahi User Guide & Feature Walkthrough</h2>
              <p className="text-[11px] text-blue-100">Simple, non-technical manual for AI-native Tally accounting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-blue-100 hover:text-white rounded hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center bg-[#f0f4f8] px-4 pt-2 border-b border-slate-200 space-x-1 text-xs">
          <button
            onClick={() => setActiveSection('OVERVIEW')}
            className={`px-4 py-2 font-bold rounded-t border-t border-x transition ${
              activeSection === 'OVERVIEW'
                ? 'bg-white text-[#005a9e] border-slate-300 border-b-white'
                : 'text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            1. Overview & What This Site Does
          </button>

          <button
            onClick={() => setActiveSection('WORKFLOWS')}
            className={`px-4 py-2 font-bold rounded-t border-t border-x transition ${
              activeSection === 'WORKFLOWS'
                ? 'bg-white text-[#005a9e] border-slate-300 border-b-white'
                : 'text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            2. Step-by-Step Feature Workflows
          </button>

          <button
            onClick={() => setActiveSection('SHORTCUTS')}
            className={`px-4 py-2 font-bold rounded-t border-t border-x transition ${
              activeSection === 'SHORTCUTS'
                ? 'bg-white text-[#005a9e] border-slate-300 border-b-white'
                : 'text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            3. Fast Keyboard Shortcuts
          </button>

          <button
            onClick={() => setActiveSection('TALLY_MAP')}
            className={`px-4 py-2 font-bold rounded-t border-t border-x transition ${
              activeSection === 'TALLY_MAP'
                ? 'bg-white text-[#005a9e] border-slate-300 border-b-white'
                : 'text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            4. Tally Prime Feature Mapping
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center px-5">
          <Search className="h-4 w-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search guide (e.g., e-invoice, bank statement, create ledger, GST)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900"
          />
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-800 space-y-6">
          {activeSection === 'OVERVIEW' && (
            <div className="space-y-5">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-2">
                <h3 className="font-extrabold text-indigo-900 text-sm flex items-center space-x-1.5">
                  <Sparkles className="h-4 w-4 text-[#ffbe00]" />
                  <span>What is Vahi?</span>
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Vahi (वही)</strong> is an easy-to-use, AI-powered business accounting software designed to completely replace legacy tools like Tally Prime. It allows non-technical business owners, accountants, and finance heads to handle 100% of their business operations — from issuing tax invoices, matching bank statements, tracking inventory, calculating GST returns, and managing payroll — with automated AI assistance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-xs space-y-2">
                  <div className="flex items-center space-x-2 text-[#005a9e] font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Real Double-Entry Accounting</span>
                  </div>
                  <p className="text-slate-600">
                    Guarantees absolute math accuracy (`Debit === Credit`). Posted ledger vouchers are audit-locked and legally compliant under Indian Income Tax & GST laws.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-xs space-y-2">
                  <div className="flex items-center space-x-2 text-[#005a9e] font-bold">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    <span>Background AI Automation</span>
                  </div>
                  <p className="text-slate-600">
                    Vahi silently parses vendor bills (OCR), checks buyer GSTINs, matches bank payments, flags overdue receivables, and alerts you before cash flow falls low.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'WORKFLOWS' && (
            <div className="space-y-6">
              {/* Workflow 1 */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-[#005a9e]" />
                    <span>1. Creating & Issuing Tax Invoices (Sales)</span>
                  </h4>
                  <button
                    onClick={() => navigateTo('sales')}
                    className="px-2.5 py-1 bg-[#005a9e] text-white text-[11px] font-bold rounded hover:bg-[#00477d]"
                  >
                    Go to Sales Desk →
                  </button>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Navigate to <strong>Sales</strong> workspace or press <strong>Alt+S</strong>.</li>
                  <li>Click <strong>Create Tax Invoice</strong>. Select customer name and billing items.</li>
                  <li>Vahi automatically calculates CGST/SGST (for same state) or IGST (for inter-state).</li>
                  <li>For invoices over ₹50,000, Vahi generates statutory E-Way Bill details and a 64-character SHA-256 e-Invoice IRN hash.</li>
                  <li>Click <strong>Post & Issue Invoice</strong> — stock is deducted automatically and receivables are updated!</li>
                </ol>
              </div>

              {/* Workflow 2 */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Landmark className="h-4 w-4 text-emerald-700" />
                    <span>2. Bank Statement Import & Smart Reconciliation</span>
                  </h4>
                  <button
                    onClick={() => navigateTo('banking')}
                    className="px-2.5 py-1 bg-emerald-700 text-white text-[11px] font-bold rounded hover:bg-emerald-800"
                  >
                    Go to Banking →
                  </button>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Navigate to <strong>Banking</strong> workspace.</li>
                  <li>Click <strong>Import Bank CSV Statement</strong> or paste text from HDFC/ICICI/SBI online banking.</li>
                  <li>Vahi's AI matches bank credits and debits against open customer invoices and vendor bills.</li>
                  <li>Click <strong>Run Reconciliation</strong> — matched entries clear automatically with 1-click!</li>
                </ol>
              </div>

              {/* Workflow 3 */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-purple-700" />
                    <span>3. Creating Ledgers & Stock Items (Master Setup)</span>
                  </h4>
                  <button
                    onClick={() => navigateTo('accounting')}
                    className="px-2.5 py-1 bg-purple-700 text-white text-[11px] font-bold rounded hover:bg-purple-800"
                  >
                    Go to Ledgers →
                  </button>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Click <strong>K:Company</strong> or press <strong>Alt+C</strong> on your keyboard.</li>
                  <li>Choose <strong>Create Ledger</strong> (for Customer, Vendor, Bank, Expense) or <strong>Create Stock Item</strong>.</li>
                  <li>Enter ledger code, name, and group. Opening balances update live!</li>
                </ol>
              </div>
            </div>
          )}

          {activeSection === 'SHORTCUTS' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Vahi supports full keyboard navigation identical to Tally Prime. Work 10x faster without touching your mouse!
              </p>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-[#005a9e] text-white text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Shortcut Key</th>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">Ctrl + K / ⌘K</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">Ask Vahi (G: Go To)</td>
                      <td className="py-2.5 px-4 text-slate-600">Open AI Slide-Over Command Drawer for search or action.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">Alt + S</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">Create Invoice</td>
                      <td className="py-2.5 px-4 text-slate-600">Fast Tax Invoice creation window.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">Alt + E</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">Record Expense</td>
                      <td className="py-2.5 px-4 text-slate-600">Quick Payment Voucher entry.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">Alt + R</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">Record Payment</td>
                      <td className="py-2.5 px-4 text-slate-600">Receipt Voucher for funds received.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">Alt + C</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">Company / Add Master</td>
                      <td className="py-2.5 px-4 text-slate-600">Create Ledger, Stock Item, or update company setup.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">Alt + U</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">Upload Document</td>
                      <td className="py-2.5 px-4 text-slate-600">OCR document processing pipeline.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'TALLY_MAP' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Migrating from Tally Prime? Here is how familiar Tally menus map directly to Vahi:
              </p>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-[#005a9e] text-white text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Tally Prime Feature</th>
                      <th className="py-2.5 px-4">Vahi Workspace</th>
                      <th className="py-2.5 px-4">AI Advantage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">F8: Sales Voucher</td>
                      <td className="py-2.5 px-4 text-[#005a9e] font-bold">Sales & E-Invoicing</td>
                      <td className="py-2.5 px-4 text-emerald-700">Auto-calculated GST place-of-supply & 64-char IRN hash.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">F9: Purchase Voucher</td>
                      <td className="py-2.5 px-4 text-[#005a9e] font-bold">Purchases & 3-Way Match</td>
                      <td className="py-2.5 px-4 text-emerald-700">Automated PO vs GRN vs Vendor Invoice discrepancy check.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">Bank Reconciliation (BKO)</td>
                      <td className="py-2.5 px-4 text-[#005a9e] font-bold">Banking Auto-Reconcile</td>
                      <td className="py-2.5 px-4 text-emerald-700">Semantic narration matching with 94%+ precision.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">Display → Statutory (GST)</td>
                      <td className="py-2.5 px-4 text-[#005a9e] font-bold">GST Tax Return Desk</td>
                      <td className="py-2.5 px-4 text-emerald-700">Live GSTR-1, GSTR-3B liability reports & GSTR-2B ITC alerts.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">Audit Trail (Edit Log)</td>
                      <td className="py-2.5 px-4 text-[#005a9e] font-bold">Immutable Audit Trail</td>
                      <td className="py-2.5 px-4 text-emerald-700">Cryptographic SHA-256 event log recording every ledger action.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
