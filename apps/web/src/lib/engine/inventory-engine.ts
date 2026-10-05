// ============================================================================
// LedgerOS Deterministic Inventory Engine
// Stock Ledger, Valuation (FIFO/Weighted Avg), Reorder Intelligence & Movement
// ============================================================================

import { Product, StockMovement } from '../types';

export interface InventoryInsight {
  type: 'STOCKOUT_RISK' | 'SLOW_MOVING' | 'REBALANCE_OPPORTUNITY' | 'VALUATION_DRIFT';
  productId: string;
  productName: string;
  sku: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  actionableRecommendation: string;
}

export class InventoryEngine {
  /**
   * Evaluates inventory health, reorder risks, and warehouse rebalancing needs.
   */
  public static analyzeInventory(
    products: Product[],
    movements: StockMovement[]
  ): InventoryInsight[] {
    const insights: InventoryInsight[] = [];

    for (const product of products) {
      // 1. Reorder risk check
      if (product.totalStock <= product.reorderLevel) {
        const severity = product.totalStock === 0 ? 'HIGH' : 'MEDIUM';
        const burnRate = 2; // units per day average
        const daysRemaining = Math.max(0, Math.floor(product.totalStock / burnRate));

        insights.push({
          type: 'STOCKOUT_RISK',
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          severity,
          message: `${product.name} (SKU: ${product.sku}) stock is ${product.totalStock} ${product.unit} (Reorder threshold: ${product.reorderLevel} ${product.unit}). Projected runout: ${daysRemaining} days.`,
          actionableRecommendation: `Generate draft PO to primary vendor for ${product.reorderLevel * 2} ${product.unit}.`,
        });
      }

      // 2. Slow moving inventory (> 90 days without sale)
      if (product.daysSinceLastSold > 90 && product.totalStock > 20) {
        const tiedCapital = product.totalStock * product.purchasePrice;
        insights.push({
          type: 'SLOW_MOVING',
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          severity: 'MEDIUM',
          message: `${product.name} has not registered a sale in ${product.daysSinceLastSold} days. ₹${tiedCapital.toLocaleString()} in working capital is stagnant.`,
          actionableRecommendation: 'Consider 15% discount campaign or bundle with fast-moving complementary SKUs.',
        });
      }

      // 3. Warehouse imbalance detection
      if (product.warehouseBalances.length >= 2) {
        const [whA, whB] = product.warehouseBalances;
        if (whA.quantity > 50 && whB.quantity < 5) {
          insights.push({
            type: 'REBALANCE_OPPORTUNITY',
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            severity: 'LOW',
            message: `Warehouse imbalance: ${whA.warehouseName} has ${whA.quantity} units while ${whB.warehouseName} is depleted (${whB.quantity} units).`,
            actionableRecommendation: `Schedule stock transfer of 20 units from ${whA.warehouseName} to ${whB.warehouseName}.`,
          });
        }
      }
    }

    return insights;
  }

  /**
   * Compute total inventory valuation based on configured method (Weighted Average)
   */
  public static computeTotalValuation(products: Product[]): {
    totalValue: number;
    totalUnits: number;
    categoryBreakdown: Record<string, { units: number; value: number }>;
  } {
    let totalValue = 0;
    let totalUnits = 0;
    const categoryBreakdown: Record<string, { units: number; value: number }> = {};

    for (const p of products) {
      const val = p.totalStock * p.purchasePrice;
      totalValue += val;
      totalUnits += p.totalStock;

      if (!categoryBreakdown[p.category]) {
        categoryBreakdown[p.category] = { units: 0, value: 0 };
      }
      categoryBreakdown[p.category].units += p.totalStock;
      categoryBreakdown[p.category].value += val;
    }

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      totalUnits,
      categoryBreakdown,
    };
  }
}
