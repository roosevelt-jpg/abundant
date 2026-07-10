import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { sendFounderWelcomeEmail } from '@/lib/auth-emails';
import { notifyUserPush } from '@/lib/notify-activity';

/** Idempotent: send founder welcome if Auth email is verified and not yet sent */
export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get('authorization');
    if (!header?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(header.slice(7), true);
    if (!decoded.email || !decoded.email_verified) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const db = getAdminDb();
    const ref = db.collection('users').doc(decoded.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    const data = snap.data() || {};
    if (data.welcomeEmailSentAt) {
      return NextResponse.json({ ok: true, alreadySent: true });
    }

    const displayName = data.displayName || decoded.name || decoded.email;
    await sendFounderWelcomeEmail({ to: decoded.email, displayName });
    const now = Date.now();
    await ref.set(
      { welcomeEmailSentAt: now, emailVerifiedAt: now, updatedAt: now },
      { merge: true }
    );

    await notifyUserPush(decoded.uid, {
      title: 'Welcome to Abundant',
      body: 'Explore membership packages and upcoming events.',
      link: '/membership',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/auth/ensure-welcome]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
