import { getModel } from "../llm-provider";
import { WorkflowState } from "../graph";
import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export const supervisorSchema = z.object({
  next: z.enum(["FINISH", "DocumentIntelligence", "Accounting", "CFO", "Collections"]),
  reason: z.string(),
});

function deterministicRoute(intent: string, hasDocText: boolean, hasDocSummary: boolean, hasProposedAction: boolean): { next: "FINISH" | "DocumentIntelligence" | "Accounting" | "CFO" | "Collections"; reason: string } {
  if (hasDocText && !hasDocSummary) {
    return { next: "DocumentIntelligence", reason: "Unparsed document text detected" };
  }
  if (hasDocSummary && !hasProposedAction) {
    return { next: "Accounting", reason: "Document summary ready for double-entry journal formulation" };
  }

  const lower = intent.toLowerCase();
  if (
    lower.includes("who owe") || lower.includes("who owes") || lower.includes("overdue") ||
    lower.includes("receivable") || lower.includes("debtor") || lower.includes("unpaid") ||
    lower.includes("collection") || lower.includes("remind")
  ) {
    return { next: "Collections", reason: "User intent targets customer receivables and aging" };
  }

  if (
    lower.includes("why") || lower.includes("profit") || lower.includes("margin") ||
    lower.includes("cash") || lower.includes("loss") || lower.includes("revenue") ||
    lower.includes("overview") || lower.includes("financial health") || lower.includes("runway") ||
    lower.includes("how is my business") || lower.includes("cfo")
  ) {
    return { next: "CFO", reason: "User intent targets executive CFO financial analysis" };
  }

  if (
    lower.includes("sold") || lower.includes("sale") || lower.includes("bill") ||
    lower.includes("paid") || lower.includes("pay") || lower.includes("receipt") ||
    lower.includes("received") || lower.includes("bought") || lower.includes("purchase") ||
    lower.includes("voucher") || lower.includes("journal")
  ) {
    return { next: "Accounting", reason: "User intent targets general ledger voucher posting" };
  }

  return { next: "CFO", reason: "General business inquiry routed to AI CFO" };
}

export const supervisorNode = async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
  // If the workflow has already failed or completed, do not re-route
  if (state.status === "FAILED") {
    return {
      activeAgent: "Supervisor",
      nextAgent: "FINISH",
    };
  }

  // If accounting proposal is already generated and awaiting approval, supervisor terminates
  if (state.proposedAction && state.approvalRequired) {
    return {
      activeAgent: "Supervisor",
      nextAgent: "FINISH",
      findings: ["Workflow reached approval boundary. Supervisor concluded orchestration."],
    };
  }

  try {
    const rawModel = getModel();
    const model = rawModel.withStructuredOutput
      ? rawModel.withStructuredOutput(supervisorSchema)
      : rawModel;

    const systemPrompt = `You are the Supervisor Agent of Ledger AI, an AI accounting platform.
Your job is to route the workflow to the correct specialist agent or finish the task.
Available Agents:
- DocumentIntelligence: Extracts information from invoices, receipts, and other documents.
- Accounting: Processes general ledger operations, validates double entry, and handles sales, purchases, payments, and receipts.
- CFO: Analyzes financial data, profit margins, cash flow, revenue trends, and business performance.
- Collections: Checks overdue invoices, aging accounts receivable, and customer payment follow-ups.

Routing rules:
1. If documentText is present and has NOT yet been parsed into documentSummary, send to DocumentIntelligence.
2. If documentSummary is present but NO proposedAction has been prepared, send to Accounting.
3. If user intent asks about receivables, who owes money, overdue invoices, debtors, or collecting payment, send to Collections.
4. If user intent asks about financial performance, why profit fell/rose, margins, cash runway, balance sheet, or CFO overview, send to CFO.
5. If user intent asks to record sales, purchase bills, payments, or receipts without an attached document, send to Accounting.
6. If proposedAction is prepared or task is complete, choose FINISH.
`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Intent: ${state.intent}\nState summary: ${JSON.stringify({
        hasDocText: !!state.documentText,
        hasDocSummary: !!state.documentSummary,
        hasProposedAction: !!state.proposedAction,
        approvalRequired: !!state.approvalRequired,
      })}`),
    ];

    const rawResponse = await model.invoke(messages);
    const response = supervisorSchema.parse(rawResponse);

    return {
      activeAgent: "Supervisor",
      nextAgent: response.next,
      findings: [`Supervisor routed workflow to ${response.next} (Reason: ${response.reason})`],
    };
  } catch (err: any) {
    // Graceful deterministic fallback
    const fallback = deterministicRoute(
      state.intent || "",
      !!state.documentText,
      !!state.documentSummary,
      !!state.proposedAction
    );

    return {
      activeAgent: "Supervisor",
      nextAgent: fallback.next,
      findings: [`Supervisor routed workflow to ${fallback.next} (Reason: ${fallback.reason})`],
    };
  }
};
