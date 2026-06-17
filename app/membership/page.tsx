'use client';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { MembershipPlan } from '@/lib/types';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function MembershipPage() {
  const { currentUser, userData } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    loadPublishedPlans();
  }, []);

  const loadPublishedPlans = async () => {
    try {
      setLoading(true);
      const plansRef = collection(db, 'membershipPlans');
      const snapshot = await getDocs(plansRef);
      const plansData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((plan) => (plan as MembershipPlan).isPublic && (plan as MembershipPlan).status === 'active') as MembershipPlan[];
      
      setPlans(plansData.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (error) {
      console.error('[v0] Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: MembershipPlan) => {
    if (!currentUser) {
      alert('Please log in to subscribe');
      return;
    }

    try {
      setSubscribing(plan.id);

      // Update user subscription
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        membershipPlanId: plan.id,
        membershipTier: plan.slug,
        subscriptionStatus: 'active',
        subscriptionStartDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update plan subscriber count
      const planRef = doc(db, 'membershipPlans', plan.id);
      await updateDoc(planRef, {
        subscribers: (plan.subscribers || 0) + 1,
      });

      alert('Successfully subscribed to ' + plan.name);
      window.location.reload();
    } catch (error) {
      console.error('[v0] Error subscribing:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  const currentPlan = plans.find((p) => p.id === userData?.membershipPlanId);
  const isSubscribed = userData?.subscriptionStatus === 'active';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Loading membership plans...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Membership Plans</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Choose the perfect plan for your membership
            </p>

            {isSubscribed && currentPlan && (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg inline-block">
                <p className="text-sm text-green-900 dark:text-green-300">
                  <span className="font-semibold">Current Plan:</span> {currentPlan.name}
                </p>
              </div>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-lg border-2 transition-all ${
                  plan.isMostPopular
                    ? 'border-accent shadow-lg scale-105 relative'
                    : 'border-border hover:border-accent/50'
                }`}
                style={{
                  backgroundColor: 'var(--card)',
                }}
              >
                {plan.isMostPopular && (
                  <div
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-accent text-white text-sm font-bold rounded-full"
                  >
                    {plan.badge || 'Most Popular'}
                  </div>
                )}

                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                  {plan.badge && !plan.isMostPopular && (
                    <p className="text-sm text-accent font-semibold mb-4">{plan.badge}</p>
                  )}

                  <div className="mb-6">
                    <div className="text-4xl font-bold mb-2">
                      ${plan.price}
                      <span className="text-lg text-muted-foreground font-normal">
                        /{plan.billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={subscribing === plan.id || (currentPlan?.id === plan.id && isSubscribed)}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors mb-6 ${
                      currentPlan?.id === plan.id && isSubscribed
                        ? 'bg-green-500/10 text-green-600 cursor-default'
                        : 'bg-accent text-white hover:bg-accent/90'
                    }`}
                  >
                    {subscribing === plan.id ? 'Subscribing...' : currentPlan?.id === plan.id && isSubscribed ? 'Current Plan' : 'Subscribe Now'}
                  </button>

                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-border space-y-2 text-sm text-muted-foreground">
                    <div>
                      Access Level: <span className="font-semibold text-foreground">{['', 'Member', 'Elite', 'Inner Circle', 'Founder'][plan.accessLevel]}</span>
                    </div>
                    {(plan.maxEventRegistrations || 0) > 0 && (
                      <div>
                        Event Registrations: <span className="font-semibold text-foreground">{plan.maxEventRegistrations}/month</span>
                      </div>
                    )}
                    {plan.prioritySupport && (
                      <div className="text-accent font-semibold">✓ Priority Support Included</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>

            <div className="space-y-6">
              {[
                {
                  q: 'Can I change my membership plan?',
                  a: 'Yes, you can upgrade or downgrade your plan anytime from your dashboard. Changes take effect immediately.',
                },
                {
                  q: 'Is there a long-term commitment?',
                  a: 'No, you can cancel your membership at any time. There are no lock-in contracts or hidden fees.',
                },
                {
                  q: 'What if I want to cancel?',
                  a: 'You can cancel your subscription from your account settings. Your access continues until the end of your billing period.',
                },
                {
                  q: 'Do you offer annual billing?',
                  a: 'Yes, annual plans are available for most tiers and include significant savings compared to monthly billing.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards through our secure Stripe payment processor. All transactions are encrypted.',
                },
              ].map((item, index) => (
                <div key={index} className="p-6 bg-card rounded-lg border border-border">
                  <h3 className="font-semibold mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
