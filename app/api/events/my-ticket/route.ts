import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { buildCheckInQrPayload, qrImageUrl } from '@/lib/event-checkin';

/** Return the current user's ticket + QR for an event */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const eventId = req.nextUrl.searchParams.get('eventId');
    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const snap = await getAdminDb()
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('userId', '==', user.uid)
      .get();

    const reg = snap.docs
      .map((d) => d.data())
      .find((r) => r.status === 'registered' || r.status === 'attended');

    if (!reg) {
      return NextResponse.json({ error: 'No ticket found' }, { status: 404 });
    }

    const payload = buildCheckInQrPayload(eventId, reg.checkInCode || reg.id.slice(0, 8).toUpperCase());

    return NextResponse.json({
      registration: reg,
      checkInCode: reg.checkInCode,
      qrPayload: payload,
      qrUrl: qrImageUrl(payload),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load ticket';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
