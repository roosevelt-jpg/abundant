import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getStripe } from '@/lib/stripe-server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const db = getAdminDb();
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventDoc.data()!;
    if (event.pricingType !== 'paid' || !event.price) {
      return NextResponse.json({ error: 'Event is not a paid event' }, { status: 400 });
    }

    const stripe = await getStripe();
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: event.currency || 'usd',
            product_data: { name: event.title, description: event.description?.slice(0, 200) },
            unit_amount: Math.round(event.price * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/events?registered=${eventId}`,
      cancel_url: `${origin}/events?cancelled=${eventId}`,
      metadata: { userId: user.uid, eventId, type: 'event' },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
