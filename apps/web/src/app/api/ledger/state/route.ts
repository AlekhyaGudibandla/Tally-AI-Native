import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;
    let organizationId = user?.organizationId;

    if (!organizationId) {
      // Fallback to primary demo organization for seamless local exploration
      const defaultOrg = await prisma.organization.findFirst();
      organizationId = defaultOrg?.id;
    }

    if (!organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { branches: true },
    });

    const accounts = await prisma.account.findMany({
      where: { organizationId },
      include: { group: true },
      orderBy: { name: "asc" },
    });

    const products = await prisma.product.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });

    const customers = await prisma.customer.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });

    const suppliers = await prisma.supplier.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });

    const invoices = await prisma.invoice.findMany({
      where: { organizationId },
      include: { customer: true, lines: { include: { product: true } } },
      orderBy: { date: "desc" },
    });

    const vouchers = await prisma.voucher.findMany({
      where: { organizationId },
      include: {
        transactions: {
          include: { account: true },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    const workflowRuns = await prisma.workflowRun.findMany({
      where: { organizationId },
      include: { records: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: {
        org,
        accounts,
        products,
        customers,
        suppliers,
        invoices,
        vouchers,
        workflowRuns,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch live ledger state" },
      { status: 500 }
    );
  }
}

