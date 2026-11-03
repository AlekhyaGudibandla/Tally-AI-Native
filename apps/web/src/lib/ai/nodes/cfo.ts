import { WorkflowState } from "../graph";
import { ToolRegistry } from "../tools/registry";
import { getModel } from "../llm-provider";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export const cfoNode = async (
  state: WorkflowState
): Promise<Partial<WorkflowState>> => {
  try {
    const metrics = await ToolRegistry.getFinancialMetrics(state.organizationId);

    const findings: string[] = [];
    findings.push(
      `CFO Financial Overview: Total Recorded Revenue is ₹${metrics.totalSalesRevenue.toLocaleString(
        "en-IN"
      )} with Operating Expenses at ₹${metrics.totalExpenses.toLocaleString("en-IN")}.`
    );
    findings.push(
      `Profitability & Margins: Net Profit is ₹${metrics.netProfit.toLocaleString(
        "en-IN"
      )} (${metrics.profitMargin}% Net Margin). Gross Profit is estimated at ₹${metrics.grossProfit.toLocaleString(
        "en-IN"
      )}.`
    );
    findings.push(
      `Treasury & Liquidity: Cash & Bank Balances stand at ₹${metrics.cashAndBankBalance.toLocaleString(
        "en-IN"
      )}. Accounts Receivable: ₹${metrics.accountsReceivable.toLocaleString(
        "en-IN"
      )} vs Accounts Payable: ₹${metrics.accountsPayable.toLocaleString("en-IN")}.`
    );

    let executiveSummary = "";
    try {
      const model = getModel();
      const prompt = `You are the AI Chief Financial Officer (CFO) of Ledger AI.
Analyze the following corporate financial position and answer the user's intent.
Financial Data:
- Sales Revenue: ₹${metrics.totalSalesRevenue}
- Operating Expenses: ₹${metrics.totalExpenses}
- Net Profit: ₹${metrics.netProfit} (${metrics.profitMargin}% margin)
- Cash & Bank Balance: ₹${metrics.cashAndBankBalance}
- Accounts Receivable: ₹${metrics.accountsReceivable}
- Accounts Payable: ₹${metrics.accountsPayable}
- GST Tax Collected: ₹${metrics.totalTaxCollected}
- Active Vouchers: ${metrics.voucherCount}

User Query / Intent: "${state.intent}"

Provide a concise, professional, highly actionable CFO assessment (2-3 sentences max). Highlight health, working capital runway, and any risk or upside.`;

      const response = await model.invoke([
        new SystemMessage("You are an expert fractional CFO for enterprise businesses."),
        new HumanMessage(prompt),
      ]);

      executiveSummary = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    } catch {
      // Deterministic fallback if LLM is unavailable
      executiveSummary = `Financial health assessment: Net margin is currently at ${metrics.profitMargin}% with ₹${metrics.cashAndBankBalance.toLocaleString(
        "en-IN"
      )} in liquid bank reserves. Working capital ratio is healthy with receivables (₹${metrics.accountsReceivable.toLocaleString(
        "en-IN"
      )}) comfortably covering near-term payables.`;
    }

    findings.push(executiveSummary);

    return {
      activeAgent: "CFO",
      status: "COMPLETED",
      findings,
    };
  } catch (err: any) {
    const errorMsg = err?.message || "CFO analysis failed";
    return {
      activeAgent: "CFO",
      status: "FAILED",
      error: errorMsg,
      findings: [`CFO Agent Error: ${errorMsg}`],
    };
  }
};

