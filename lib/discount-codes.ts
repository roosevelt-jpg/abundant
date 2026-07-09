import { EventDiscountCode } from '@/lib/types';
import { getAdminDb } from '@/lib/firebase-admin';

export interface DiscountResult {
  code: EventDiscountCode;
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
}

export function calculateDiscountedPrice(
  price: number,
  code: Pick<EventDiscountCode, 'discountType' | 'discountValue'>
): { finalPrice: number; discountAmount: number } {
  let discountAmount = 0;
  if (code.discountType === 'percent') {
    discountAmount = Math.round(price * (code.discountValue / 100) * 100) / 100;
  } else {
    discountAmount = Math.min(code.discountValue, price);
  }
  const finalPrice = Math.max(0, Math.round((price - discountAmount) * 100) / 100);
  return { finalPrice, discountAmount };
}

export async function validateDiscountCode(
  codeStr: string,
  eventId: string,
  eventPrice: number
): Promise<DiscountResult> {
  const normalized = codeStr.trim().toUpperCase();
  if (!normalized) throw new Error('Discount code is required');

  const db = getAdminDb();
  const snap = await db
    .collection('eventDiscountCodes')
    .where('code', '==', normalized)
    .where('active', '==', true)
    .limit(1)
    .get();

  if (snap.empty) throw new Error('Invalid or expired discount code');

  const code = snap.docs[0].data() as EventDiscountCode;

  if (code.expiresAt && code.expiresAt < Date.now()) {
    throw new Error('This discount code has expired');
  }

  if (code.maxUses && code.usedCount >= code.maxUses) {
    throw new Error('This discount code has reached its usage limit');
  }

  if (code.eventIds.length > 0 && !code.eventIds.includes(eventId)) {
    throw new Error('This discount code does not apply to this event');
  }

  const { finalPrice, discountAmount } = calculateDiscountedPrice(eventPrice, code);

  return { code, originalPrice: eventPrice, finalPrice, discountAmount };
}

export async function incrementDiscountUsage(codeId: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection('eventDiscountCodes').doc(codeId);
  const doc = await ref.get();
  if (!doc.exists) return;
  const data = doc.data() as EventDiscountCode;
  await ref.update({ usedCount: (data.usedCount || 0) + 1 });
}
