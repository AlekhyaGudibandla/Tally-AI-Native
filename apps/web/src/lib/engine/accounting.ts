import prisma from '@/lib/db';

export type EntryParams = {
  accountId: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
};

export type PostVoucherParams = {
  organizationId: string;
  type: 'SALES' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT' | 'JOURNAL' | 'CONTRA';
  date: Date;
  narration?: string;
  entries: EntryParams[];
};

export class AccountingEngine {
  /**
   * Validates if a set of entries satisfies the double-entry invariant:
   * SUM(DEBIT) === SUM(CREDIT)
   */
  public static validateInvariant(entries: EntryParams[]): boolean {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      if (entry.amount <= 0) throw new Error('Amount must be positive');
      
      if (entry.type === 'DEBIT') {
        totalDebit += entry.amount;
      } else {
        totalCredit += entry.amount;
      }
    }

    // Floating point comparison safeguard (e.g. 0.1 + 0.2 === 0.30000000000000004)
    return Math.abs(totalDebit - totalCredit) < 0.001;
  }

  /**
   * Posts a mathematically perfect double-entry voucher to the ledger.
   * Runs inside an atomic database transaction.
   */
  public static async postVoucher(params: PostVoucherParams) {
    if (!this.validateInvariant(params.entries)) {
      throw new Error('Voucher rejected: Debits and Credits do not match.');
    }

    // Generate a voucher number (e.g. JV-2026-1023)
    const voucherNo = `${params.type.substring(0, 3)}-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

    return await prisma.$transaction(async (tx) => {
      // 1. Create the Voucher Header
      const voucher = await tx.voucher.create({
        data: {
          organizationId: params.organizationId,
          voucherNo,
          type: params.type,
          date: params.date,
          narration: params.narration,
          isReversed: false,
        },
      });

      // 2. Create the Transaction Lines
      for (const entry of params.entries) {
        await tx.transaction.create({
          data: {
            voucherId: voucher.id,
            accountId: entry.accountId,
            amount: entry.amount,
            type: entry.type,
          },
        });

        // 3. Update the cached account balance (for faster reads)
        // Note: For real enterprise apps, you'd calculate this on the fly or use a view,
        // but caching is acceptable for demonstration.
        const account = await tx.account.findUnique({ where: { id: entry.accountId } });
        if (!account) throw new Error(`Account ${entry.accountId} not found.`);

        // Adjust balance based on typical account nature (simplified)
        // Usually: Assets/Expenses increase with Debit. Liabilities/Equity/Revenue increase with Credit.
        let balanceModifier = 0;
        
        // Fetch group to know nature
        const group = await tx.ledgerGroup.findUnique({ where: { id: account.groupId } });
        const nature = group?.nature || 'ASSET';

        if (['ASSET', 'EXPENSE'].includes(nature)) {
          balanceModifier = entry.type === 'DEBIT' ? entry.amount : -entry.amount;
        } else {
          balanceModifier = entry.type === 'CREDIT' ? entry.amount : -entry.amount;
        }

        await tx.account.update({
          where: { id: account.id },
          data: {
            balance: account.balance + balanceModifier
          }
        });
      }

      return voucher;
    });
  }

  /**
   * Immutably reverses a posted voucher.
   */
  public static async reverseVoucher(voucherId: string, narration: string) {
    return await prisma.$transaction(async (tx) => {
      const originalVoucher = await tx.voucher.findUnique({
        where: { id: voucherId },
        include: { transactions: true },
      });

      if (!originalVoucher) throw new Error('Voucher not found');
      if (originalVoucher.isReversed) throw new Error('Voucher is already reversed');

      // Create Reversal Voucher
      const reversalVoucher = await tx.voucher.create({
        data: {
          organizationId: originalVoucher.organizationId,
          voucherNo: `REV-${originalVoucher.voucherNo}`,
          type: 'JOURNAL',
          date: new Date(),
          narration: `Reversal of ${originalVoucher.voucherNo}: ${narration}`,
        },
      });

      // Flip the entries
      for (const entry of originalVoucher.transactions) {
        const flippedType = entry.type === 'DEBIT' ? 'CREDIT' : 'DEBIT';
        
        await tx.transaction.create({
          data: {
            voucherId: reversalVoucher.id,
            accountId: entry.accountId,
            amount: entry.amount,
            type: flippedType,
          },
        });

        // Update cached balance
        const account = await tx.account.findUnique({ where: { id: entry.accountId } });
        const group = await tx.ledgerGroup.findUnique({ where: { id: account!.groupId } });
        const nature = group?.nature || 'ASSET';

        let balanceModifier = 0;
        if (['ASSET', 'EXPENSE'].includes(nature)) {
          balanceModifier = flippedType === 'DEBIT' ? entry.amount : -entry.amount;
        } else {
          balanceModifier = flippedType === 'CREDIT' ? entry.amount : -entry.amount;
        }

        await tx.account.update({
          where: { id: account!.id },
          data: { balance: account!.balance + balanceModifier }
        });
      }

      // Mark original as reversed
      await tx.voucher.update({
        where: { id: voucherId },
        data: { isReversed: true }
      });

      return reversalVoucher;
    });
  }
}
