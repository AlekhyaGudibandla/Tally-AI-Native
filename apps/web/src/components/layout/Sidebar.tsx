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
  Activity,
  AlertTriangle,
  ListTree,
  TrendingUp,
  FileText,
  Settings,
  Sparkles,
  Database,
  HelpCircle,
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
      { id: 'dashboard', label: 'Dashboard', keyBadge: 'O', icon: LayoutDashboard },
      { id: 'feed', label: 'Activity & Alerts', keyBadge: 'A', icon: AlertTriangle, badgeKey: 'attention' },
      { id: 'approvals', label: 'Pending Approvals', keyBadge: 'V', icon: CheckCircle2, badgeKey: 'approvals' },
    ],
  },
  {
    label: 'Accounting',
    items: [
      { id: 'sales', label: 'Invoices & Sales', keyBadge: 'F8', icon: Receipt },
      { id: 'purchases', label: 'Bills & Purchases', keyBadge: 'F9', icon: ShoppingCart },
      { id: 'banking', label: 'Bank & Cash', keyBadge: 'F4', icon: Landmark },
      { id: 'accounting', label: 'General Ledger', keyBadge: 'F7', icon: BookOpen },
      { id: 'chart', label: 'Chart of Accounts', keyBadge: 'C', icon: ListTree },
    ],
  },
  {
    label: 'Reports & Compliance',
    items: [
      { id: 'reports', label: 'Financial Reports (P&L)', keyBadge: 'F', icon: BarChart3 },
      { id: 'receivables', label: 'Receivables & Dues', keyBadge: 'R', icon: TrendingUp },
      { id: 'payables', label: 'Payables & Bills', keyBadge: 'P', icon: FileText },
      { id: 'gst', label: 'GST Returns (GSTR)', keyBadge: 'G', icon: FileCheck2 },
      { id: 'audit', label: 'Audit Trail', keyBadge: 'D', icon: History },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'inventory', label: 'Inventory & Stock', keyBadge: 'I', icon: Boxes },
      { id: 'master', label: 'Customers & Vendors', keyBadge: 'M', icon: Database },
      { id: 'payroll', label: 'Payroll & Team', keyBadge: 'Y', icon: Users },
      { id: 'health', label: 'Cash Flow & Runway', keyBadge: 'H', icon: Activity },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onOpenAskAI }) => {
  const { activityFeed, org } = useLedger();

  const pendingCount = activityFeed.filter(
    (item) => item.status === 'PENDING_APPROVAL' || item.status === 'ATTENTION_REQUIRED'
  ).length;

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200/80 bg-white flex flex-col h-[calc(100vh-4rem)] select-none">
      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-3.5 space-y-5">
        {sections.map((section) => (
          <div key={section.label} className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2.5">
              {section.label}
            </span>
            <div className="space-y-0.5 mt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                const showBadge = item.badgeKey === 'attention' && pendingCount > 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`saas-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>

                    {showBadge && (
                      <span className="h-5 min-w-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}

                    <span className={`text-[10px] font-mono px-1 rounded ${
                      isActive ? 'text-blue-600 bg-blue-100/60' : 'text-slate-400 bg-slate-100'
                    }`}>
                      {item.keyBadge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom AI Assistant Card & User info */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/70 space-y-3">
        {/* Quick AI Trigger */}
        <div
          onClick={onOpenAskAI}
          className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 cursor-pointer hover:bg-blue-100/80 transition flex items-center gap-2.5 group"
        >
          <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 flex items-center justify-between">
              <span>AI Assistant</span>
              <span className="text-[10px] text-blue-600 font-medium">Ready</span>
            </p>
            <p className="text-[11px] text-slate-500 truncate">Ask anything or enter a bill</p>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
            AU
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">Admin User</p>
            <p className="text-[11px] text-slate-400 truncate">admin@ledgerai.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
