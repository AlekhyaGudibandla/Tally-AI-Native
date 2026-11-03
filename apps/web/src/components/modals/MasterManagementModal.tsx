'use client';

import React, { useState } from 'react';
import {
  Building2,
  BookPlus,
  PackagePlus,
  Download,
  Upload,
  RotateCcw,
  X,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { AccountType, AccountSubType } from '@/lib/types';

interface MasterManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterManagementModal: React.FC<MasterManagementModalProps> = ({ isOpen, onClose }) => {
  const {
    org,
    addAccount,
    addProduct,
    setOrgDetails,
    exportBackupJSON,
    importBackupJSON,
    resetToDefaultData,
    resetToEmptySlate,
  } = useLedger();

  const [activeTab, setActiveTab] = useState<'COMPANY' | 'CREATE_LEDGER' | 'CREATE_PRODUCT' | 'BACKUP'>('CREATE_LEDGER');

  // Company Form state
  const [compName, setCompName] = useState(org.name);
  const [compLegal, setCompLegal] = useState(org.legalName);
  const [compGstin, setCompGstin] = useState(org.gstin);
  const [compPan, setCompPan] = useState(org.pan);
  const [compState, setCompState] = useState(org.stateName);

  // New Ledger state
  const [ledgerCode, setLedgerCode] = useState('');
  const [ledgerName, setLedgerName] = useState('');
  const [ledgerType, setLedgerType] = useState<AccountType>('EXPENSE');
  const [ledgerSubType, setLedgerSubType] = useState<AccountSubType>('INDIRECT_EXPENSE');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // New Stock Item state
  const [sku, setSku] = useState('');
  const [prodName, setProdName] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [hsnCode, setHsnCode] = useState('8471');
  const [gstRate, setGstRate] = useState<number>(18);
  const [unit, setUnit] = useState('NOS');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [totalStock, setTotalStock] = useState<number>(0);

  if (!isOpen) return null;

  const handleUpdateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setOrgDetails({
      ...org,
      name: compName,
      legalName: compLegal,
      gstin: compGstin,
      pan: compPan,
      stateName: compState,
    });
    alert('Company Profile successfully updated!');
  };

  const handleCreateLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerCode || !ledgerName) {
      alert('Please fill in Account Code and Ledger Name.');
      return;
    }
    const res = addAccount({
      code: ledgerCode,
      name: ledgerName,
      type: ledgerType,
      subType: ledgerSubType,
      balance: openingBalance,
      currency: 'INR',
      isActive: true,
      isSystem: false,
    });
    if (res.success) {
      alert(`Ledger "${ledgerName}" successfully created!`);
      setLedgerCode('');
      setLedgerName('');
      setOpeningBalance(0);
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !prodName) {
      alert('Please fill in SKU and Stock Item Name.');
      return;
    }
    const res = addProduct({
      sku,
      name: prodName,
      category,
      hsnCode,
      defaultGstRate: gstRate,
      unit,
      purchasePrice,
      sellingPrice,
      totalStock,
      reorderLevel: 5,
      valuationMethod: 'WEIGHTED_AVERAGE',
      warehouseBalances: [
        { warehouseId: 'wh-mumbai', warehouseName: 'Mumbai Central Depot', quantity: totalStock },
      ],
      daysSinceLastSold: 0,
      isSlowMoving: false,
    });
    if (res.success) {
      alert(`Stock Item "${prodName}" successfully created!`);
      setSku('');
      setProdName('');
      setPurchasePrice(0);
      setSellingPrice(0);
      setTotalStock(0);
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importBackupJSON(content);
        if (res.success) {
          alert('Company data backup successfully imported and restored!');
          onClose();
        } else {
          alert(`Backup Import Failed: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#b0c4de] rounded-lg max-w-3xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#005a9e] text-white">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-[#ffbe00]" />
            <h2 className="font-bold text-base">Company Masters & Data Setup (Alt+C)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-blue-100 hover:text-white rounded hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-[#f0f4f8] px-4 pt-2 border-b border-slate-200 space-x-1">
          <button
            onClick={() => setActiveTab('CREATE_LEDGER')}
            className={`px-4 py-2 text-xs font-bold rounded-t border-t border-x transition flex items-center space-x-1.5 ${
              activeTab === 'CREATE_LEDGER'
                ? 'bg-white text-[#005a9e] border-slate-300 border-b-white'
                : 'text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <BookPlus className="h-3.5 w-3.5" />
            <span>Create Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('CREATE_PRODUCT')}
            className={`px-4 py-2 text-xs font-bold rounded-t border-t border-x transition flex items-center space-x-1.5 ${
              activeTab === 'CREATE_PRODUCT'
                ? 'bg-white text-[#005a9e] border-slate-300 border-b-white'
                : 'text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <PackagePlus className="h-3.5 w-3.5" />
            <span>Create Stock Item</span>
          </button>

          <button
            onClick={() => setActiveTab('COMPANY')}
            className={`px-4 py-2 text-xs font-bold rounded-t border-t border-x transition flex items-center space-x-1.5 ${
              activeTab === 'COMPANY'
                ? 'bg-white text-[#005a9e] border-slate-300 border-b-white'
                : 'text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Company Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('BACKUP')}
            className={`px-4 py-2 text-xs font-bold rounded-t border-t border-x transition flex items-center space-x-1.5 ${
              activeTab === 'BACKUP'
                ? 'bg-white text-[#005a9e] border-slate-300 border-b-white'
                : 'text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Data Backup & Reset</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-800">
          {/* TAB 1: CREATE LEDGER */}
          {activeTab === 'CREATE_LEDGER' && (
            <form onSubmit={handleCreateLedger} className="space-y-4">
              <div className="bg-indigo-50/60 p-3 rounded border border-indigo-100 text-indigo-900 text-xs">
                Create new account ledgers (Customers, Vendors, Bank Accounts, Expenses, Duties & Taxes, Income).
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ledger Code / Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5109 or VEND-901"
                    value={ledgerCode}
                    onChange={(e) => setLedgerCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ledger Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Travel & Conveyance Expenses"
                    value={ledgerName}
                    onChange={(e) => setLedgerName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Primary Account Group *</label>
                  <select
                    value={ledgerType}
                    onChange={(e) => {
                      const t = e.target.value as AccountType;
                      setLedgerType(t);
                      if (t === 'ASSET') setLedgerSubType('BANK');
                      else if (t === 'LIABILITY') setLedgerSubType('ACCOUNTS_PAYABLE');
                      else if (t === 'INCOME') setLedgerSubType('DIRECT_INCOME');
                      else setLedgerSubType('INDIRECT_EXPENSE');
                    }}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900"
                  >
                    <option value="ASSET">ASSET (Cash, Bank, Debtors, Inventory)</option>
                    <option value="LIABILITY">LIABILITY (Creditors, Taxes Payable)</option>
                    <option value="EQUITY">EQUITY (Share Capital, Reserves)</option>
                    <option value="INCOME">INCOME (Sales, Direct Revenue)</option>
                    <option value="EXPENSE">EXPENSE (Direct / Indirect Expenses)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sub-Group Classification</label>
                  <select
                    value={ledgerSubType}
                    onChange={(e) => setLedgerSubType(e.target.value as AccountSubType)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900"
                  >
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK">Bank Accounts</option>
                    <option value="ACCOUNTS_RECEIVABLE">Accounts Receivable (Sundry Debtors)</option>
                    <option value="ACCOUNTS_PAYABLE">Accounts Payable (Sundry Creditors)</option>
                    <option value="DUTIES_AND_TAXES">Duties & Taxes (CGST/SGST/IGST/TDS)</option>
                    <option value="DIRECT_EXPENSE">Direct Expenses / COGS</option>
                    <option value="INDIRECT_EXPENSE">Indirect Expenses</option>
                    <option value="DIRECT_INCOME">Direct Income / Sales</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005a9e] hover:bg-[#00477d] text-white font-bold rounded shadow-sm flex items-center space-x-1.5"
                >
                  <BookPlus className="h-4 w-4" />
                  <span>Save Ledger Master</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CREATE PRODUCT */}
          {activeTab === 'CREATE_PRODUCT' && (
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="bg-sky-50 p-3 rounded border border-sky-100 text-sky-900 text-xs">
                Add stock items to your inventory catalog with HSN codes, default GST rates, and purchase/selling prices.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU / Item Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LAP-DELL-I7"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Item Description / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell XPS 15 Workstation Laptop"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST Rate (%)</label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard)</option>
                    <option value={28}>28%</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit of Measure</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900"
                  >
                    <option value="NOS">NOS (Numbers)</option>
                    <option value="KGS">KGS (Kilograms)</option>
                    <option value="BOX">BOX (Boxes)</option>
                    <option value="MTR">MTR (Meters)</option>
                    <option value="SET">SET (Sets)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Initial Opening Quantity</label>
                  <input
                    type="number"
                    value={totalStock}
                    onChange={(e) => setTotalStock(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005a9e] hover:bg-[#00477d] text-white font-bold rounded shadow-sm flex items-center space-x-1.5"
                >
                  <PackagePlus className="h-4 w-4" />
                  <span>Save Stock Item</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: COMPANY PROFILE */}
          {activeTab === 'COMPANY' && (
            <form onSubmit={handleUpdateCompany} className="space-y-4">
              <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-900 text-xs">
                Configure your active business profile, registered GSTIN, PAN, state code, and legal entity details.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display Company Name *</label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Legal Company Name *</label>
                  <input
                    type="text"
                    required
                    value={compLegal}
                    onChange={(e) => setCompLegal(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTIN (15 Digits) *</label>
                  <input
                    type="text"
                    required
                    value={compGstin}
                    onChange={(e) => setCompGstin(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">PAN Number *</label>
                  <input
                    type="text"
                    required
                    value={compPan}
                    onChange={(e) => setCompPan(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono uppercase"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Registered State</label>
                  <input
                    type="text"
                    value={compState}
                    onChange={(e) => setCompState(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005a9e] hover:bg-[#00477d] text-white font-bold rounded shadow-sm flex items-center space-x-1.5"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Update Company Profile</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: BACKUP & RESET */}
          {activeTab === 'BACKUP' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Download className="h-4 w-4 text-[#005a9e]" />
                  <span>Export JSON Company Backup</span>
                </h3>
                <p className="text-slate-600">
                  Export all chart of accounts, vouchers, invoices, inventory items, bank statement reconciliations, and audit logs into a single JSON file.
                </p>
                <button
                  onClick={exportBackupJSON}
                  className="px-4 py-2 bg-[#005a9e] hover:bg-[#00477d] text-white font-bold rounded shadow-sm flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Complete Backup (.JSON)</span>
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Upload className="h-4 w-4 text-emerald-700" />
                  <span>Restore JSON Company Backup</span>
                </h3>
                <p className="text-slate-600">
                  Select a previously exported Ledger AI JSON backup file to restore all company vouchers and ledgers.
                </p>
                <label className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded shadow-sm cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Select JSON File & Restore</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="bg-red-50 p-4 rounded border border-red-200 space-y-3">
                <h3 className="font-bold text-red-900 text-sm flex items-center space-x-1.5">
                  <RotateCcw className="h-4 w-4 text-red-700" />
                  <span>Reset Options</span>
                </h3>
                <p className="text-red-700">
                  Reset local storage state. You can reload standard Indian enterprise sample data or start with a clean empty slate for your real business.
                </p>
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    onClick={() => {
                      if (confirm('Reset to standard Indian Enterprise sample data?')) {
                        resetToDefaultData();
                        alert('Reset to sample data completed.');
                        onClose();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold rounded hover:bg-slate-50"
                  >
                    Load Sample Data
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all data and start with an empty slate for your real business?')) {
                        resetToEmptySlate();
                        alert('Reset to empty slate completed.');
                        onClose();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-red-600 text-white font-bold rounded hover:bg-red-700 shadow-sm"
                  >
                    Clear All Data (Clean Slate)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
