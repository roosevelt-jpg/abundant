import { NextRequest, NextResponse } from 'next/server';
import { updateEvent, deleteEvent } from '@/lib/firestore-service';

export const dynamic = 'force-dynamic';

async function initializeFirebase() {
  // Only initialize in production/preview environments where env vars are available
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    return; // Skip initialization during build
  }
  
  try {
    const firebaseApp = await import('firebase-admin/app') as any;
    const { initializeApp, cert, getApps } = firebaseApp;
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
        } as any),
      });
    }
  } catch (error) {
    console.error('[v0] Firebase init error:', error);
  }
}

async function verifyAdmin(authToken: string | null | undefined) {
  if (!authToken) return false;
  try {
    const { getAuth } = await import('firebase-admin/auth');
    const token = authToken.replace('Bearer ', '');
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken.email === 'admin@abundantglobalclub.com';
  } catch (error) {
    return false;
  }
}

// PUT /api/events/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isAdmin = await verifyAdmin(request.headers.get('authorization'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    await updateEvent(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in PUT /api/events/[id]:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE /api/events/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isAdmin = await verifyAdmin(request.headers.get('authorization'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteEvent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error in DELETE /api/events/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
