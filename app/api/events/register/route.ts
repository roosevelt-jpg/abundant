import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { canUserRegisterForEvent } from '@/lib/event-eligibility';
import { User } from '@/lib/types';

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
    if (event.pricingType === 'paid') {
      return NextResponse.json({ error: 'Paid events require checkout' }, { status: 400 });
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
      return NextResponse.json({ error: 'Already registered', registrationId: existing.docs[0].id });
    }

    const regRef = db.collection('eventRegistrations').doc();
    await regRef.set({
      id: regRef.id,
      eventId,
      userId: user.uid,
      userName: userData?.displayName || user.email,
      userEmail: user.email,
      registeredAt: Date.now(),
      status: 'registered',
      paymentStatus: 'free',
    });

    await eventDoc.ref.update({ registered: (event.registered || 0) + 1 });

    return NextResponse.json({ registrationId: regRef.id, event: { id: eventId, ...event } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
