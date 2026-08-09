import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getStripe } from '@/lib/stripe-server';
import { getAdminDb } from '@/lib/firebase-admin';
import { canUserRegisterForEvent } from '@/lib/event-eligibility';
import { validateDiscountCode } from '@/lib/discount-codes';
import {
  getEffectiveTicketTiers,
  getEventPath,
  getEventRegistrationBlockReason,
  isEventFull,
} from '@/lib/event-utils';
import {
  applyMembershipDiscount,
  getTierPaidEventDiscountPercent,
  resolveMemberTierId,
} from '@/lib/membership-access';
import { Event, MemberRecord, MembershipTier, Settings, User } from '@/lib/types';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { getSiteUrl } from '@/lib/site-url';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { eventId, discountCode, ticketTierId, inviteCode } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const db = getAdminDb();
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventDoc.data() as Event;
    const block = getEventRegistrationBlockReason(event);
    if (block) {
      return NextResponse.json({ error: block }, { status: 400 });
    }

    const mode = event.registrationMode || 'open';
    let usedInviteCode: string | undefined;
    if (mode === 'invite_only') {
      const code = String(inviteCode || '').trim().toUpperCase();
      if (!code) {
        return NextResponse.json({ error: 'Invite code required for this event' }, { status: 403 });
      }
      const inviteSnap = await db
        .collection('eventInvites')
        .where('eventId', '==', eventId)
        .where('code', '==', code)
        .limit(1)
        .get();
      if (inviteSnap.empty) {
        return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 });
      }
      const invite = inviteSnap.docs[0].data();
      if (invite.status !== 'pending') {
        return NextResponse.json({ error: 'This invite has already been used' }, { status: 403 });
      }
      if (invite.expiresAt && invite.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'This invite has expired' }, { status: 403 });
      }
      usedInviteCode = code;
    }

    const tiers = getEffectiveTicketTiers(event);
    const tier = tiers.find((t) => t.id === ticketTierId) || tiers[0];
    const basePrice = tier?.price ?? event.price ?? 0;

    if (basePrice <= 0) {
      return NextResponse.json(
        { error: 'Use free registration for complimentary tickets', freeRegistration: true },
        { status: 400 }
      );
    }

    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() as User | undefined;
    const memberDoc = await db.collection('members').doc(user.uid).get();
    const memberData = (memberDoc.exists ? memberDoc.data() : null) as MemberRecord | null;
    const settingsSnap = await db.collection('settings').doc(SETTINGS_DOC_ID).get();
    const paidPlansEnabled =
      (settingsSnap.data() as Settings | undefined)?.membershipAccess?.paidPlansEnabled === true;

    const eligibility = canUserRegisterForEvent(userData, event, memberData, paidPlansEnabled);
    if (!eligibility.allowed) {
      return NextResponse.json(
        { error: eligibility.reason, code: eligibility.code },
        { status: 403 }
      );
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
      return s === 'registered' || s === 'pending' || s === 'attended' || s === 'waitlisted';
    });
    if (active) {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 });
    }

    let finalPrice = basePrice;
    let discountId: string | undefined;
    let discountAmount = 0;
    let appliedCode: string | undefined;
    let membershipDiscountPercent = 0;

    const membershipTiersSnap = await db.collection('membershipTiers').get();
    const membershipTiers = membershipTiersSnap.docs.map((d) => d.data() as MembershipTier);
    const tierId = resolveMemberTierId(userData, memberData);
    membershipDiscountPercent = getTierPaidEventDiscountPercent(tierId, membershipTiers);
    if (membershipDiscountPercent > 0) {
      const applied = applyMembershipDiscount(finalPrice, membershipDiscountPercent);
      finalPrice = applied.finalPrice;
      discountAmount += applied.discountAmount;
    }

    if (discountCode) {
      const result = await validateDiscountCode(discountCode, eventId, finalPrice);
      discountAmount += result.discountAmount;
      finalPrice = result.finalPrice;
      discountId = result.code.id;
      appliedCode = result.code.code;
    }

    // Fully discounted → client should call free register instead of Stripe
    if (finalPrice <= 0) {
      return NextResponse.json({
        freeRegistration: true,
        finalPrice: 0,
        discountAmount,
        membershipDiscountPercent,
      });
    }

    const stripe = await getStripe();
    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      getSiteUrl() ||
      'http://localhost:3001';
    const eventPath = getEventPath(event);

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
        membershipDiscountPercent: String(membershipDiscountPercent),
        originalPrice: String(basePrice),
        inviteCode: usedInviteCode || '',
        registrationMode: mode,
      },
    });

    return NextResponse.json({
      url: session.url,
      finalPrice,
      discountAmount,
      membershipDiscountPercent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
