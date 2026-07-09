import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getStripe } from '@/lib/stripe-server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: 'planId required' }, { status: 400 });
    }

    const db = getAdminDb();
    const planDoc = await db.collection('membershipPlans').doc(planId).get();
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const plan = planDoc.data()!;
    const stripe = await getStripe();
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    let priceId = plan.stripePriceId;

    if (!priceId) {
      const product = await stripe.products.create({ name: plan.name, metadata: { planId } });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.price * 100),
        currency: plan.currency || 'usd',
        recurring: { interval: plan.interval },
      });
      priceId = price.id;
      await planDoc.ref.update({ stripePriceId: priceId, stripeProductId: product.id });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?subscription=success`,
      cancel_url: `${origin}/membership?subscription=cancelled`,
      metadata: { userId: user.uid, planId, type: 'subscription' },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
