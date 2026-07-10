import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { UserRole } from '@/lib/types';
import { isAdminRole, isPrimaryAdmin } from '@/lib/auth-utils';
import { ALL_ADMIN_PERMISSIONS } from '@/lib/permissions';

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
    const email = (decoded.email || '').toLowerCase();
    const userDoc = await getAdminDb().collection('users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      // Primary admin can authenticate even before Firestore profile exists
      if (isPrimaryAdmin(email)) {
        return { uid: decoded.uid, email, role: 'super_admin' };
      }
      return null;
    }

    const data = userDoc.data()!;
    let role = data.role as UserRole;

    // Ensure primary admin always has super_admin for API access
    if (isPrimaryAdmin(email) && role !== 'super_admin') {
      role = 'super_admin';
      userDoc.ref
        .set(
          {
            role: 'super_admin',
            permissions: ALL_ADMIN_PERMISSIONS,
            updatedAt: Date.now(),
          },
          { merge: true }
        )
        .catch(() => undefined);
    }

    return {
      uid: decoded.uid,
      email: decoded.email || data.email,
      role,
    };
  } catch (err) {
    console.error('[api-auth] verifyAuth failed:', err);
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
  if (!isAdminRole(user.role) && !isPrimaryAdmin(user.email)) throw new Error('Forbidden');
  return user;
}

export async function requireSuperAdmin(req: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(req);
  if (user.role !== 'super_admin' && !isPrimaryAdmin(user.email)) throw new Error('Forbidden');
  return user;
}
