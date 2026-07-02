import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp, verifyAdminToken } from '@/lib/firebase-admin-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization');
    const isAdmin = await verifyAdminToken(authToken);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      },
      adminApp: null as any,
      nodeEnv: process.env.NODE_ENV,
    };

    try {
      const app = await getAdminApp();
      diagnostics.adminApp = app ? 'Initialized' : 'Not initialized';
    } catch (error) {
      diagnostics.adminApp = error instanceof Error ? error.message : String(error);
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('[v0] Diagnostics error:', error);
    return NextResponse.json({ error: 'Diagnostics failed' }, { status: 500 });
  }
}
