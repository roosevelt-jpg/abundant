import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import {
  getInviteByToken,
  getMembershipApplication,
  markInviteUsed,
  upsertMemberRecord,
} from '@/lib/intake-service';
import { stripUndefined } from '@/lib/strip-undefined';
import { User } from '@/lib/types';
import { sendFounderWelcomeEmail, sendBrandedEmailVerification } from '@/lib/auth-emails';
import { notifyMembersActivity } from '@/lib/notify-activity';

const schema = z.object({
  token: z.string().min(10),
  idToken: z.string().min(20),
});

/** Complete invite signup after Google / Facebook sign-in */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const invite = await getInviteByToken(parsed.data.token);
    if (!invite || invite.status !== 'sent' || invite.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'This invite link is no longer valid — contact admin@abundantglobalclub.com' },
        { status: 400 }
      );
    }

    const decoded = await getAdminAuth().verifyIdToken(parsed.data.idToken);
    const oauthEmail = (decoded.email || '').toLowerCase();
    if (!oauthEmail || oauthEmail !== invite.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: `Please sign in with ${invite.email} — the email on your social account must match your invite.`,
        },
        { status: 400 }
      );
    }

    const app = await getMembershipApplication(invite.applicationId);
    const db = getAdminDb();
    const now = Date.now();
    const existing = await db.collection('users').doc(decoded.uid).get();

    if (!existing.exists) {
      const user: User = stripUndefined({
        uid: decoded.uid,
        email: invite.email,
        displayName: app?.fullName || decoded.name || invite.email,
        photoURL: decoded.picture,
        role: 'member' as const,
        membershipTier: app?.tierInterest && app.tierInterest !== 'not_sure' ? app.tierInterest : 'global',
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
      await db.collection('users').doc(decoded.uid).set(user);

      await upsertMemberRecord(decoded.uid, {
        applicationId: invite.applicationId,
        email: invite.email,
        displayName: app?.fullName || decoded.name || invite.email,
        onboardingCompletedAt: null,
        tierStatus: 'pending',
        tier: app?.tierInterest && app.tierInterest !== 'not_sure' ? app.tierInterest : undefined,
        socialLinks: app?.linkedinUrl ? { linkedin: app.linkedinUrl } : {},
      });
    }

    await markInviteUsed(invite.id);

    const displayName = app?.fullName || decoded.name || invite.email;

    if (decoded.email_verified) {
      const snap = await db.collection('users').doc(decoded.uid).get();
      if (!snap.data()?.welcomeEmailSentAt) {
        try {
          await sendFounderWelcomeEmail({ to: invite.email, displayName });
          await db.collection('users').doc(decoded.uid).set(
            { welcomeEmailSentAt: now, emailVerifiedAt: now, updatedAt: now },
            { merge: true }
          );
        } catch (err) {
          console.error('[complete-invite-oauth] welcome email', err);
        }
      }
    } else {
      try {
        await sendBrandedEmailVerification(invite.email, displayName);
      } catch (err) {
        console.error('[complete-invite-oauth] verify email', err);
      }
    }

    await notifyMembersActivity({
      title: 'New member joined',
      body: `${displayName} just joined Abundant Global Club.`,
      link: '/admin/members',
    }).catch(() => undefined);

    return NextResponse.json({
      ok: true,
      email: invite.email,
      emailVerified: !!decoded.email_verified,
    });
  } catch (error) {
    console.error('[api/auth/complete-invite-oauth]', error);
    return NextResponse.json({ error: 'Failed to complete signup' }, { status: 500 });
  }
}
