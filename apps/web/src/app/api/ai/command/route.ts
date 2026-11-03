import { NextRequest, NextResponse } from "next/server";
import { processAICommand, getPendingWorkflowAction } from "@/lib/actions/ai-actions";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Active session required" }, { status: 401 });
    }

    const body = await req.json();
    const { command, documentText } = body;

    if (!command || typeof command !== "string" || !command.trim()) {
      return NextResponse.json({ error: "Missing required parameter 'command'" }, { status: 400 });
    }

    const result = await processAICommand(command, documentText);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Active session required" }, { status: 401 });
    }

    const pending = await getPendingWorkflowAction();
    return NextResponse.json({ pending });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

