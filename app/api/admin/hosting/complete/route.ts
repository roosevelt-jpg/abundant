import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { HostingPeriodMonths, HostingPlanId } from '@/lib/hosting-plans';
import { activateSiteHosting } from '@/lib/site-hosting';
import { getHostingStripe } from '@/lib/stripe-hosting-server';

const schema = z.object({
  orderId: z.string().min(1),
  paymentIntentId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { orderId, paymentIntentId } = parsed.data;
    const db = getAdminDb();
    const orderRef = db.collection('hostingOrders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderSnap.data()!;
    if (order.adminUid !== auth.uid && auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (order.paymentIntentId !== paymentIntentId) {
      return NextResponse.json({ error: 'Payment mismatch' }, { status: 400 });
    }

    const stripe = await getHostingStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Payment not completed (status: ${intent.status})` },
        { status: 400 }
      );
    }

    const paidAt = Date.now();
    await orderRef.update({
      status: 'paid',
      paidAt,
      updatedAt: paidAt,
      stripeChargeId: typeof intent.latest_charge === 'string' ? intent.latest_charge : null,
    });

    const siteHosting = await activateSiteHosting({
      planId: order.planId as HostingPlanId,
      periodMonths: order.periodMonths as HostingPeriodMonths,
      orderId,
      paymentIntentId,
      activatedBy: auth.email,
      paidAt,
    });

    return NextResponse.json({
      ok: true,
      status: 'paid',
      siteHosting,
    });
  } catch (error) {
    console.error('[api/admin/hosting/complete]', error);
    const message = error instanceof Error ? error.message : 'Failed to complete order';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
