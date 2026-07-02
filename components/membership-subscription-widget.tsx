'use client';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { MembershipPlan } from '@/lib/types';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Check, Zap } from 'lucide-react';

export default function MembershipSubscription() {
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
    return <div className="text-center py-8 text-muted-foreground">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-6 h-6 text-accent" />
        <h2 className="text-2xl font-bold">Membership Plans</h2>
      </div>

      {isSubscribed && currentPlan && (
        <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
          <p className="text-sm text-green-900 dark:text-green-300">
            <span className="font-semibold">Current Plan:</span> {currentPlan.name} - {currentPlan.description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-lg border-2 transition-all p-6 ${
              plan.isMostPopular ? 'border-accent shadow-lg relative' : 'border-border'
            }`}
          >
            {plan.isMostPopular && (
              <div className="absolute -top-3 left-4 px-3 py-1 bg-accent text-white text-xs font-bold rounded-full">
                Most Popular
              </div>
            )}

            <div className="pt-2">
              <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
              {plan.badge && <p className="text-xs text-accent font-semibold mb-3">{plan.badge}</p>}

              <div className="mb-4">
                <div className="text-2xl font-bold">
                  ${plan.price}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{plan.billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={subscribing === plan.id || (currentPlan?.id === plan.id && isSubscribed)}
                className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors mb-4 ${
                  currentPlan?.id === plan.id && isSubscribed
                    ? 'bg-green-500/10 text-green-600 cursor-default'
                    : 'bg-accent text-white hover:bg-accent/90'
                }`}
              >
                {subscribing === plan.id
                  ? 'Subscribing...'
                  : currentPlan?.id === plan.id && isSubscribed
                  ? 'Current'
                  : 'Subscribe'}
              </button>

              <div className="space-y-2 text-xs">
                {plan.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
                {plan.features.length > 3 && (
                  <p className="text-muted-foreground">+{plan.features.length - 3} more features</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
        <p className="text-xs text-blue-900 dark:text-blue-300">
          Upgrade your membership to unlock exclusive features, priority support, and special benefits. You can change plans anytime.
        </p>
      </div>
    </div>
  );
}
