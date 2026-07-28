import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { HOSTING_PERIOD_OPTIONS, HOSTING_PLANS } from '@/lib/hosting-plans';
import { getSiteHostingStatus } from '@/lib/site-hosting';
import { getStripePublishableKey, isStripeConfigured } from '@/lib/stripe-server';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [publishableKey, configured, siteHosting] = await Promise.all([
      getStripePublishableKey(),
      isStripeConfigured(),
      getSiteHostingStatus(),
    ]);

    return NextResponse.json({
      configured,
      publishableKey: configured ? publishableKey : null,
      siteHosting,
      periodOptions: HOSTING_PERIOD_OPTIONS,
      plans: HOSTING_PLANS.map((p) => ({
        id: p.id,
        name: p.name,
        fullName: p.fullName,
        tagline: p.tagline,
        resources: p.resources,
        features: p.features,
        periods: Object.fromEntries(
          HOSTING_PERIOD_OPTIONS.map((months) => {
            const pricing = p.periods[months];
            return [
              months,
              {
                months,
                priceMonthly: pricing.priceMonthly,
                priceOriginalMonthly: pricing.priceOriginalMonthly,
                renewMonthly: pricing.renewMonthly,
                savePercent: pricing.savePercent,
                total: pricing.getTotal(),
                originalTotal: pricing.getOriginalTotal(),
              },
            ];
          })
        ),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
