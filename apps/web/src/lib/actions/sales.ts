'use server';

import { auth } from '@/auth';

import { AccountingEngine } from '@/lib/engine/accounting';
import { GSTEngine } from '@/lib/engine/gst';
import { InventoryEngine } from '@/lib/engine/inventory';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createSalesInvoiceAction(params: {
  organizationId: string;
  customerId: string;
  invoiceNo: string;
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
    // 1. Calculate taxes per item and aggregate
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

    // 2. Fetch or create required ledgers
    const getOrCreateAccount = async (name: string) => {
      let acc = await prisma.account.findFirst({ where: { name, organizationId: params.organizationId } });
      if (!acc) {
        let group = await prisma.ledgerGroup.findFirst({ where: { name: 'Direct Incomes' } });
        if (!group) group = await prisma.ledgerGroup.create({ data: { name: 'Direct Incomes', nature: 'INCOME' } });
        acc = await prisma.account.create({ data: { organizationId: params.organizationId, groupId: group.id, name } });
      }
      return acc;
    };

    let salesAcc = await getOrCreateAccount('Sales Account');
    let cgstAcc = await getOrCreateAccount('Output CGST');
    let sgstAcc = await getOrCreateAccount('Output SGST');
    let igstAcc = await getOrCreateAccount('Output IGST');

    // 3. Generate double-entry voucher
    const entries = GSTEngine.generateSalesVoucherEntries(
      params.customerId,
      salesAcc.id,
      cgstAcc.id,
      sgstAcc.id,
      igstAcc.id,
      { taxableAmount: totalTaxable, cgst: totalCgst, sgst: totalSgst, igst: totalIgst, totalAmount: grandTotal }
    );

    const voucher = await AccountingEngine.postVoucher({
      organizationId: params.organizationId,
      type: 'SALES',
      date: new Date(),
      narration: params.narration,
      entries,
    });

    // 4. Create Invoice Record
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: params.organizationId,
        customerId: params.customerId,
        invoiceNo: params.invoiceNo,
        isInterState: params.isInterState,
        totalTaxable,
        totalTax: totalCgst + totalSgst + totalIgst,
        grandTotal,
        lines: {
          create: lineResults.map(({ item, tax }) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxableAmount: tax.taxableAmount,
            gstRate: item.gstRate,
            totalAmount: tax.totalAmount,
          }))
        }
      }
    });

    // 5. Update Inventory (Deduct stock)
    for (const { item } of lineResults) {
      await InventoryEngine.processStockMovement(
        params.organizationId,
        item.productId,
        item.quantity,
        'OUT'
      );
    }

    revalidatePath('/');
    return { success: true, data: { invoice, voucher } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
