import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendAdminInviteEmail } from '@/lib/gmail-smtp';
import { logActivityServer } from '@/lib/activity-log';
import { AdminInvite, AdminPermission } from '@/lib/types';
import { ALL_ADMIN_PERMISSIONS } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin(req);
    const { email, role, expiresInDays = 7, permissions = [] } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const inviteRole = role === 'super_admin' ? 'super_admin' : 'admin';
    const invitePermissions: AdminPermission[] =
      inviteRole === 'super_admin'
        ? ALL_ADMIN_PERMISSIONS
        : (permissions as AdminPermission[]).filter((p) => p !== 'invites');

    if (inviteRole === 'admin' && invitePermissions.length === 0) {
      return NextResponse.json({ error: 'Select at least one permission for the admin' }, { status: 400 });
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];

    const db = getAdminDb();
    const ref = db.collection('adminInvites').doc();
    const invite: AdminInvite = {
      id: ref.id,
      code,
      role: inviteRole,
      email: email.trim().toLowerCase(),
      permissions: inviteRole === 'admin' ? invitePermissions : undefined,
      createdBy: admin.uid,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
      status: 'pending',
    };

    await ref.set(invite);

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const signupUrl = `${origin}/join-admin?code=${code}`;

    await sendAdminInviteEmail({
      to: invite.email,
      code,
      role: invite.role,
      permissions: invitePermissions,
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
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
