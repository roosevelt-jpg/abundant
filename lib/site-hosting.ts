import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { getHostingPlan, HostingPeriodMonths, HostingPlanId, SITE_HOSTING_DOMAIN } from '@/lib/hosting-plans';
import { SiteHostingStatus } from '@/lib/types';

export { SITE_HOSTING_DOMAIN };

export function buildActiveSiteHosting(input: {
  planId: HostingPlanId;
  periodMonths: HostingPeriodMonths;
  orderId: string;
  paymentIntentId: string;
  activatedBy: string;
  paidAt?: number;
}): SiteHostingStatus {
  const paidAt = input.paidAt ?? Date.now();
  const plan = getHostingPlan(input.planId);
  const msPerMonth = 30.44 * 24 * 60 * 60 * 1000;

  return {
    status: 'active',
    domain: SITE_HOSTING_DOMAIN,
    planId: input.planId,
    planName: plan?.fullName || input.planId,
    periodMonths: input.periodMonths,
    orderId: input.orderId,
    paymentIntentId: input.paymentIntentId,
    activatedAt: paidAt,
    expiresAt: paidAt + input.periodMonths * msPerMonth,
    activatedBy: input.activatedBy,
    updatedAt: paidAt,
  };
}

/** Persist Active hosting for abundantglobalclub.com after successful payment. */
export async function activateSiteHosting(input: {
  planId: HostingPlanId;
  periodMonths: HostingPeriodMonths;
  orderId: string;
  paymentIntentId: string;
  activatedBy: string;
  paidAt?: number;
}): Promise<SiteHostingStatus> {
  const siteHosting = buildActiveSiteHosting(input);
  await getAdminDb()
    .collection('settings')
    .doc(SETTINGS_DOC_ID)
    .set({ siteHosting, updatedAt: Date.now() }, { merge: true });
  return siteHosting;
}

export async function getSiteHostingStatus(): Promise<SiteHostingStatus | null> {
  const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC_ID).get();
  const status = snap.data()?.siteHosting as SiteHostingStatus | undefined;
  if (!status) return null;

  // Auto-expire if past expiresAt
  if (status.status === 'active' && status.expiresAt && status.expiresAt < Date.now()) {
    return { ...status, status: 'expired', updatedAt: Date.now() };
  }
  return status;
}
