import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getStripe } from '@/lib/stripe-server';
import { getAdminDb } from '@/lib/firebase-admin';
import { canUserRegisterForEvent } from '@/lib/event-eligibility';
import { validateDiscountCode } from '@/lib/discount-codes';
import { getEffectiveTicketTiers, isEventFull } from '@/lib/event-utils';
import { Event, User } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { eventId, discountCode, ticketTierId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const db = getAdminDb();
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventDoc.data() as Event;
    if ((event.registrationMode || 'open') === 'invite_only') {
      return NextResponse.json({ error: 'This event is invite-only — use free RSVP with an invite code, or contact the host' }, { status: 403 });
    }

    const tiers = getEffectiveTicketTiers(event);
    const tier = tiers.find((t) => t.id === ticketTierId) || tiers[0];
    const basePrice = tier?.price ?? event.price ?? 0;

    if (basePrice <= 0) {
      return NextResponse.json({ error: 'Use free registration for complimentary tickets' }, { status: 400 });
    }

    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() as User | undefined;

    const eligibility = canUserRegisterForEvent(userData, event);
    if (!eligibility.allowed) {
      return NextResponse.json({ error: eligibility.reason }, { status: 403 });
    }

    if (isEventFull(event)) {
      return NextResponse.json({ error: 'This event is at full capacity' }, { status: 400 });
    }

    const existing = await db
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('userId', '==', user.uid)
      .get();

    const active = existing.docs.some((d) => {
      const s = d.data().status;
      return s === 'registered' || s === 'pending' || s === 'attended';
    });
    if (active) {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 });
    }

    let finalPrice = basePrice;
    let discountId: string | undefined;
    let discountAmount = 0;
    let appliedCode: string | undefined;

    if (discountCode) {
      const result = await validateDiscountCode(discountCode, eventId, basePrice);
      finalPrice = result.finalPrice;
      discountId = result.code.id;
      discountAmount = result.discountAmount;
      appliedCode = result.code.code;
    }

    const stripe = await getStripe();
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const eventPath = event.slug ? `/events/${event.slug}` : `/events?registered=${eventId}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: event.currency || 'usd',
            product_data: {
              name: `${event.title}${tier?.name ? ` — ${tier.name}` : ''}`,
              description: event.description?.slice(0, 200),
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}${eventPath}?registered=1`,
      cancel_url: `${origin}${eventPath}?cancelled=1`,
      metadata: {
        userId: user.uid,
        eventId,
        type: 'event',
        ticketTierId: tier?.id || '',
        ticketTierName: tier?.name || '',
        discountCodeId: discountId || '',
        discountCode: appliedCode || '',
        discountAmount: String(discountAmount),
        originalPrice: String(basePrice),
      },
    });

    return NextResponse.json({ url: session.url, finalPrice, discountAmount });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
