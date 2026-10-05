'use server';

import prisma from '@/lib/db';

export async function getAccountingData(organizationId: string) {
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

export async function getSalesData(organizationId: string) {
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

export async function getPurchasesData(organizationId: string) {
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

export async function getInventoryData(organizationId: string) {
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

export async function getMasterData(organizationId: string) {
  try {
    const customers = await prisma.customer.findMany({ where: { organizationId } });
    const suppliers = await prisma.supplier.findMany({ where: { organizationId } });
    const products = await prisma.product.findMany({ where: { organizationId } });
    return { success: true, data: { customers, suppliers, products } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDashboardData(organizationId: string) {
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
