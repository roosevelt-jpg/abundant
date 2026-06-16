'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { getSubscriptionPlans } from '@/lib/stripe-service';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  description: string;
  features: string[];
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const fetchedPlans = await getSubscriptionPlans();
      setPlans(fetchedPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    try {
      setSelectedPlan(priceId);
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user123', // Replace with actual user ID
          'x-user-email': 'user@example.com', // Replace with actual email
          'x-user-name': 'User Name' // Replace with actual name
        },
        body: JSON.stringify({ priceId })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading pricing plans...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground">Choose the plan that works best for you</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.length > 0 ? (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="p-8 bg-card rounded-xl border border-border hover:border-accent/50 transition-all"
              >
                <h2 className="font-heading text-2xl font-bold mb-2">{plan.name}</h2>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="font-heading text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={selectedPlan === plan.id}
                  className="w-full mb-8 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedPlan === plan.id ? 'Processing...' : 'Subscribe Now'}
                </button>

                {/* Features */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-muted-foreground uppercase">What's included:</p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No pricing plans available. Create them in Stripe dashboard.</p>
            </div>
          )}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <h3 className="font-heading text-xl font-bold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4 text-left">
            <div>
              <p className="font-semibold mb-2">Can I change my plan later?</p>
              <p className="text-muted-foreground text-sm">Yes, you can upgrade or downgrade your plan anytime from your account settings.</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Is there a free trial?</p>
              <p className="text-muted-foreground text-sm">Yes, all plans include a 7-day free trial. No credit card required to start.</p>
            </div>
            <div>
              <p className="font-semibold mb-2">What payment methods do you accept?</p>
              <p className="text-muted-foreground text-sm">We accept all major credit and debit cards through Stripe.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
