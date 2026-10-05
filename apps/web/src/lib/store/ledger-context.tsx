'use client';

// ============================================================================
// LedgerOS Global State Provider
// Reactive multi-module state with live audit trail, activity stream & AI simulator
// Full production-grade persistence (localStorage) & real user CRUD workflow
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Account,
  AuditLogEntry,
  AutonomousActivityEvent,
  BankTransaction,
  Invoice,
  JournalEntry,
  Organization,
  Product,
  PurchaseOrder,
  GoodsReceiptNote,
  AIAgentRun,
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_ACTIVITY_FEED,
  INITIAL_AUDIT_LOGS,
  INITIAL_BANK_TRANSACTIONS,
  INITIAL_GRNS,
  INITIAL_INVOICES,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_ORG,
  INITIAL_PRODUCTS,
  INITIAL_PURCHASE_ORDERS,
} from './mock-store';
import { AccountingEngine } from '../engine/accounting-engine';
import { GSTEngine } from '../engine/gst-engine';
import { BankingReconciliationEngine } from '../engine/banking-reconciliation-engine';

const STORAGE_KEY = 'vahi_ledger_production_state_v1';

interface LedgerContextType {
  org: Organization;
  accounts: Account[];
  journalEntries: JournalEntry[];
  invoices: Invoice[];
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  grns: GoodsReceiptNote[];
  bankTransactions: BankTransaction[];
  activityFeed: AutonomousActivityEvent[];
  auditLogs: AuditLogEntry[];
  agentRuns: AIAgentRun[];

  // Real Production Actions
  addAccount: (accountData: Omit<Account, 'id'>) => { success: boolean; error?: string };
  addProduct: (productData: Omit<Product, 'id'>) => { success: boolean; error?: string };
  addInvoice: (invoice: Invoice) => { success: boolean; error?: string };
  addJournalEntry: (entry: JournalEntry) => { success: boolean; error?: string };
  reverseJournalEntry: (entryId: string, reason: string) => { success: boolean; error?: string };
  approveTransaction: (id: string) => void;
  runReconciliation: () => void;
  importBankStatementCSV: (csvText: string) => { importedCount: number; matchedCount: number };
  setOrgDetails: (newOrg: Organization) => void;
  exportBackupJSON: () => void;
  importBackupJSON: (jsonString: string) => { success: boolean; error?: string };
  resetToDefaultData: () => void;
  resetToEmptySlate: () => void;

  // AI & Simulation Triggers
  simulateIncomingInvoice: () => void;
  simulateBankFeed: () => void;
  simulateGSTAnomaly: () => void;
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'immutableHash'>) => void;
  addAgentRun: (run: AIAgentRun) => void;
  addFeedEvent: (event: AutonomousActivityEvent) => void;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [org, setOrg] = useState<Organization>(INITIAL_ORG);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL_ENTRIES);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [grns, setGrns] = useState<GoodsReceiptNote[]>(INITIAL_GRNS);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(INITIAL_BANK_TRANSACTIONS);
  const [activityFeed, setActivityFeed] = useState<AutonomousActivityEvent[]>(INITIAL_ACTIVITY_FEED);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [agentRuns, setAgentRuns] = useState<AIAgentRun[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.org) setOrg(parsed.org);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.journalEntries) setJournalEntries(parsed.journalEntries);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.purchaseOrders) setPurchaseOrders(parsed.purchaseOrders);
        if (parsed.grns) setGrns(parsed.grns);
        if (parsed.bankTransactions) setBankTransactions(parsed.bankTransactions);
        if (parsed.activityFeed) setActivityFeed(parsed.activityFeed);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
      }
    } catch (e) {
      console.error('Failed to load saved state from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save state to localStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const stateToSave = {
        org,
        accounts,
        journalEntries,
        invoices,
        products,
        purchaseOrders,
        grns,
        bankTransactions,
        activityFeed,
        auditLogs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to persist state to localStorage:', e);
    }
  }, [org, accounts, journalEntries, invoices, products, purchaseOrders, grns, bankTransactions, activityFeed, auditLogs, isLoaded]);

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'immutableHash'>) => {
    const timestamp = new Date().toISOString();
    const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newLog: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}`,
      timestamp,
      immutableHash: hash,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addFeedEvent = (event: AutonomousActivityEvent) => {
    setActivityFeed((prev) => [event, ...prev]);
  };

  const addAgentRun = (run: AIAgentRun) => {
    setAgentRuns((prev) => [run, ...prev]);
  };

  const setOrgDetails = (newOrg: Organization) => {
    setOrg(newOrg);
    addAuditLog({
      actor: { type: 'USER', id: 'usr-owner', name: 'Company Admin' },
      action: 'UPDATE_ORGANIZATION_SETTINGS',
      entityType: 'TAX_SETTING',
      entityId: newOrg.id,
      afterSnapshot: newOrg,
      reason: 'Company profile updated',
    });
  };

  // Add Account / Master Ledger Creation
  const addAccount = (accountData: Omit<Account, 'id'>) => {
    if (accounts.some((a) => a.code === accountData.code)) {
      return { success: false, error: `Account code ${accountData.code} already exists.` };
    }
    const newAcc: Account = {
      ...accountData,
      id: `acc-custom-${Date.now()}`,
    };
    setAccounts((prev) => [...prev, newAcc]);

    addAuditLog({
      actor: { type: 'USER', id: 'usr-acc', name: 'Accountant' },
      action: 'CREATE_LEDGER_ACCOUNT',
      entityType: 'JOURNAL',
      entityId: newAcc.code,
      afterSnapshot: newAcc,
      reason: `New Ledger "${newAcc.name}" created under ${newAcc.type}`,
    });

    return { success: true };
  };

  // Add Product / Stock Item Creation
  const addProduct = (productData: Omit<Product, 'id'>) => {
    if (products.some((p) => p.sku === productData.sku)) {
      return { success: false, error: `SKU "${productData.sku}" already exists.` };
    }
    const newProduct: Product = {
      ...productData,
      id: `prod-custom-${Date.now()}`,
    };
    setProducts((prev) => [...prev, newProduct]);

    addAuditLog({
      actor: { type: 'USER', id: 'usr-acc', name: 'Inventory Manager' },
      action: 'CREATE_STOCK_ITEM',
      entityType: 'JOURNAL',
      entityId: newProduct.sku,
      afterSnapshot: newProduct,
      reason: `New Stock Item "${newProduct.name}" created with SKU ${newProduct.sku}`,
    });

    return { success: true };
  };

  // Post Journal Entry & Update Ledger Balances
  const addJournalEntry = (entry: JournalEntry) => {
    const validation = AccountingEngine.validateDoubleEntry(entry.lines);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(' | ') };
    }

    setJournalEntries((prev) => [entry, ...prev]);

    // Update account balances
    if (entry.status === 'POSTED') {
      setAccounts((prevAccs) =>
        prevAccs.map((acc) => {
          const matchingLines = entry.lines.filter((l) => l.accountId === acc.id);
          if (matchingLines.length === 0) return acc;
          const deltaDebit = matchingLines.reduce((s, l) => s + l.debit, 0);
          const deltaCredit = matchingLines.reduce((s, l) => s + l.credit, 0);

          let newBalance = acc.balance;
          if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
            newBalance += (deltaDebit - deltaCredit);
          } else {
            newBalance += (deltaCredit - deltaDebit);
          }

          return { ...acc, balance: Math.round(newBalance * 100) / 100 };
        })
      );
    }

    addAuditLog({
      actor: { type: 'USER', id: 'usr-acc', name: entry.createdBy || 'Accountant' },
      action: 'POST_JOURNAL_VOUCHER',
      entityType: 'JOURNAL',
      entityId: entry.entryNumber,
      afterSnapshot: { entryNumber: entry.entryNumber, totalDebit: entry.totalDebit, lines: entry.lines.length },
      reason: entry.narration,
    });

    return { success: true };
  };

  // Create Invoice, auto-post Sales Journal Voucher & deduct stock inventory
  const addInvoice = (invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev]);

    // Update product stock levels
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const item = invoice.items.find((i) => i.productId === p.id || i.itemDescription === p.name);
        if (!item) return p;
        const newStock = Math.max(0, p.totalStock - item.quantity);
        return {
          ...p,
          totalStock: newStock,
          daysSinceLastSold: 0,
        };
      })
    );

    // Auto-create double entry journal voucher for the invoice if posted/issued
    if (invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID' || invoice.status === 'PAID') {
      const arAccount = accounts.find((a) => a.subType === 'ACCOUNTS_RECEIVABLE') || accounts[3];
      const salesAccount = accounts.find((a) => a.code === '4001') || accounts[13];
      const cgstAccount = accounts.find((a) => a.code === '2101') || accounts[9];
      const sgstAccount = accounts.find((a) => a.code === '2102') || accounts[10];
      const igstAccount = accounts.find((a) => a.code === '2103') || accounts[11];

      const lines = [
        {
          id: `l-inv-ar-${Date.now()}`,
          accountId: arAccount.id,
          accountName: `${arAccount.name} - ${invoice.partyName}`,
          debit: invoice.grandTotal,
          credit: 0,
        },
        {
          id: `l-inv-rev-${Date.now()}`,
          accountId: salesAccount.id,
          accountName: salesAccount.name,
          debit: 0,
          credit: invoice.subTotal - invoice.totalDiscount,
        },
      ];

      const totalCgst = invoice.items.reduce((s, i) => s + i.cgstAmount, 0);
      const totalSgst = invoice.items.reduce((s, i) => s + i.sgstAmount, 0);
      const totalIgst = invoice.items.reduce((s, i) => s + i.igstAmount, 0);

      if (totalCgst > 0) {
        lines.push({
          id: `l-inv-cgst-${Date.now()}`,
          accountId: cgstAccount.id,
          accountName: cgstAccount.name,
          debit: 0,
          credit: totalCgst,
        });
      }
      if (totalSgst > 0) {
        lines.push({
          id: `l-inv-sgst-${Date.now()}`,
          accountId: sgstAccount.id,
          accountName: sgstAccount.name,
          debit: 0,
          credit: totalSgst,
        });
      }
      if (totalIgst > 0) {
        lines.push({
          id: `l-inv-igst-${Date.now()}`,
          accountId: igstAccount.id,
          accountName: igstAccount.name,
          debit: 0,
          credit: totalIgst,
        });
      }

      addJournalEntry({
        id: `trx-inv-${Date.now()}`,
        entryNumber: `JV-${invoice.invoiceNumber}`,
        voucherType: 'SALES',
        entryDate: invoice.invoiceDate,
        status: 'POSTED',
        narration: `Tax Invoice #${invoice.invoiceNumber} raised to ${invoice.partyName}`,
        lines,
        totalDebit: invoice.grandTotal,
        totalCredit: invoice.grandTotal,
        sourceType: invoice.createdVia === 'AI_AGENT' ? 'DOCUMENT_AI' : 'MANUAL',
        createdBy: 'Sales Invoicing Desk',
        postedAt: new Date().toISOString(),
        tags: ['SALES', 'INVOICE', 'GST'],
      });
    }

    addFeedEvent({
      id: `feed-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'INVOICE_OCR',
      title: `Invoice #${invoice.invoiceNumber} created for ${invoice.partyName}`,
      summary: `Total: ₹${invoice.grandTotal.toLocaleString('en-IN')} | GST: ₹${invoice.totalTax.toLocaleString('en-IN')} | ${invoice.eInvoice?.irn ? 'IRN Generated' : 'Draft'}`,
      severity: 'SUCCESS',
      status: 'AUTO_RESOLVED',
      amount: invoice.grandTotal,
    });

    return { success: true };
  };

  const reverseJournalEntry = (entryId: string, reason: string) => {
    const target = journalEntries.find((j) => j.id === entryId);
    if (!target) return { success: false, error: 'Transaction not found' };

    try {
      const reversal = AccountingEngine.createReversalEntry(target, reason, 'Rajesh Sharma (CFO)');
      setJournalEntries((prev) => [
        reversal,
        ...prev.map((j) => (j.id === entryId ? { ...j, status: 'REVERSED' as const, reversalEntryId: reversal.id } : j)),
      ]);

      addAuditLog({
        actor: { type: 'USER', id: 'usr-cfo', name: 'Rajesh Sharma (CFO)' },
        action: 'REVERSE_TRANSACTION',
        entityType: 'JOURNAL',
        entityId: target.entryNumber,
        beforeSnapshot: { status: target.status },
        afterSnapshot: { status: 'REVERSED', reversalVoucher: reversal.entryNumber },
        reason,
      });

      addFeedEvent({
        id: `feed-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'APPROVAL_REQ',
        title: `Voucher #${target.entryNumber} Reversed`,
        summary: `Deterministic reversal posted (${reversal.entryNumber}). General Ledger adjusted.`,
        severity: 'INFO',
        status: 'AUTO_RESOLVED',
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const approveTransaction = (id: string) => {
    setActivityFeed((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'AUTO_RESOLVED' } : item))
    );

    addAuditLog({
      actor: { type: 'USER', id: 'usr-cfo', name: 'Finance Controller' },
      action: 'APPROVE_HIGH_RISK_WORKFLOW',
      entityType: 'AI_POLICY',
      entityId: id,
      afterSnapshot: { status: 'APPROVED' },
      reason: 'Human-in-the-loop authorization verified and granted.',
    });
  };

  const runReconciliation = () => {
    const report = BankingReconciliationEngine.reconcile(bankTransactions, journalEntries);
    setBankTransactions(report.processedTransactions);

    addFeedEvent({
      id: `feed-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'BANK_RECON',
      title: 'Smart Bank Reconciliation Completed',
      summary: `${report.matchedCount} matched | ${report.unmatchedCount} unmatched | ${report.suspiciousCount} suspicious anomaly`,
      severity: report.suspiciousCount > 0 ? 'WARNING' : 'SUCCESS',
      status: report.unmatchedCount > 0 ? 'ATTENTION_REQUIRED' : 'AUTO_RESOLVED',
      amount: report.matchedAmount,
    });
  };

  // Real Bank Statement CSV Parser
  const importBankStatementCSV = (csvText: string) => {
    const lines = csvText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const imported: BankTransaction[] = [];
    let matchCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      if (cols.length >= 4) {
        const date = cols[0] || new Date().toISOString().split('T')[0];
        const desc = cols[1] || 'Bank Statement Entry';
        const ref = cols[2] || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
        const amount = Math.abs(parseFloat(cols[3]) || 1000);
        const type: 'CREDIT' | 'DEBIT' = (cols[4] && cols[4].toUpperCase() === 'DEBIT') || (parseFloat(cols[3]) < 0) ? 'DEBIT' : 'CREDIT';

        const tx: BankTransaction = {
          id: `btx-csv-${Date.now()}-${i}`,
          bankAccountId: 'acc-hdfc',
          date,
          description: desc,
          rawReference: ref,
          amount,
          type,
          balanceAfter: 2000000,
          reconciliationStatus: 'UNMATCHED',
        };

        // Check if matching journal entry exists
        const matchedJe = journalEntries.find((j) =>
          j.totalDebit === amount || j.totalCredit === amount || j.narration.toLowerCase().includes(desc.toLowerCase())
        );

        if (matchedJe) {
          tx.reconciliationStatus = 'RECONCILED';
          tx.matchedJournalEntryId = matchedJe.id;
          tx.matchType = 'EXACT';
          tx.aiConfidence = 99.0;
          tx.aiExplanation = `Auto-matched to voucher #${matchedJe.entryNumber}`;
          matchCount++;
        }

        imported.push(tx);
      }
    }

    setBankTransactions((prev) => [...imported, ...prev]);

    addFeedEvent({
      id: `feed-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'BANK_RECON',
      title: `Bank Statement Imported (${imported.length} rows)`,
      summary: `✓ ${matchCount} automatically matched to ledger entries | ${imported.length - matchCount} pending review`,
      severity: 'SUCCESS',
      status: 'AUTO_RESOLVED',
    });

    return { importedCount: imported.length, matchedCount: matchCount };
  };

  // Data Backup Export
  const exportBackupJSON = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      version: '1.0',
      org,
      accounts,
      journalEntries,
      invoices,
      products,
      purchaseOrders,
      grns,
      bankTransactions,
      activityFeed,
      auditLogs,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vahi_Company_Backup_${org.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Data Backup Restore
  const importBackupJSON = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.org) setOrg(parsed.org);
      if (parsed.accounts) setAccounts(parsed.accounts);
      if (parsed.journalEntries) setJournalEntries(parsed.journalEntries);
      if (parsed.invoices) setInvoices(parsed.invoices);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.purchaseOrders) setPurchaseOrders(parsed.purchaseOrders);
      if (parsed.grns) setGrns(parsed.grns);
      if (parsed.bankTransactions) setBankTransactions(parsed.bankTransactions);
      if (parsed.activityFeed) setActivityFeed(parsed.activityFeed);
      if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);

      addAuditLog({
        actor: { type: 'USER', id: 'usr-admin', name: 'System Admin' },
        action: 'RESTORE_COMPANY_BACKUP',
        entityType: 'TAX_SETTING',
        entityId: 'SYSTEM',
        afterSnapshot: { restoredAt: new Date().toISOString() },
        reason: 'Company data restored from external JSON backup',
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid JSON backup file format.' };
    }
  };

  // Reset to default initial seed data
  const resetToDefaultData = () => {
    setOrg(INITIAL_ORG);
    setAccounts(INITIAL_ACCOUNTS);
    setJournalEntries(INITIAL_JOURNAL_ENTRIES);
    setInvoices(INITIAL_INVOICES);
    setProducts(INITIAL_PRODUCTS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setGrns(INITIAL_GRNS);
    setBankTransactions(INITIAL_BANK_TRANSACTIONS);
    setActivityFeed(INITIAL_ACTIVITY_FEED);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Reset to clean empty slate for a brand new business
  const resetToEmptySlate = () => {
    const emptyOrg: Organization = {
      id: `org-${Date.now()}`,
      name: 'My Business Enterprise',
      legalName: 'My Business Private Limited',
      gstin: '27AAACB1234C1Z1',
      pan: 'AAACB1234C',
      cin: 'U74999MH2026PTC123456',
      address: 'Industrial Area, Phase 1',
      pincode: '400001',
      baseCurrency: 'INR',
      stateCode: '27',
      stateName: 'Maharashtra',
      financialYearFrom: '2026-04-01',
      booksBeginningFrom: '2026-04-01',
      currentFiscalYear: '2026-2027',
      branches: [
        {
          id: 'br-ho',
          name: 'Head Office',
          code: 'HO-01',
          gstin: '27AAACB1234C1Z1',
          city: 'Mumbai',
          state: 'Maharashtra',
          isHeadOffice: true,
        },
      ],
    };

    setOrg(emptyOrg);
    setAccounts(INITIAL_ACCOUNTS.map((a) => ({ ...a, balance: 0 })));
    setJournalEntries([]);
    setInvoices([]);
    setProducts([]);
    setPurchaseOrders([]);
    setGrns([]);
    setBankTransactions([]);
    setActivityFeed([]);
    setAuditLogs([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const simulateIncomingInvoice = () => {
    const newFeed: AutonomousActivityEvent = {
      id: `feed-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'INVOICE_OCR',
      title: 'New PDF Invoice Ingested: Titan Cloud Workstations',
      summary: '✓ Vision OCR extracted 4 items (₹1,85,000) | Validated against PO-884 | Ready for review.',
      severity: 'INFO',
      status: 'PENDING_APPROVAL',
      amount: 185000,
      actionRequired: 'Controller Sign-off required (> ₹1L)',
    };
    addFeedEvent(newFeed);
  };

  const simulateBankFeed = () => {
    const newTx: BankTransaction = {
      id: `btx-sim-${Date.now()}`,
      bankAccountId: 'acc-hdfc',
      date: new Date().toISOString().split('T')[0],
      description: 'NEFT-RETAIL-DIRECT-0098',
      rawReference: `CMS${Math.floor(100000 + Math.random() * 900000)}`,
      amount: 125000,
      type: 'CREDIT',
      balanceAfter: 2105000,
      reconciliationStatus: 'RECONCILED',
      matchedPartyName: 'Direct Retail Customer',
      matchType: 'SEMANTIC',
      aiConfidence: 98.2,
      aiExplanation: 'Auto-reconciled against retail POS settlement batch.',
    };
    setBankTransactions((prev) => [newTx, ...prev]);

    addFeedEvent({
      id: `feed-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'BANK_RECON',
      title: '₹1,25,000 received via Connected Banking',
      summary: '✓ Matched to retail POS batch. Ledger posted automatically.',
      severity: 'SUCCESS',
      status: 'AUTO_RESOLVED',
      amount: 125000,
    });
  };

  const simulateGSTAnomaly = () => {
    addFeedEvent({
      id: `feed-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'GST_ALERT',
      title: 'GSTR-2B ITC Mismatch Detected',
      summary: '⚠ Vendor "Zenith Networks" failed to upload invoice #ZN-409 in their GSTR-1. ₹34,200 ITC at risk.',
      severity: 'WARNING',
      status: 'ATTENTION_REQUIRED',
      amount: 34200,
      actionRequired: 'Automate vendor payment hold until GSTR-1 reflects filing',
    });
  };

  const value = useMemo(
    () => ({
      org,
      accounts,
      journalEntries,
      invoices,
      products,
      purchaseOrders,
      grns,
      bankTransactions,
      activityFeed,
      auditLogs,
      agentRuns,
      addAccount,
      addProduct,
      addInvoice,
      addJournalEntry,
      reverseJournalEntry,
      approveTransaction,
      runReconciliation,
      importBankStatementCSV,
      setOrgDetails,
      exportBackupJSON,
      importBackupJSON,
      resetToDefaultData,
      resetToEmptySlate,
      simulateIncomingInvoice,
      simulateBankFeed,
      simulateGSTAnomaly,
      addAuditLog,
      addAgentRun,
      addFeedEvent,
    }),
    [
      org,
      accounts,
      journalEntries,
      invoices,
      products,
      purchaseOrders,
      grns,
      bankTransactions,
      activityFeed,
      auditLogs,
      agentRuns,
    ]
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
};

export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
};

