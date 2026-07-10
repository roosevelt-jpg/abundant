import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { sendMemberBroadcast } from '@/lib/fcm';
import { logActivityServer } from '@/lib/activity-log';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { title, body, link } = await req.json();

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const messageId = await sendMemberBroadcast({ title, body, link });
    if (!messageId) {
      return NextResponse.json(
        { error: 'FCM is not enabled. Turn it on under Settings → Integrations.' },
        { status: 400 }
      );
    }

    await logActivityServer({
      type: 'create',
      entity: 'settings',
      description: `Push notification sent: ${title}`,
      actorId: admin.uid,
      actorName: admin.email,
    });

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error('[api/admin/notifications/push]', error);
    const msg = error instanceof Error ? error.message : 'Failed to send notification';
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
