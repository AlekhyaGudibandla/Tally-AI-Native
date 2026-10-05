'use client';

import React, { useState } from 'react';
import {
  Users,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  DollarSign,
  FileText,
  Calendar,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';

interface Employee {
  id: string;
  name: string;
  role: string;
  pan: string;
  bank: string;
  gross: number;
  pf: number;
  tds: number;
  pt: number;
  net: number;
}

const calcDeductions = (gross: number): Omit<Employee, 'id' | 'name' | 'role' | 'pan' | 'bank' | 'gross' | 'net'> => {
  const pf = Math.round(Math.min(gross * 0.12, 21600)); // 12% capped at ₹21,600/mo
  const tds = gross > 83333 ? Math.round((gross - 83333) * 0.20) : 0; // simplified TDS above ₹10L
  const pt = gross > 10000 ? 200 : 0;
  return { pf, tds, pt };
};

export const PayrollWorkspace: React.FC = () => {
  const { addJournalEntry, addFeedEvent } = useLedger();

  const [employees, setEmployees] = useState<Employee[]>([
    (() => { const d = calcDeductions(220000); return { id: 'emp-01', name: 'Aarav Patel', role: 'Senior Backend Architect', pan: 'ABCPA1234A', bank: 'HDFC ****2341', gross: 220000, ...d, net: 220000 - d.pf - d.tds - d.pt }; })(),
    (() => { const d = calcDeductions(140000); return { id: 'emp-02', name: 'Neha Deshmukh', role: 'Financial Analyst', pan: 'BCDND5678B', bank: 'ICICI ****9821', gross: 140000, ...d, net: 140000 - d.pf - d.tds - d.pt }; })(),
    (() => { const d = calcDeductions(95000); return { id: 'emp-03', name: 'Vikram Joshi', role: 'Warehouse Manager', pan: 'CDEVJ9012C', bank: 'SBI ****1123', gross: 95000, ...d, net: 95000 - d.pf - d.tds - d.pt }; })(),
    (() => { const d = calcDeductions(110000); return { id: 'emp-04', name: 'Pooja Verma', role: 'Senior Accountant', pan: 'DEFPV3456D', bank: 'Axis ****7723', gross: 110000, ...d, net: 110000 - d.pf - d.tds - d.pt }; })(),
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [payrollMonth, setPayrollMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // New employee form
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPan, setNewPan] = useState('');
  const [newBank, setNewBank] = useState('');
  const [newGross, setNewGross] = useState(0);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const totalGross = employees.reduce((s, e) => s + e.gross, 0);
  const totalPF = employees.reduce((s, e) => s + e.pf, 0);
  const totalTDS = employees.reduce((s, e) => s + e.tds, 0);
  const totalPT = employees.reduce((s, e) => s + e.pt, 0);
  const totalNet = employees.reduce((s, e) => s + e.net, 0);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newGross <= 0) return;
    const d = calcDeductions(newGross);
    const emp: Employee = {
      id: `emp-${Date.now()}`,
      name: newName.trim(),
      role: newRole.trim() || 'Staff',
      pan: newPan.trim().toUpperCase() || 'PENDING',
      bank: newBank.trim() || 'Pending',
      gross: newGross,
      ...d,
      net: newGross - d.pf - d.tds - d.pt,
    };
    setEmployees((prev) => [...prev, emp]);
    showToast(`Employee "${emp.name}" added to payroll`, true);
    setNewName(''); setNewRole(''); setNewPan(''); setNewBank(''); setNewGross(0);
    setShowAddModal(false);
  };

  const handleRemoveEmployee = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    showToast(`${emp?.name} removed from payroll`, false);
  };

  const handleProcessPayroll = () => {
    if (employees.length === 0) {
      showToast('No employees to process.', false);
      return;
    }
    const monthLabel = new Date(payrollMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });

    const lines = [
      { id: `pay-dr-${Date.now()}`, accountId: 'acc-salaries', accountName: 'Salaries & Staff Welfare', debit: totalGross, credit: 0 },
      { id: `pay-cr-bank-${Date.now()}`, accountId: 'acc-hdfc', accountName: 'HDFC Current Account (Net Direct Credit)', debit: 0, credit: totalNet },
      { id: `pay-cr-pf-${Date.now()}`, accountId: 'acc-ap', accountName: 'EPFO Statutory PF Payable', debit: 0, credit: totalPF },
      { id: `pay-cr-tds-${Date.now()}`, accountId: 'acc-tds', accountName: 'TDS Payable u/s 192', debit: 0, credit: totalTDS },
      { id: `pay-cr-pt-${Date.now()}`, accountId: 'acc-ap', accountName: 'Professional Tax Payable', debit: 0, credit: totalPT },
    ];

    const result = addJournalEntry({
      id: `trx-pay-${Date.now()}`,
      entryNumber: `PAY-${payrollMonth}`,
      voucherType: 'PAYMENT',
      entryDate: payrollMonth + '-28',
      status: 'POSTED',
      narration: `Monthly payroll ${monthLabel} — ${employees.length} employees`,
      lines,
      totalDebit: totalGross,
      totalCredit: totalGross,
      sourceType: 'SYSTEM',
      createdBy: 'Payroll Engine',
      approvedBy: 'CFO',
      postedAt: new Date().toISOString(),
      tags: ['PAYROLL', 'STATUTORY'],
    });

    if (result.success) {
      addFeedEvent({
        id: `feed-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'APPROVAL_REQ',
        title: `Payroll ${monthLabel} Posted`,
        summary: `₹${totalGross.toLocaleString('en-IN')} salary voucher posted · Net ₹${totalNet.toLocaleString('en-IN')} cleared to bank`,
        severity: 'SUCCESS',
        status: 'AUTO_RESOLVED',
        amount: totalGross,
      });
      showToast(`Payroll voucher PAY-${payrollMonth} posted successfully!`, true);
    } else {
      showToast(result.error || 'Failed to post payroll', false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xs border shadow-lg text-xs font-semibold ${toast.ok ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#005a9e] text-[11px] font-bold uppercase tracking-wider">
            <Users className="h-3.5 w-3.5" />
            <span>Statutory Payroll & Staff Records</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 mt-0.5">Payroll & Deductions</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Auto-calculates PF (12%), TDS (u/s 192), Professional Tax · Posts to General Ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 border border-[#b0c4de] rounded-xs px-2 py-1.5 bg-white text-xs">
            <Calendar className="h-3.5 w-3.5 text-[#005a9e]" />
            <input
              type="month"
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(e.target.value)}
              className="focus:outline-none text-xs bg-transparent text-slate-800 font-semibold"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-[#b0c4de] text-slate-700 text-xs font-bold rounded-xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Employee
          </button>
          <button
            onClick={handleProcessPayroll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005a9e] hover:bg-[#00477d] text-white text-xs font-bold rounded-xs transition"
          >
            <FileText className="h-3.5 w-3.5" />
            Post Payroll Voucher
          </button>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Gross Payroll', value: totalGross, color: 'text-slate-900', sub: `${employees.length} employees` },
          { label: 'Net Disbursable', value: totalNet, color: 'text-emerald-700', sub: 'Direct bank credit' },
          { label: 'PF (EPFO) Payable', value: totalPF, color: 'text-sky-700', sub: 'Due 15th of next month' },
          { label: 'TDS Withheld (192)', value: totalTDS, color: 'text-amber-700', sub: 'Form 24Q quarterly' },
        ].map((k) => (
          <div key={k.label} className="border border-[#c2d4e5] rounded-xs bg-white p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{k.label}</p>
            <p className={`text-xl font-black font-mono mt-1 ${k.color}`}>₹{k.value.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Employee Roster Table */}
      <div className="border border-[#c2d4e5] rounded-xs overflow-hidden">
        <div className="bg-[#e8f0f8] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#005a9e] border-b border-[#c2d4e5] flex items-center justify-between">
          <span>Employee Salary Structures</span>
          <span className="font-mono text-[#005a9e]">{new Date(payrollMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        </div>
        {employees.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No employees added yet. Click "Add Employee" to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#f4f8fc] border-b border-[#c2d4e5]">
                <tr>
                  <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Designation</th>
                  <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">PAN / Bank</th>
                  <th className="py-2 px-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gross Salary</th>
                  <th className="py-2 px-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">PF (12%)</th>
                  <th className="py-2 px-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">TDS (192)</th>
                  <th className="py-2 px-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">PT</th>
                  <th className="py-2 px-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Payable</th>
                  <th className="py-2 px-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8f0f8]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#f7fafd] transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{emp.name}</td>
                    <td className="py-2.5 px-4 text-slate-600">{emp.role}</td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] font-mono">{emp.pan}<br />{emp.bank}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-700">₹{emp.gross.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-sky-700">−₹{emp.pf.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-amber-700">−₹{emp.tds.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-500">−₹{emp.pt}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">₹{emp.net.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => alert(`Payslip for ${emp.name}\nGross: ₹${emp.gross.toLocaleString('en-IN')}\nPF: ₹${emp.pf.toLocaleString('en-IN')}\nTDS: ₹${emp.tds.toLocaleString('en-IN')}\nPT: ₹${emp.pt}\nNet: ₹${emp.net.toLocaleString('en-IN')}`)}
                          className="px-2 py-1 bg-white hover:bg-[#e8f0f8] border border-[#b0c4de] text-slate-700 rounded-xs text-[10px] font-bold transition"
                        >
                          Payslip
                        </button>
                        <button
                          onClick={() => handleRemoveEmployee(emp.id)}
                          className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xs transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals row */}
              <tfoot className="bg-[#e8f0f8] border-t border-[#b0c4de]">
                <tr>
                  <td colSpan={3} className="py-2.5 px-4 text-xs font-black text-slate-700 uppercase tracking-wider">Total ({employees.length} Employees)</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">₹{totalGross.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-sky-700">₹{totalPF.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-amber-700">₹{totalTDS.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-slate-500">₹{totalPT.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">₹{totalNet.toLocaleString('en-IN')}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#b0c4de] rounded-xs shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-3 bg-[#005a9e] text-white rounded-t-xs">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-extrabold text-sm">Add New Employee</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/20 rounded-xs">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Full Name *</label>
                  <input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Ravi Kapoor" className="w-full border border-[#b0c4de] rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-[#005a9e] bg-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Designation</label>
                  <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g. Senior Developer" className="w-full border border-[#b0c4de] rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-[#005a9e] bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">PAN Number</label>
                  <input value={newPan} onChange={(e) => setNewPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} className="w-full border border-[#b0c4de] rounded-xs px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#005a9e] bg-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Bank Account</label>
                  <input value={newBank} onChange={(e) => setNewBank(e.target.value)} placeholder="HDFC ****1234" className="w-full border border-[#b0c4de] rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-[#005a9e] bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Gross Monthly Salary (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newGross || ''}
                  onChange={(e) => setNewGross(Number(e.target.value))}
                  placeholder="e.g. 75000"
                  className="w-full border border-[#b0c4de] rounded-xs px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#005a9e] bg-white"
                />
                {newGross > 0 && (() => {
                  const d = calcDeductions(newGross);
                  return (
                    <p className="text-[10px] text-slate-500 mt-1">
                      PF: ₹{d.pf.toLocaleString('en-IN')} | TDS: ₹{d.tds.toLocaleString('en-IN')} | PT: ₹{d.pt} → Net: ₹{(newGross - d.pf - d.tds - d.pt).toLocaleString('en-IN')}
                    </p>
                  );
                })()}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#c2d4e5]">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xs border border-slate-200 transition font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#005a9e] hover:bg-[#00477d] text-white text-xs font-bold rounded-xs transition">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
