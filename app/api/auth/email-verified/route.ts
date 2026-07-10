import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { sendFounderWelcomeEmail } from '@/lib/auth-emails';
import { notifyUserPush } from '@/lib/notify-activity';

/** Called after the member verifies their email — sends founder welcome once */
export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get('authorization');
    if (!header?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(header.slice(7));
    if (!decoded.email) {
      return NextResponse.json({ error: 'No email on account' }, { status: 400 });
    }
    if (!decoded.email_verified) {
      return NextResponse.json({ error: 'Email not verified yet' }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection('users').doc(decoded.uid);
    const snap = await ref.get();
    const data = snap.data() || {};

    if (data.welcomeEmailSentAt) {
      return NextResponse.json({ ok: true, alreadySent: true });
    }

    const displayName = data.displayName || decoded.name || decoded.email;
    await sendFounderWelcomeEmail({ to: decoded.email, displayName });

    const now = Date.now();
    await ref.set(
      {
        welcomeEmailSentAt: now,
        emailVerifiedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    await notifyUserPush(decoded.uid, {
      title: 'Welcome to Abundant',
      body: 'Your email is verified — explore membership packages in the app.',
      link: '/membership',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/auth/email-verified]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
