import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { HOSTING_PLANS } from '@/lib/hosting-plans';
import { getSiteHostingStatus } from '@/lib/site-hosting';
import {
  getHostingStripePublishableKey,
  isHostingStripeConfigured,
} from '@/lib/stripe-hosting-server';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [publishableKey, configured, siteHosting] = await Promise.all([
      getHostingStripePublishableKey(),
      isHostingStripeConfigured(),
      getSiteHostingStatus(),
    ]);

    return NextResponse.json({
      configured,
      publishableKey: configured ? publishableKey : null,
      siteHosting,
      plans: HOSTING_PLANS.map((p) => ({
        id: p.id,
        name: p.name,
        fullName: p.fullName,
        tagline: p.tagline,
        resources: p.resources,
        features: p.features,
        periods: {
          12: {
            months: 12,
            priceMonthly: p.periods[12].priceMonthly,
            priceOriginalMonthly: p.periods[12].priceOriginalMonthly,
            renewMonthly: p.periods[12].renewMonthly,
            savePercent: p.periods[12].savePercent,
            total: p.periods[12].getTotal(),
            originalTotal: p.periods[12].getOriginalTotal(),
          },
          24: {
            months: 24,
            priceMonthly: p.periods[24].priceMonthly,
            priceOriginalMonthly: p.periods[24].priceOriginalMonthly,
            renewMonthly: p.periods[24].renewMonthly,
            savePercent: p.periods[24].savePercent,
            total: p.periods[24].getTotal(),
            originalTotal: p.periods[24].getOriginalTotal(),
          },
        },
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
