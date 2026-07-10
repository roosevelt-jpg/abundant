'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isWithinFreePeriod } from '@/lib/constants';
import { isAdminRole } from '@/lib/auth-utils';
import { useLanguage } from '@/context/LanguageContext';
import { EmailVerifyBanner } from '@/components/email-verify-banner';
import { EnablePushCard } from '@/components/enable-push-card';

export default function Dashboard() {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

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
    !isWithinFreePeriod() &&
    userData.subscriptionStatus !== 'active' &&
    userData.subscriptionStatus !== 'trialing';

  if (loading || !currentUser) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">Loading your dashboard…</div>
    );
  }

  const displayName = userData?.displayName || currentUser.email || 'Member';
  const joinedDate = userData?.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : 'Recently';
  const status = userData?.status || 'active';
  const membershipTier = userData?.membershipTier || 'member';

  return (
    <div>
      <EmailVerifyBanner />
      {showUpgradeBanner && (
        <div className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold">
              {t('dashboard.upgrade', 'Membership required for events from September 1')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(
                'dashboard.upgradeDesc',
                'Upgrade to unlock free events and member discounts on paid events.'
              )}
            </p>
          </div>
          <Link
            href="/membership"
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-semibold whitespace-nowrap"
          >
            {t('dashboard.viewPlans', 'View Plans')}
          </Link>
        </div>
      )}

      <div className="mb-8">
        <h2 className="font-heading text-3xl font-bold mb-2">
          {t('dashboard.welcome', 'Welcome')}, {displayName}!
        </h2>
        <p className="text-muted-foreground">Member since {joinedDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="font-heading font-bold mb-4">Your Status</h3>
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-semibold text-foreground capitalize">{status}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {status === 'active' && 'Your account is active'}
            {status === 'inactive' && 'Your account is inactive'}
            {status === 'suspended' && 'Your account is suspended - contact support'}
          </p>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="font-heading font-bold mb-4">Membership Tier</h3>
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-semibold text-accent capitalize">{membershipTier}</span>
          </p>
          <Link href="/membership" className="text-xs text-accent hover:text-accent/80">
            Upgrade →
          </Link>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="font-heading font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/dashboard/profile" className="text-accent hover:text-accent/80">
                Edit Profile
              </Link>
            </li>
            <li>
              <Link href="/events" className="text-accent hover:text-accent/80">
                View Events
              </Link>
            </li>
            <li>
              <Link href="/dashboard/testimonials" className="text-accent hover:text-accent/80">
                Share Testimonial
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
          <h3 className="font-heading text-lg font-bold mb-4">Upcoming Events</h3>
          <p className="text-muted-foreground text-sm mb-3">Browse and register for community events.</p>
          <Link href="/events" className="text-sm font-semibold text-accent hover:text-accent/80">
            View all events →
          </Link>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="font-heading text-lg font-bold mb-4">Membership</h3>
          <p className="text-muted-foreground text-sm mb-3">
            Explore packages and benefits for your tier.
          </p>
          <Link href="/membership" className="text-sm font-semibold text-accent hover:text-accent/80">
            View packages →
          </Link>
        </div>
      </div>
    </div>
  );
}
