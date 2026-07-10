import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

const SESSION_COOKIE = '__session';
const MAX_AGE = 60 * 60 * 24 * 5; // 5 days

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: MAX_AGE,
    path: '/',
  };
}

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const res = NextResponse.json({ success: true, uid: decoded.uid });
    // Must set on the response object — cookies() from next/headers often does not
    // attach Set-Cookie correctly for this route in production.
    res.cookies.set(SESSION_COOKIE, idToken, sessionCookieOptions());
    return res;
  } catch (error) {
    console.error('[api/auth/session]', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
