// ============================================================================
// LedgerOS Core Type Definitions - Enterprise Financial & AI Architecture
// ============================================================================

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export type UserRole = 'OWNER' | 'CFO' | 'ACCOUNTANT' | 'AUDITOR';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  governanceLevel: number; // 0 to 5
}

export interface Organization {
  id: string;
  name: string;
  legalName: string;
  gstin: string;
  pan: string;
  cin: string;
  address?: string;
  pincode?: string;
  baseCurrency: Currency;
  stateCode: string; // e.g. "27" for Maharashtra
  stateName: string;
  financialYearFrom: string; // e.g. "2025-04-01"
  booksBeginningFrom: string; // e.g. "2025-04-01"
  currentFiscalYear: string; // e.g. "2025-2026"
  tallyVaultPassword?: string;
  branches: Branch[];
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  gstin: string;
  city: string;
  state: string;
  isHeadOffice: boolean;
}

// ----------------------------------------------------------------------------
// Chart of Accounts & General Ledger
// ----------------------------------------------------------------------------
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
export type AccountSubType =
  | 'CASH'
  | 'BANK'
  | 'ACCOUNTS_RECEIVABLE'
  | 'INVENTORY'
  | 'FIXED_ASSET'
  | 'ACCOUNTS_PAYABLE'
  | 'DUTIES_AND_TAXES'
  | 'CURRENT_LIABILITY'
  | 'DIRECT_INCOME'
  | 'INDIRECT_INCOME'
  | 'DIRECT_EXPENSE'
  | 'INDIRECT_EXPENSE'
  | 'EQUITY';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subType: AccountSubType;
  parentAccountId?: string;
  balance: number; // positive = normal balance for type (Debit for Asset/Expense, Credit for Liab/Income/Equity)
  currency: Currency;
  isActive: boolean;
  isSystem: boolean;
  description?: string;
}

export type VoucherType =
  | 'SALES'
  | 'PURCHASE'
  | 'PAYMENT'
  | 'RECEIPT'
  | 'CONTRA'
  | 'JOURNAL'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE';

export type TransactionStatus =
  | 'DRAFT'
  | 'AI_PROPOSED'
  | 'VALIDATING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'POSTED'
  | 'RECONCILED'
  | 'REVERSED';

export interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  costCenterId?: string;
  hsnCode?: string;
  gstRate?: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  voucherType: VoucherType;
  entryDate: string; // ISO date YYYY-MM-DD
  status: TransactionStatus;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  narration: string;
  sourceType: 'MANUAL' | 'DOCUMENT_AI' | 'BANK_FEED' | 'EMAIL_AI' | 'SYSTEM';
  sourceDocumentId?: string;
  aiMetadata?: {
    confidence: number;
    agentId: string;
    model: string;
    reasoning: string;
    suggestedBy: string;
  };
  createdBy: string;
  approvedBy?: string;
  postedAt?: string;
  reversalEntryId?: string;
  tags: string[];
}

// ----------------------------------------------------------------------------
// GST, Tax & Indian Compliance
// ----------------------------------------------------------------------------
export type GSTSupplyType = 'INTRA_STATE' | 'INTER_STATE' | 'EXPORT' | 'SEZ';

export interface GSTItemTax {
  hsnCode: string;
  taxableAmount: number;
  gstRate: number; // e.g. 18 for 18%
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  isRCM: boolean; // Reverse Charge Mechanism
}

export interface EInvoiceDetails {
  irn: string;
  ackNo: string;
  ackDate: string;
  signedQRCode: string;
  status: 'GENERATED' | 'CANCELLED' | 'FAILED';
  cancelReason?: string;
}

export interface EWayBillDetails {
  ewbNumber: string;
  ewbDate: string;
  validUpto: string;
  vehicleNumber: string;
  fromPincode: string;
  toPincode: string;
  distanceKm: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

// ----------------------------------------------------------------------------
// Sales & Invoicing
// ----------------------------------------------------------------------------
export interface InvoiceLineItem {
  id: string;
  productId: string;
  itemDescription: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'TAX_INVOICE' | 'BILL_OF_SUPPLY' | 'EXPORT_INVOICE';
  partyId: string;
  partyName: string;
  partyGstin: string;
  partyState: string;
  partyStateCode: string;
  invoiceDate: string;
  dueDate: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  supplyType: GSTSupplyType;
  items: InvoiceLineItem[];
  subTotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  eInvoice?: EInvoiceDetails;
  eWayBill?: EWayBillDetails;
  journalEntryId?: string;
  createdVia: 'MANUAL' | 'AI_AGENT' | 'API';
}

// ----------------------------------------------------------------------------
// Purchase, PO, GRN & 3-Way Matching Engine
// ----------------------------------------------------------------------------
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  orderDate: string;
  deliveryDate: string;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_RECEIVED' | 'FULFILLED' | 'CANCELLED';
  items: {
    productId: string;
    productName: string;
    orderedQty: number;
    unitPrice: number;
    totalAmount: number;
  }[];
  totalAmount: number;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  receiptDate: string;
  warehouseId: string;
  items: {
    productId: string;
    productName: string;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    batchNumber?: string;
  }[];
  inspectedBy: string;
}

export interface ThreeWayMatchResult {
  matchId: string;
  poNumber: string;
  grnNumber: string;
  invoiceNumber: string;
  vendorName: string;
  status: 'PERFECT_MATCH' | 'PRICE_DISCREPANCY' | 'QUANTITY_DISCREPANCY' | 'MISSING_GRN' | 'MISSING_PO';
  variancePercent: number;
  priceVariance: number;
  quantityVariance: number;
  discrepancyDetails: string[];
  aiRecommendation: string;
  requiresFinanceApproval: boolean;
}

// ----------------------------------------------------------------------------
// Inventory Management
// ----------------------------------------------------------------------------
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  hsnCode: string;
  defaultGstRate: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  totalStock: number;
  reorderLevel: number;
  valuationMethod: 'FIFO' | 'WEIGHTED_AVERAGE';
  warehouseBalances: {
    warehouseId: string;
    warehouseName: string;
    quantity: number;
  }[];
  daysSinceLastSold: number;
  isSlowMoving: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  movementType: 'INWARD' | 'OUTWARD' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  unitRate: number;
  totalValue: number;
  date: string;
  referenceType: 'PURCHASE' | 'SALE' | 'GRN' | 'PHYSICAL_AUDIT';
  referenceId: string;
  fromWarehouse?: string;
  toWarehouse?: string;
}

// ----------------------------------------------------------------------------
// Banking & Smart Reconciliation Engine
// ----------------------------------------------------------------------------
export interface BankAccount {
  id: string;
  accountNumber: string; // masked in UI for safety
  bankName: string;
  branch: string;
  ifscCode: string;
  currentBalance: number;
  unreconciledCount: number;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  rawReference: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  balanceAfter: number;
  reconciliationStatus: 'RECONCILED' | 'PROBABLE_MATCH' | 'UNMATCHED' | 'SUSPICIOUS_ANOMALY';
  matchedJournalEntryId?: string;
  matchedPartyName?: string;
  matchType?: 'EXACT' | 'FUZZY' | 'SEMANTIC' | 'SPLIT' | 'PARTIAL' | 'MANUAL';
  aiConfidence?: number;
  aiExplanation?: string;
}

// ----------------------------------------------------------------------------
// AI Governance, Safety Levels & Observability
// ----------------------------------------------------------------------------
export type AISafetyLevel =
  | 'LEVEL_0_READ'        // AI can inspect & report only
  | 'LEVEL_1_SUGGEST'     // AI can suggest actions
  | 'LEVEL_2_DRAFT'       // AI can prepare drafts
  | 'LEVEL_3_LOW_RISK'    // Routine actions < ₹10k auto-execute
  | 'LEVEL_4_HIGH_RISK'   // High value (> ₹1L) or bank edits: Human approval strictly required
  | 'LEVEL_5_PROHIBITED'; // Mutating historical posted entries or arbitrary DB edits: strictly blocked

export interface AIConfidenceBreakdown {
  extraction: number;     // OCR / Layout parsing accuracy %
  classification: number; // Ledger / Account grouping %
  accounting: number;     // Double-entry balancing invariant %
  tax: number;            // GST & TDS verification %
  matching: number;       // Vendor / PO alignment %
  overallScore: number;   // Composite score %
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AIAgentRun {
  id: string;
  workflowId: string;
  agentType: 'SUPERVISOR' | 'BOOKKEEPER' | 'RECONCILIATION' | 'TAX' | 'ANOMALY' | 'COLLECTION' | 'CFO';
  model: string;
  commandOrTrigger: string;
  status: 'PLANNING' | 'EXECUTING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'FAILED';
  latencyMs: number;
  tokenUsage: { prompt: number; completion: number; totalCostUsd: number };
  confidence: AIConfidenceBreakdown;
  toolsInvoked: string[];
  findings: string[];
  proposedActions: {
    id: string;
    type: string;
    description: string;
    amount?: number;
    safetyLevel: AISafetyLevel;
    needsApproval: boolean;
    executed: boolean;
  }[];
  timestamp: string;
}

export interface AutonomousActivityEvent {
  id: string;
  timestamp: string;
  category: 'INVOICE_OCR' | 'BANK_RECON' | 'GST_ALERT' | 'CASH_FLOW' | 'INVENTORY' | 'APPROVAL_REQ';
  title: string;
  summary: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  status: 'AUTO_RESOLVED' | 'PENDING_APPROVAL' | 'ATTENTION_REQUIRED';
  amount?: number;
  sourceRef?: string;
  actionRequired?: string;
}

// ----------------------------------------------------------------------------
// Audit Trail & Immutability
// ----------------------------------------------------------------------------
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: {
    type: 'USER' | 'AI_AGENT' | 'SYSTEM_WORKER';
    id: string;
    name: string;
    role?: string;
    ipAddress?: string;
  };
  action: string; // e.g. "POST_JOURNAL_ENTRY", "OVERRIDE_TAX_RATE", "RECONCILE_BANK_TX"
  entityType: 'JOURNAL' | 'INVOICE' | 'PAYMENT' | 'BANK_TX' | 'TAX_SETTING' | 'AI_POLICY';
  entityId: string;
  beforeSnapshot?: Record<string, any>;
  afterSnapshot: Record<string, any>;
  reason: string;
  aiMetadata?: {
    model: string;
    confidence: number;
    promptTokenHash?: string;
  };
  immutableHash: string; // SHA-256 integrity hash
}
