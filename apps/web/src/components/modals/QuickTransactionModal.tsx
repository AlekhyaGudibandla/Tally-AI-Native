'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Receipt,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Building,
  Plus,
  Send,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { Invoice, JournalEntry } from '@/lib/types';
import { AgentOrchestrator } from '@/lib/ai/agent-orchestrator';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'ai' | 'sales' | 'purchase' | 'receipt' | 'payment' | 'journal';
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'ai',
}) => {
  const {
    org,
    accounts,
    invoices,
    products,
    bankTransactions,
    journalEntries,
    addInvoice,
    addJournalEntry,
    addFeedEvent,
  } = useLedger();

  const [activeTab, setActiveTab] = useState<'ai' | 'sales' | 'purchase' | 'receipt' | 'payment' | 'journal'>(defaultTab);

  // ── Tab 1: AI Natural Language State ──────────────────────────────────────
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // ── Tab 2: Sales Form State ────────────────────────────────────────────────
  const [salesParty, setSalesParty] = useState('Acme Corp');
  const [salesItem, setSalesItem] = useState('Apple MacBook Pro 16"');
  const [salesQty, setSalesQty] = useState(2);
  const [salesPrice, setSalesPrice] = useState(125000);
  const [salesGstRate, setSalesGstRate] = useState(18);
  const [salesIsInterstate, setSalesIsInterstate] = useState(false);

  // ── Tab 3: Purchase Form State ─────────────────────────────────────────────
  const [purParty, setPurParty] = useState('Delta Electronics Ltd');
  const [purItem, setPurItem] = useState('RAM DDR5 32GB Modules');
  const [purQty, setPurQty] = useState(10);
  const [purPrice, setPurPrice] = useState(8500);
  const [purGstRate, setPurGstRate] = useState(18);

  // ── Tab 4: Receipt Form State ──────────────────────────────────────────────
  const [rcptCustomer, setRcptCustomer] = useState('ABC Traders');
  const [rcptAmount, setRcptAmount] = useState(80000);
  const [rcptBank, setRcptBank] = useState('acc-hdfc');
  const [rcptNarration, setRcptNarration] = useState('Payment received against outstanding invoices');

  // ── Tab 5: Payment Form State ──────────────────────────────────────────────
  const [pmtCategory, setPmtCategory] = useState('Office Rent Expense');
  const [pmtAmount, setPmtAmount] = useState(45000);
  const [pmtBank, setPmtBank] = useState('acc-hdfc');
  const [pmtNarration, setPmtNarration] = useState('Monthly office rent disbursement');

  if (!isOpen) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAiInterpret = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const result = await AgentOrchestrator.executeCommand(aiPrompt, {
        organizationName: org.name,
        accounts,
        invoices,
        bankTransactions,
        products,
        journalEntries,
      });
      setAiResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiExecuteAction = () => {
    if (!aiResult?.proposedAction) return;
    const action = aiResult.proposedAction;

    if (action.type === 'POST_SALES_INVOICE' && action.payload?.invoice) {
      addInvoice(action.payload.invoice);
      alert('✓ Sales Invoice created & posted to General Ledger!');
    } else if (action.payload?.journalEntry) {
      addJournalEntry(action.payload.journalEntry);
      alert('✓ Transaction posted to General Ledger!');
    } else {
      alert('✓ Action processed successfully!');
    }
    if (aiResult.feedEvent) addFeedEvent(aiResult.feedEvent);
    onClose();
  };

  const handleCreateSales = (e: React.FormEvent) => {
    e.preventDefault();
    const subTotal = salesQty * salesPrice;
    const totalTax = Math.round(subTotal * (salesGstRate / 100));
    const cgst = salesIsInterstate ? 0 : Math.round(totalTax / 2);
    const sgst = salesIsInterstate ? 0 : Math.round(totalTax / 2);
    const igst = salesIsInterstate ? totalTax : 0;
    const grandTotal = subTotal + totalTax;

    const invNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNum,
      type: 'TAX_INVOICE',
      partyId: 'party-custom',
      partyName: salesParty,
      partyGstin: salesIsInterstate ? '29AABCS1429B1ZB' : '27AABCU9603R1ZM',
      partyState: salesIsInterstate ? 'Karnataka' : 'Maharashtra',
      partyStateCode: salesIsInterstate ? '29' : '27',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'ISSUED',
      supplyType: salesIsInterstate ? 'INTER_STATE' : 'INTRA_STATE',
      subTotal,
      totalDiscount: 0,
      totalTax,
      grandTotal,
      paidAmount: 0,
      balanceAmount: grandTotal,
      createdVia: 'MANUAL',
      items: [
        {
          id: `item-${Date.now()}`,
          productId: 'prod-generic',
          itemDescription: `${salesQty}x ${salesItem}`,
          hsnCode: '8471',
          quantity: salesQty,
          unit: 'NOS',
          unitPrice: salesPrice,
          discountPercent: 0,
          taxableAmount: subTotal,
          gstRate: salesGstRate,
          cgstAmount: cgst,
          sgstAmount: sgst,
          igstAmount: igst,
          totalAmount: grandTotal,
        },
      ],
    };

    addInvoice(newInvoice);
    onClose();
  };

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const subTotal = purQty * purPrice;
    const totalTax = Math.round(subTotal * (purGstRate / 100));
    const cgst = Math.round(totalTax / 2);
    const sgst = Math.round(totalTax / 2);
    const grandTotal = subTotal + totalTax;

    const purNum = `PUR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const entry: JournalEntry = {
      id: `trx-pur-${Date.now()}`,
      entryNumber: purNum,
      voucherType: 'PURCHASE',
      entryDate: new Date().toISOString().split('T')[0],
      status: 'POSTED',
      narration: `Purchase of ${purQty}x ${purItem} from ${purParty}`,
      lines: [
        { id: 'p1', accountId: 'acc-inventory', accountName: 'Stock in Trade / Purchases', debit: subTotal, credit: 0 },
        { id: 'p2', accountId: 'acc-itc-cgst', accountName: 'ITC - CGST (9%)', debit: cgst, credit: 0 },
        { id: 'p3', accountId: 'acc-itc-sgst', accountName: 'ITC - SGST (9%)', debit: sgst, credit: 0 },
        { id: 'p4', accountId: 'acc-ap', accountName: `Accounts Payable (${purParty})`, debit: 0, credit: grandTotal },
      ],
      totalDebit: grandTotal,
      totalCredit: grandTotal,
      sourceType: 'MANUAL',
      createdBy: 'Finance Desk',
      postedAt: new Date().toISOString(),
      tags: ['PURCHASE', 'ITC'],
    };

    addJournalEntry(entry);
    onClose();
  };

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const rctNum = `RCT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const bankAccount = accounts.find((a) => a.id === rcptBank) || accounts[1];

    const entry: JournalEntry = {
      id: `trx-rct-${Date.now()}`,
      entryNumber: rctNum,
      voucherType: 'RECEIPT',
      entryDate: new Date().toISOString().split('T')[0],
      status: 'POSTED',
      narration: rcptNarration,
      lines: [
        { id: 'r1', accountId: bankAccount.id, accountName: bankAccount.name, debit: rcptAmount, credit: 0 },
        { id: 'r2', accountId: 'acc-ar', accountName: `Accounts Receivable (${rcptCustomer})`, debit: 0, credit: rcptAmount },
      ],
      totalDebit: rcptAmount,
      totalCredit: rcptAmount,
      sourceType: 'MANUAL',
      createdBy: 'Finance Desk',
      postedAt: new Date().toISOString(),
      tags: ['RECEIPT', 'CUSTOMER_PAYMENT'],
    };

    addJournalEntry(entry);
    onClose();
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const pmtNum = `PMT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const bankAccount = accounts.find((a) => a.id === pmtBank) || accounts[1];

    const entry: JournalEntry = {
      id: `trx-pmt-${Date.now()}`,
      entryNumber: pmtNum,
      voucherType: 'PAYMENT',
      entryDate: new Date().toISOString().split('T')[0],
      status: 'POSTED',
      narration: pmtNarration,
      lines: [
        { id: 'p1', accountId: 'acc-expense', accountName: pmtCategory, debit: pmtAmount, credit: 0 },
        { id: 'p2', accountId: bankAccount.id, accountName: bankAccount.name, debit: 0, credit: pmtAmount },
      ],
      totalDebit: pmtAmount,
      totalCredit: pmtAmount,
      sourceType: 'MANUAL',
      createdBy: 'Finance Desk',
      postedAt: new Date().toISOString(),
      tags: ['PAYMENT', 'EXPENSE'],
    };

    addJournalEntry(entry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-slide">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">New Transaction</h2>
              <p className="text-xs text-slate-500">Record sales, purchases, bank receipts, or tell Vahi in plain English</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 border-b border-slate-100 flex gap-2 overflow-x-auto bg-white">
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Tell Vahi (AI)</span>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'sales'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Sales Invoice (F8)</span>
          </button>
          <button
            onClick={() => setActiveTab('purchase')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'purchase'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Purchase Bill (F9)</span>
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'receipt'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
            <span>Money In (F6)</span>
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'payment'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-rose-600" />
            <span>Money Out (F5)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ── TAB: AI Plain English ── */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">No accounting jargon required</p>
                  <p className="text-indigo-800/80">
                    Just type what happened (e.g. &ldquo;Sold 5 Dell Monitors to Nexus for 75,000 + 18% GST&rdquo; or &ldquo;Paid 35,000 office rent via bank&rdquo;). Vahi calculates tax, debits & credits, stock, and posts to ledger.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">What happened in your business?</label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Sold 4 Laptops to Sharma Enterprises for 50,000 each with 18% GST on credit..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white placeholder-slate-400"
                />
              </div>

              {/* Quick AI Presets */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setAiPrompt('Sold 3 MacBooks to Acme Corp for 3,75,000 with 18% GST')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg transition"
                >
                  ⚡ Sale: 3 MacBooks to Acme (₹3.75L)
                </button>
                <button
                  type="button"
                  onClick={() => setAiPrompt('Paid monthly office rent ₹45,000 via HDFC bank')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg transition"
                >
                  ⚡ Rent: ₹45,000 from Bank
                </button>
                <button
                  type="button"
                  onClick={() => setAiPrompt('Received ₹80,000 from ABC Traders against invoice')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg transition"
                >
                  ⚡ Receipt: ₹80,000 from ABC
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAiInterpret}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isAiLoading ? 'Analyzing & Computing Accounting Voucher...' : 'Interpret & Prepare Voucher'}
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* AI Result Proposal */}
              {aiResult && (
                <div className="mt-4 p-4 border border-indigo-200 bg-indigo-50/40 rounded-xl space-y-3 animate-fade-slide">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Deterministic Accounting Engine Validated
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      Confidence: {aiResult.run.confidence.overallScore}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{aiResult.speechSummary}</p>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                    {aiResult.run.findings.map((f: string, i: number) => (
                      <div key={i} className="text-slate-600 flex items-start gap-1.5">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  {aiResult.proposedAction && (
                    <button
                      type="button"
                      onClick={handleAiExecuteAction}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                    >
                      ✓ 1-Click Approve & Post to General Ledger
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Sales Invoice Form ── */}
          {activeTab === 'sales' && (
            <form onSubmit={handleCreateSales} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Party Name</label>
                  <input
                    type="text"
                    required
                    value={salesParty}
                    onChange={(e) => setSalesParty(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Item / Service Description</label>
                  <input
                    type="text"
                    required
                    value={salesItem}
                    onChange={(e) => setSalesItem(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={salesQty}
                    onChange={(e) => setSalesQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax Rate</label>
                  <select
                    value={salesGstRate}
                    onChange={(e) => setSalesGstRate(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard)</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="interstate"
                  checked={salesIsInterstate}
                  onChange={(e) => setSalesIsInterstate(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="interstate" className="text-xs text-slate-700 font-medium">
                  Inter-state supply (Apply IGST instead of CGST + SGST)
                </label>
              </div>

              {/* Live Calculations Preview */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono font-medium">₹{(salesQty * salesPrice).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax ({salesGstRate}%):</span>
                  <span className="font-mono font-medium">
                    ₹{Math.round(salesQty * salesPrice * (salesGstRate / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                  <span>Invoice Grand Total:</span>
                  <span className="font-mono text-indigo-600">
                    ₹{Math.round(salesQty * salesPrice * (1 + salesGstRate / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
              >
                Create Tax Invoice & Post to Ledger
              </button>
            </form>
          )}

          {/* ── TAB: Purchase Bill Form ── */}
          {activeTab === 'purchase' && (
            <form onSubmit={handleCreatePurchase} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Vendor Name</label>
                  <input
                    type="text"
                    required
                    value={purParty}
                    onChange={(e) => setPurParty(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Item / Materials</label>
                  <input
                    type="text"
                    required
                    value={purItem}
                    onChange={(e) => setPurItem(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purQty}
                    onChange={(e) => setPurQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purPrice}
                    onChange={(e) => setPurPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax Rate</label>
                  <select
                    value={purGstRate}
                    onChange={(e) => setPurGstRate(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              {/* Calculations Preview */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Purchases Subtotal:</span>
                  <span className="font-mono font-medium">₹{(purQty * purPrice).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Eligible Input Tax Credit (ITC):</span>
                  <span className="font-mono font-medium text-emerald-600">
                    + ₹{Math.round(purQty * purPrice * (purGstRate / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                  <span>Total Payable:</span>
                  <span className="font-mono text-indigo-600">
                    ₹{Math.round(purQty * purPrice * (1 + purGstRate / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
              >
                Record Purchase Bill & Add to Inventory
              </button>
            </form>
          )}

          {/* ── TAB: Money In (Receipt) Form ── */}
          {activeTab === 'receipt' && (
            <form onSubmit={handleCreateReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Payer Name</label>
                <input
                  type="text"
                  required
                  value={rcptCustomer}
                  onChange={(e) => setRcptCustomer(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Received (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rcptAmount}
                    onChange={(e) => setRcptAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deposit To Bank Account</label>
                  <select
                    value={rcptBank}
                    onChange={(e) => setRcptBank(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="acc-hdfc">HDFC Bank Current Account</option>
                    <option value="acc-icici">ICICI Bank Escrow Account</option>
                    <option value="acc-cash">Cash on Hand</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Narration / Reference</label>
                <input
                  type="text"
                  value={rcptNarration}
                  onChange={(e) => setRcptNarration(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition"
              >
                Record Receipt (Bank Dr, Customer Cr)
              </button>
            </form>
          )}

          {/* ── TAB: Money Out (Payment) Form ── */}
          {activeTab === 'payment' && (
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category / Supplier</label>
                <select
                  value={pmtCategory}
                  onChange={(e) => setPmtCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="Office Rent Expense">Office Rent Expense</option>
                  <option value="Staff Salaries Expense">Staff Salaries & Payroll</option>
                  <option value="Electricity & Utilities">Electricity & Utilities</option>
                  <option value="Cloud Hosting & Software">Cloud Hosting & SaaS</option>
                  <option value="Freight & Logistics Expense">Freight & Logistics</option>
                  <option value="Vendor Payment">Supplier / Vendor Settlement</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pmtAmount}
                    onChange={(e) => setPmtAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursing Account</label>
                  <select
                    value={pmtBank}
                    onChange={(e) => setPmtBank(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="acc-hdfc">HDFC Bank Current Account</option>
                    <option value="acc-icici">ICICI Bank Escrow Account</option>
                    <option value="acc-cash">Cash on Hand</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Narration / Remarks</label>
                <input
                  type="text"
                  value={pmtNarration}
                  onChange={(e) => setPmtNarration(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition"
              >
                Record Payment (Expense Dr, Bank Cr)
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
