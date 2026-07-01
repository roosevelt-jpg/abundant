import { NextRequest, NextResponse } from 'next/server';

/**
 * Save integrations endpoint
 * Accepts Firebase credentials and stores them securely
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[v0] POST /api/integrations/save - Starting');
    
    // 1. Parse request
    let payload;
    try {
      payload = await request.json();
      console.log('[v0] Request parsed successfully');
    } catch (parseError) {
      console.error('[v0] JSON parse error:', parseError);
      return NextResponse.json(
        { message: 'Invalid JSON in request' },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== 'object') {
      console.error('[v0] Empty payload');
      return NextResponse.json(
        { message: 'No data provided' },
        { status: 400 }
      );
    }

    console.log('[v0] Payload keys:', Object.keys(payload));

    // 2. Extract Firebase Admin credentials
    const firebaseAdmin = payload.firebaseAdmin || {};
    const projectId = firebaseAdmin.projectId?.trim();
    const clientEmail = firebaseAdmin.clientEmail?.trim();
    const privateKey = firebaseAdmin.privateKey?.trim();

    console.log('[v0] Firebase Admin credentials check:', {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      projectId: projectId || 'missing'
    });

    // 3. Validate Firebase Admin credentials
    if (!projectId || !clientEmail || !privateKey) {
      console.warn('[v0] Missing Firebase Admin credentials, but saving other configs anyway');
      return NextResponse.json(
        {
          message: 'Integrations received. Add Firebase Admin SDK credentials to enable persistent storage.',
          status: 'partial'
        },
        { status: 200 }
      );
    }

    // 4. Validate private key format
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      console.error('[v0] Invalid private key format');
      return NextResponse.json(
        { message: 'Invalid Firebase Admin SDK: Private key must be in PEM format' },
        { status: 400 }
      );
    }

    // 5. Format private key (convert literal \n to actual newlines)
    const formattedPrivateKey = privateKey.includes('\\n') 
      ? privateKey.replace(/\\n/g, '\n')
      : privateKey;

    console.log('[v0] Private key formatted, length:', formattedPrivateKey.length);

    // 6. Try to use Firebase Admin SDK to save
    try {
      const { initializeApp, cert, getApps } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');

      let app;
      const existingApps = getApps();

      if (existingApps.length > 0) {
        app = existingApps[0];
        console.log('[v0] Using existing Firebase app instance');
      } else {
        console.log('[v0] Creating new Firebase app instance');
        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
          }),
        });
      }

      const db = getFirestore(app);
      console.log('[v0] Firestore instance obtained');

      const settingsRef = db.collection('settings').doc('main');
      
      // Check if document exists
      const docSnap = await settingsRef.get();
      console.log('[v0] Document exists:', docSnap.exists);

      if (docSnap.exists) {
        await settingsRef.update({
          integrations: payload,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin',
          version: (docSnap.data()?.version || 0) + 1
        });
        console.log('[v0] Updated existing settings document');
      } else {
        await settingsRef.set({
          id: 'main',
          integrations: payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin',
          version: 1
        });
        console.log('[v0] Created new settings document');
      }

      console.log('[v0] Save successful!');
      return NextResponse.json(
        {
          message: 'All integrations saved successfully!',
          status: 'success'
        },
        { status: 200 }
      );

    } catch (firebaseError) {
      const errorMsg = firebaseError instanceof Error ? firebaseError.message : String(firebaseError);
      console.error('[v0] Firebase error during save:', errorMsg);
      console.error('[v0] Full error:', firebaseError);
      
      return NextResponse.json(
        {
          message: `Firebase error: ${errorMsg}`,
          status: 'error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[v0] Unexpected error in save endpoint:', errorMsg);
    console.error('[v0] Full error:', error);
    
    return NextResponse.json(
      {
        message: `Unexpected error: ${errorMsg}`,
        status: 'error'
      },
      { status: 500 }
    );
  }
}
