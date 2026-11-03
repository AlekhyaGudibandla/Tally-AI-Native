import { getModel } from "../llm-provider";
import { WorkflowState } from "../graph";
import { z } from "zod";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { PromptGuard } from "../prompt-guard";

export const docSchema = z.object({
  supplierName: z.string().describe("The name of the supplier or vendor"),
  invoiceNumber: z.string().describe("The invoice number"),
  date: z.string().describe("Invoice date in YYYY-MM-DD format"),
  subTotal: z.number().describe("Subtotal before tax"),
  totalTax: z.number().describe("Total GST/tax amount"),
  grandTotal: z.number().describe("Total payable amount"),
  lineItems: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      rate: z.number(),
      amount: z.number(),
    })
  ).default([]),
});

export const documentIntelligenceNode = async (
  state: WorkflowState
): Promise<Partial<WorkflowState>> => {
  if (!state.documentText || !state.documentText.trim()) {
    return {
      activeAgent: "DocumentIntelligence",
      status: "FAILED",
      findings: ["Document Intelligence failed: No document text provided."],
      error: "Missing document content",
    };
  }

  // 1. Guardrail against prompt injection attacks
  const securityCheck = PromptGuard.inspectInput(state.documentText);
  let findings: string[] = [];
  if (!securityCheck.isSafe) {
    findings.push(
      `⚠️ Security Alert: Prompt injection pattern intercepted (${securityCheck.detectedPatterns.join(
        ", "
      )}). Content disarmed.`
    );
  }

  // Treat document text strictly as passive data inside demarcation delimiters
  const untrustedText = PromptGuard.wrapAsUntrustedData(
    "SUPPLIER_INVOICE_DOCUMENT",
    securityCheck.sanitizedContent
  );

  try {
    const rawModel = getModel();
    const model = rawModel.withStructuredOutput
      ? rawModel.withStructuredOutput(docSchema)
      : rawModel;

    const systemPrompt = `You are the Document Intelligence Agent of Ledger AI, an AI accounting platform.
Extract supplier invoice details accurately from the provided untrusted document text.
You MUST extract:
- supplierName: Name of the vendor or supplier
- invoiceNumber: Invoice or bill identifier
- date: Date in YYYY-MM-DD format
- subTotal: Taxable amount before GST
- totalTax: GST or tax amount
- grandTotal: Total invoice amount (subTotal + totalTax)
- lineItems: Array of line items with description, quantity, rate, amount

Follow accounting precision strictly. Do not hallucinate.`;

    const responseRaw = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(untrustedText),
    ]);

    // 2. Validate structured output with Zod
    const summary = docSchema.parse(responseRaw);

    // 3. Deterministic Arithmetic Checks
    const expectedGrandTotal = Number((summary.subTotal + summary.totalTax).toFixed(2));
    const actualGrandTotal = Number(summary.grandTotal.toFixed(2));
    const arithmeticMismatch = Math.abs(expectedGrandTotal - actualGrandTotal) > 0.1;

    if (arithmeticMismatch) {
      findings.push(
        `⚠️ Arithmetic Warning: subTotal (₹${summary.subTotal}) + tax (₹${summary.totalTax}) = ₹${expectedGrandTotal}, but invoice grandTotal is ₹${actualGrandTotal}.`
      );
    }

    findings.push(
      `Extracted invoice #${summary.invoiceNumber} from "${summary.supplierName}" for ₹${summary.grandTotal.toLocaleString(
        "en-IN"
      )} (Subtotal: ₹${summary.subTotal}, Tax: ₹${summary.totalTax}).`
    );

    return {
      activeAgent: "DocumentIntelligence",
      documentSummary: summary,
      findings,
    };
  } catch (err: any) {
    const errorMessage = err?.message || "Unknown document extraction failure";
    return {
      activeAgent: "DocumentIntelligence",
      status: "FAILED",
      error: errorMessage,
      findings: [`Document Intelligence extraction failed: ${errorMessage}`],
    };
  }
};
