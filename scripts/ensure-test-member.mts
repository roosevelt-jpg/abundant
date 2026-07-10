/**
 * Ensure a test member account exists for local dashboard testing.
 * Usage: node --import tsx scripts/ensure-test-member.mts
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const { getAdminAuth, getAdminDb } = await import('../lib/firebase-admin.ts');

const email = 'member@abundantglobalclub.com';
const password = 'Member@Abundant123!';
const displayName = 'Test Member';

const auth = getAdminAuth();
const db = getAdminDb();

let uid: string;
try {
  const existing = await auth.getUserByEmail(email);
  uid = existing.uid;
  await auth.updateUser(uid, { password, emailVerified: true, displayName });
  console.log('Updated existing Auth user:', email);
} catch {
  const created = await auth.createUser({
    email,
    password,
    displayName,
    emailVerified: true,
  });
  uid = created.uid;
  console.log('Created Auth user:', email);
}

const now = Date.now();
await db.collection('users').doc(uid).set(
  {
    uid,
    email,
    displayName,
    role: 'member',
    membershipTier: 'global',
    joinedAt: now,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    country: 'AE',
    countryOfResidence: 'AE',
    nationality: 'AE',
    citizenship: 'AE',
    city: 'Dubai',
    gender: 'prefer_not_to_say',
    welcomeEmailSentAt: now,
    emailVerifiedAt: now,
  },
  { merge: true }
);

await db.collection('members').doc(uid).set(
  {
    uid,
    email,
    displayName,
    expertiseTags: [],
    directoryVisibility: 'members_only',
    socialLinks: {},
    availableForIntros: true,
    tier: 'global',
    tierStatus: 'pending',
    notificationPrefs: { eventInvites: true, weeklyDigest: true, introRequests: true },
    onboardingCompletedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  { merge: true }
);

console.log('Firestore user + member docs ready');
console.log('');
console.log('Member login');
console.log('  Email:    ', email);
console.log('  Password: ', password);
console.log('  URL:      ', 'http://localhost:3001/login');
