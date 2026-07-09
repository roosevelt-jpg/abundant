import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  updateDoc,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { AdminInvite } from '@/lib/types';

function db() {
  return getDb();
}

const invitesRef = () => collection(db(), 'adminInvites');

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createAdminInvite(
  createdBy: string,
  role: 'admin' | 'super_admin',
  expiresInDays = 7
): Promise<AdminInvite> {
  const invite: AdminInvite = {
    id: doc(invitesRef()).id,
    code: generateCode(),
    role,
    createdBy,
    createdAt: Date.now(),
    expiresAt: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    status: 'pending',
  };
  await setDoc(doc(invitesRef(), invite.id), invite);
  return invite;
}

export async function getAllInvites(): Promise<AdminInvite[]> {
  const snap = await getDocs(invitesRef());
  return snap.docs.map((d) => d.data() as AdminInvite).sort((a, b) => b.createdAt - a.createdAt);
}

export async function revokeInvite(id: string): Promise<void> {
  await updateDoc(doc(invitesRef(), id), { status: 'revoked' });
}

export async function validateInviteCode(code: string): Promise<AdminInvite | null> {
  const q = query(invitesRef(), where('code', '==', code.toUpperCase()), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const invite = snap.docs[0].data() as AdminInvite;
  if (invite.expiresAt < Date.now()) {
    await updateDoc(doc(invitesRef(), invite.id), { status: 'expired' });
    return null;
  }
  return invite;
}

export async function markInviteUsed(id: string, usedBy: string): Promise<void> {
  await updateDoc(doc(invitesRef(), id), {
    status: 'used',
    usedAt: Date.now(),
    usedBy,
  });
}

export async function deleteInvite(id: string): Promise<void> {
  await deleteDoc(doc(invitesRef(), id));
}
