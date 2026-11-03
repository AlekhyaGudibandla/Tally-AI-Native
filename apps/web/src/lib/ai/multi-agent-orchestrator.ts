import { StateGraph, END, START } from "@langchain/langgraph";
import { graphState, WorkflowState } from "./graph";
import { supervisorNode } from "./nodes/supervisor";
import { documentIntelligenceNode } from "./nodes/document-intelligence";
import { accountingNode } from "./nodes/accounting";
import { cfoNode } from "./nodes/cfo";
import { collectionsNode } from "./nodes/collections";
import prisma from "../db";
import { PIISanitizer } from "./pii-sanitizer";

export class MultiAgentOrchestrator {
  private static readonly EXECUTION_TIMEOUT_MS = 30000;
  private static readonly RECURSION_LIMIT = 10;

  private static getGraph() {
    const workflow = new StateGraph<WorkflowState>({ channels: graphState as any })
      .addNode("Supervisor", supervisorNode)
      .addNode("DocumentIntelligence", documentIntelligenceNode)
      .addNode("Accounting", accountingNode)
      .addNode("CFO", cfoNode)
      .addNode("Collections", collectionsNode)

      .addEdge(START, "Supervisor")

      .addConditionalEdges(
        "Supervisor",
        async (state: WorkflowState) => {
          if (state.status === "FAILED") {
            return END;
          }
          if (state.status === "WAITING_FOR_APPROVAL") {
            return END;
          }
          if (state.nextAgent === "DocumentIntelligence") {
            return "DocumentIntelligence";
          }
          if (state.nextAgent === "Accounting") {
            return "Accounting";
          }
          if (state.nextAgent === "CFO") {
            return "CFO";
          }
          if (state.nextAgent === "Collections") {
            return "Collections";
          }
          return END;
        },
        {
          DocumentIntelligence: "DocumentIntelligence",
          Accounting: "Accounting",
          CFO: "CFO",
          Collections: "Collections",
          [END]: END,
        }
      )

      .addConditionalEdges(
        "DocumentIntelligence",
        async (state: WorkflowState) => {
          if (state.status === "FAILED") return END;
          return "Supervisor";
        },
        {
          Supervisor: "Supervisor",
          [END]: END,
        }
      )
      .addConditionalEdges(
        "Accounting",
        async (state: WorkflowState) => {
          if (state.status === "FAILED" || state.status === "WAITING_FOR_APPROVAL" || state.proposedAction) {
            return END;
          }
          return "Supervisor";
        },
        {
          Supervisor: "Supervisor",
          [END]: END,
        }
      )
      .addConditionalEdges(
        "CFO",
        async () => {
          return END;
        },
        {
          [END]: END,
        }
      )
      .addConditionalEdges(
        "Collections",
        async () => {
          return END;
        },
        {
          [END]: END,
        }
      );

    return workflow.compile();
  }

  /**
   * Sanitizes state or payload before writing to persistent database logs.
   * Redacts sensitive secrets, credentials, and masks PII.
   */
  private static sanitizeForStorage(obj: any): string {
    try {
      const jsonStr = JSON.stringify(obj, (key, value) => {
        // Redact secrets
        if (/key|secret|password|token/i.test(key) && typeof value === "string") {
          return "[REDACTED_SECRET]";
        }
        return value;
      });
      return PIISanitizer.sanitize(jsonStr).sanitized;
    } catch {
      return "{}";
    }
  }

  public static async executeCommand(
    command: string,
    organizationId: string,
    documentText?: string
  ): Promise<WorkflowState> {
    if (!organizationId) {
      throw new Error("Tenant isolation violation: organizationId is required");
    }

    const app = this.getGraph();

    // 1. Create persistent WorkflowRun record in database
    const run = await prisma.workflowRun.create({
      data: {
        organizationId,
        intent: command,
        status: "RUNNING",
        state: "{}",
      },
    });

    const initialState: Partial<WorkflowState> = {
      workflowId: run.id,
      organizationId,
      intent: command,
      documentText,
      status: "RUNNING",
      messages: [],
      findings: [],
      activeAgent: "Supervisor",
    };

    let finalState: WorkflowState = initialState as WorkflowState;

    try {
      // 2. Execute graph with timeout and recursion boundaries
      const streamPromise = (async () => {
        const stream = await app.stream(initialState, {
          recursionLimit: this.RECURSION_LIMIT,
        });

        for await (const chunk of stream) {
          for (const [node, stateUpdate] of Object.entries(chunk)) {
            const startTime = Date.now();
            const update = stateUpdate as Partial<WorkflowState>;

            // Record step audit trail
            const latencyMs = Math.max(1, Date.now() - startTime);
            const status = update.status === "FAILED" ? "FAILED" : "SUCCESS";
            const toolsUsed =
              node === "Accounting"
                ? ["validateInvariant", "createProposedVoucher"]
                : node === "DocumentIntelligence"
                ? ["GroqLLM_StructuredOutput", "PromptGuard", "ArithmeticValidator"]
                : node === "CFO"
                ? ["ToolRegistry.getFinancialMetrics", "FinancialHealthAnalyzer"]
                : node === "Collections"
                ? ["ToolRegistry.getReceivablesAging", "CollectionsReminderBuilder"]
                : ["GroqLLM_SupervisorPlanner"];

            await prisma.agentExecutionRecord.create({
              data: {
                workflowRunId: run.id,
                agentName: node,
                input: this.sanitizeForStorage({
                  intent: command,
                  hasDocText: !!documentText,
                }),
                output: this.sanitizeForStorage(stateUpdate),
                toolsUsed: JSON.stringify(toolsUsed),
                latencyMs,
                status,
              },
            });

            finalState = { ...finalState, ...(update as any) };
          }
        }
      })();

      // Enforce timeout limit
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                `Graph execution exceeded timeout limit (${this.EXECUTION_TIMEOUT_MS / 1000}s)`
              )
            ),
          this.EXECUTION_TIMEOUT_MS
        );
      });

      await Promise.race([streamPromise, timeoutPromise]);

      // 3. Finalize run status
      const terminalStatus =
        finalState.status !== "RUNNING"
          ? finalState.status
          : finalState.proposedAction?.needsApproval
          ? "WAITING_FOR_APPROVAL"
          : "COMPLETED";

      finalState.status = terminalStatus;

      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: terminalStatus,
          state: this.sanitizeForStorage(finalState),
        },
      });

      return finalState;
    } catch (e: any) {
      const errorMsg = e?.message || "Workflow execution failed";
      console.error("[MultiAgentOrchestrator Error]:", errorMsg);

      finalState.status = "FAILED";
      finalState.error = errorMsg;
      finalState.findings = [
        ...(finalState.findings || []),
        `Workflow execution error: ${errorMsg}`,
      ];

      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          state: this.sanitizeForStorage(finalState),
        },
      });

      return finalState;
    }
  }

  /**
   * Retrieve stored workflow state by ID (supports page refresh recovery)
   */
  public static async getWorkflowState(
    workflowId: string,
    organizationId: string
  ): Promise<WorkflowState | null> {
    const run = await prisma.workflowRun.findUnique({
      where: { id: workflowId },
    });
    if (!run || run.organizationId !== organizationId) return null;

    try {
      return JSON.parse(run.state) as WorkflowState;
    } catch {
      return null;
    }
  }

  /**
   * Retrieve pending workflow runs awaiting human approval for tenant
   */
  public static async getPendingWorkflows(organizationId: string) {
    return await prisma.workflowRun.findMany({
      where: {
        organizationId,
        status: "WAITING_FOR_APPROVAL",
      },
      include: {
        records: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
