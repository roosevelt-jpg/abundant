import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { validateDiscountCode } from '@/lib/discount-codes';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const { code, eventId, price } = await req.json();

    if (!code || !eventId || price == null || Number.isNaN(Number(price))) {
      return NextResponse.json({ error: 'code, eventId, and price required' }, { status: 400 });
    }

    const result = await validateDiscountCode(code, eventId, Number(price));
    return NextResponse.json({
      valid: true,
      code: result.code.code,
      finalPrice: result.finalPrice,
      discountAmount: result.discountAmount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid discount code';
    return NextResponse.json({ error: message, valid: false }, { status: 400 });
  }
}
