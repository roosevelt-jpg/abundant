import { randomBytes } from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { stripUndefined } from '@/lib/strip-undefined';
import {
  MembershipApplication,
  MembershipInvite,
  MembershipTier,
  MemberRecord,
  ResourceSubmission,
  Taxonomies,
} from '@/lib/types';
import {
  getDefaultMembershipTiers,
  getDefaultTaxonomies,
  TAXONOMIES_DOC_ID,
} from '@/lib/intake-defaults';

export async function getTaxonomies(): Promise<Taxonomies> {
  const snap = await getAdminDb().collection('taxonomies').doc(TAXONOMIES_DOC_ID).get();
  if (!snap.exists) return getDefaultTaxonomies();
  return snap.data() as Taxonomies;
}

export async function saveTaxonomies(data: Partial<Taxonomies>): Promise<Taxonomies> {
  const existing = await getTaxonomies();
  const next = stripUndefined({
    ...existing,
    ...data,
    id: 'main' as const,
    updatedAt: Date.now(),
  });
  await getAdminDb().collection('taxonomies').doc(TAXONOMIES_DOC_ID).set(next);
  return next;
}

export async function getVisibleMembershipTiers(): Promise<MembershipTier[]> {
  const snap = await getAdminDb().collection('membershipTiers').get();
  if (snap.empty) return getDefaultMembershipTiers().filter((t) => t.visible);
  return snap.docs
    .map((d) => d.data() as MembershipTier)
    .filter((t) => t.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getAllMembershipTiers(): Promise<MembershipTier[]> {
  const snap = await getAdminDb().collection('membershipTiers').get();
  if (snap.empty) return getDefaultMembershipTiers();
  return snap.docs
    .map((d) => d.data() as MembershipTier)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function upsertMembershipTier(tier: MembershipTier): Promise<void> {
  await getAdminDb()
    .collection('membershipTiers')
    .doc(tier.id)
    .set(stripUndefined({ ...tier, updatedAt: Date.now() }), { merge: true });
}

export async function createMembershipApplication(
  data: Omit<MembershipApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<MembershipApplication> {
  const ref = getAdminDb().collection('membershipApplications').doc();
  const app: MembershipApplication = stripUndefined({
    ...data,
    id: ref.id,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await ref.set(app);
  return app;
}

export async function listMembershipApplications(): Promise<MembershipApplication[]> {
  const snap = await getAdminDb().collection('membershipApplications').get();
  return snap.docs
    .map((d) => d.data() as MembershipApplication)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMembershipApplication(id: string): Promise<MembershipApplication | null> {
  const snap = await getAdminDb().collection('membershipApplications').doc(id).get();
  return snap.exists ? (snap.data() as MembershipApplication) : null;
}

export async function updateMembershipApplication(
  id: string,
  updates: Partial<MembershipApplication>
): Promise<void> {
  await getAdminDb()
    .collection('membershipApplications')
    .doc(id)
    .update(stripUndefined({ ...updates, updatedAt: Date.now() }));
}

export function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createMembershipInvite(options: {
  applicationId: string;
  email: string;
  expiresInDays?: number;
}): Promise<MembershipInvite> {
  const ref = getAdminDb().collection('membershipInvites').doc();
  const days = options.expiresInDays ?? 14;
  const invite: MembershipInvite = {
    id: ref.id,
    applicationId: options.applicationId,
    email: options.email.toLowerCase(),
    token: generateInviteToken(),
    status: 'sent',
    expiresAt: Date.now() + days * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
  };
  await ref.set(invite);
  return invite;
}

export async function getInviteByToken(token: string): Promise<MembershipInvite | null> {
  const snap = await getAdminDb()
    .collection('membershipInvites')
    .where('token', '==', token)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].data() as MembershipInvite;
}

export async function markInviteUsed(id: string): Promise<void> {
  await getAdminDb().collection('membershipInvites').doc(id).update({
    status: 'used',
    usedAt: Date.now(),
  });
}

export async function getMemberRecord(uid: string): Promise<MemberRecord | null> {
  const snap = await getAdminDb().collection('members').doc(uid).get();
  return snap.exists ? (snap.data() as MemberRecord) : null;
}

export async function upsertMemberRecord(uid: string, data: Partial<MemberRecord>): Promise<void> {
  const ref = getAdminDb().collection('members').doc(uid);
  const existing = await ref.get();
  if (existing.exists) {
    await ref.update(stripUndefined({ ...data, updatedAt: Date.now() }));
  } else {
    await ref.set(
      stripUndefined({
        uid,
        expertiseTags: [],
        directoryVisibility: 'members_only',
        socialLinks: {},
        availableForIntros: true,
        tierStatus: 'pending',
        notificationPrefs: {
          eventInvites: true,
          weeklyDigest: true,
          introRequests: true,
        },
        onboardingCompletedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...data,
      })
    );
  }
}

export async function createResourceSubmission(
  data: Omit<ResourceSubmission, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<ResourceSubmission> {
  const ref = getAdminDb().collection('resourceSubmissions').doc();
  const item: ResourceSubmission = stripUndefined({
    ...data,
    id: ref.id,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await ref.set(item);
  return item;
}

export async function listResourceSubmissions(): Promise<ResourceSubmission[]> {
  const snap = await getAdminDb().collection('resourceSubmissions').get();
  return snap.docs
    .map((d) => d.data() as ResourceSubmission)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateResourceSubmission(
  id: string,
  updates: Partial<ResourceSubmission>
): Promise<void> {
  await getAdminDb()
    .collection('resourceSubmissions')
    .doc(id)
    .update(stripUndefined({ ...updates, updatedAt: Date.now() }));
}

export async function getResourceSubmission(id: string): Promise<ResourceSubmission | null> {
  const snap = await getAdminDb().collection('resourceSubmissions').doc(id).get();
  return snap.exists ? (snap.data() as ResourceSubmission) : null;
}
