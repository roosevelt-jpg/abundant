import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendEventInviteEmail } from '@/lib/gmail-smtp';
import { generateEventCode } from '@/lib/event-checkin';
import { formatEventWhen, getEventPath } from '@/lib/event-utils';
import { Event, EventInvite } from '@/lib/types';
import { notifyMembersActivity } from '@/lib/notify-activity';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const eventId = req.nextUrl.searchParams.get('eventId');
    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const snap = await getAdminDb()
      .collection('eventInvites')
      .where('eventId', '==', eventId)
      .get();

    const invites = snap.docs
      .map((d) => d.data() as EventInvite)
      .sort((a, b) => b.invitedAt - a.invitedAt);

    return NextResponse.json(invites);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load invites';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { eventId, emails, expiresInDays = 14 } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const list: string[] = Array.isArray(emails)
      ? emails
      : String(emails || '')
          .split(/[\n,;]+/)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);

    const unique = [...new Set(list)].filter((e) => e.includes('@'));
    if (unique.length === 0) {
      return NextResponse.json({ error: 'Add at least one valid email' }, { status: 400 });
    }

    const db = getAdminDb();
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventDoc.data() as Event;
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const eventUrl = `${origin}${getEventPath(event)}`;
    const when = formatEventWhen(event);
    const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;

    const created: EventInvite[] = [];
    const errors: { email: string; error: string }[] = [];

    for (const email of unique) {
      const code = generateEventCode(8);
      const ref = db.collection('eventInvites').doc();
      const invite: EventInvite = {
        id: ref.id,
        eventId,
        email,
        code,
        status: 'pending',
        invitedBy: admin.uid,
        invitedAt: Date.now(),
        expiresAt,
      };

      try {
        await ref.set(invite);
        await sendEventInviteEmail({
          to: email,
          eventTitle: event.title,
          eventWhen: when,
          eventLocation: event.location || 'See event page',
          inviteCode: code,
          eventUrl: `${eventUrl}?invite=${code}`,
          hostName: event.hosts?.[0]?.name,
        });
        created.push(invite);
      } catch (err) {
        errors.push({
          email,
          error: err instanceof Error ? err.message : 'Failed to send',
        });
      }
    }

    if (created.length > 0) {
      await notifyMembersActivity({
        title: 'Event invites sent',
        body: `${created.length} invite(s) sent for “${event.title}”.`,
        link: getEventPath(event),
      });
    }

    return NextResponse.json({
      sent: created.length,
      invites: created,
      errors,
    });
  } catch (error) {
    console.error('[api/admin/events/invites]', error);
    const message = error instanceof Error ? error.message : 'Failed to send invites';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
