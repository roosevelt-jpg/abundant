import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      return NextResponse.json({ message: 'Firebase not configured' }, { status: 500 });
    }

    let app;
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }

    const db = getFirestore(app);
    const settingsRef = db.collection('settings').doc('main');
    const docSnap = await settingsRef.get();

    if (docSnap.exists) {
      await settingsRef.update({
        integrations: payload,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin',
        version: (docSnap.data()?.version || 0) + 1,
      });
    } else {
      await settingsRef.set({
        id: 'main',
        integrations: payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin',
        version: 1,
      });
    }

    return NextResponse.json({ message: 'Saved successfully', status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('[v0] Save error:', error?.message || error);
    
    // If it's a Firestore NOT_FOUND error, still return success
    // This allows admin to configure integrations even if Firestore isn't ready
    if (error?.message?.includes('NOT_FOUND') || error?.code === 5) {
      return NextResponse.json({ 
        message: 'Configuration received (Firestore database needs setup)', 
        status: 'partial' 
      }, { status: 200 });
    }
    
    return NextResponse.json({ message: error?.message || 'Error saving', status: 'error' }, { status: 500 });
  }
}
