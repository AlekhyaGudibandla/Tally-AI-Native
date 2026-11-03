import { BaseMessage } from "@langchain/core/messages";

export interface DocumentSummary {
  supplierName: string;
  invoiceNumber: string;
  date: string;
  subTotal: number;
  totalTax: number;
  grandTotal: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

export interface AccountingValidationResult {
  isValid: boolean;
  totalDebit: number;
  totalCredit: number;
  discrepancies: string[];
}

export interface ProposedJournalEntry {
  id: string;
  entryNumber: string;
  voucherType: string;
  entryDate: string;
  status: string;
  narration: string;
  lines: Array<{
    id: string;
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
  totalDebit: number;
  totalCredit: number;
  sourceType: string;
  createdBy: string;
  postedAt: string;
  tags: string[];
}

export interface ProposedAction {
  id: string;
  type: string;
  description: string;
  amount: number;
  safetyLevel: string;
  needsApproval: boolean;
  executed: boolean;
  payload: any;
}

export interface WorkflowState {
  workflowId: string;
  organizationId: string;
  userId: string | null;
  intent: string;
  status: 'QUEUED' | 'RUNNING' | 'WAITING_FOR_INPUT' | 'WAITING_FOR_APPROVAL' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  messages: BaseMessage[];
  documentText?: string;
  documentSummary?: DocumentSummary;
  supplier?: any;
  accountingValidation?: AccountingValidationResult;
  proposedAction?: ProposedAction;
  approvalRequired?: boolean;
  findings: string[];
  activeAgent: string;
  nextAgent?: string;
  error?: string;
}

// Defining the State schema for LangGraph
export const graphState = {
  workflowId: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  organizationId: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  userId: {
    value: (x: string | null, y: string | null) => y ?? x,
    default: () => null,
  },
  intent: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  status: {
    value: (x: any, y: any) => y ?? x,
    default: () => "QUEUED",
  },
  messages: {
    value: (x: BaseMessage[], y: BaseMessage[]) => (x || []).concat(y || []),
    default: () => [],
  },
  documentText: {
    value: (x: string | undefined, y: string | undefined) => y ?? x,
    default: () => undefined,
  },
  documentSummary: {
    value: (x: DocumentSummary | undefined, y: DocumentSummary | undefined) => y ?? x,
    default: () => undefined,
  },
  supplier: {
    value: (x: any, y: any) => y ?? x,
    default: () => undefined,
  },
  accountingValidation: {
    value: (x: AccountingValidationResult | undefined, y: AccountingValidationResult | undefined) => y ?? x,
    default: () => undefined,
  },
  proposedAction: {
    value: (x: ProposedAction | undefined, y: ProposedAction | undefined) => y ?? x,
    default: () => undefined,
  },
  approvalRequired: {
    value: (x: boolean | undefined, y: boolean | undefined) => y ?? x,
    default: () => undefined,
  },
  findings: {
    value: (x: string[], y: string[]) => (x || []).concat(y || []),
    default: () => [],
  },
  activeAgent: {
    value: (x: string, y: string) => y ?? x,
    default: () => "Supervisor",
  },
  nextAgent: {
    value: (x: string | undefined, y: string | undefined) => y ?? x,
    default: () => undefined,
  },
  error: {
    value: (x: string | undefined, y: string | undefined) => y ?? x,
    default: () => undefined,
  },
};
