import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/api-auth';
import { logActivityServer } from '@/lib/activity-log';
import { MembershipPlan } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const db = getAdminDb();

    const existing = await db.collection('membershipPlans').get();
    const ref = db.collection('membershipPlans').doc();
    const now = Date.now();

    const plan: MembershipPlan = {
      id: ref.id,
      name: body.name || 'New Plan',
      price: body.price ?? 99,
      currency: body.currency || 'usd',
      interval: body.interval || 'month',
      benefits: body.benefits || ['Community access'],
      tier: body.tier || 'member',
      active: body.active ?? true,
      order: existing.size,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(plan);

    await logActivityServer({
      type: 'create',
      entity: 'plan',
      entityId: plan.id,
      description: `Membership plan created: ${plan.name}`,
      actorId: admin.uid,
      actorName: admin.email,
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('[api/admin/plans POST]', error);
    const message = error instanceof Error ? error.message : 'Failed to create plan';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
