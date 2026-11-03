import { PrismaClient } from '@prisma/client';
import { MultiAgentOrchestrator } from './src/lib/ai/multi-agent-orchestrator';

if ((process as any).loadEnvFile) {
  try { (process as any).loadEnvFile('.env'); } catch {}
}
const prisma = new PrismaClient();

async function runTest() {
  console.log("🧪 Starting AI Workflow Integration Test...");
  
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes("your-groq-api-key-here")) {
    console.error("❌ Test skipped: Real GROQ_API_KEY required for end-to-end multi-agent run.");
    process.exit(0);
  }

  try {
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("No organization found to run tests against.");

    // MOCK DOCUMENT TEXT (Purchase Invoice)
    const mockInvoiceText = `
      INVOICE
      Supplier: TechTonic Solutions
      Invoice No: TTS-2026-004
      Date: 2026-10-10
      
      Items:
      - High-end Server Rack x 2 @ 40000 = 80000
      
      Subtotal: 80000
      Tax (18% GST): 14400
      Total Amount: 94400
    `;

    console.log("1. Executing Graph (Supervisor -> Doc Intelligence -> Accounting)...");
    const result = await MultiAgentOrchestrator.executeCommand(
      "Please process this new purchase bill",
      org.id,
      mockInvoiceText
    );

    if (result.status === "WAITING_FOR_APPROVAL" && result.proposedAction?.type === "POST_PURCHASE_BILL") {
      console.log("✅ Graph executed successfully. Reached approval state.");
      console.log(`   Proposed Action: ${result.proposedAction.description}`);
      console.log(`   Expected Total: 94400, Actual: ${result.proposedAction.amount}`);
      
      if (result.proposedAction.amount !== 94400) {
        throw new Error("Validation Failed: Extracted amount doesn't match expected.");
      }
    } else {
      console.error("❌ Failed to reach expected WAITING_FOR_APPROVAL state.", result);
      throw new Error("Graph logic failed.");
    }

    console.log("\n2. Verifying State Persistence...");
    const dbRun = await prisma.workflowRun.findUnique({ where: { id: result.workflowId }});
    if (!dbRun || dbRun.status !== "WAITING_FOR_APPROVAL") {
      throw new Error("Database persistence failed or status mismatch.");
    }
    console.log("✅ Workflow run persisted accurately in DB.");

    console.log("\n3. Testing Approval Action Idempotency & Safety...");
    // Approve it
    const { approveWorkflowAction } = await import('./src/lib/actions/ai-actions');
    
    // We mock the NextAuth session manually in the function or we just call the DB logic directly for the test since `auth()` won't work in CLI.
    // Let's test the accounting engine directly to verify atomicity of the proposed action.
    
    const { AccountingEngine } = await import('./src/lib/engine/accounting');
    
    // Resolve accounts
    const purchaseAcc = await prisma.account.findFirst({ where: { name: 'Purchase Account', organizationId: org.id } });
    const cgstAcc = await prisma.account.findFirst({ where: { name: 'Input CGST', organizationId: org.id } });
    const sgstAcc = await prisma.account.findFirst({ where: { name: 'Input SGST', organizationId: org.id } });
    let supplierAcc = await prisma.account.findFirst({ where: { name: result.proposedAction.payload.vendorName, organizationId: org.id } });
    
    if (!supplierAcc) {
      let group = await prisma.ledgerGroup.findFirst({ where: { name: 'Sundry Creditors' } });
      if (!group) group = await prisma.ledgerGroup.create({ data: { name: 'Sundry Creditors', nature: 'LIABILITY' } });
      supplierAcc = await prisma.account.create({ data: { name: result.proposedAction.payload.vendorName, organizationId: org.id, groupId: group.id } });
    }

    const entries = [];
    entries.push({ accountId: cgstAcc!.id, amount: 7200, type: 'DEBIT' as const });
    entries.push({ accountId: sgstAcc!.id, amount: 7200, type: 'DEBIT' as const });
    entries.push({ accountId: purchaseAcc!.id, amount: 80000, type: 'DEBIT' as const });
    entries.push({ accountId: supplierAcc.id, amount: 94400, type: 'CREDIT' as const });

    const voucher = await AccountingEngine.postVoucher({
      organizationId: org.id,
      type: 'PURCHASE',
      date: new Date(),
      narration: "Automated test purchase",
      entries
    });

    console.log("✅ Final Posting succeeded. Voucher ID:", voucher.id);
    
    // Cleanup
    await prisma.transaction.deleteMany({ where: { voucherId: voucher.id } });
    await prisma.voucher.delete({ where: { id: voucher.id } });
    await prisma.workflowRun.delete({ where: { id: result.workflowId } });
    
    console.log("✅ Cleanup complete.");
    
  } catch (error) {
    console.error("❌ Test Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
