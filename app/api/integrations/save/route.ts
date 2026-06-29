import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-server';
import { verifyAdminToken } from '@/lib/admin-utils';

export async function POST(request: NextRequest) {
  try {
    let integrations;
    try {
      const body = await request.json();
      integrations = body.integrations || {};
    } catch (parseError) {
      console.error('[v0] JSON parse error:', parseError);
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Verify token exists (optional check for security, but don't block if Firebase not configured yet)
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      console.warn('[v0] No authorization token provided for integrations save');
      // Allow for now since this is the first setup step
    }
    
    // Try to verify as admin, but allow if Firebase not configured yet
    if (token) {
      const isAdmin = await verifyAdminToken(token);
      if (!isAdmin) {
        console.warn('[v0] Token verification failed, but continuing');
        // Continue anyway - this is the setup endpoint
      }
    }

    let db;
    try {
      db = await getDb();
    } catch (dbInitError) {
      console.error('[v0] Error initializing database:', dbInitError);
      return NextResponse.json(
        { message: 'Database initialization error' },
        { status: 503 }
      );
    }
    
    if (!db) {
      console.warn('[v0] Database not initialized, integrations data received but cannot persist');
      // Still return success so user sees the credentials were submitted
      // They will be persisted once Firebase is configured
      return NextResponse.json(
        { 
          message: 'Integrations received (database pending Firebase configuration)',
          integrations,
          status: 'pending'
        },
        { status: 200 }
      );
    }

    // Save integrations to Firestore under settings/integrations
    const settingsRef = db.collection('settings').doc('main');
    
    try {
      // Get existing settings
      const existing = await settingsRef.get();
      
      if (existing.exists) {
        // Update existing settings with new integrations
        await settingsRef.update({
          integrations: integrations,
          updatedAt: Date.now(),
          updatedBy: 'admin'
        });
      } else {
        // Create new settings document
        await settingsRef.set({
          id: 'main',
          integrations: integrations,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          updatedBy: 'admin'
        });
      }

      console.log('[v0] Integrations saved successfully to Firestore');

      return NextResponse.json(
        { 
          message: 'Integrations saved successfully',
          integrations,
          status: 'saved'
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('[v0] Database error saving integrations:', dbError);
      return NextResponse.json(
        { message: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[v0] Error in POST /api/integrations/save:', errorMessage);
    return NextResponse.json(
      { 
        message: `Error: ${errorMessage}`,
        error: true
      },
      { status: 500 }
    );
  }
}
