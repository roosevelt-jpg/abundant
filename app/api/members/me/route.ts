import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getMemberRecord, upsertMemberRecord } from '@/lib/intake-service';
import { stripUndefined } from '@/lib/strip-undefined';
import { MembershipTierId } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const member = await getMemberRecord(user.uid);
    return NextResponse.json({ member });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const db = getAdminDb();

    // Preferred tier only — never activate billing from onboarding
    const allowed = stripUndefined({
      photoUrl: body.photoUrl,
      bio: body.bio,
      expertiseTags: body.expertiseTags,
      directoryVisibility: body.directoryVisibility,
      socialLinks: body.socialLinks,
      availableForIntros: body.availableForIntros,
      notificationPrefs: body.notificationPrefs,
      ...(body.tier ? { tier: body.tier as MembershipTierId, tierStatus: 'pending' as const } : {}),
      ...(body.complete
        ? {
            onboardingCompletedAt: Date.now(),
            tier: body.tier as MembershipTierId | undefined,
            tierStatus: 'pending' as const,
          }
        : {}),
      displayName: body.displayName,
      email: user.email,
    });

    await upsertMemberRecord(user.uid, allowed);

    // Sync profile fields used for event gating onto users doc
    const userUpdates = stripUndefined({
      updatedAt: Date.now(),
      ...(body.gender ? { gender: body.gender } : {}),
      ...(body.displayName ? { displayName: body.displayName } : {}),
      ...(body.tier ? { membershipTier: body.tier as MembershipTierId } : {}),
      ...(body.photoUrl ? { photoURL: body.photoUrl } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.bio !== undefined ? { bio: body.bio } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.country !== undefined ? { country: body.country, countryOfResidence: body.country } : {}),
      ...(body.countryOfResidence !== undefined
        ? { countryOfResidence: body.countryOfResidence, country: body.countryOfResidence }
        : {}),
      ...(body.nationality !== undefined ? { nationality: body.nationality } : {}),
      ...(body.citizenship !== undefined ? { citizenship: body.citizenship } : {}),
      ...(body.city !== undefined ? { city: body.city } : {}),
      ...(body.address !== undefined ? { address: body.address } : {}),
      ...(body.profession !== undefined ? { profession: body.profession } : {}),
      ...(body.dateOfBirth !== undefined ? { dateOfBirth: body.dateOfBirth } : {}),
    });
    if (Object.keys(userUpdates).length > 1) {
      await db.collection('users').doc(user.uid).set(userUpdates, { merge: true });
    }

    const member = await getMemberRecord(user.uid);
    return NextResponse.json({ member });
  } catch (error) {
    console.error('[api/members/me]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
