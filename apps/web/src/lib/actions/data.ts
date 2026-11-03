'use server';

import { auth } from '@/auth';

import prisma from '@/lib/db';

export async function getAccountingData(clientOrgId?: string) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  if (!organizationId) return { success: false, error: 'Unauthorized: No organization context' };
  try {
    const accounts = await prisma.account.findMany({
      where: { organizationId },
      include: { group: true },
      orderBy: { name: 'asc' },
    });

    const vouchers = await prisma.voucher.findMany({
      where: { organizationId },
      include: { transactions: true },
      orderBy: { date: 'desc' },
    });

    return { success: true, data: { accounts, vouchers } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSalesData(clientOrgId?: string) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  if (!organizationId) return { success: false, error: 'Unauthorized: No organization context' };
  try {
    const invoices = await prisma.invoice.findMany({
      where: { organizationId },
      include: { customer: true, lines: true },
      orderBy: { date: 'desc' },
    });
    const customers = await prisma.customer.findMany({ where: { organizationId } });
    const products = await prisma.product.findMany({ where: { organizationId } });
    return { success: true, data: { invoices, customers, products } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPurchasesData(clientOrgId?: string) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  if (!organizationId) return { success: false, error: 'Unauthorized: No organization context' };
  try {
    const suppliers = await prisma.supplier.findMany({ where: { organizationId } });
    const products = await prisma.product.findMany({ where: { organizationId } });
    const vouchers = await prisma.voucher.findMany({
      where: { organizationId, type: 'PURCHASE' },
      include: { transactions: { include: { account: true } } },
      orderBy: { date: 'desc' },
    });
    return { success: true, data: { suppliers, products, vouchers } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInventoryData(clientOrgId?: string) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  if (!organizationId) return { success: false, error: 'Unauthorized: No organization context' };
  try {
    const products = await prisma.product.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: { products } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMasterData(clientOrgId?: string) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  if (!organizationId) return { success: false, error: 'Unauthorized: No organization context' };
  try {
    const customers = await prisma.customer.findMany({ where: { organizationId } });
    const suppliers = await prisma.supplier.findMany({ where: { organizationId } });
    const products = await prisma.product.findMany({ where: { organizationId } });
    return { success: true, data: { customers, suppliers, products } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDashboardData(clientOrgId?: string) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  if (!organizationId) return { success: false, error: 'Unauthorized: No organization context' };
  try {
    const vouchersCount = await prisma.voucher.count({ where: { organizationId } });
    const customersCount = await prisma.customer.count({ where: { organizationId } });
    const suppliersCount = await prisma.supplier.count({ where: { organizationId } });
    const productsCount = await prisma.product.count({ where: { organizationId } });
    const accounts = await prisma.account.findMany({ where: { organizationId } });
    const recentVouchers = await prisma.voucher.findMany({
      where: { organizationId },
      orderBy: { date: 'desc' },
      take: 5,
      include: { transactions: { include: { account: true } } }
    });

    const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

    return {
      success: true,
      data: {
        vouchersCount,
        customersCount,
        suppliersCount,
        productsCount,
        totalBalance,
        recentVouchers,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
