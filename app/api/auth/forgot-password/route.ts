import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuth } from '@/lib/firebase-admin';
import { sendBrandedPasswordReset } from '@/lib/auth-emails';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();

    // Always return success to avoid email enumeration; only send if user exists
    try {
      await getAdminAuth().getUserByEmail(email);
      await sendBrandedPasswordReset(email);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/user-not-found') {
        console.error('[api/auth/forgot-password]', err);
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (error) {
    console.error('[api/auth/forgot-password]', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
