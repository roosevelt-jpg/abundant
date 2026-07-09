import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendAdminInviteEmail } from '@/lib/gmail-smtp';
import { logActivityServer } from '@/lib/activity-log';
import { AdminInvite } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { email, role, expiresInDays = 7 } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];

    const db = getAdminDb();
    const ref = db.collection('adminInvites').doc();
    const invite: AdminInvite = {
      id: ref.id,
      code,
      role: role === 'super_admin' ? 'super_admin' : 'admin',
      createdBy: admin.uid,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
      status: 'pending',
      email: email.trim(),
    };

    await ref.set(invite);

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const signupUrl = `${origin}/signup`;

    await sendAdminInviteEmail({
      to: email.trim(),
      code,
      role: invite.role,
      expiresAt: invite.expiresAt,
      signupUrl,
    });

    await logActivityServer({
      type: 'create',
      entity: 'invite',
      entityId: invite.id,
      description: `Admin invite sent to ${email} (${invite.role})`,
      actorId: admin.uid,
      actorName: admin.email,
    });

    return NextResponse.json(invite);
  } catch (error) {
    console.error('[api/admin/invites]', error);
    const msg = error instanceof Error ? error.message : 'Failed to send invite';
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
