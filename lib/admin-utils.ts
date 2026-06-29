import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from './firebase-admin-server';

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const app = await getAdminApp();
    if (!app) {
      console.warn('[v0] Admin app not initialized, allowing request');
      return false;
    }

    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(token);

    // Check if user is admin (you can add custom claims check here)
    if (decodedToken.admin === true || decodedToken.email === 'admin@abundantglobalclub.com') {
      return true;
    }

    // Also allow if user has admin custom claim
    if (decodedToken.customClaims?.admin === true) {
      return true;
    }

    console.warn('[v0] User not authorized as admin:', decodedToken.uid);
    return false;
  } catch (error) {
    console.error('[v0] Error verifying admin token:', error);
    return false;
  }
}
