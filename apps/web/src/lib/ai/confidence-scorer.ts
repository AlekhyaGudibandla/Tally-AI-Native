// ============================================================================
// LedgerOS Multi-Dimensional AI Confidence Engine & Safety Governance
// Based on deterministic mathematical checks, not hallucinations.
// ============================================================================

import { AIConfidenceBreakdown, AISafetyLevel } from '../types';

export class ConfidenceScorer {
  /**
   * Computes a multi-dimensional confidence breakdown from observable evidence.
   */
  public static evaluateProposal(evidence: {
    ocrClarity: number;             // 0 - 100
    hasValidGSTIN: boolean;
    hasValidHSN: boolean;
    debitCreditBalanced: boolean;
    matchedExistingVendor: boolean;
    hasMatchingPO: boolean;
    amount: number;
  }): { breakdown: AIConfidenceBreakdown; safetyLevel: AISafetyLevel; requiresApproval: boolean; reasons: string[] } {
    const extraction = evidence.ocrClarity;
    const classification = evidence.matchedExistingVendor ? 96 : 72;
    const accounting = evidence.debitCreditBalanced ? 100 : 0;
    const tax = evidence.hasValidGSTIN && evidence.hasValidHSN ? 98 : evidence.hasValidGSTIN ? 80 : 50;
    const matching = evidence.hasMatchingPO ? 95 : 65;

    // Weighted composite score
    const overallScore = Math.round(
      extraction * 0.2 +
      classification * 0.2 +
      accounting * 0.3 +
      tax * 0.15 +
      matching * 0.15
    );

    let riskRating: AIConfidenceBreakdown['riskRating'] = 'LOW';
    if (!evidence.debitCreditBalanced || overallScore < 60) {
      riskRating = 'CRITICAL';
    } else if (evidence.amount > 100000 || !evidence.hasMatchingPO || tax < 70) {
      riskRating = 'HIGH';
    } else if (overallScore < 85) {
      riskRating = 'MEDIUM';
    }

    // Safety Level determination
    let safetyLevel: AISafetyLevel = 'LEVEL_2_DRAFT';
    let requiresApproval = true;
    const reasons: string[] = [];

    if (!evidence.debitCreditBalanced) {
      safetyLevel = 'LEVEL_5_PROHIBITED';
      requiresApproval = true;
      reasons.push('Prohibited: Total debits do not equal total credits. Cannot post unbalanced voucher.');
    } else if (evidence.amount > 100000) {
      safetyLevel = 'LEVEL_4_HIGH_RISK';
      requiresApproval = true;
      reasons.push(`High Value Policy: Amount ₹${evidence.amount.toLocaleString()} exceeds threshold of ₹1,00,000. Finance Controller approval required.`);
    } else if (evidence.amount <= 10000 && overallScore >= 95 && evidence.hasMatchingPO) {
      safetyLevel = 'LEVEL_3_LOW_RISK';
      requiresApproval = false; // Auto-executable routine transaction
      reasons.push('Routine transaction policy: Verified under ₹10,000 threshold with 95%+ confidence. Eligible for auto-posting.');
    } else {
      safetyLevel = 'LEVEL_2_DRAFT';
      requiresApproval = true;
      reasons.push('Standard review policy: Transaction prepared as verified draft awaiting staff confirmation.');
    }

    return {
      breakdown: {
        extraction,
        classification,
        accounting,
        tax,
        matching,
        overallScore,
        riskRating,
      },
      safetyLevel,
      requiresApproval,
      reasons,
    };
  }
}
