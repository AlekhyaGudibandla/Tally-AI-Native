'use server';

import { AccountingEngine } from '@/lib/engine/accounting';
import { GSTEngine } from '@/lib/engine/gst';
import { InventoryEngine } from '@/lib/engine/inventory';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createPurchaseInvoiceAction(params: {
  organizationId: string;
  supplierId: string;
  billNo: string;
  isInterState: boolean;
  narration: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
  }>;
}) {
  try {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let grandTotal = 0;

    const lineResults = params.items.map(item => {
      const taxable = item.quantity * item.unitPrice;
      const tax = GSTEngine.calculateTax(taxable, item.gstRate, params.isInterState);
      
      totalTaxable += tax.taxableAmount;
      totalCgst += tax.cgst;
      totalSgst += tax.sgst;
      totalIgst += tax.igst;
      grandTotal += tax.totalAmount;

      return { item, tax };
    });

    // Helper to get or create ledger account
    const getOrCreateAccount = async (name: string) => {
      let acc = await prisma.account.findFirst({ where: { name, organizationId: params.organizationId } });
      if (!acc) {
        let group = await prisma.ledgerGroup.findFirst({ where: { name: 'Direct Expenses' } });
        if (!group) group = await prisma.ledgerGroup.create({ data: { name: 'Direct Expenses', nature: 'EXPENSE' } });
        acc = await prisma.account.create({ data: { organizationId: params.organizationId, groupId: group.id, name } });
      }
      return acc;
    };

    let purchaseAcc = await getOrCreateAccount('Purchase Account');
    let cgstAcc = await getOrCreateAccount('Input CGST');
    let sgstAcc = await getOrCreateAccount('Input SGST');
    let igstAcc = await getOrCreateAccount('Input IGST');

    // Debit Purchase Account & Input Taxes, Credit Supplier Account
    const entries: Array<{ accountId: string; amount: number; type: 'DEBIT' | 'CREDIT' }> = [
      { accountId: purchaseAcc.id, amount: totalTaxable, type: 'DEBIT' }
    ];

    if (totalCgst > 0) entries.push({ accountId: cgstAcc.id, amount: totalCgst, type: 'DEBIT' });
    if (totalSgst > 0) entries.push({ accountId: sgstAcc.id, amount: totalSgst, type: 'DEBIT' });
    if (totalIgst > 0) entries.push({ accountId: igstAcc.id, amount: totalIgst, type: 'DEBIT' });

    // Credit Supplier / Sundry Creditor
    entries.push({ accountId: params.supplierId, amount: grandTotal, type: 'CREDIT' });

    const voucher = await AccountingEngine.postVoucher({
      organizationId: params.organizationId,
      type: 'PURCHASE',
      date: new Date(),
      narration: params.narration || `Purchase Bill #${params.billNo}`,
      entries,
    });

    // Stock Movement (Add inventory IN)
    for (const { item } of lineResults) {
      await InventoryEngine.processStockMovement(
        params.organizationId,
        item.productId,
        item.quantity,
        'IN'
      );
    }

    revalidatePath('/');
    return { success: true, data: { voucher } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
