'use server';

import prisma from '@/lib/db';

export async function getTrialBalanceAction(organizationId: string) {
  try {
    const accounts = await prisma.account.findMany({
      where: { organizationId },
      include: {
        group: true,
        transactions: true,
      }
    });

    let totalDebit = 0;
    let totalCredit = 0;

    const report = accounts.map(acc => {
      let debitSum = 0;
      let creditSum = 0;

      acc.transactions.forEach(t => {
        if (t.type === 'DEBIT') debitSum += t.amount;
        if (t.type === 'CREDIT') creditSum += t.amount;
      });

      const netBalance = debitSum - creditSum;
      if (netBalance >= 0) {
        totalDebit += netBalance;
      } else {
        totalCredit += Math.abs(netBalance);
      }

      return {
        id: acc.id,
        name: acc.name,
        group: acc.group.name,
        nature: acc.group.nature,
        debit: netBalance >= 0 ? netBalance : 0,
        credit: netBalance < 0 ? Math.abs(netBalance) : 0,
      };
    });

    return {
      success: true,
      data: {
        report,
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getFinancialSummaryAction(organizationId: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { organizationId },
      include: { customer: true }
    });

    const totalSales = invoices.reduce((acc, inv) => acc + inv.totalTaxable, 0);
    const totalTax = invoices.reduce((acc, inv) => acc + inv.totalTax, 0);
    const grandTotalSales = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

    const vouchers = await prisma.voucher.findMany({
      where: { organizationId, type: 'PURCHASE' },
      include: { transactions: true }
    });

    const totalPurchases = vouchers.reduce((acc, v) => {
      const dbSum = v.transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
      return acc + dbSum;
    }, 0);

    const netProfit = totalSales - totalPurchases;

    return {
      success: true,
      data: {
        totalSales,
        totalTax,
        grandTotalSales,
        totalPurchases,
        netProfit,
        invoiceCount: invoices.length,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
