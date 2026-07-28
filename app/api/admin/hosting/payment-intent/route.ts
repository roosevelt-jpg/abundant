import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { calculateHostingOrder, HostingPeriodMonths, HostingPlanId } from '@/lib/hosting-plans';
import { getStripe } from '@/lib/stripe-server';

const schema = z.object({
  planId: z.enum(['startup', 'professional', 'growth']),
  periodMonths: z.union([z.literal(12), z.literal(24)]),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid plan or period' }, { status: 400 });
    }

    const { planId, periodMonths } = parsed.data;
    const order = calculateHostingOrder(planId as HostingPlanId, periodMonths as HostingPeriodMonths);
    const stripe = await getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.amountCents,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        type: 'hosting_plan',
        planId,
        periodMonths: String(periodMonths),
        adminUid: auth.uid,
        adminEmail: auth.email,
      },
      receipt_email: auth.email,
      description: `Abundant Hosting — ${order.plan.fullName} (${periodMonths} months)`,
    });

    const now = Date.now();
    const orderRef = getAdminDb().collection('hostingOrders').doc();
    await orderRef.set({
      id: orderRef.id,
      planId,
      periodMonths,
      amountCents: order.amountCents,
      currency: 'usd',
      tax: order.tax,
      total: order.total,
      status: 'pending',
      paymentIntentId: paymentIntent.id,
      adminUid: auth.uid,
      adminEmail: auth.email,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: orderRef.id,
      paymentIntentId: paymentIntent.id,
      amountCents: order.amountCents,
      total: order.total,
    });
  } catch (error) {
    console.error('[api/admin/hosting/payment-intent]', error);
    const message = error instanceof Error ? error.message : 'Failed to start payment';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
