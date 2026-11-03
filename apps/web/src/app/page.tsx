'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightFKeyPanel } from '@/components/layout/RightFKeyPanel';
import { AICommandCenter } from '@/components/command/AICommandCenter';
import { AutonomousActivityFeed } from '@/components/feed/AutonomousActivityFeed';
import { DashboardWorkspace } from '@/components/workspaces/DashboardWorkspace';
import { SalesWorkspace } from '@/components/workspaces/SalesWorkspace';
import { PurchasesWorkspace } from '@/components/workspaces/PurchasesWorkspace';
import { AccountingWorkspace } from '@/components/workspaces/AccountingWorkspace';
import { InventoryWorkspace } from '@/components/workspaces/InventoryWorkspace';
import { BankingWorkspace } from '@/components/workspaces/BankingWorkspace';
import { GSTWorkspace } from '@/components/workspaces/GSTWorkspace';
import { ReceivablesWorkspace } from '@/components/workspaces/ReceivablesWorkspace';
import { PayablesWorkspace } from '@/components/workspaces/PayablesWorkspace';
import { PayrollWorkspace } from '@/components/workspaces/PayrollWorkspace';
import { ReportsWorkspace } from '@/components/workspaces/ReportsWorkspace';
import { DocumentsWorkspace } from '@/components/workspaces/DocumentsWorkspace';
import { ApprovalsWorkspace } from '@/components/workspaces/ApprovalsWorkspace';
import { AuditWorkspace } from '@/components/workspaces/AuditWorkspace';
import { ChartWorkspace } from '@/components/workspaces/ChartWorkspace';
import { HealthWorkspace } from '@/components/workspaces/HealthWorkspace';
import { ForecastsWorkspace } from '@/components/workspaces/ForecastsWorkspace';
import MasterDataWorkspace from '@/components/workspaces/MasterDataWorkspace';
import { X, Sparkles, Cpu } from 'lucide-react';

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState('');

  const openAskAI = useCallback((query = '') => {
    setAiInitialQuery(query);
    setAiDrawerOpen(true);
  }, []);

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openAskAI();
      }
      if (e.key === 'Escape') setAiDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [openAskAI]);

  const renderWorkspace = () => {
    switch (activeView) {
      case 'dashboard':   return <DashboardWorkspace setActiveView={setActiveView} onOpenAskAI={openAskAI} />;
      case 'feed':        return <AutonomousActivityFeed />;
      case 'sales':       return <SalesWorkspace />;
      case 'purchases':   return <PurchasesWorkspace />;
      case 'accounting':  return <AccountingWorkspace />;
      case 'inventory':   return <InventoryWorkspace />;
      case 'banking':     return <BankingWorkspace />;
      case 'gst':         return <GSTWorkspace />;
      case 'receivables': return <ReceivablesWorkspace />;
      case 'payables':    return <PayablesWorkspace />;
      case 'payroll':     return <PayrollWorkspace />;
      case 'reports':     return <ReportsWorkspace />;
      case 'documents':   return <DocumentsWorkspace />;
      case 'approvals':   return <ApprovalsWorkspace />;
      case 'audit':       return <AuditWorkspace />;
      case 'chart':       return <ChartWorkspace />;
      case 'health':      return <HealthWorkspace />;
      case 'forecasts':   return <ForecastsWorkspace />;
      case 'master':      return <MasterDataWorkspace />;
      default:            return <DashboardWorkspace setActiveView={setActiveView} onOpenAskAI={openAskAI} />;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAskAI={openAskAI}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenAskAI={openAskAI}
        />

        {/* Main content viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative">
          <div className="min-h-full" key={activeView}>
            {renderWorkspace()}
          </div>
        </main>

        {/* Quick F-Key Action Bar */}
        <RightFKeyPanel
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenAskAI={openAskAI}
        />
      </div>

      {/* ── AI Assistant Drawer ─────────────────────────── */}
      {aiDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setAiDrawerOpen(false)}
          />

          {/* Drawer panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl z-50 animate-slide-right flex flex-col bg-white shadow-2xl border-l border-slate-200">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight text-slate-900 flex items-center gap-2">
                    <span>Ledger AI Assistant</span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">⌘K</span>
                  </p>
                  <p className="text-xs text-slate-500">Ask financial questions or instruct actions in plain English</p>
                </div>
              </div>
              <button
                onClick={() => setAiDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer body — mount the AI Command Center */}
            <div className="flex-1 overflow-hidden p-3 bg-slate-50/50">
              <AICommandCenter initialQuery={aiInitialQuery} embedded />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
