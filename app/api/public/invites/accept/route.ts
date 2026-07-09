import { NextRequest, NextResponse } from 'next/server';
import { acceptAdminInvite } from '@/lib/invite-server';

export async function POST(req: NextRequest) {
  try {
    const { code, email, password, displayName } = await req.json();

    if (!code?.trim() || !email?.trim() || !password || !displayName?.trim()) {
      return NextResponse.json(
        { error: 'Code, email, full name, and password are required' },
        { status: 400 }
      );
    }

    const result = await acceptAdminInvite({
      code: code.trim(),
      email: email.trim(),
      password,
      displayName: displayName.trim(),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[api/public/invites/accept]', error);
    const message = error instanceof Error ? error.message : 'Failed to create admin account';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
