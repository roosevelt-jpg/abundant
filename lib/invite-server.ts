import { getAdminDb } from '@/lib/firebase-admin';
import { getAdminAuth } from '@/lib/firebase-admin';
import { AdminInvite, AdminPermission, User } from '@/lib/types';

export async function findPendingInvite(code: string): Promise<AdminInvite | null> {
  const normalized = code.trim().toUpperCase();
  const db = getAdminDb();
  const snap = await db
    .collection('adminInvites')
    .where('code', '==', normalized)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (snap.empty) return null;

  const invite = snap.docs[0].data() as AdminInvite;
  if (invite.expiresAt < Date.now()) {
    await snap.docs[0].ref.update({ status: 'expired' });
    return null;
  }
  return invite;
}

export async function acceptAdminInvite(options: {
  code: string;
  email: string;
  password: string;
  displayName: string;
}): Promise<{ uid: string; email: string }> {
  const invite = await findPendingInvite(options.code);
  if (!invite) throw new Error('Invalid or expired invite code');

  const email = options.email.trim().toLowerCase();
  const inviteEmail = invite.email.trim().toLowerCase();

  if (email !== inviteEmail) {
    throw new Error('Email does not match the invited address');
  }

  if (options.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  let userRecord;
  try {
    userRecord = await auth.createUser({
      email,
      password: options.password,
      displayName: options.displayName.trim(),
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/email-already-exists') {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    throw err;
  }

  const permissions: AdminPermission[] =
    invite.role === 'super_admin'
      ? []
      : invite.permissions || [];

  const newUser: User = {
    uid: userRecord.uid,
    email,
    displayName: options.displayName.trim(),
    role: invite.role,
    permissions: invite.role === 'admin' ? permissions : undefined,
    membershipTier: 'member',
    joinedAt: Date.now(),
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.collection('users').doc(userRecord.uid).set(newUser);
  await db.collection('adminInvites').doc(invite.id).update({
    status: 'used',
    usedAt: Date.now(),
    usedBy: userRecord.uid,
  });

  return { uid: userRecord.uid, email };
}
