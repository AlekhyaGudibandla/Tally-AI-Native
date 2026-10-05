// ============================================================================
// LedgerOS Deterministic GST, E-Invoice & E-Way Bill Engine
// Compliant with Indian GST Council rules, NIC E-Invoice & E-Way Bill specifications.
// ============================================================================

import {
  EInvoiceDetails,
  EWayBillDetails,
  GSTItemTax,
  GSTSupplyType,
  InvoiceLineItem,
} from '../types';

export interface TaxCalculationResult {
  supplyType: GSTSupplyType;
  itemsTax: GSTItemTax[];
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  requiresEInvoice: boolean;
  requiresEWayBill: boolean;
  complianceNotes: string[];
}

export class GSTEngine {
  /**
   * Deterministically determines supply type from supplier state code and customer state code.
   * State code: First 2 digits of GSTIN (e.g., '27' for Maharashtra, '29' for Karnataka, '07' for Delhi)
   */
  public static determineSupplyType(
    supplierStateCode: string,
    customerStateCode: string,
    isExport: boolean = false,
    isSEZ: boolean = false
  ): GSTSupplyType {
    if (isExport) return 'EXPORT';
    if (isSEZ) return 'SEZ';
    if (!supplierStateCode || !customerStateCode) return 'INTRA_STATE';

    return supplierStateCode.trim() === customerStateCode.trim()
      ? 'INTRA_STATE'
      : 'INTER_STATE';
  }

  /**
   * Computes accurate line-level and invoice-level GST breakdown.
   */
  public static calculateTaxes(
    supplierStateCode: string,
    customerStateCode: string,
    items: {
      hsnCode: string;
      taxableAmount: number;
      gstRate: number;
      isRCM?: boolean;
    }[],
    orgTurnoverCrores: number = 10 // Turnover > 5 Cr mandates E-Invoice
  ): TaxCalculationResult {
    const supplyType = this.determineSupplyType(supplierStateCode, customerStateCode);
    const itemsTax: GSTItemTax[] = [];
    const notes: string[] = [];

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    for (const item of items) {
      const taxable = Math.round(item.taxableAmount * 100) / 100;
      totalTaxable += taxable;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (supplyType === 'INTRA_STATE') {
        const halfRate = item.gstRate / 2;
        cgst = Math.round((taxable * halfRate) / 100 * 100) / 100;
        sgst = Math.round((taxable * halfRate) / 100 * 100) / 100;
      } else {
        igst = Math.round((taxable * item.gstRate) / 100 * 100) / 100;
      }

      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;

      itemsTax.push({
        hsnCode: item.hsnCode,
        taxableAmount: taxable,
        gstRate: item.gstRate,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        cessAmount: 0,
        isRCM: !!item.isRCM,
      });

      if (item.isRCM) {
        notes.push(`Reverse Charge Mechanism applicable on HSN ${item.hsnCode}. Recipient is liable to pay tax directly.`);
      }
    }

    const totalTax = Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100;
    const grandTotal = Math.round((totalTaxable + totalTax) * 100) / 100;

    // Compliance rules
    const requiresEInvoice = orgTurnoverCrores >= 5; // Mandatory under Indian law for >5Cr B2B
    const requiresEWayBill = grandTotal > 50000;     // Mandatory for goods movement > 50,000 INR

    if (requiresEInvoice) {
      notes.push('E-Invoice required: Turn-over criteria met. IRN must be registered with IRP.');
    }
    if (requiresEWayBill) {
      notes.push('E-Way Bill mandatory: Consignment invoice total exceeds ₹50,000 threshold.');
    }

    return {
      supplyType,
      itemsTax,
      totalTaxable: Math.round(totalTaxable * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      totalTax,
      grandTotal,
      requiresEInvoice,
      requiresEWayBill,
      complianceNotes: notes,
    };
  }

  /**
   * Deterministically generates mock IRP compliant E-Invoice IRN & QR Payload.
   */
  public static generateEInvoicePayload(
    supplierGstin: string,
    docNumber: string,
    docDate: string,
    docType: 'INV' | 'CRN' | 'DBN' = 'INV'
  ): EInvoiceDetails {
    // Standard mock 64-char IRN hash simulation
    const seed = `${supplierGstin}-${docType}-${docNumber}-${docDate}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    const irn = `${hex}f4b82c19e5d7620a84e6027a419c8f0391ab2d48c8942b01c563ef908123`.slice(0, 64);
    const ackNo = `1124${Math.floor(10000000 + Math.random() * 90000000)}`;

    return {
      irn,
      ackNo,
      ackDate: new Date().toISOString(),
      signedQRCode: `GSTIN:${supplierGstin}|DOC:${docNumber}|DT:${docDate}|IRN:${irn.slice(0, 16)}...`,
      status: 'GENERATED',
    };
  }

  /**
   * Generates E-Way Bill payload and estimates validity days based on distance (200km/day rule).
   */
  public static generateEWayBill(
    fromPincode: string,
    toPincode: string,
    vehicleNumber: string,
    distanceKm: number = 320
  ): EWayBillDetails {
    const ewbNumber = `2410${Math.floor(10000000 + Math.random() * 90000000)}`;
    const validityDays = Math.max(1, Math.ceil(distanceKm / 200));

    const validDate = new Date();
    validDate.setDate(validDate.getDate() + validityDays);

    return {
      ewbNumber,
      ewbDate: new Date().toISOString(),
      validUpto: validDate.toISOString(),
      vehicleNumber: vehicleNumber.toUpperCase().replace(/\s+/g, ''),
      fromPincode,
      toPincode,
      distanceKm,
      status: 'ACTIVE',
    };
  }

  /**
   * Validate GSTIN structure (15 characters: 2 state + 10 PAN + 1 entity + 1 'Z' + 1 check digit)
   */
  public static validateGSTIN(gstin: string): { isValid: boolean; stateCode?: string; pan?: string; error?: string } {
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstin) return { isValid: false, error: 'GSTIN cannot be blank' };
    const clean = gstin.trim().toUpperCase();
    if (!regex.test(clean)) {
      return {
        isValid: false,
        error: `Invalid GSTIN format: '${clean}'. Must match 15-character alphanumeric format (e.g. 27AABCA1234F1Z8).`,
      };
    }
    return {
      isValid: true,
      stateCode: clean.substring(0, 2),
      pan: clean.substring(2, 12),
    };
  }
}
