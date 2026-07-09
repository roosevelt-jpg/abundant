import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/api-auth';
import { sendEmail } from '@/lib/sendgrid';
import { logActivityServer } from '@/lib/activity-log';
import { SETTINGS_DOC_ID } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { submissionId, message } = await req.json();

    if (!submissionId || !message?.trim()) {
      return NextResponse.json({ error: 'Submission ID and message are required' }, { status: 400 });
    }

    const db = getAdminDb();
    const subRef = db.collection('contactSubmissions').doc(submissionId);
    const subSnap = await subRef.get();

    if (!subSnap.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = subSnap.data()!;
    const settingsSnap = await db.collection('settings').doc(SETTINGS_DOC_ID).get();
    const siteName = settingsSnap.data()?.siteName || 'Abundant Global Club';

    await sendEmail({
      to: submission.email,
      subject: `Re: ${submission.subject}`,
      text: message,
      fromName: siteName,
    });

    const replies = [
      ...(submission.replies || []),
      { message, sentAt: Date.now(), sentBy: admin.email },
    ];

    await subRef.update({ status: 'responded', replies });

    await logActivityServer({
      type: 'update',
      entity: 'contact',
      entityId: submissionId,
      description: `Replied to contact from ${submission.name}`,
      actorId: admin.uid,
      actorName: admin.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/admin/contact/reply]', error);
    const msg = error instanceof Error ? error.message : 'Failed to send reply';
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
