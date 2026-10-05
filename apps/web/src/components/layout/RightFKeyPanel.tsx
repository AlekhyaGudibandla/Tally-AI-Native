'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Keyboard, Sparkles } from 'lucide-react';

interface RightFKeyPanelProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenAskAI: (initialQuery?: string) => void;
}

type FKeyEntry =
  | { divider: true }
  | { key: string; label: string; action: () => void; active?: boolean; divider?: false };

export const RightFKeyPanel: React.FC<RightFKeyPanelProps> = ({
  activeView,
  setActiveView,
  onOpenAskAI,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const fKeys: FKeyEntry[] = [
    { key: 'F2', label: 'Period Date', action: () => alert('Period: FY 2026-27 (Current Date: 29-Sep-2026)') },
    { key: 'F3', label: 'Company', action: () => setActiveView('dashboard') },
    { key: 'F4', label: 'Contra', action: () => setActiveView('banking') },
    { key: 'F5', label: 'Payment', action: () => setActiveView('payables') },
    { key: 'F6', label: 'Receipt', action: () => setActiveView('receivables') },
    { key: 'F7', label: 'Journal', action: () => setActiveView('accounting') },
    { key: 'F8', label: 'Sales', action: () => setActiveView('sales'), active: activeView === 'sales' },
    { key: 'F9', label: 'Purchase', action: () => setActiveView('purchases'), active: activeView === 'purchases' },
    { key: 'F10', label: 'Vouchers', action: () => setActiveView('accounting') },
    { divider: true },
    { key: 'Alt+C', label: 'Masters', action: () => {} },
    { key: 'Alt+G', label: 'Go To AI', action: () => onOpenAskAI() },
    { key: 'Alt+F1', label: 'Detailed View', action: () => setActiveView('reports') },
    { divider: true },
    { key: 'F12', label: 'Configure', action: () => onOpenAskAI('How do I configure GSTR-3B tax settings?') },
  ];

  if (collapsed) {
    return (
      <div className="w-9 shrink-0 border-l border-slate-200/80 bg-slate-50 flex flex-col items-center py-3 select-none">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          title="Expand Quick Keys (F-Bar)"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="mt-4 [writing-mode:vertical-rl] text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Quick Keys
        </div>
      </div>
    );
  }

  return (
    <aside className="w-36 shrink-0 bg-white border-l border-slate-200/80 flex flex-col h-[calc(100vh-3.5rem)] select-none text-xs">
      <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between text-slate-500 bg-slate-50/50">
        <div className="flex items-center gap-1.5">
          <Keyboard className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Quick Bar</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-0.5 rounded text-slate-400 hover:text-slate-600 transition"
          title="Collapse"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {fKeys.map((item, idx) => {
          if (item.divider) {
            return <div key={`div-${idx}`} className="h-px bg-slate-100 my-1" />;
          }

          return (
            <button
              key={item.key + item.label}
              onClick={item.action}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] transition text-left ${
                item.active
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <span className={`font-mono text-[10px] font-bold shrink-0 ${item.active ? 'text-indigo-100' : 'text-indigo-600'}`}>
                {item.key}
              </span>
              <span className="truncate flex-1 text-right">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
