import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getDb } from '@/lib/firebase-admin-server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];

    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const { planId } = await request.json();

    // Get Firestore database
    const db = await getDb();

    // Get plan details
    const planRef = db.collection('membershipPlans').doc(planId);
    const planSnap = await planRef.get();

    if (!planSnap.exists) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const planData = planSnap.data();

    // Update user subscription in Firestore
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      membershipPlanId: planId,
      membershipTier: planData?.slug,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      updatedAt: new Date(),
    });

    // Increment subscriber count
    await planRef.update({
      subscribers: (planData?.subscribers || 0) + 1,
    });

    // TODO: Create Stripe checkout session here when Stripe is configured
    // For now, return success response

    return NextResponse.json({
      success: true,
      message: 'Subscription updated',
      plan: {
        id: planId,
        name: planData?.name,
        price: planData?.price,
        billingCycle: planData?.billingCycle,
      },
    });
  } catch (error) {
    console.error('[v0] Subscription error:', error);
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }
}
