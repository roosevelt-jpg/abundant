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
        // Properly handle private key - it might have literal \n or actual newlines
        let formattedPrivateKey = privateKey;
        
        // If it contains literal \n, convert to actual newlines
        if (formattedPrivateKey.includes('\\n')) {
          formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
        }
        
        // Ensure key has proper PEM format
        if (!formattedPrivateKey.includes('BEGIN PRIVATE KEY')) {
          throw new Error('Invalid private key format - must contain BEGIN PRIVATE KEY');
        }

        console.log('[v0] Initializing Firebase Admin SDK with projectId:', projectId);
        
        // Initialize Firebase Admin with provided credentials
        let app;
        const existingApps = getApps();
        
        if (existingApps.length > 0) {
          app = existingApps[0];
          console.log('[v0] Using existing Firebase app');
        } else {
          app = initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey: formattedPrivateKey,
            }),
          });
          console.log('[v0] Initialized new Firebase app');
        }

        const db = getFirestore(app);
        const settingsRef = db.collection('settings').doc('main');

        console.log('[v0] Saving integrations to Firestore...');
        
        // Save all integrations to Firestore
        const docSnap = await settingsRef.get();

        if (docSnap.exists) {
          await settingsRef.update({
            integrations: payload,
            updatedAt: new Date(),
            updatedBy: 'admin'
          });
          console.log('[v0] Updated existing settings document');
        } else {
          await settingsRef.set({
            id: 'main',
            integrations: payload,
            createdAt: new Date(),
            updatedAt: new Date(),
            updatedBy: 'admin'
          });
          console.log('[v0] Created new settings document');
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
        console.error('[v0] Firebase error:', errorMsg, firebaseError);
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
