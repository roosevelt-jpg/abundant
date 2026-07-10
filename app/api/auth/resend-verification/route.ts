import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getAdminAuth } from '@/lib/firebase-admin';
import { sendBrandedEmailVerification } from '@/lib/auth-emails';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const authUser = await getAdminAuth().getUser(user.uid);
    if (authUser.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }
    if (!authUser.email) {
      return NextResponse.json({ error: 'No email on account' }, { status: 400 });
    }
    await sendBrandedEmailVerification(authUser.email, authUser.displayName || undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/auth/resend-verification]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
