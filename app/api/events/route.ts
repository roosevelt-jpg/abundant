import { NextRequest, NextResponse } from 'next/server';
import { getEvents, addEvent, updateEvent, deleteEvent } from '@/lib/firestore-service';

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

// GET /api/events
export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error('[v0] Error in GET /api/events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/events
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request.headers.get('authorization'));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const id = await addEvent(data);
    return NextResponse.json({ id, ...data }, { status: 201 });
  } catch (error) {
    console.error('[v0] Error in POST /api/events:', error);
    return NextResponse.json({ error: 'Failed to add event' }, { status: 500 });
  }
}
