import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID, PRIMARY_ADMIN_EMAIL } from '@/lib/constants';
import {
  getDefaultCareersPage,
  getDefaultLegalPages,
  getDefaultPressPage,
  getDefaultResourcesPage,
  getSeedJobs,
  getSeedPressItems,
  getSeedResources,
} from '@/lib/content-page-defaults';
import {
  getDefaultMembershipTiers,
  getDefaultTaxonomies,
  TAXONOMIES_DOC_ID,
} from '@/lib/intake-defaults';
import { Settings } from '@/lib/types';

let seedPromise: Promise<void> | null = null;

/** One-time seed of page copy + sample list items when collections/settings are empty. */
export async function ensureSeededContent(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  const db = getAdminDb();
  const settingsRef = db.collection('settings').doc(SETTINGS_DOC_ID);
  const snap = await settingsRef.get();
  const existing = (snap.exists ? snap.data() : {}) as Partial<Settings>;
  const patch: Record<string, unknown> = {};

  if (!existing.resourcesPage) patch.resourcesPage = getDefaultResourcesPage();
  if (!existing.careersPage) patch.careersPage = getDefaultCareersPage();
  if (!existing.pressPage) patch.pressPage = getDefaultPressPage();
  if (!existing.legalPages) patch.legalPages = getDefaultLegalPages();

  // Normalize emails in existing content blobs to the primary admin address
  if (existing.pressPage && existing.pressPage.mediaContactEmail !== PRIMARY_ADMIN_EMAIL) {
    patch.pressPage = {
      ...getDefaultPressPage(),
      ...existing.pressPage,
      mediaContactEmail: PRIMARY_ADMIN_EMAIL,
      updatedAt: Date.now(),
    };
  }
  if (existing.legalPages) {
    const legal = existing.legalPages;
    const needsEmail =
      legal.privacy?.contactEmail !== PRIMARY_ADMIN_EMAIL ||
      legal.terms?.contactEmail !== PRIMARY_ADMIN_EMAIL;
    if (needsEmail) {
      const defaults = getDefaultLegalPages();
      patch.legalPages = {
        ...defaults,
        ...legal,
        privacy: {
          ...defaults.privacy,
          ...legal.privacy,
          contactEmail: PRIMARY_ADMIN_EMAIL,
          sections: legal.privacy?.sections?.length ? legal.privacy.sections : defaults.privacy.sections,
        },
        terms: {
          ...defaults.terms,
          ...legal.terms,
          contactEmail: PRIMARY_ADMIN_EMAIL,
          sections: legal.terms?.sections?.length ? legal.terms.sections : defaults.terms.sections,
        },
        updatedAt: Date.now(),
      };
    }
  }
  if (existing.resourcesPage && !existing.resourcesPage.submitCta?.body?.includes(PRIMARY_ADMIN_EMAIL)) {
    const defaults = getDefaultResourcesPage();
    patch.resourcesPage = {
      ...defaults,
      ...existing.resourcesPage,
      submitCta: {
        ...defaults.submitCta,
        ...existing.resourcesPage.submitCta,
        body: defaults.submitCta.body,
      },
      updatedAt: Date.now(),
    };
  }
  if (!existing.contactEmail || existing.contactEmail === 'hello@abundant.club') {
    patch.contactEmail = PRIMARY_ADMIN_EMAIL;
  }

  if (Object.keys(patch).length > 0) {
    await settingsRef.set(
      { ...patch, updatedAt: Date.now(), updatedBy: 'system-seed' },
      { merge: true }
    );
  }

  const resourcesSnap = await db.collection('resources').limit(1).get();
  if (resourcesSnap.empty) {
    const now = Date.now();
    const batch = db.batch();
    getSeedResources().forEach((item, i) => {
      const ref = db.collection('resources').doc();
      batch.set(ref, { ...item, id: ref.id, createdAt: now, updatedAt: now, order: i });
    });
    await batch.commit();
  }

  const jobsSnap = await db.collection('jobPostings').limit(1).get();
  if (jobsSnap.empty) {
    const now = Date.now();
    const batch = db.batch();
    getSeedJobs().forEach((item, i) => {
      const ref = db.collection('jobPostings').doc();
      batch.set(ref, { ...item, id: ref.id, createdAt: now, updatedAt: now, order: i });
    });
    await batch.commit();
  }

  const pressSnap = await db.collection('pressItems').limit(1).get();
  if (pressSnap.empty) {
    const now = Date.now();
    const batch = db.batch();
    getSeedPressItems().forEach((item, i) => {
      const ref = db.collection('pressItems').doc();
      batch.set(ref, { ...item, id: ref.id, createdAt: now, updatedAt: now, order: i });
    });
    await batch.commit();
  }

  // Intake config only (Phase 9) — taxonomies + membership tiers
  const taxRef = db.collection('taxonomies').doc(TAXONOMIES_DOC_ID);
  if (!(await taxRef.get()).exists) {
    await taxRef.set(getDefaultTaxonomies());
  }

  const tiersSnap = await db.collection('membershipTiers').limit(1).get();
  if (tiersSnap.empty) {
    const batch = db.batch();
    getDefaultMembershipTiers().forEach((tier) => {
      batch.set(db.collection('membershipTiers').doc(tier.id), tier);
    });
    await batch.commit();
  }
}
