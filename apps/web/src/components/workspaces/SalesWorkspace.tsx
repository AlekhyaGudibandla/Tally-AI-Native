'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt, Plus, QrCode, Truck, CheckCircle2, FileText, Printer, AlertTriangle
} from 'lucide-react';
import { GSTEngine } from '@/lib/engine/gst-engine'; // Still using mock for E-Invoice logic payload gen
import { createSalesInvoiceAction } from '@/lib/actions/sales';
import { getSalesData } from '@/lib/actions/data';

export const SalesWorkspace: React.FC = () => {
  const [dbData, setDbData] = useState<{ invoices: any[]; customers: any[]; products: any[] }>({ invoices: [], customers: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isInterState, setIsInterState] = useState(false);

  const fetchDbData = async () => {
    const res = await getSalesData('org-1'); // Hardcoded demo org
    if (res.success && res.data) {
      setDbData(res.data);
      if (res.data.customers.length > 0) setCustomerId(res.data.customers[0].id);
      if (res.data.products.length > 0) setProductId(res.data.products[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDbData();
  }, []);

  const selectedProduct = dbData.products.find(p => p.id === productId);
  const selectedCustomer = dbData.customers.find(c => c.id === customerId);

  // Live calculation preview
  const unitPrice = selectedProduct?.sellingPrice || 0;
  const gstRate = selectedProduct?.gstRate || 18;
  const taxableAmount = quantity * unitPrice;
  // Fallback to mock engine if real tax engine logic is not exposed to UI (we could import it, but it's fine to calculate here for preview)
  const cgst = isInterState ? 0 : (taxableAmount * gstRate) / 200;
  const sgst = isInterState ? 0 : (taxableAmount * gstRate) / 200;
  const igst = isInterState ? (taxableAmount * gstRate) / 100 : 0;
  const grandTotal = taxableAmount + cgst + sgst + igst;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedCustomer) return;

    const invNumber = `INV-2026-${Math.floor(2400 + Math.random() * 500)}`;
    
    const res = await createSalesInvoiceAction({
      organizationId: 'org-1',
      customerId,
      invoiceNo: invNumber,
      isInterState,
      narration: `Sales to ${selectedCustomer.name}`,
      items: [{
        productId,
        quantity,
        unitPrice,
        gstRate,
      }]
    });

    if (res.success) {
      alert(`Tax Invoice #${invNumber} generated! Double entry voucher posted and Inventory stock deducted by ${quantity}.`);
      setShowCreateModal(false);
      fetchDbData();
    } else {
      alert(`Failed to create invoice: ${res.error}`);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading sales data...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <Receipt className="h-4 w-4" />
            <span>Sales & Inventory Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Tax Invoices (DB Linked)</h1>
          <p className="text-slate-500 text-sm mt-1">
            Automated double-entry ledgers, dynamic tax splitting, and live stock deduction.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm flex items-center space-x-2 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Generate Tax Invoice</span>
        </button>
      </div>

      {dbData.customers.length === 0 || dbData.products.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center space-x-3 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-bold text-sm">Master Data Required</p>
            <p className="text-xs mt-1">Please add at least one Customer and one Product in the Master Data workspace before creating an invoice.</p>
          </div>
        </div>
      ) : null}

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Posted Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supply Type</th>
                <th className="py-3 px-4">Taxable</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {dbData.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNo}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{inv.customer?.name}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      !inv.isInterState ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {!inv.isInterState ? 'Intra-State (CGST+SGST)' : 'Inter-State (IGST)'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">₹{inv.totalTaxable.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-right">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateInvoice}
            className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Generate Invoice & Deduct Stock</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-mono px-2 py-1 bg-slate-100 rounded"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Select Customer</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  >
                    {dbData.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Supply Type</label>
                  <select
                    value={isInterState ? 'inter' : 'intra'}
                    onChange={(e) => setIsInterState(e.target.value === 'inter')}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  >
                    <option value="intra">Intra-State (CGST + SGST)</option>
                    <option value="inter">Inter-State (IGST)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-600 font-medium block mb-1">Select Product</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  >
                    {dbData.products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Value ({quantity} @ ₹{unitPrice}):</span>
                  <span className="text-slate-900">₹{taxableAmount.toLocaleString('en-IN')}</span>
                </div>
                {!isInterState ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST ({(gstRate/2)}%):</span>
                      <span className="text-slate-900">₹{cgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST ({(gstRate/2)}%):</span>
                      <span className="text-slate-900">₹{sgst.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST ({gstRate}%):</span>
                    <span className="text-slate-900">₹{igst.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-700 font-bold text-sm pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={dbData.customers.length === 0 || dbData.products.length === 0}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Issue Invoice & Update Stock</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
