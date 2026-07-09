import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { UserRole } from '@/lib/types';
import { isAdminRole } from '@/lib/auth-utils';

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
}

export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;

  try {
    const token = header.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const userDoc = await getAdminDb().collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) return null;

    const data = userDoc.data()!;
    return {
      uid: decoded.uid,
      email: decoded.email || data.email,
      role: data.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = await verifyAuth(req);
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(req);
  if (!isAdminRole(user.role)) throw new Error('Forbidden');
  return user;
}
