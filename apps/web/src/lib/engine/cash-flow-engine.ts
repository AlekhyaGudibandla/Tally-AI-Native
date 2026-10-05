// ============================================================================
// LedgerOS Cash Flow Forecasting Engine
// Deterministic 30/60/90-day scenarios based on receivables aging & payables schedules.
// ============================================================================

import { Invoice } from '../types';

export interface CashForecastBucket {
  period: 'CURRENT' | 'DAY_30' | 'DAY_60' | 'DAY_90';
  label: string;
  expectedInflows: number;
  expectedOutflows: number;
  netCashFlow: number;
  projectedBalanceBase: number;
  projectedBalanceConservative: number;
  projectedBalanceOptimistic: number;
  minimumThresholdBreached: boolean;
}

export interface CashFlowReport {
  currentLiquidCash: number;
  minimumSafetyThreshold: number;
  burnRatePerMonth: number;
  buckets: CashForecastBucket[];
  keyRisks: string[];
  recommendations: string[];
}

export class CashFlowEngine {
  public static forecast(
    currentCash: number,
    receivables: Invoice[],
    pendingPayablesAmount: number,
    monthlyFixedCost: number = 350000, // Salaries + Rent + Utilities
    safetyThreshold: number = 500000   // ₹5,00,000 threshold
  ): CashFlowReport {
    // Group receivables by aging probability
    let rec0to30 = 0;
    let rec31to60 = 0;
    let rec61to90 = 0;

    const today = new Date();

    receivables
      .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
      .forEach((inv) => {
        const dueDate = new Date(inv.dueDate);
        const diffDays = Math.round((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

        if (diffDays <= 0) {
          rec0to30 += inv.balanceAmount;
        } else if (diffDays <= 30) {
          rec0to30 += inv.balanceAmount;
        } else if (diffDays <= 60) {
          rec31to60 += inv.balanceAmount;
        } else {
          rec61to90 += inv.balanceAmount;
        }
      });

    // Buckets computation
    // Period 1: Day 1-30
    const in30Base = rec0to30 * 0.9 + rec31to60 * 0.5;
    const in30Conserv = rec0to30 * 0.75 + rec31to60 * 0.3;
    const in30Optim = rec0to30 * 0.98 + rec31to60 * 0.8;
    const out30 = pendingPayablesAmount * 0.6 + monthlyFixedCost;

    const bal30Base = currentCash + in30Base - out30;
    const bal30Conserv = currentCash + in30Conserv - (out30 * 1.05);
    const bal30Optim = currentCash + in30Optim - (out30 * 0.95);

    // Period 2: Day 31-60
    const in60Base = rec31to60 * 0.7 + 400000; // recurring projected sales
    const in60Conserv = rec31to60 * 0.5 + 300000;
    const in60Optim = rec31to60 * 0.85 + 550000;
    const out60 = pendingPayablesAmount * 0.4 + monthlyFixedCost;

    const bal60Base = bal30Base + in60Base - out60;
    const bal60Conserv = bal30Conserv + in60Conserv - (out60 * 1.05);
    const bal60Optim = bal30Optim + in60Optim - (out60 * 0.95);

    // Period 3: Day 61-90
    const in90Base = rec61to90 * 0.4 + 450000;
    const in90Conserv = rec61to90 * 0.2 + 320000;
    const in90Optim = rec61to90 * 0.6 + 600000;
    const out90 = monthlyFixedCost + 150000; // regular opex

    const bal90Base = bal60Base + in90Base - out90;
    const bal90Conserv = bal60Conserv + in90Conserv - (out90 * 1.05);
    const bal90Optim = bal60Optim + in90Optim - (out90 * 0.95);

    const buckets: CashForecastBucket[] = [
      {
        period: 'CURRENT',
        label: 'Today',
        expectedInflows: 0,
        expectedOutflows: 0,
        netCashFlow: 0,
        projectedBalanceBase: currentCash,
        projectedBalanceConservative: currentCash,
        projectedBalanceOptimistic: currentCash,
        minimumThresholdBreached: currentCash < safetyThreshold,
      },
      {
        period: 'DAY_30',
        label: '30 Days',
        expectedInflows: Math.round(in30Base),
        expectedOutflows: Math.round(out30),
        netCashFlow: Math.round(in30Base - out30),
        projectedBalanceBase: Math.round(bal30Base),
        projectedBalanceConservative: Math.round(bal30Conserv),
        projectedBalanceOptimistic: Math.round(bal30Optim),
        minimumThresholdBreached: bal30Conserv < safetyThreshold,
      },
      {
        period: 'DAY_60',
        label: '60 Days',
        expectedInflows: Math.round(in60Base),
        expectedOutflows: Math.round(out60),
        netCashFlow: Math.round(in60Base - out60),
        projectedBalanceBase: Math.round(bal60Base),
        projectedBalanceConservative: Math.round(bal60Conserv),
        projectedBalanceOptimistic: Math.round(bal60Optim),
        minimumThresholdBreached: bal60Conserv < safetyThreshold,
      },
      {
        period: 'DAY_90',
        label: '90 Days',
        expectedInflows: Math.round(in90Base),
        expectedOutflows: Math.round(out90),
        netCashFlow: Math.round(in90Base - out90),
        projectedBalanceBase: Math.round(bal90Base),
        projectedBalanceConservative: Math.round(bal90Conserv),
        projectedBalanceOptimistic: Math.round(bal90Optim),
        minimumThresholdBreached: bal90Conserv < safetyThreshold,
      },
    ];

    const keyRisks: string[] = [];
    const recommendations: string[] = [];

    if (bal30Conserv < safetyThreshold) {
      keyRisks.push(`Under conservative scenario, cash reserves may dip below threshold (₹${safetyThreshold.toLocaleString()}) within 30 days.`);
      recommendations.push('Trigger proactive follow-up with top 3 debtors who owe > ₹1,00,000 via AI Collection Assistant.');
    }
    if (pendingPayablesAmount > currentCash * 0.8) {
      keyRisks.push('Pending supplier liabilities exceed 80% of immediate bank cash.');
      recommendations.push('Stagger non-critical vendor disbursements to match expected collections in week 3.');
    }

    return {
      currentLiquidCash: currentCash,
      minimumSafetyThreshold: safetyThreshold,
      burnRatePerMonth: monthlyFixedCost,
      buckets,
      keyRisks,
      recommendations,
    };
  }
}
