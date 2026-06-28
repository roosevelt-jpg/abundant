import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const db = await getDb();
    
    if (!db) {
      return NextResponse.json({ status: 'inactive' });
    }

    // Fetch user's subscription from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ status: 'inactive' });
    }

    const userData = userDoc.data();
    return NextResponse.json({
      status: userData?.subscriptionStatus || 'inactive',
      planId: userData?.subscriptionPlanId,
      planName: userData?.subscriptionPlanName,
      renewalDate: userData?.subscriptionRenewalDate,
      startDate: userData?.subscriptionStartDate
    });
  } catch (error) {
    console.error('[v0] Error fetching subscription:', error);
    return NextResponse.json({ status: 'inactive' });
  }
}
