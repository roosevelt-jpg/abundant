import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-server';

/**
 * Save integrations endpoint
 * Uses environment-configured Firebase credentials
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return NextResponse.json(
        { message: 'Invalid JSON', error: 'parse_error' },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { message: 'Empty payload', error: 'empty' },
        { status: 400 }
      );
    }

    // 2. Get Firestore database using environment credentials
    const db = await getDb();

    if (!db) {
      // No environment credentials available
      // Check if user provided credentials in request
      const firebaseAdmin = payload.firebaseAdmin || {};
      
      if (!firebaseAdmin.projectId || !firebaseAdmin.clientEmail || !firebaseAdmin.privateKey) {
        return NextResponse.json(
          {
            message: 'Firebase environment variables not configured. Please add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to your environment.',
            error: 'no_firebase_config',
            hint: 'Set up Firebase Admin SDK credentials in environment variables first'
          },
          { status: 200 }
        );
      }

      // User provided credentials - but we can't use them here
      // This is a security issue - don't accept credentials via API
      return NextResponse.json(
        {
          message: 'Cannot accept Firebase credentials via API for security reasons. Set environment variables instead.',
          error: 'unsafe_credentials'
        },
        { status: 400 }
      );
    }

    // 3. Save to Firestore
    try {
      const settingsRef = db.collection('settings').doc('main');
      const docSnap = await settingsRef.get();

      if (docSnap.exists) {
        await settingsRef.update({
          integrations: payload,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin',
          version: (docSnap.data()?.version || 0) + 1
        });
      } else {
        await settingsRef.set({
          id: 'main',
          integrations: payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin',
          version: 1
        });
      }

      return NextResponse.json(
        {
          message: 'All integrations saved successfully!',
          status: 'success'
        },
        { status: 200 }
      );
    } catch (saveError) {
      const msg = saveError instanceof Error ? saveError.message : String(saveError);
      console.error('[v0] Firestore save failed:', msg);
      
      return NextResponse.json(
        {
          message: `Failed to save to Firestore: ${msg}`,
          error: 'firestore_error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[v0] Unexpected error:', msg);
    
    return NextResponse.json(
      { message: `Unexpected error: ${msg}`, error: 'unknown' },
      { status: 500 }
    );
  }
}
