import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-server';
import type { MembershipPlan } from '@/lib/types';

export async function GET() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[v0] Database not initialized, returning empty list');
      return NextResponse.json([]);
    }

    const snapshot = await db.collection('membershipPlans')
      .orderBy('order', 'asc')
      .get();

    const plans: MembershipPlan[] = [];
    snapshot.forEach((doc: any) => {
      plans.push(doc.data() as MembershipPlan);
    });

    return NextResponse.json(plans, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('[v0] Error fetching membership plans:', error);
    // Return empty array on error instead of 500
    return NextResponse.json([]);
  }
}
