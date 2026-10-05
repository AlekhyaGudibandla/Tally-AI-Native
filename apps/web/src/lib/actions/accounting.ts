'use server';

import { AccountingEngine, PostVoucherParams } from '@/lib/engine/accounting';
import { revalidatePath } from 'next/cache';

export async function createVoucherAction(params: PostVoucherParams) {
  try {
    const voucher = await AccountingEngine.postVoucher(params);
    revalidatePath('/'); // Invalidate cache so UI updates
    return { success: true, data: voucher };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reverseVoucherAction(voucherId: string, narration: string) {
  try {
    const reversal = await AccountingEngine.reverseVoucher(voucherId, narration);
    revalidatePath('/');
    return { success: true, data: reversal };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
