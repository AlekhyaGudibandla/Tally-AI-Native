'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bell,
  Sparkles,
  Search,
  ChevronDown,
  CheckCircle2,
  FileText,
  RefreshCw,
  AlertTriangle,
  Plus,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { MasterManagementModal } from '@/components/modals/MasterManagementModal';
import { UserGuideModal } from '@/components/modals/UserGuideModal';
import { QuickTransactionModal } from '@/components/modals/QuickTransactionModal';

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenAskAI: (initialQuery?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView, onOpenAskAI }) => {
  const {
    org,
    activityFeed,
    simulateIncomingInvoice,
    simulateBankFeed,
    simulateGSTAnomaly,
    runReconciliation,
    refreshData,
  } = useLedger();

  const [showSimMenu, setShowSimMenu] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showUserGuideModal, setShowUserGuideModal] = useState(false);
  const [showQuickTxModal, setShowQuickTxModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setShowUserGuideModal(true);
      }
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setShowMasterModal(true);
      }
      if (e.altKey && (e.key === 'n' || e.key === 'N' || e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        setShowQuickTxModal(true);
      }
      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setActiveView('sales');
      }
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setActiveView('purchases');
      }
      if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setActiveView('banking');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setActiveView]);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const pendingAttentionCount = activityFeed.filter(
    (item) => item.status === 'PENDING_APPROVAL' || item.status === 'ATTENTION_REQUIRED'
  ).length;

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-30 shrink-0 select-none shadow-2xs">
        {/* Left: Brand + Organization Selector */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm transition group-hover:bg-blue-700">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">
                Ledger AI
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Organization selector */}
          <button
            onClick={() => setShowMasterModal(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition text-left group"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate max-w-[160px]">
                {org.name || 'Ledger AI Technologies'}
              </span>
              <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {(org as any).financialYear || 'FY 2026-27'}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        {/* Center: Search & Ask AI Bar */}
        <div className="flex-1 max-w-lg mx-6 hidden md:block">
          <div
            onClick={() => onOpenAskAI()}
            className="flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer text-slate-400 hover:text-slate-600 transition shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="h-4 w-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
              <span className="text-xs text-slate-500 group-hover:text-slate-700 truncate">
                Search transactions or ask AI anything...
              </span>
            </div>
            <kbd className="px-2 py-0.5 text-[10px] font-semibold bg-white text-slate-500 border border-slate-200 rounded-md shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions, Balance Status & Profile */}
        <div className="flex items-center gap-3">
          {/* Books Balanced Status */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Books Balanced: ₹0.00 difference</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 transition"
            title="Sync with database"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* + New Transaction Button */}
          <button
            onClick={() => setShowQuickTxModal(true)}
            className="btn-primary text-xs py-1.5 px-3"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Transaction</span>
            <span className="text-[10px] opacity-75 hidden lg:inline">Alt+N</span>
          </button>

          {/* Notifications / Approvals */}
          <button
            onClick={() => setActiveView('feed')}
            className="relative p-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 transition"
            title="Activity & Approvals"
          >
            <Bell className="h-4 w-4" />
            {pendingAttentionCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                {pendingAttentionCount}
              </span>
            )}
          </button>

          {/* Quick Demo Automations Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSimMenu(!showSimMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline">Demo Actions</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showSimMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSimMenu(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 text-xs">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Quick Workflows
                  </div>
                  <button
                    onClick={() => {
                      simulateIncomingInvoice();
                      setShowSimMenu(false);
                      setActiveView('sales');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-800">Simulate Vendor Invoice OCR</p>
                      <p className="text-[11px] text-slate-400">Scans bill and drafts voucher</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      simulateBankFeed();
                      setShowSimMenu(false);
                      setActiveView('banking');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition"
                  >
                    <RefreshCw className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-800">Simulate Bank Payment Received</p>
                      <p className="text-[11px] text-slate-400">Matches open accounts receivable</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      runReconciliation();
                      setShowSimMenu(false);
                      setActiveView('banking');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition"
                  >
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="font-semibold text-slate-800">Run 3-Way Match Check</p>
                      <p className="text-[11px] text-slate-400">Checks PO, receipt note, and invoice</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      simulateGSTAnomaly();
                      setShowSimMenu(false);
                      setActiveView('gst');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition border-t border-slate-100"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="font-semibold text-slate-800">Simulate GST Mismatch</p>
                      <p className="text-[11px] text-slate-400">Flags missing vendor ITC credit</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      {showMasterModal && <MasterManagementModal isOpen={showMasterModal} onClose={() => setShowMasterModal(false)} />}
      {showUserGuideModal && <UserGuideModal isOpen={showUserGuideModal} onClose={() => setShowUserGuideModal(false)} />}
      {showQuickTxModal && <QuickTransactionModal isOpen={showQuickTxModal} onClose={() => setShowQuickTxModal(false)} />}
    </>
  );
};
