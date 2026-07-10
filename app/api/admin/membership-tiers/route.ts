import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import {
  getAllMembershipTiers,
  getTaxonomies,
  saveTaxonomies,
  upsertMembershipTier,
} from '@/lib/intake-service';
import { MembershipTier, Taxonomies } from '@/lib/types';
import { stripUndefined } from '@/lib/strip-undefined';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const [tiers, taxonomies] = await Promise.all([getAllMembershipTiers(), getTaxonomies()]);
    return NextResponse.json({ tiers, taxonomies });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    if (body.tier) {
      const tier = stripUndefined(body.tier) as MembershipTier;
      await upsertMembershipTier(tier);
    }
    if (body.taxonomies) {
      await saveTaxonomies(body.taxonomies as Partial<Taxonomies>);
    }
    const [tiers, taxonomies] = await Promise.all([getAllMembershipTiers(), getTaxonomies()]);
    return NextResponse.json({ tiers, taxonomies });
  } catch (error) {
    console.error('[api/admin/membership-tiers]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
