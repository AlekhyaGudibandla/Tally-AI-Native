'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bell,
  Sparkles,
  Search,
  HelpCircle,
  Zap,
  ChevronDown,
  CheckCircle2,
  FileText,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Settings,
  ShieldCheck,
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
    exportBackupJSON,
    simulateIncomingInvoice,
    simulateBankFeed,
    simulateGSTAnomaly,
    runReconciliation,
  } = useLedger();

  const [showSimMenu, setShowSimMenu] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showUserGuideModal, setShowUserGuideModal] = useState(false);
  const [showQuickTxModal, setShowQuickTxModal] = useState(false);

  // Global hotkeys for F1 (Help) & Alt+C (Company Masters) & Alt+N / Alt+T (New Transaction)
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

  const pendingAttentionCount = activityFeed.filter(
    (item) => item.status === 'PENDING_APPROVAL' || item.status === 'ATTENTION_REQUIRED'
  ).length;

  return (
    <>
      <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 flex items-center justify-between z-30 shrink-0 select-none">
        {/* Left: Brand + Company Info */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:bg-indigo-600 transition">
              V
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900">Vahi</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">AI-Native</span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Company Switcher Pill */}
          <button
            onClick={() => setShowMasterModal(true)}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200/80 hover:bg-slate-50 transition text-left"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">{org.name}</span>
              <span className="text-[10px] font-mono font-medium text-slate-400">FY 26-27</span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </div>

        {/* Center: Global AI Command Bar */}
        <div className="flex-1 max-w-lg mx-4 hidden md:block">
          <div
            onClick={() => onOpenAskAI()}
            className="flex items-center justify-between px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl cursor-pointer text-slate-400 hover:text-slate-600 transition shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0 group-hover:scale-110 transition" />
              <span className="text-xs text-slate-500 group-hover:text-slate-700 truncate">
                Tell Vahi what happened or ask anything...
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-slate-500 border border-slate-200 rounded shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions & State Monitor */}
        <div className="flex items-center gap-2">
          {/* + New Transaction Primary Button */}
          <button
            onClick={() => setShowQuickTxModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Entry</span>
            <span className="text-[10px] opacity-70 hidden lg:inline font-mono">Alt+N</span>
          </button>

          {/* AI Ledger Status Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ledger Deterministic</span>
          </div>

          {/* Attention / Notification Bell */}
          <button
            onClick={() => setActiveView('feed')}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Attention Feed"
          >
            <Bell className="h-4 w-4" />
            {pendingAttentionCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                {pendingAttentionCount}
              </span>
            )}
          </button>

          {/* Workflow Simulation Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSimMenu(!showSimMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline">Simulate</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showSimMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSimMenu(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-fade-slide">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Live Operations Feeds
                  </div>
                  <button
                    onClick={() => {
                      simulateIncomingInvoice();
                      setShowSimMenu(false);
                      setActiveView('sales');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Process Invoice OCR & GRN</span>
                  </button>
                  <button
                    onClick={() => {
                      simulateBankFeed();
                      setShowSimMenu(false);
                      setActiveView('banking');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Sync Connected Bank Feed</span>
                  </button>
                  <button
                    onClick={() => {
                      runReconciliation();
                      setShowSimMenu(false);
                      setActiveView('banking');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    <span>Run Auto-Reconciliation</span>
                  </button>
                  <button
                    onClick={() => {
                      simulateGSTAnomaly();
                      setShowSimMenu(false);
                      setActiveView('gst');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span>Simulate GST Rate Anomaly</span>
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    onClick={() => {
                      exportBackupJSON();
                      setShowSimMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 text-slate-600"
                  >
                    Export Full Ledger JSON Backup
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Master Management Alt+C */}
          <button
            onClick={() => setShowMasterModal(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition hidden sm:flex"
            title="Masters (Alt+C)"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Help F1 */}
          <button
            onClick={() => setShowUserGuideModal(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="User Manual & Keyboard Guide (F1)"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Modals */}
      {showMasterModal && <MasterManagementModal isOpen={showMasterModal} onClose={() => setShowMasterModal(false)} />}
      {showUserGuideModal && <UserGuideModal isOpen={showUserGuideModal} onClose={() => setShowUserGuideModal(false)} />}
      {showQuickTxModal && <QuickTransactionModal isOpen={showQuickTxModal} onClose={() => setShowQuickTxModal(false)} />}
    </>
  );
};
