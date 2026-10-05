import prisma from '@/lib/db';

export class InventoryEngine {
  /**
   * Processes stock changes when an invoice is issued or a purchase is made.
   */
  public static async processStockMovement(
    organizationId: string,
    productId: string,
    quantity: number,
    movementType: 'IN' | 'OUT'
  ) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error(`Product ${productId} not found`);

    if (movementType === 'OUT' && product.currentStock < quantity) {
      throw new Error(`Insufficient stock for product ${product.name}. Current: ${product.currentStock}, Required: ${quantity}`);
    }

    const modifier = movementType === 'IN' ? quantity : -quantity;

    // Update stock atomically
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { currentStock: { increment: modifier } }
    });

    return updatedProduct;
  }
}
