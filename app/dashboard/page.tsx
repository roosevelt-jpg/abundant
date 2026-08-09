'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { isMembershipOpenAccess } from '@/lib/constants';
import { useSettings } from '@/hooks/useSettings';
import { isAdminRole } from '@/lib/auth-utils';
import { useLanguage } from '@/context/LanguageContext';
import { EmailVerifyBanner } from '@/components/email-verify-banner';
import { EnablePushCard } from '@/components/enable-push-card';

export default function Dashboard() {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const paidPlansEnabled = settings?.membershipAccess?.paidPlansEnabled === true;

  useEffect(() => {
    if (loading || !currentUser || !userData || isAdminRole(userData.role)) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch('/api/members/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.member && !data.member.onboardingCompletedAt) {
          router.replace('/onboarding');
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, currentUser, userData, router]);

  const showUpgradeBanner =
    !loading &&
    userData &&
    paidPlansEnabled &&
    !isMembershipOpenAccess(true) &&
    userData.subscriptionStatus !== 'active' &&
    userData.subscriptionStatus !== 'trialing';

  if (loading || !currentUser) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        {t('common.loading', 'Loading...')}
      </div>
    );
  }

  const status = userData?.status || 'active';
  const membershipTier = userData?.membershipTier || 'member';

  return (
    <div>
      <EmailVerifyBanner />
      {showUpgradeBanner && (
        <div className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold">
              {t('dashboard.upgrade', 'Your free access period has ended')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(
                'dashboard.upgradeDesc',
                'Upgrade to continue enjoying full member benefits.'
              )}
            </p>
          </div>
          <Link
            href="/membership"
            className="btn-gradient px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
          >
            {t('dashboard.viewPlans', 'View Plans')}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="font-heading font-bold mb-4">{t('common.status', 'Status')}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-semibold text-foreground capitalize">{status}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {status === 'active' && t('common.active', 'Active')}
            {status === 'inactive' && t('common.inactive', 'Inactive')}
            {status === 'suspended' && 'Your account is suspended - contact support'}
          </p>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="font-heading font-bold mb-4">
            {t('dashboard.membershipStatus', 'Membership Status')}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-semibold text-accent capitalize">{membershipTier}</span>
          </p>
          <Link href="/membership" className="text-xs text-accent hover:text-accent/80">
            {t('dashboard.viewPlans', 'View Plans')} →
          </Link>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="font-heading font-bold mb-4">
            {t('dashboard.quickLinks', 'Quick Links')}
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/dashboard/profile" className="text-accent hover:text-accent/80">
                {t('dashboard.myProfile', 'My Profile')}
              </Link>
            </li>
            <li>
              <Link href="/events" className="text-accent hover:text-accent/80">
                {t('nav.events', 'Events')}
              </Link>
            </li>
            <li>
              <Link href="/dashboard/testimonials" className="text-accent hover:text-accent/80">
                {t('admin.nav.testimonials', 'Testimonials')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div id="notifications" className="mb-8 scroll-mt-8">
        <EnablePushCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="font-heading text-lg font-bold mb-4">
            {t('dashboard.upcomingEvents', 'Upcoming Events')}
          </h3>
          <p className="text-muted-foreground text-sm mb-3">
            {t('events.subtitle', 'Join us for exclusive networking and learning opportunities')}
          </p>
          <Link href="/events" className="text-sm font-semibold text-accent hover:text-accent/80">
            {t('common.viewAll', 'View all')} →
          </Link>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="font-heading text-lg font-bold mb-4">
            {t('nav.membership', 'Membership')}
          </h3>
          <p className="text-muted-foreground text-sm mb-3">
            {t('membership.subtitle', 'Choose the tier that aligns with your ambitions')}
          </p>
          <Link href="/membership" className="text-sm font-semibold text-accent hover:text-accent/80">
            {t('dashboard.viewPlans', 'View Plans')} →
          </Link>
        </div>
      </div>
    </div>
  );
}
