// ============================================================================
// LedgerOS 3-Way Matching Engine: PO ↔ GRN ↔ Invoice
// Deterministic variance analysis for procurement & AP controls.
// ============================================================================

import { GoodsReceiptNote, PurchaseOrder, ThreeWayMatchResult } from '../types';

export interface InvoiceMatchInput {
  invoiceNumber: string;
  vendorName: string;
  poNumber: string;
  items: {
    productId: string;
    productName: string;
    invoicedQty: number;
    unitPrice: number;
  }[];
}

export class ThreeWayMatchEngine {
  /**
   * Deterministically verifies 3-Way alignment between Purchase Order, GRN, and Invoiced line items.
   */
  public static match(
    invoice: InvoiceMatchInput,
    po?: PurchaseOrder,
    grn?: GoodsReceiptNote,
    priceTolerancePercent: number = 0, // strict 0% price tolerance by default
    quantityTolerancePercent: number = 0
  ): ThreeWayMatchResult {
    const discrepancies: string[] = [];

    // Check 1: Existence of PO
    if (!po) {
      return {
        matchId: `match-${Date.now()}`,
        poNumber: invoice.poNumber || 'UNKNOWN',
        grnNumber: grn?.grnNumber || 'NOT_FOUND',
        invoiceNumber: invoice.invoiceNumber,
        vendorName: invoice.vendorName,
        status: 'MISSING_PO',
        variancePercent: 100,
        priceVariance: 0,
        quantityVariance: 0,
        discrepancyDetails: ['No matching approved Purchase Order found for this vendor invoice.'],
        aiRecommendation: 'Flag for Procurement review. Do not process payment without an authorized PO.',
        requiresFinanceApproval: true,
      };
    }

    // Check 2: Existence of GRN (Goods Receipt)
    if (!grn) {
      return {
        matchId: `match-${Date.now()}`,
        poNumber: po.poNumber,
        grnNumber: 'NOT_FOUND',
        invoiceNumber: invoice.invoiceNumber,
        vendorName: invoice.vendorName,
        status: 'MISSING_GRN',
        variancePercent: 100,
        priceVariance: 0,
        quantityVariance: 0,
        discrepancyDetails: ['No Goods Receipt Note (GRN) found in warehouse records for PO ' + po.poNumber],
        aiRecommendation: 'Hold invoice payment. Awaiting warehouse intake & physical inspection sign-off.',
        requiresFinanceApproval: true,
      };
    }

    let totalPriceVariance = 0;
    let totalQtyVariance = 0;
    let hasPriceError = false;
    let hasQtyError = false;

    // Line-by-line verification
    for (const invItem of invoice.items) {
      const poItem = po.items.find(
        (p) => p.productId === invItem.productId || p.productName.toLowerCase() === invItem.productName.toLowerCase()
      );
      const grnItem = grn.items.find(
        (g) => g.productId === invItem.productId || g.productName.toLowerCase() === invItem.productName.toLowerCase()
      );

      if (!poItem) {
        discrepancies.push(`Item '${invItem.productName}' on invoice is NOT present on PO ${po.poNumber}.`);
        hasQtyError = true;
        continue;
      }

      // Price comparison (Invoice vs PO)
      const priceDiff = invItem.unitPrice - poItem.unitPrice;
      const priceDiffPct = poItem.unitPrice > 0 ? (priceDiff / poItem.unitPrice) * 100 : 0;

      if (priceDiffPct > priceTolerancePercent) {
        hasPriceError = true;
        totalPriceVariance += priceDiff * invItem.invoicedQty;
        discrepancies.push(
          `Price variance on '${invItem.productName}': Invoiced at ₹${invItem.unitPrice.toLocaleString()} vs PO price ₹${poItem.unitPrice.toLocaleString()} (+${priceDiffPct.toFixed(1)}%).`
        );
      }

      // Quantity comparison (Invoice vs GRN Accepted Qty)
      const acceptedQty = grnItem ? grnItem.acceptedQty : 0;
      if (invItem.invoicedQty > acceptedQty) {
        hasQtyError = true;
        const diffQty = invItem.invoicedQty - acceptedQty;
        totalQtyVariance += diffQty;
        discrepancies.push(
          `Quantity mismatch on '${invItem.productName}': Invoiced for ${invItem.invoicedQty} units, but warehouse verified only ${acceptedQty} accepted units (${diffQty} units overbilled).`
        );
      }
    }

    let status: ThreeWayMatchResult['status'] = 'PERFECT_MATCH';
    let recommendation = 'All 3 documents match approved quantities and rates. Ready for auto-approval.';
    let requiresFinanceApproval = false;

    if (hasPriceError && hasQtyError) {
      status = 'PRICE_DISCREPANCY';
      recommendation = 'Multiple critical discrepancies detected in both unit rate and billable quantity. Require Controller approval.';
      requiresFinanceApproval = true;
    } else if (hasPriceError) {
      status = 'PRICE_DISCREPANCY';
      recommendation = `Price variance detected (+₹${totalPriceVariance.toLocaleString()}). Request credit note or revised invoice from vendor.`;
      requiresFinanceApproval = true;
    } else if (hasQtyError) {
      status = 'QUANTITY_DISCREPANCY';
      recommendation = `Billed quantity exceeds warehouse GRN accepted quantity. Withhold payment for unverified units.`;
      requiresFinanceApproval = true;
    }

    const variancePercent =
      po.totalAmount > 0
        ? Math.min(100, (Math.abs(totalPriceVariance) / po.totalAmount) * 100)
        : 0;

    return {
      matchId: `match-${Date.now()}`,
      poNumber: po.poNumber,
      grnNumber: grn.grnNumber,
      invoiceNumber: invoice.invoiceNumber,
      vendorName: invoice.vendorName,
      status,
      variancePercent: Math.round(variancePercent * 10) / 10,
      priceVariance: Math.round(totalPriceVariance * 100) / 100,
      quantityVariance: totalQtyVariance,
      discrepancyDetails: discrepancies,
      aiRecommendation: recommendation,
      requiresFinanceApproval,
    };
  }
}
