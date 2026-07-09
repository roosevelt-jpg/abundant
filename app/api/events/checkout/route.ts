import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getStripe } from '@/lib/stripe-server';
import { getAdminDb } from '@/lib/firebase-admin';
import { canUserRegisterForEvent } from '@/lib/event-eligibility';
import { validateDiscountCode } from '@/lib/discount-codes';
import { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { eventId, discountCode } = await req.json();

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

    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() as User | undefined;

    const eligibility = canUserRegisterForEvent(userData, event);
    if (!eligibility.allowed) {
      return NextResponse.json({ error: eligibility.reason }, { status: 403 });
    }

    if (event.capacity && (event.registered || 0) >= event.capacity) {
      return NextResponse.json({ error: 'This event is at full capacity' }, { status: 400 });
    }

    const existing = await db
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('userId', '==', user.uid)
      .where('status', '==', 'registered')
      .get();

    if (!existing.empty) {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 });
    }

    let finalPrice = event.price;
    let discountId: string | undefined;
    let discountAmount = 0;
    let appliedCode: string | undefined;

    if (discountCode) {
      const result = await validateDiscountCode(discountCode, eventId, event.price);
      finalPrice = result.finalPrice;
      discountId = result.code.id;
      discountAmount = result.discountAmount;
      appliedCode = result.code.code;
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
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/events?registered=${eventId}`,
      cancel_url: `${origin}/events?cancelled=${eventId}`,
      metadata: {
        userId: user.uid,
        eventId,
        type: 'event',
        discountCodeId: discountId || '',
        discountCode: appliedCode || '',
        discountAmount: String(discountAmount),
        originalPrice: String(event.price),
      },
    });

    return NextResponse.json({ url: session.url, finalPrice, discountAmount });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
