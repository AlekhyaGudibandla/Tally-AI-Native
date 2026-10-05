'use client';

import React, { useState } from 'react';
import { Users, Truck, Package, Plus, Search, MoreVertical } from 'lucide-react';

export default function MasterDataWorkspace() {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers' | 'products'>('customers');

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Data Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your customers, suppliers, and inventory products.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" />
          {activeTab === 'customers' ? 'Add Customer' : activeTab === 'suppliers' ? 'Add Supplier' : 'Add Product'}
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-slate-200 bg-white">
        <div className="flex gap-6">
          <TabButton 
            active={activeTab === 'customers'} 
            onClick={() => setActiveTab('customers')}
            icon={<Users className="h-4 w-4" />}
            label="Customers"
          />
          <TabButton 
            active={activeTab === 'suppliers'} 
            onClick={() => setActiveTab('suppliers')}
            icon={<Truck className="h-4 w-4" />}
            label="Suppliers"
          />
          <TabButton 
            active={activeTab === 'products'} 
            onClick={() => setActiveTab('products')}
            icon={<Package className="h-4 w-4" />}
            label="Products & Inventory"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`} 
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
               <span className="text-xs font-medium text-slate-500">Filter: All</span>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  {activeTab !== 'products' && <th className="px-6 py-3">GSTIN</th>}
                  {activeTab === 'customers' && <th className="px-6 py-3">Credit Limit</th>}
                  {activeTab === 'suppliers' && <th className="px-6 py-3">Payment Terms</th>}
                  {activeTab === 'products' && (
                    <>
                      <th className="px-6 py-3">SKU</th>
                      <th className="px-6 py-3">Purchase Price</th>
                      <th className="px-6 py-3">Selling Price</th>
                      <th className="px-6 py-3">Stock</th>
                    </>
                  )}
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Empty State for Demo */}
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-sm">No {activeTab} found in database.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-1 py-3 border-b-2 font-medium text-sm transition-colors ${
        active 
          ? 'border-indigo-600 text-indigo-600' 
          : 'border-transparent text-slate-500 hover:text-slate-800'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
