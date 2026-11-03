import { NextRequest, NextResponse } from "next/server";
import { approveWorkflowAction, rejectWorkflowAction } from "@/lib/actions/ai-actions";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Active session required" }, { status: 401 });
    }

    const body = await req.json();
    const { workflowId, actionId, decision = "APPROVE", reason } = body;

    if (!workflowId) {
      return NextResponse.json({ error: "Missing required parameter 'workflowId'" }, { status: 400 });
    }

    if (decision === "REJECT") {
      const res = await rejectWorkflowAction(workflowId, reason || "Rejected via API");
      return NextResponse.json(res);
    }

    if (!actionId) {
      return NextResponse.json({ error: "Missing required parameter 'actionId' for approval" }, { status: 400 });
    }

    const res = await approveWorkflowAction(workflowId, actionId);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

