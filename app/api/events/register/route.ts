import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { canUserRegisterForEvent } from '@/lib/event-eligibility';
import { getEffectiveTicketTiers, isEventFull, getEventPath, getEventRegistrationBlockReason } from '@/lib/event-utils';
import { generateEventCode } from '@/lib/event-checkin';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { Event, Settings, User } from '@/lib/types';
import { notifyUserPush, notifyMembersActivity } from '@/lib/notify-activity';
import { sendEventRegistrationConfirmationEmail } from '@/lib/event-emails';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { eventId, ticketTierId, joinWaitlist, inviteCode } = await req.json();

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
    const tierPrice = tier?.price ?? (event.pricingType === 'paid' ? event.price || 0 : 0);

    if (tierPrice > 0) {
      return NextResponse.json({ error: 'Paid tickets require checkout' }, { status: 400 });
    }

    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() as User | undefined;
    const memberDoc = await db.collection('members').doc(user.uid).get();
    const memberData = memberDoc.exists ? memberDoc.data() : null;
    const settingsSnap = await db.collection('settings').doc(SETTINGS_DOC_ID).get();
    const paidPlansEnabled =
      (settingsSnap.data() as Settings | undefined)?.membershipAccess?.paidPlansEnabled === true;

    const eligibility = canUserRegisterForEvent(userData, event, memberData as never, paidPlansEnabled);
    if (!eligibility.allowed) {
      return NextResponse.json(
        { error: eligibility.reason, code: eligibility.code },
        { status: 403 }
      );
    }

    const existing = await db
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('userId', '==', user.uid)
      .get();

    const active = existing.docs.find((d) => {
      const s = d.data().status;
      return s === 'registered' || s === 'waitlisted' || s === 'pending' || s === 'attended';
    });
    if (active) {
      return NextResponse.json({
        error: 'Already registered',
        registrationId: active.id,
        status: active.data().status,
      });
    }

    const full = isEventFull(event);
    let status: 'registered' | 'waitlisted' | 'pending' = 'registered';

    if (mode === 'approval') {
      status = 'pending';
    } else if (full) {
      if (event.enableWaitlist || joinWaitlist) {
        status = 'waitlisted';
      } else {
        return NextResponse.json({ error: 'This event is at full capacity' }, { status: 400 });
      }
    }

    const regRef = db.collection('eventRegistrations').doc();
    const checkInCode = generateEventCode(8);
    const payload = {
      id: regRef.id,
      eventId,
      userId: user.uid,
      userName: userData?.displayName || user.email,
      userEmail: user.email,
      registeredAt: Date.now(),
      status,
      paymentStatus: 'free' as const,
      ticketTierId: tier?.id,
      ticketTierName: tier?.name,
      checkInCode,
      inviteCode: usedInviteCode,
    };
    await regRef.set(payload);

    if (usedInviteCode) {
      const inviteSnap = await db
        .collection('eventInvites')
        .where('eventId', '==', eventId)
        .where('code', '==', usedInviteCode)
        .limit(1)
        .get();
      if (!inviteSnap.empty) {
        await inviteSnap.docs[0].ref.update({
          status: 'accepted',
          acceptedAt: Date.now(),
          acceptedBy: user.uid,
        });
      }
    }

    if (status === 'registered') {
      await eventDoc.ref.update({ registered: (event.registered || 0) + 1 });
    } else if (status === 'waitlisted') {
      await eventDoc.ref.update({ waitlistCount: (event.waitlistCount || 0) + 1 });
    }

    const path = getEventPath(event);
    await notifyUserPush(user.uid, {
      title: status === 'waitlisted' ? 'Added to waitlist' : 'Registration confirmed',
      body: status === 'waitlisted'
        ? `You're on the waitlist for ${event.title}.`
        : `You're registered for ${event.title}.`,
      link: path,
    });
    await notifyMembersActivity({
      title: 'Event registration',
      body: `A member registered for ${event.title}.`,
      link: path,
    });

    try {
      await sendEventRegistrationConfirmationEmail({
        to: user.email,
        userName: userData?.displayName || undefined,
        event,
        status,
        checkInCode: status === 'registered' ? checkInCode : undefined,
        ticketTierName: tier?.name,
      });
    } catch (emailErr) {
      console.error('[api/events/register] confirmation email failed', emailErr);
    }

    return NextResponse.json({
      registrationId: regRef.id,
      status,
      event,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
