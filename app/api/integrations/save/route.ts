import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-server';
import { verifyAdminToken } from '@/lib/admin-utils';

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isAdmin = await verifyAdminToken(token);
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Access denied - admin required' },
        { status: 403 }
      );
    }

    const { integrations } = await request.json();

    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        { message: 'Database not initialized' },
        { status: 503 }
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

      console.log('[v0] Integrations saved successfully');

      return NextResponse.json(
        { 
          message: 'Integrations saved successfully',
          integrations 
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('[v0] Database error saving integrations:', dbError);
      return NextResponse.json(
        { message: 'Failed to save integrations to database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[v0] Error in POST /api/integrations/save:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
