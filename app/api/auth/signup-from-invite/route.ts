import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { signupFromInviteSchema } from '@/lib/intake-schemas';
import {
  getInviteByToken,
  getMembershipApplication,
  markInviteUsed,
  upsertMemberRecord,
} from '@/lib/intake-service';
import { stripUndefined } from '@/lib/strip-undefined';
import { User } from '@/lib/types';
import { sendBrandedEmailVerification } from '@/lib/auth-emails';
import { notifyMembersActivity } from '@/lib/notify-activity';
import { membershipTierFromInterest, paidTierFromInterest } from '@/lib/membership-access';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token') || '';
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    const invite = await getInviteByToken(token);
    if (!invite || invite.status !== 'sent' || invite.expiresAt < Date.now()) {
      return NextResponse.json({ valid: false, error: 'This invite link is no longer valid' }, { status: 400 });
    }
    const app = await getMembershipApplication(invite.applicationId);
    return NextResponse.json({
      valid: true,
      email: invite.email,
      fullName: app?.fullName || '',
    });
  } catch (error) {
    console.error('[api/auth/signup-from-invite GET]', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupFromInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid' }, { status: 400 });
    }

    const invite = await getInviteByToken(parsed.data.token);
    if (!invite || invite.status !== 'sent' || invite.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'This invite link is no longer valid — contact admin@abundantglobalclub.com' },
        { status: 400 }
      );
    }

    const app = await getMembershipApplication(invite.applicationId);
    const auth = getAdminAuth();
    const db = getAdminDb();

    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: invite.email,
        password: parsed.data.password,
        displayName: app?.fullName || invite.email,
        emailVerified: false,
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'An account already exists for this email. Please log in.' }, { status: 400 });
      }
      throw err;
    }

    const now = Date.now();
    const user: User = stripUndefined({
      uid: userRecord.uid,
      email: invite.email,
      displayName: app?.fullName || invite.email,
      role: 'member' as const,
      membershipTier: membershipTierFromInterest(app?.tierInterest),
      joinedAt: now,
      status: 'active' as const,
      createdAt: now,
      updatedAt: now,
      phone: app?.phone,
      country: app?.country,
      countryOfResidence: app?.country,
      nationality: app?.nationality || app?.country,
      citizenship: app?.citizenship || app?.nationality || app?.country,
      city: app?.city,
      gender: app?.gender,
      profession: app?.role,
      joinReason: app?.whyJoin,
    });
    await db.collection('users').doc(userRecord.uid).set(user);

    await upsertMemberRecord(userRecord.uid, {
      applicationId: invite.applicationId,
      email: invite.email,
      displayName: app?.fullName || invite.email,
      onboardingCompletedAt: null,
      tierStatus: 'pending',
      tier: paidTierFromInterest(app?.tierInterest),
      socialLinks: app?.linkedinUrl ? { linkedin: app.linkedinUrl } : {},
    });

    await markInviteUsed(invite.id);

    try {
      await sendBrandedEmailVerification(invite.email, app?.fullName || invite.email);
    } catch (err) {
      console.error('[signup-from-invite] verification email', err);
    }

    await notifyMembersActivity({
      title: 'New member joined',
      body: `${app?.fullName || invite.email} just created an account.`,
      link: '/admin/members',
    }).catch(() => undefined);

    return NextResponse.json({ ok: true, email: invite.email, needsEmailVerification: true });
  } catch (error) {
    console.error('[api/auth/signup-from-invite POST]', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
