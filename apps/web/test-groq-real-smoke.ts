import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// 1. Explicitly load .env from apps/web/.env before any other imports
const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "apps/web/.env"),
  path.resolve(__dirname, ".env"),
  path.resolve(__dirname, "apps/web/.env"),
];

let loadedEnvPath: string | null = null;
const existingKey = process.env.GROQ_API_KEY?.trim();
const hasActiveKey = existingKey && existingKey !== "your-groq-api-key-here" && !existingKey.includes("your-groq");

for (const cand of envCandidates) {
  if (fs.existsSync(cand)) {
    dotenv.config({ path: cand, override: !hasActiveKey });
    loadedEnvPath = cand;
    break;
  }
}

// 2. Import application modules after environment has been explicitly populated
import prisma from "./src/lib/db";
import { getModel, getConfiguredModelName } from "./src/lib/ai/llm-provider";
import { MultiAgentOrchestrator } from "./src/lib/ai/multi-agent-orchestrator";
import { docSchema } from "./src/lib/ai/nodes/document-intelligence";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

async function runGroqRealSmokeTest() {
  console.log("================================================================================");
  console.log("🚀 VAHI AI PLATFORM — REAL GROQ PROVIDER SMOKE TEST");
  console.log("================================================================================\n");

  const apiKey = process.env.GROQ_API_KEY?.trim();
  const modelName = getConfiguredModelName();

  console.log(`[Config] Environment file loaded : ${loadedEnvPath || "None (process.env fallback)"}`);
  console.log(`[Config] Configured Groq Model   : ${modelName}`);

  // Masked credential verification (NEVER print or leak the key)
  if (!apiKey || apiKey === "your-groq-api-key-here" || apiKey.includes("your-groq")) {
    console.error("\n❌ TEST FAILED: Missing or unconfigured GROQ_API_KEY.");
    console.error("   The environment variable GROQ_API_KEY in apps/web/.env is currently unset or contains placeholder text.");
    console.error("   To execute live inference:");
    console.error("   1. Open apps/web/.env");
    console.error("   2. Set GROQ_API_KEY=\"gsk_...\" (obtained from https://console.groq.com/keys)");
    console.error("   3. Save the file and re-run: npx tsx test-groq-real-smoke.ts\n");
    process.exit(1);
  }

  // Key is present — display safe masked representation (e.g. gsk_...1234)
  const maskedKey = apiKey.length > 8
    ? `${apiKey.substring(0, 4)}...${apiKey.slice(-4)} (${apiKey.length} chars)`
    : `**** (${apiKey.length} chars)`;
  console.log(`[Config] Groq Key Detected       : ${maskedKey}`);

  console.log(`\n1. Initializing Groq Chat Client for model "${modelName}"...`);
  const startTime = Date.now();

  try {
    const rawModel = getModel({ modelName });
    const model = rawModel.withStructuredOutput
      ? rawModel.withStructuredOutput(docSchema)
      : rawModel;

    const sampleInvoice = `
      TAX INVOICE
      Vendor: CloudScale Networks Pvt Ltd
      Invoice: CSN-2026-9021
      Date: 2026-10-11
      
      Description: Dedicated 10Gbps Cloud Connectivity
      Subtotal: 45000.00
      GST (18%): 8100.00
      Grand Total: 53100.00
    `;

    console.log("2. Sending live inference request to Groq API (Structured Invoice Extraction)...");
    const rawResponse = await model.invoke([
      new SystemMessage("Extract invoice details accurately. Strictly follow the requested JSON schema."),
      new HumanMessage(sampleInvoice),
    ]);

    const extracted = docSchema.parse(rawResponse);
    const latency = Date.now() - startTime;

    console.log(`\n✅ LIVE GROQ API RESPONSE RECEIVED IN ${latency}ms!`);
    console.log("--------------------------------------------------------------------------------");
    console.log("   • Supplier Name  :", extracted.supplierName);
    console.log("   • Invoice Number :", extracted.invoiceNumber);
    console.log("   • Date           :", extracted.date);
    console.log("   • Subtotal       : ₹" + extracted.subTotal.toLocaleString("en-IN"));
    console.log("   • GST Tax        : ₹" + extracted.totalTax.toLocaleString("en-IN"));
    console.log("   • Grand Total    : ₹" + extracted.grandTotal.toLocaleString("en-IN"));
    console.log("--------------------------------------------------------------------------------");

    // 3. Test Full Multi-Agent Graph with live Groq inference
    const org = await prisma.organization.findFirst();
    if (org) {
      console.log(`\n3. Executing live end-to-end multi-agent workflow for org "${org.name}"...`);
      const graphResult = await MultiAgentOrchestrator.executeCommand(
        "Please parse and prepare accounting voucher for this cloud invoice",
        org.id,
        sampleInvoice
      );

      console.log(`✅ Multi-Agent Workflow completed with status: ${graphResult.status}`);
      console.log("   • Active Agent   :", graphResult.activeAgent);
      console.log("   • Step Findings  :");
      graphResult.findings.forEach((f) => console.log(`     - ${f}`));

      if (graphResult.proposedAction) {
        console.log(`   • Proposed Action: ${graphResult.proposedAction.description}`);
        console.log(`   • Safety Level   : ${graphResult.proposedAction.safetyLevel}`);
        console.log(`   • Needs Approval : ${graphResult.proposedAction.needsApproval}`);
      }
    }

    console.log("\n================================================================================");
    console.log("🎉 GROQ LIVE INFERENCE & MULTI-AGENT WORKFLOW VERIFIED SUCCESSFULLY");
    console.log("================================================================================\n");
    process.exit(0);
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const status = error?.status || error?.statusCode || error?.response?.status;

    console.error("\n❌ LIVE GROQ REQUEST FAILED");
    console.error("--------------------------------------------------------------------------------");

    if (status === 401 || errorMsg.includes("401") || /invalid.*api.*key|unauthorized/i.test(errorMsg)) {
      console.error("❌ AUTHENTICATION ERROR (HTTP 401):");
      console.error("   Groq rejected the API key as invalid or revoked.");
      console.error("   Please verify your key at: https://console.groq.com/keys");
    } else if (status === 429 || errorMsg.includes("429") || /rate.*limit|quota/i.test(errorMsg)) {
      console.error("❌ RATE LIMIT ERROR (HTTP 429):");
      console.error("   Groq rate limit or TPM/RPM tokens-per-minute quota exceeded.");
      console.error("   Please wait a few moments or switch to llama-3.1-8b-instant.");
    } else if (status === 404 || status === 400 || /model.*not.*found|model.*deprecated/i.test(errorMsg)) {
      console.error(`❌ MODEL ERROR (${status || "HTTP 400/404"}):`);
      console.error(`   The model "${modelName}" is unavailable or not supported by Groq.`);
      console.error("   Recommended supported models: llama-3.3-70b-versatile, llama-3.1-8b-instant");
    } else {
      console.error(`❌ ERROR DETAILS: ${errorMsg}`);
    }
    console.error("--------------------------------------------------------------------------------\n");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runGroqRealSmokeTest();
