'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Boxes,
  Receipt,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { ThreeWayMatchEngine } from '@/lib/engine/three-way-match-engine';
import { ThreeWayMatchResult } from '@/lib/types';

export const PurchasesWorkspace: React.FC = () => {
  const { purchaseOrders, grns } = useLedger();

  // 3-Way Match Sandbox Scenario selector
  const [scenario, setScenario] = useState<'PERFECT' | 'PRICE_VARIANCE' | 'QTY_VARIANCE'>('PERFECT');

  // Compute 3-way match result based on scenario
  const po = purchaseOrders[0]; // PO-2026-081 (2 Server nodes @ 250k)
  const grn = grns[0];           // GRN-2026-092 (2 units accepted)

  const invoiceInput = {
    invoiceNumber: scenario === 'PERFECT' ? 'INV-DELTA-9912' : scenario === 'PRICE_VARIANCE' ? 'INV-DELTA-9913' : 'INV-DELTA-9914',
    vendorName: 'Delta Electronics Ltd',
    poNumber: po.poNumber,
    items: [
      {
        productId: 'prod-srv-01',
        productName: 'Rackmount Cloud Server Node 64-Core',
        invoicedQty: scenario === 'QTY_VARIANCE' ? 3 : 2, // 3 units instead of 2!
        unitPrice: scenario === 'PRICE_VARIANCE' ? 275000 : 250000, // 275k (+10% variance) instead of 250k!
      },
    ],
  };

  const matchResult: ThreeWayMatchResult = ThreeWayMatchEngine.match(
    invoiceInput,
    po,
    grn,
    0, // strict 0% price tolerance
    0  // strict 0% quantity tolerance
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <ShoppingCart className="h-4 w-4" />
            <span>Procurement & Accounts Payable Controls</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            3-Way Matching Engine (PO ↔ GRN ↔ Invoice)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Deterministic variance verification prevents overbilling, price inflation, and ghost vendor payments before money leaves the bank.
          </p>
        </div>

        {/* Scenario Switcher */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm">
          <span className="text-xs text-slate-500 font-medium px-2">Simulate Match:</span>
          <button
            onClick={() => setScenario('PERFECT')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              scenario === 'PERFECT'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ✓ Perfect Match
          </button>
          <button
            onClick={() => setScenario('PRICE_VARIANCE')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              scenario === 'PRICE_VARIANCE'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ⚠ Price Variance (+10%)
          </button>
          <button
            onClick={() => setScenario('QTY_VARIANCE')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              scenario === 'QTY_VARIANCE'
                ? 'bg-red-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            🔴 Quantity Overbilled
          </button>
        </div>
      </div>

      {/* 3-Way Match Visual Diagram */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-base">Interactive 3-Way Alignment Inspector</h2>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase font-mono border ${
              matchResult.status === 'PERFECT_MATCH'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {matchResult.status.replace('_', ' ')}
          </span>
        </div>

        {/* 3 Cards: PO, GRN, INVOICE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Card 1: Purchase Order */}
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-sky-700 text-xs font-bold uppercase">
              <ShoppingCart className="h-4 w-4" />
              <span>1. Purchase Order (PO)</span>
            </div>
            <div>
              <p className="font-mono font-bold text-slate-900 text-sm">{po.poNumber}</p>
              <p className="text-slate-500 text-xs">{po.vendorName}</p>
            </div>
            <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Authorized Units:</span>
                <span className="font-mono text-slate-900 font-bold">{po.items[0].orderedQty} Units</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Approved Rate:</span>
                <span className="font-mono text-slate-900 font-bold">₹{po.items[0].unitPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sky-700 font-bold pt-1">
                <span>PO Total:</span>
                <span className="font-mono">₹{po.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Goods Receipt Note (GRN) */}
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase">
              <Boxes className="h-4 w-4" />
              <span>2. Goods Receipt (GRN)</span>
            </div>
            <div>
              <p className="font-mono font-bold text-slate-900 text-sm">{grn.grnNumber}</p>
              <p className="text-slate-500 text-xs">Warehouse: {grn.warehouseId}</p>
            </div>
            <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Received Physically:</span>
                <span className="font-mono text-slate-900 font-bold">{grn.items[0].receivedQty} Units</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Verified & Accepted:</span>
                <span className="font-mono text-emerald-700 font-bold">{grn.items[0].acceptedQty} Units</span>
              </div>
              <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                <span>Inspector:</span>
                <span>{grn.inspectedBy.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Vendor Invoice */}
          <div className={`p-5 rounded-lg border space-y-3 ${
            matchResult.status === 'PERFECT_MATCH'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-red-50/50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2 text-purple-700 text-xs font-bold uppercase">
              <Receipt className="h-4 w-4" />
              <span>3. Vendor Tax Invoice</span>
            </div>
            <div>
              <p className="font-mono font-bold text-slate-900 text-sm">{invoiceInput.invoiceNumber}</p>
              <p className="text-slate-500 text-xs">{invoiceInput.vendorName}</p>
            </div>
            <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Billed Quantity:</span>
                <span className={`font-mono font-bold ${
                  scenario === 'QTY_VARIANCE' ? 'text-red-700 animate-pulse' : 'text-slate-900'
                }`}>
                  {invoiceInput.items[0].invoicedQty} Units
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Billed Unit Rate:</span>
                <span className={`font-mono font-bold ${
                  scenario === 'PRICE_VARIANCE' ? 'text-amber-700 animate-pulse' : 'text-slate-900'
                }`}>
                  ₹{invoiceInput.items[0].unitPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-purple-700 font-bold pt-1">
                <span>Billed Total:</span>
                <span className="font-mono">
                  ₹{(invoiceInput.items[0].invoicedQty * invoiceInput.items[0].unitPrice).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Summary & Recommendation */}
        <div className={`p-4 rounded-lg border space-y-2 ${
          matchResult.status === 'PERFECT_MATCH'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center space-x-2">
            {matchResult.status === 'PERFECT_MATCH' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-red-700 shrink-0" />
            )}
            <h4 className="font-bold text-sm">
              {matchResult.status === 'PERFECT_MATCH' ? 'Match Confirmed' : 'Discrepancy Intercepted'}
            </h4>
          </div>

          <p className="text-xs leading-relaxed text-slate-700 pl-7 font-medium">
            {matchResult.aiRecommendation}
          </p>

          {matchResult.discrepancyDetails.length > 0 && (
            <ul className="pl-7 text-xs space-y-1 pt-1 text-red-700 font-mono">
              {matchResult.discrepancyDetails.map((d, i) => (
                <li key={i}>• {d}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
