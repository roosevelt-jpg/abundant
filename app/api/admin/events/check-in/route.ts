import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { parseCheckInQrPayload } from '@/lib/event-checkin';

/** Door check-in by QR payload or check-in code */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { eventId, code, qrPayload } = await req.json();

    const parsed = qrPayload ? parseCheckInQrPayload(String(qrPayload)) : null;
    const checkInCode = (parsed?.checkInCode || code || '').toString().trim().toUpperCase();
    const resolvedEventId = eventId || parsed?.eventId;

    if (!checkInCode) {
      return NextResponse.json({ error: 'Check-in code required' }, { status: 400 });
    }

    const db = getAdminDb();
    let query = db.collection('eventRegistrations').where('checkInCode', '==', checkInCode);
    const snap = await query.limit(5).get();

    if (snap.empty) {
      return NextResponse.json({ error: 'No guest found for this code' }, { status: 404 });
    }

    const match = snap.docs.find((d) => {
      const data = d.data();
      if (resolvedEventId && data.eventId !== resolvedEventId) return false;
      return data.status === 'registered' || data.status === 'attended';
    });

    if (!match) {
      return NextResponse.json({ error: 'Guest not found for this event' }, { status: 404 });
    }

    const data = match.data();
    if (data.status === 'attended' && data.checkInTime) {
      return NextResponse.json({
        alreadyCheckedIn: true,
        registration: data,
        message: `${data.userName} was already checked in`,
      });
    }

    await match.ref.update({
      status: 'attended',
      checkInTime: Date.now(),
    });

    return NextResponse.json({
      ok: true,
      registration: { ...data, status: 'attended', checkInTime: Date.now() },
      message: `Checked in ${data.userName}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Check-in failed';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
