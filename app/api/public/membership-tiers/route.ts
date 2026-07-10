import { NextResponse } from 'next/server';
import { getVisibleMembershipTiers } from '@/lib/intake-service';
import { ensureSeededContent } from '@/lib/seed-content';

export async function GET() {
  try {
    await ensureSeededContent();
    const tiers = await getVisibleMembershipTiers();
    return NextResponse.json(tiers);
  } catch (error) {
    console.error('[api/public/membership-tiers]', error);
    return NextResponse.json([]);
  }
}
