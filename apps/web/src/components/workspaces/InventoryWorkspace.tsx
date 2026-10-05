'use client';

import React, { useEffect, useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { getInventoryData } from '@/lib/actions/data';

export const InventoryWorkspace: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    const res = await getInventoryData('org-1');
    if (res.success && res.data) {
      setProducts(res.data.products);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const totalValue = products.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);
  const totalUnits = products.reduce((acc, p) => acc + p.currentStock, 0);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading inventory balance...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <Boxes className="h-4 w-4" />
            <span>Multi-Warehouse Inventory & Valuation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Inventory & Stock Intelligence (DB Linked)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time atomic stock ledger, dynamic balance deduction on sales, and automatic valuation.
          </p>
        </div>

        <div className="card p-3 text-xs flex items-center space-x-4">
          <div>
            <span className="text-slate-500 block">Total Stock Valuation:</span>
            <span className="font-mono font-bold text-emerald-700 text-base">₹{totalValue.toLocaleString('en-IN')}</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-slate-500 block">Total Units on Hand:</span>
            <span className="font-mono font-bold text-slate-900 text-base">{totalUnits} Units</span>
          </div>
        </div>
      </div>

      {/* Products Stock Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">SKU Catalog & Real-Time Balances</span>
          <span className="text-xs text-slate-500 font-mono">Valuation: WEIGHTED_AVERAGE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">HSN</th>
                <th className="py-3 px-4 text-right">Purchase Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
                <th className="py-3 px-4 text-right">Stock Value</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {products.map((p) => {
                const stockVal = p.currentStock * p.purchasePrice;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{p.sku}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{p.hsn || '8471'}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">₹{p.purchasePrice.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">₹{p.sellingPrice.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{p.currentStock} {p.unit}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{stockVal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      {p.currentStock < 10 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1 w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Low Stock</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
