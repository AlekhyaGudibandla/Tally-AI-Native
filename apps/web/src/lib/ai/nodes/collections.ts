import { WorkflowState } from "../graph";
import { ToolRegistry } from "../tools/registry";

export const collectionsNode = async (
  state: WorkflowState
): Promise<Partial<WorkflowState>> => {
  try {
    const aging = await ToolRegistry.getReceivablesAging(state.organizationId);
    const findings: string[] = [];

    findings.push(
      `Collections & Accounts Receivable Summary: Total Outstanding is ₹${aging.totalOutstanding.toLocaleString(
        "en-IN"
      )} across ${aging.debtorCount} customers.`
    );
    findings.push(
      `Overdue Receivables: ₹${aging.totalOverdue.toLocaleString(
        "en-IN"
      )} has passed the 30-day payment credit window.`
    );

    if (aging.debtorsList.length === 0) {
      findings.push("All customer accounts are currently within credit limits. No collection actions needed.");
      return {
        activeAgent: "Collections",
        status: "COMPLETED",
        findings,
      };
    }

    const topDebtor = aging.debtorsList[0];
    findings.push(
      `Top Outstanding Account: "${topDebtor.customerName}" owes ₹${topDebtor.outstandingAmount.toLocaleString(
        "en-IN"
      )}${topDebtor.hasOverdue ? ` (₹${topDebtor.overdueAmount.toLocaleString("en-IN")} is overdue)` : ""}.`
    );

    // Formulate automated collection reminder proposal
    const proposedAction = ToolRegistry.createProposedCollectionReminder(state.organizationId, {
      customerName: topDebtor.customerName,
      amount: topDebtor.overdueAmount > 0 ? topDebtor.overdueAmount : topDebtor.outstandingAmount,
    });

    findings.push(
      `Prepared automated payment reminder with direct payment link for ${topDebtor.customerName}. Requiring human authorization before dispatch.`
    );

    return {
      activeAgent: "Collections",
      status: "WAITING_FOR_APPROVAL",
      approvalRequired: true,
      proposedAction: proposedAction as any,
      findings,
    };
  } catch (err: any) {
    const errorMsg = err?.message || "Collections analysis failed";
    return {
      activeAgent: "Collections",
      status: "FAILED",
      error: errorMsg,
      findings: [`Collections Agent Error: ${errorMsg}`],
    };
  }
};

