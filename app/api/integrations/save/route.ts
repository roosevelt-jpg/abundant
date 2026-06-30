import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Simple endpoint to save integrations
 * Stores Firebase credentials in Firestore, then uses them to initialize Admin SDK
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { message: 'No data provided' },
        { status: 400 }
      );
    }

    // Extract Firebase Admin SDK credentials from payload
    const firebaseAdmin = payload.firebaseAdmin || {};
    const projectId = firebaseAdmin.projectId;
    const clientEmail = firebaseAdmin.clientEmail;
    const privateKey = firebaseAdmin.privateKey;

    // If Firebase credentials provided, use them to initialize and save
    if (projectId && clientEmail && privateKey) {
      try {
        // Initialize Firebase Admin with provided credentials
        let app;
        const existingApps = getApps();
        
        if (existingApps.length > 0) {
          app = existingApps[0];
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

        // Save all integrations to Firestore
        const docSnap = await settingsRef.get();

        if (docSnap.exists) {
          await settingsRef.update({
            integrations: payload,
            updatedAt: new Date(),
            updatedBy: 'admin'
          });
        } else {
          await settingsRef.set({
            id: 'main',
            integrations: payload,
            createdAt: new Date(),
            updatedAt: new Date(),
            updatedBy: 'admin'
          });
        }

        return NextResponse.json(
          {
            message: 'Integrations saved successfully',
            status: 'success'
          },
          { status: 200 }
        );
      } catch (firebaseError) {
        const errorMsg = firebaseError instanceof Error ? firebaseError.message : String(firebaseError);
        console.error('[v0] Firebase error:', errorMsg);
        return NextResponse.json(
          {
            message: `Firebase error: ${errorMsg}`
          },
          { status: 500 }
        );
      }
    }

    // If no Firebase credentials but other integrations provided, just return success
    // (They can be stored later once Firebase is set up)
    return NextResponse.json(
      {
        message: 'Data received - Firebase Admin SDK credentials needed to persist to database',
        status: 'pending'
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[v0] Save error:', errorMsg);
    return NextResponse.json(
      {
        message: `Error: ${errorMsg}`
      },
      { status: 500 }
    );
  }
}
