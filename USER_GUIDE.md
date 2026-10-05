# Vahi (वही) — Production User Guide & Feature Manual

Welcome to **Vahi (वही)** — the business-first, AI-native operating system for modern business accounting and operations.

Vahi combines **Tally Prime-level double-entry accounting rigor** with a modern, clean SaaS user experience and non-obtrusive, background automation. 

---

## Table of Contents

1. [Product Overview & Philosophy](#1-product-overview--philosophy)
2. [Interface Layout & Quick Navigation](#2-interface-layout--quick-navigation)
3. [Keyboard Shortcuts (Tally Parity)](#3-keyboard-shortcuts-tally-parity)
4. [Detailed Workspace Guide](#4-detailed-workspace-guide)
   - [Dashboard & Executive Briefing](#1-dashboard--executive-briefing)
   - [Sales & Statutory E-Invoicing](#2-sales--statutory-e-invoicing)
   - [Purchases & 3-Way Match](#3-purchases--3-way-match)
   - [Accounting & Double-Entry Journal](#4-accounting--double-entry-journal)
   - [Banking & Auto-Reconciliation](#5-banking--auto-reconciliation)
   - [Financial Statements & Reports](#6-financial-statements--reports)
   - [GST & Indian Tax Compliance](#7-gst--indian-tax-compliance)
   - [Accounts Receivable & Reminders](#8-accounts-receivable--reminders)
   - [Accounts Payable Optimizer](#9-accounts-payable-optimizer)
   - [Multi-Warehouse Inventory](#10-multi-warehouse-inventory)
   - [Statutory Payroll & TDS](#11-statutory-payroll--tds)
   - [Document OCR Sandbox](#12-document-ocr-sandbox)
   - [Human Approval Queue](#13-human-approval-queue)
   - [Immutable Cryptographic Audit Trail](#14-immutable-cryptographic-audit-trail)
5. [Enterprise AI Safety Governance (6-Level Framework)](#5-enterprise-ai-safety-governance-6-level-framework)
6. [Tally Prime Migration & Feature Mapping](#6-tally-prime-migration--feature-mapping)

---

## 1. Product Overview & Philosophy

Vahi is designed around a core principle: **"Business-first, AI-assisted everywhere."**

- **Familiar SaaS Usability:** Clean slate background, crisp white cards, Indigo accents, and accessible data structures that non-technical users and accountants can operate immediately.
- **Unobtrusive Automation:** Vahi works silently in the background — parsing vendor invoices, checking GSTIN validity, reconciling bank transactions, and warning of cash flow risks.
- **Strict Accounting Invariants:** All ledgers enforce `SUM(Debit) === SUM(Credit)`. Posted accounting entries are immutable; corrections require counter-reversal journal entries (`REV-xxxx`) with audit notes.
- **Indian SME Statutory Compliance:** Complete GST tax logic (CGST, SGST, IGST), 64-character SHA-256 IRN registration for e-Invoicing, E-Way Bill threshold checks, and Section 192 TDS/PF payroll deductions.

---

## 2. Interface Layout & Quick Navigation

The Vahi interface is structured into three main regions:

1. **Top Navigation Bar:**
   - **Organization & Branch Switcher:** Switch between companies (e.g., Apex Technologies Pvt Ltd) and registered branches (Mumbai HO vs Bangalore R&D).
   - **Global Search & Ask Vahi (`⌘K`):** Slide-over AI drawer for natural language queries ("How is cash flow for the next 30 days?", "Show overdue invoices > 1L").
   - **Environment Indicator:** Switch between Production Live and Simulation Sandbox.

2. **Left Navigation Sidebar:**
   - Grouped logically into **Operations**, **Finance & Tax**, and **Governance**.
   - Hover tooltips and active highlight badges indicate pending review count.

3. **Main Workspace View:**
   - Follows the intuitive information hierarchy: **Needs Attention → Today's Business → Quick Actions → Business Health → Financial Ratios**.

---

## 3. Keyboard Shortcuts (Tally Parity)

Vahi supports fast keyboard navigation familiar to Tally users:

| Shortcut | Action | Description |
|---|---|---|
| `⌘K` / `Ctrl+K` | **Ask Vahi** | Open AI Slide-Over Command Drawer |
| `Alt + S` | **Create Invoice** | Fast Tax Invoice Creation Modal |
| `Alt + E` | **Record Expense** | Quick Payment Voucher |
| `Alt + R` | **Record Payment** | Receipt Voucher |
| `Alt + C` | **Add Party** | Create Customer or Vendor Account |
| `Alt + U` | **Upload Document** | Vision OCR Extraction Sandbox |

---

## 4. Detailed Workspace Guide

### 1. Dashboard & Executive Briefing
- **Needs Attention Today:** Displays actionable operational items (e.g., overdue receivables, GST state mismatches, > ₹1L purchase approvals).
- **Direct Action Buttons:** Click `[Send Reminder]`, `[Fix Tax Line]`, or `[Approve]` to complete tasks directly from the dashboard without searching menus.
- **Progressive Disclosure (`?`):** Click the help icon on any item to view Vahi's step-by-step reasoning workflow (`Document Understanding` → `3-Way Match` → `GST Check` → `Ledger Post`).
- **Today's Business:** Real-time Revenue, Receivables, Payables, and Liquid Cash.
- **Quick Action Bar:** One-click shortcuts for daily data entry.

### 2. Sales & Statutory E-Invoicing
- **Tax Invoice Builder:** Calculates inter-state (IGST 18%) vs intra-state (CGST 9% + SGST 9%) based on buyer GSTIN.
- **E-Invoice IRN Generator:** Generates a 64-character SHA-256 IRN hash, signed QR code data, and Ack Number upon posting.
- **E-Way Bill Integration:** Triggers e-Way bill requirement warnings for consignments exceeding ₹50,000.

### 3. Purchases & 3-Way Match
- **Alignment Checker:** Automatically matches Purchase Orders (PO), Goods Receipt Notes (GRN), and Vendor Invoices.
- **Variance Detection:** Highlights price discrepancies (unit rate mismatch) or quantity shortages before payment approval.

### 4. Accounting & Double-Entry Journal
- **Chart of Accounts Tree:** Organized hierarchy across Assets (1xxx), Liabilities (2xxx), Equity (3xxx), Revenue (4xxx), and Expenses (5xxx).
- **Journal Voucher Builder:** Interactive multi-line entry builder with real-time `Debit vs Credit` balancing indicator.
- **Counter-Reversal Modal:** Immutably reverses posted entries with explicit audit notes without altering historical records.

### 5. Banking & Auto-Reconciliation
- **Bank Feed Table:** Live feed from accounts (HDFC Current Account, ICICI Operating Account).
- **Multi-Tier Matching Engine:** Exact reference match, semantic vendor alias matching, and partial TDS deduction split resolution.

### 6. Financial Statements & Reports
- **Profit & Loss (P&L):** Computed Revenue - Cost of Goods Sold = Gross Profit, minus Operating Expenses = Net Profit.
- **Balance Sheet:** Assets = Liabilities + Equity (with real-time equity retained earnings roll-up).
- **Trial Balance:** Complete list of debit and credit balances across all active accounts.

### 7. GST & Indian Tax Compliance
- **Return Summaries:** Form GSTR-1 (Outward Supplies) and GSTR-3B (Summary Tax Liability & ITC Netting).
- **GSTIN Format Verifier Tool:** Deterministic 15-character GSTIN validator (State Code, PAN, Entity Number, Z, Checksum).

### 8. Accounts Receivable & Reminders
- **Aging Buckets:** Breakdown of receivables across `Current`, `1-30 Days`, `31-60 Days`, `61-90 Days`, and `90+ Days`.
- **Automated Collection Generator:** Creates ready-to-send payment reminders via WhatsApp and Email with UPI payment links.

### 9. Accounts Payable Optimizer
- **Payment Tranche Scheduler:** Optimizes vendor payment timing to capture early settlement discounts without draining cash runway.

### 10. Multi-Warehouse Inventory
- **Warehouse Location Balances:** Stock tracking across warehouses (Mumbai Central Depot vs Bangalore R&D Center).
- **Weighted Average Valuation:** Calculates cost of inventory, stock turnover, and reorder runout forecasts.

### 11. Statutory Payroll & TDS
- **Monthly Salary Roster:** Staff profiles with Basic Pay, House Rent Allowance (HRA), Special Allowance.
- **Statutory Deductions:** Employee Provident Fund (EPFO 12%), Professional Tax (PT), and Section 192 Income Tax TDS withholding.
- **Auto-Voucher Posting:** Posts salary expense and net payable liabilities to ledgers with one click.

### 12. Document OCR Sandbox
- **Vision Extraction Pipeline:** Drag-and-drop vendor bills/receipts to extract Vendor Name, Taxable Amount, GSTIN, and Line Items.
- **Adversarial Prompt Guard:** Intercepts prompt injection attacks hidden inside uploaded documents.

### 13. Human Approval Queue
- **Risk Gate:** Governs high-value transactions (> ₹1,00,000) or unusual ledger changes, requiring explicit CFO approval.

### 14. Immutable Cryptographic Audit Trail
- **Regulatory Event Log:** SHA-256 hash-chained log recording every user action, AI recommendation, and ledger posting with timestamp and IP address.

---

## 5. Enterprise AI Safety Governance (6-Level Framework)

Vahi enforces strict security guardrails on all background operations:

| Level | Classification | Description | Policy Enforcement |
|---|---|---|---|
| **L0** | Read-Only | Data extraction & analytics | Fully Autonomous |
| **L1** | Draft Generation | Voucher preparation | Soft User Confirmation |
| **L2** | Tax & Invariant Check | GSTIN & Debit=Credit checks | Deterministic Validation |
| **L3** | Standard Reconcile | Bank matching (< ₹50k) | Auto-Posted with Log |
| **L4** | High-Value Action | Transactions > ₹1,00,000 | **Mandatory Human Approval** |
| **L5** | Ledger Mutation | Historical reversal entries | Immutable Audit Log Required |

---

## 6. Tally Prime Migration & Feature Mapping

If you are migrating from Tally Prime, here is how Tally features map directly to Vahi:

| Tally Prime Feature | Vahi Equivalent | Advantage in Vahi |
|---|---|---|
| `Gateway of Tally` | **Vahi Sidebar & Workspace Shell** | One-click navigation without deep sub-menus |
| `F8: Sales Voucher` | **Sales & E-Invoicing Workspace** | Automated IRN e-Invoicing & E-Way bills |
| `F9: Purchase Voucher` | **Purchases & 3-Way Match** | Automated comparison against PO and GRN |
| `F5: Payment / F6: Receipt` | **Quick Actions / Banking Workspace** | Auto-matched bank feeds and statement parsing |
| `F7: Journal Voucher` | **Accounting & General Ledger** | Real-time `DR === CR` check & reversal builder |
| `Bank Reconciliation (BKO)` | **Banking Auto-Reconcile** | 94%+ auto-match rate with semantic vendor aliasing |
| `Display → Statutory Reports` | **GST Workspace (GSTR-1 / 3B)** | Live place-of-supply check and tax validation |
| `Audit Trail (Edit Log)` | **Immutable SHA-256 Audit Trail** | Cryptographic audit trail tamper-proof by design |

---

*Vahi (वही) — Built for modern businesses. Production-ready, secure, and compliant.*

---

## 7. The Complete Product Workflow

Think of Vahi as having **5 layers**:

1. ENTERPRISE SETUP
2. DAILY BUSINESS OPERATIONS
3. FINANCIAL / TAX PROCESSING
4. AI AUTOMATION & INTELLIGENCE
5. GOVERNANCE / AUDIT / REPORTING

*(Detailed workflow appended from master specification...)*
