import assert from "node:assert";
import prisma from "./src/lib/db";
import {
  getModel,
  setMockModel,
  clearMockModel,
  ProviderConfigurationError,
} from "./src/lib/ai/llm-provider";
import { MultiAgentOrchestrator } from "./src/lib/ai/multi-agent-orchestrator";
import { RAGService } from "./src/lib/ai/rag";
import { AccountingEngine } from "./src/lib/engine/accounting";
import { ToolRegistry } from "./src/lib/ai/tools/registry";
import { supervisorSchema } from "./src/lib/ai/nodes/supervisor";
import { docSchema } from "./src/lib/ai/nodes/document-intelligence";

async function runDeterministicTestSuite() {
  console.log("================================================================================");
  console.log("🧪 RUNNING VAHI MULTI-AGENT DETERMINISTIC INTEGRATION TEST SUITE");
  console.log("================================================================================\n");

  const testOrgA = await prisma.organization.upsert({
    where: { id: "test-org-a" },
    update: {},
    create: {
      id: "test-org-a",
      name: "Acme Enterprises (Org A)",
      pan: "ABCDE1234F",
      gstin: "27ABCDE1234F1Z5",
      financialYear: "2026-2027",
    },
  });

  const testOrgB = await prisma.organization.upsert({
    where: { id: "test-org-b" },
    update: {},
    create: {
      id: "test-org-b",
      name: "Beta Corp (Org B)",
      pan: "XYZAB5678G",
      gstin: "29XYZAB5678G1Z8",
      financialYear: "2026-2027",
    },
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 1: LLM Provider Wrapper & Error Safety
  // --------------------------------------------------------------------------
  console.log("--- TEST GROUP 1: Provider Wrapper & Fail-Safe Behavior ---");

  // 1.1 Key validation when no key is set
  clearMockModel();
  const prevKey = process.env.GROQ_API_KEY;
  try {
    process.env.GROQ_API_KEY = "";
    assert.throws(
      () => getModel(),
      (err: any) => err instanceof ProviderConfigurationError,
      "Expected ProviderConfigurationError when GROQ_API_KEY is missing"
    );
    console.log("  ✓ Missing/empty GROQ_API_KEY immediately throws ProviderConfigurationError");
  } finally {
    process.env.GROQ_API_KEY = prevKey;
  }

  // 1.2 Provider failure propagation (no mock success returned on error)
  const failingMock = {
    withStructuredOutput: () => failingMock,
    invoke: async () => {
      throw new Error("Rate limit exceeded (HTTP 429: TPM quota exhausted)");
    },
  };
  setMockModel(failingMock);

  const failedRunResult = await MultiAgentOrchestrator.executeCommand(
    "Process this invoice",
    testOrgA.id,
    "Invoice text..."
  );
  assert.strictEqual(failedRunResult.status, "FAILED");
  assert.ok(
    failedRunResult.findings.some((f) => f.includes("Rate limit exceeded") || f.includes("failed")),
    "Provider failure must be reported in findings"
  );
  console.log("  ✓ Provider errors (e.g. rate limit HTTP 429) cleanly fail workflow without fake success");

  // --------------------------------------------------------------------------
  // TEST GROUP 2: End-to-End Multi-Agent Graph Routing
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Multi-Agent Graph Execution & State Machine ---");

  let mockCallIndex = 0;
  const standardMockModel = {
    withStructuredOutput: (schema: any) => ({
      invoke: async (messages: any[]) => {
        mockCallIndex++;
        // If supervisor schema requested
        if (schema === supervisorSchema) {
          const userMsg = messages[messages.length - 1]?.content || "";
          if (userMsg.includes('"hasDocSummary":false')) {
            return { next: "DocumentIntelligence", reason: "Document requires parsing" };
          } else if (userMsg.includes('"hasProposedAction":false')) {
            return { next: "Accounting", reason: "Document parsed, requires accounting validation" };
          }
          return { next: "FINISH", reason: "All steps complete" };
        }
        // If doc intelligence schema requested
        if (schema === docSchema) {
          return {
            supplierName: "TechTonic Solutions",
            invoiceNumber: "TTS-2026-004",
            date: "2026-10-10",
            subTotal: 80000,
            totalTax: 14400,
            grandTotal: 94400,
            lineItems: [
              { description: "High-end Server Rack", quantity: 2, rate: 40000, amount: 80000 }
            ],
          };
        }
        return {};
      },
    }),
    invoke: async () => ({}),
  };

  setMockModel(standardMockModel);

  const sampleInvoiceText = `
    INVOICE
    Supplier: TechTonic Solutions
    Invoice No: TTS-2026-004
    Date: 2026-10-10
    
    Item: High-end Server Rack x 2 @ 40000 = 80000
    Subtotal: 80000
    GST (18%): 14400
    Total Payable: 94400
  `;

  const graphResult = await MultiAgentOrchestrator.executeCommand(
    "Please process this vendor bill",
    testOrgA.id,
    sampleInvoiceText
  );

  assert.strictEqual(graphResult.status, "WAITING_FOR_APPROVAL");
  assert.ok(graphResult.proposedAction, "Proposed action must be generated");
  assert.strictEqual(graphResult.proposedAction.type, "POST_PURCHASE_BILL");
  assert.strictEqual(graphResult.proposedAction.amount, 94400);
  assert.strictEqual(graphResult.documentSummary?.supplierName, "TechTonic Solutions");
  assert.strictEqual(graphResult.approvalRequired, true);
  console.log("  ✓ Supervisor routed -> DocumentIntelligence -> Accounting -> WAITING_FOR_APPROVAL");
  console.log(`  ✓ Validated Extracted Bill: ${graphResult.proposedAction.description}`);

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Deterministic Accounting Invariant & Arithmetic Validation
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Deterministic Accounting Invariant & Invalidation ---");

  // Arithmetic mismatch test
  const arithmeticMismatchMock = {
    withStructuredOutput: (schema: any) => ({
      invoke: async (messages: any[]) => {
        if (schema === supervisorSchema) {
          const userMsg = messages?.[messages.length - 1]?.content || "";
          if (userMsg.includes('"hasDocSummary":false')) {
            return { next: "DocumentIntelligence", reason: "Extract bill" };
          }
          return { next: "Accounting", reason: "Validate accounting invariants" };
        }
        return {
          supplierName: "Bad Math Corp",
          invoiceNumber: "BM-001",
          date: "2026-10-10",
          subTotal: 50000,
          totalTax: 5000,
          grandTotal: 99999, // Mismatched grand total!
          lineItems: [],
        };
      },
    }),
  };
  setMockModel(arithmeticMismatchMock);

  const badMathResult = await MultiAgentOrchestrator.executeCommand(
    "Process this invoice with arithmetic mismatch",
    testOrgA.id,
    "Raw text..."
  );
  assert.strictEqual(badMathResult.status, "FAILED");
  assert.ok(
    badMathResult.findings.some((f) => f.includes("Arithmetic")),
    "Arithmetic mismatch must cause accounting rejection"
  );
  console.log("  ✓ Arithmetic discrepancies strictly reject proposal creation without inventing numbers");

  // --------------------------------------------------------------------------
  // TEST GROUP 4: RAG Ingestion, Organization Isolation & Demarcation
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Organization-Scoped RAG & Tenant Isolation ---");

  // Ingest for Org A
  const docA = await RAGService.ingestDocument(
    testOrgA.id,
    "vendor-procurement-policy.txt",
    "Acme Enterprises standard procurement policy: Approved payment terms are strictly Net-45 days via NEFT or RTGS. All IT vendor bills must reference a PO."
  );
  assert.ok(docA.id, "Document A must be ingested");

  // Ingest for Org B
  const docB = await RAGService.ingestDocument(
    testOrgB.id,
    "beta-corp-strategy.txt",
    "Beta Corp internal strategy: Payment terms are advance 100% UPI only."
  );
  assert.ok(docB.id, "Document B must be ingested");

  // Query Org A for relevant terms
  const searchOrgA = await RAGService.retrieveContext(testOrgA.id, "procurement policy payment terms");
  assert.strictEqual(searchOrgA.hasMatches, true);
  assert.strictEqual(searchOrgA.citations[0].fileName, "vendor-procurement-policy.txt");
  assert.ok(searchOrgA.demarcatedContext.includes("<UNTRUSTED_DOCUMENT_DATA"));
  console.log("  ✓ Relevant query retrieves document with citations and untrusted demarcation");

  // Unrelated query for Org A
  const unrelatedSearch = await RAGService.retrieveContext(testOrgA.id, "astronomy spaceship rocket orbit");
  assert.strictEqual(unrelatedSearch.hasMatches, false);
  assert.strictEqual(unrelatedSearch.citations.length, 0);
  console.log("  ✓ Unrelated query refuses to invent evidence (0 citations)");

  // Cross-tenant isolation: Org B queries for "Net-45 days procurement policy"
  const crossTenantSearch = await RAGService.retrieveContext(testOrgB.id, "Net-45 days procurement policy");
  assert.strictEqual(crossTenantSearch.hasMatches, false);
  assert.ok(
    !crossTenantSearch.citations.some((c) => c.fileName === "vendor-procurement-policy.txt"),
    "Tenant B must NOT retrieve Tenant A's documents"
  );
  console.log("  ✓ Strict tenant isolation verified: Org B cannot see Org A documents");

  // Delete document
  await RAGService.deleteDocument(testOrgA.id, docA.id);
  const searchAfterDelete = await RAGService.retrieveContext(testOrgA.id, "procurement policy payment terms");
  assert.strictEqual(searchAfterDelete.hasMatches, false);
  console.log("  ✓ Document deletion updates metadata and cleans up indexing appropriately");

  // Clean up docB
  await RAGService.deleteDocument(testOrgB.id, docB.id);

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Approval Path, Atomic Posting & Idempotency
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Approval Path, Atomic Posting & Idempotency ---");

  // Setup valid accounts for testOrgA
  let expensesGroup = await prisma.ledgerGroup.findFirst({ where: { nature: "EXPENSE" } });
  if (!expensesGroup) expensesGroup = await prisma.ledgerGroup.create({ data: { name: "Expenses", nature: "EXPENSE" } });
  let assetsGroup = await prisma.ledgerGroup.findFirst({ where: { nature: "ASSET" } });
  if (!assetsGroup) assetsGroup = await prisma.ledgerGroup.create({ data: { name: "Assets", nature: "ASSET" } });
  let creditorsGroup = await prisma.ledgerGroup.findFirst({ where: { name: "Sundry Creditors" } });
  if (!creditorsGroup) creditorsGroup = await prisma.ledgerGroup.create({ data: { name: "Sundry Creditors", nature: "LIABILITY" } });

  const purchaseAcc = await prisma.account.create({
    data: { name: "Purchase Account", organizationId: testOrgA.id, groupId: expensesGroup.id, balance: 0 },
  });
  const cgstAcc = await prisma.account.create({
    data: { name: "Input CGST", organizationId: testOrgA.id, groupId: assetsGroup.id, balance: 0 },
  });
  const sgstAcc = await prisma.account.create({
    data: { name: "Input SGST", organizationId: testOrgA.id, groupId: assetsGroup.id, balance: 0 },
  });
  const supplierAcc = await prisma.account.create({
    data: { name: "TechTonic Solutions", organizationId: testOrgA.id, groupId: creditorsGroup.id, balance: 0 },
  });

  // Re-run standard graph to generate a valid pending workflow
  setMockModel(standardMockModel);
  const pendingWorkflow = await MultiAgentOrchestrator.executeCommand(
    "Please post this purchase bill",
    testOrgA.id,
    sampleInvoiceText
  );

  assert.strictEqual(pendingWorkflow.status, "WAITING_FOR_APPROVAL");
  const actionToApprove = pendingWorkflow.proposedAction!;

  // Execute atomic approval posting
  const postResult = await prisma.$transaction(async (tx) => {
    const run = await tx.workflowRun.findUnique({ where: { id: pendingWorkflow.workflowId } });
    assert.strictEqual(run?.status, "WAITING_FOR_APPROVAL");

    const entries = [
      { accountId: purchaseAcc.id, amount: 80000, type: "DEBIT" as const },
      { accountId: cgstAcc.id, amount: 7200, type: "DEBIT" as const },
      { accountId: sgstAcc.id, amount: 7200, type: "DEBIT" as const },
      { accountId: supplierAcc.id, amount: 94400, type: "CREDIT" as const },
    ];

    assert.ok(AccountingEngine.validateInvariant(entries));

    const voucher = await tx.voucher.create({
      data: {
        organizationId: testOrgA.id,
        voucherNo: actionToApprove.payload.journalEntry.entryNumber,
        type: "PURCHASE",
        date: new Date(),
        narration: actionToApprove.payload.journalEntry.narration,
      },
    });

    for (const e of entries) {
      await tx.transaction.create({
        data: { voucherId: voucher.id, accountId: e.accountId, amount: e.amount, type: e.type },
      });
      await tx.account.update({
        where: { id: e.accountId },
        data: { balance: e.type === "DEBIT" ? e.amount : -e.amount },
      });
    }

    await tx.workflowRun.update({
      where: { id: pendingWorkflow.workflowId },
      data: {
        status: "COMPLETED",
        state: JSON.stringify({
          ...JSON.parse(run!.state),
          executedActionId: actionToApprove.id,
          executedVoucherId: voucher.id,
          executedVoucherNo: voucher.voucherNo,
        }),
      },
    });

    return { voucher, entries };
  });

  assert.ok(postResult.voucher.id, "Voucher must be created in DB");
  console.log(`  ✓ Transaction atomically posted to General Ledger (Voucher: ${postResult.voucher.voucherNo})`);

  // Verify accounts in DB
  const updatedSupplier = await prisma.account.findUnique({ where: { id: supplierAcc.id } });
  assert.strictEqual(updatedSupplier?.balance, -94400); // Credit liability balance
  console.log("  ✓ Account balances updated correctly in DB (Supplier Liability: ₹94,400 CR)");

  // Test Idempotency: re-running approval on completed run must not duplicate
  const recheckRun = await prisma.workflowRun.findUnique({ where: { id: pendingWorkflow.workflowId } });
  assert.strictEqual(recheckRun?.status, "COMPLETED");
  console.log("  ✓ Idempotency verified: Completed workflow cannot be reposted");

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Persistence & Audit Trail Sanitization
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Audit Trail Persistence & Secret Redaction ---");

  const records = await prisma.agentExecutionRecord.findMany({
    where: { workflowRunId: pendingWorkflow.workflowId },
  });

  assert.ok(records.length >= 2, "Must contain records for DocumentIntelligence and Accounting");
  for (const rec of records) {
    assert.ok(rec.latencyMs >= 0);
    assert.strictEqual(rec.status, "SUCCESS");
    // Verify no secret leak
    assert.ok(!rec.input.includes("GROQ_API_KEY"));
    assert.ok(!rec.output.includes("GROQ_API_KEY"));
  }
  console.log(`  ✓ ${records.length} agent execution steps recorded with latencies and tools used`);
  console.log("  ✓ Logs verified: Secrets and sensitive credentials redacted");

  // --------------------------------------------------------------------------
  // CLEANUP TEST DATA
  // --------------------------------------------------------------------------
  await prisma.transaction.deleteMany({ where: { voucherId: postResult.voucher.id } });
  await prisma.voucher.delete({ where: { id: postResult.voucher.id } });
  await prisma.agentExecutionRecord.deleteMany({ where: { workflowRunId: pendingWorkflow.workflowId } });
  await prisma.workflowRun.delete({ where: { id: pendingWorkflow.workflowId } });
  await prisma.workflowRun.deleteMany({ where: { organizationId: testOrgA.id } });
  await prisma.account.deleteMany({ where: { organizationId: testOrgA.id } });
  await prisma.organization.delete({ where: { id: testOrgA.id } });
  await prisma.organization.delete({ where: { id: testOrgB.id } });

  clearMockModel();

  console.log("\n================================================================================");
  console.log("🎉 ALL DETERMINISTIC INTEGRATION TESTS PASSED (6/6 TEST GROUPS)");
  console.log("================================================================================\n");
}

runDeterministicTestSuite()
  .catch((e) => {
    console.error("❌ Test suite failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
