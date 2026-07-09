import { NextRequest, NextResponse } from 'next/server';
import { findPendingInvite } from '@/lib/invite-server';
import { getPermissionLabel } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code?.trim()) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const invite = await findPendingInvite(code);
    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 400 });
    }

    const permissions =
      invite.role === 'super_admin'
        ? ['Full platform access']
        : (invite.permissions || []).map(getPermissionLabel);

    return NextResponse.json({
      valid: true,
      role: invite.role,
      roleLabel: invite.role.replace('_', ' '),
      permissions,
      emailHint: maskEmail(invite.email),
    });
  } catch (error) {
    console.error('[api/public/invites/validate]', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}
