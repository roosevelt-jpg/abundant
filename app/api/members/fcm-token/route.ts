import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const schema = z.object({
  token: z.string().min(20),
  action: z.enum(['add', 'remove']).default('add'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const ref = getAdminDb().collection('users').doc(user.uid);
    if (parsed.data.action === 'remove') {
      await ref.set(
        {
          fcmTokens: FieldValue.arrayRemove(parsed.data.token),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } else {
      await ref.set(
        {
          fcmTokens: FieldValue.arrayUnion(parsed.data.token),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
