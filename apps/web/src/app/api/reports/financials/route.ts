import { NextRequest, NextResponse } from "next/server";
import { ToolRegistry } from "@/lib/ai/tools/registry";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;
    const organizationId = user?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized: Active session required" }, { status: 401 });
    }

    const metrics = await ToolRegistry.getFinancialMetrics(organizationId);
    const aging = await ToolRegistry.getReceivablesAging(organizationId);

    return NextResponse.json({
      metrics,
      aging,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

