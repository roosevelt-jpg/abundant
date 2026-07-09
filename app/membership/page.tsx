'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getActivePlans } from '@/lib/membership-service';
import { getFormByPlacement } from '@/lib/forms-service';
import { CustomFormRenderer } from '@/components/custom-form-renderer';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useApiAuth } from '@/hooks/useApiAuth';
import { isWithinFreePeriod } from '@/lib/constants';
import { MembershipPlan, CustomForm } from '@/lib/types';
import { Check } from 'lucide-react';
import Link from 'next/link';

export default function Membership() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { authFetch } = useApiAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [form, setForm] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getActivePlans(), getFormByPlacement('membership')]).then(([p, f]) => {
      setPlans(p);
      setForm(f);
      setLoading(false);
    });
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!currentUser) {
      window.location.href = '/signup';
      return;
    }
    if (isWithinFreePeriod()) {
      alert('You currently have free access until August 31!');
      return;
    }
    setSubscribing(planId);
    try {
      const res = await authFetch('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Checkout failed');
    } catch {
      alert('Checkout failed');
    } finally {
      setSubscribing(null);
    }
  };

  const freePeriod = isWithinFreePeriod();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">{t('membership.title', 'Membership')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{t('membership.subtitle', 'Choose the tier that aligns with your ambitions')}</p>
            {freePeriod && (
              <div className="mt-6 inline-block px-4 py-2 bg-green-500/10 text-green-600 rounded-lg text-sm font-medium">
                {t('membership.free', 'Free full access until August 31!')}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <p className="text-center text-muted-foreground">{t('common.loading', 'Loading...')}</p>
            ) : plans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, i) => (
                  <div key={plan.id} className={`relative p-6 sm:p-8 rounded-xl border transition-all ${i === 1 ? 'border-accent bg-accent/5 md:scale-105 shadow-xl' : 'border-border hover:border-accent'}`}>
                    {i === 1 && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold">
                        {t('membership.popular', 'Most Popular')}
                      </div>
                    )}
                    <h3 className="font-heading text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-bold text-accent">${plan.price}</span>
                      <span className="text-muted-foreground">/{plan.interval}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.benefits.map((b, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm">
                          <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing === plan.id || freePeriod}
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                        i === 1 ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'border border-accent text-accent hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      {freePeriod ? t('membership.included', 'Included Free') : subscribing === plan.id ? '...' : t('membership.subscribe', 'Subscribe')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">{t('membership.noPlans', 'Plans coming soon')}</p>
            )}
          </div>
        </section>

        {form && (
          <section className="py-12 px-4 sm:px-6 lg:px-8 bg-card/50">
            <div className="max-w-lg mx-auto p-6 bg-card rounded-xl border border-border">
              <CustomFormRenderer form={form} />
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
