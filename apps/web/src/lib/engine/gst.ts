/**
 * GST Engine
 * Handles tax calculations (CGST, SGST, IGST) based on place of supply.
 */

export type TaxCalculationResult = {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
};

export class GSTEngine {
  /**
   * Calculates GST components for a given taxable amount and tax rate.
   * 
   * @param taxableAmount The base amount before taxes
   * @param taxRate The total GST percentage (e.g., 18 for 18%)
   * @param isInterState If true, charges IGST. If false, splits into CGST/SGST.
   */
  public static calculateTax(
    taxableAmount: number,
    taxRate: number,
    isInterState: boolean
  ): TaxCalculationResult {
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = (taxableAmount * taxRate) / 100;
    } else {
      const splitRate = taxRate / 2;
      cgst = (taxableAmount * splitRate) / 100;
      sgst = (taxableAmount * splitRate) / 100;
    }

    // Round to 2 decimal places
    cgst = Math.round(cgst * 100) / 100;
    sgst = Math.round(sgst * 100) / 100;
    igst = Math.round(igst * 100) / 100;

    const totalAmount = Math.round((taxableAmount + cgst + sgst + igst) * 100) / 100;

    return {
      taxableAmount,
      cgst,
      sgst,
      igst,
      totalAmount,
    };
  }

  /**
   * Generates the precise double-entry line items for a Sales Invoice.
   */
  public static generateSalesVoucherEntries(
    customerId: string,
    salesAccountId: string,
    cgstAccountId: string,
    sgstAccountId: string,
    igstAccountId: string,
    taxResult: TaxCalculationResult
  ) {
    const entries = [];

    // 1. Debit the Customer (Total Amount)
    entries.push({
      accountId: customerId,
      amount: taxResult.totalAmount,
      type: 'DEBIT' as const,
    });

    // 2. Credit Sales (Taxable Amount)
    entries.push({
      accountId: salesAccountId,
      amount: taxResult.taxableAmount,
      type: 'CREDIT' as const,
    });

    // 3. Credit Output Taxes
    if (taxResult.cgst > 0) {
      entries.push({
        accountId: cgstAccountId,
        amount: taxResult.cgst,
        type: 'CREDIT' as const,
      });
    }
    if (taxResult.sgst > 0) {
      entries.push({
        accountId: sgstAccountId,
        amount: taxResult.sgst,
        type: 'CREDIT' as const,
      });
    }
    if (taxResult.igst > 0) {
      entries.push({
        accountId: igstAccountId,
        amount: taxResult.igst,
        type: 'CREDIT' as const,
      });
    }

    return entries;
  }
}
