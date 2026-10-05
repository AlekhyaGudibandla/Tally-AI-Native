'use client';

import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  BookOpen,
  Boxes,
  Landmark,
  FileCheck2,
  Users,
  BarChart3,
  CheckCircle2,
  History,
  Shield,
  Activity,
  AlertTriangle,
  ListTree,
  TrendingUp,
  FileText,
  Settings,
  RefreshCw,
  Sparkles,
  Database,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenAskAI: () => void;
}

const sections = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Executive Dashboard', keyBadge: 'O', icon: LayoutDashboard },
      { id: 'feed', label: 'Attention Feed', keyBadge: 'A', icon: AlertTriangle, badgeKey: 'attention' },
      { id: 'approvals', label: 'Approvals Queue', keyBadge: 'V', icon: CheckCircle2, badgeKey: 'approvals' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'master', label: 'Master Data', keyBadge: 'M', icon: Database },
      { id: 'sales', label: 'Sales & Invoices', keyBadge: 'F8', icon: Receipt },
      { id: 'purchases', label: 'Purchases & Bills', keyBadge: 'F9', icon: ShoppingCart },
      { id: 'banking', label: 'Banking & Feeds', keyBadge: 'F4', icon: Landmark },
      { id: 'inventory', label: 'Stock & Inventory', keyBadge: 'I', icon: Boxes },
      { id: 'payroll', label: 'Payroll & HR', keyBadge: 'Y', icon: Users },
    ],
  },
  {
    label: 'Accounting & Ledgers',
    items: [
      { id: 'accounting', label: 'Daybook & Journals', keyBadge: 'F7', icon: BookOpen },
      { id: 'chart', label: 'Chart of Accounts', keyBadge: 'C', icon: ListTree },
      { id: 'gst', label: 'GST Returns (GSTR-1/3B)', keyBadge: 'G', icon: FileCheck2 },
      { id: 'receivables', label: 'Receivables Aging', keyBadge: 'R', icon: TrendingUp },
      { id: 'payables', label: 'Payables & Dues', keyBadge: 'P', icon: FileText },
    ],
  },
  {
    label: 'Insights & Compliance',
    items: [
      { id: 'reports', label: 'Financial Statements (P&L)', keyBadge: 'F', icon: BarChart3 },
      { id: 'health', label: 'AI CFO & Health', keyBadge: 'H', icon: Activity },
      { id: 'forecasts', label: 'Cashflow Forecast', keyBadge: 'E', icon: TrendingUp },
      { id: 'audit', label: 'Audit Trail & Logs', keyBadge: 'D', icon: History },
      { id: 'documents', label: 'OCR & Documents', keyBadge: 'W', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onOpenAskAI }) => {
  const { activityFeed } = useLedger();

  const pendingCount = activityFeed.filter(
    (item) => item.status === 'PENDING_APPROVAL' || item.status === 'ATTENTION_REQUIRED'
  ).length;

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200/80 bg-white flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {sections.map((section) => (
          <div key={section.label} className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
              {section.label}
            </span>
            <div className="space-y-0.5 mt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                const badgeNumber = item.badgeKey === 'attention' || item.badgeKey === 'approvals' ? pendingCount : 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`nav-item flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                      isActive
                        ? 'bg-indigo-50/80 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {badgeNumber > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold">
                          {badgeNumber}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-300 font-medium">{item.keyBadge}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom AI Copilot Quick Launcher */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={onOpenAskAI}
          className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-indigo-50/50 border border-slate-200/80 rounded-xl transition shadow-2xs group text-left"
        >
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">Ask Vahi AI</p>
              <p className="text-[10px] text-slate-400">Autonomous Copilot</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 border border-slate-200 px-1 py-0.5 rounded bg-slate-50">
            ⌘K
          </span>
        </button>
      </div>
    </aside>
  );
};
