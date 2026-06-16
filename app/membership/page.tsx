'use client';
export const dynamic = 'force-dynamic';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function Membership() {
  const tiers = [
    {
      name: 'Member',
      price: 99,
      period: 'month',
      description: 'Start your journey with Abundant',
      features: [
        'Access to Member Directory',
        'Monthly community events',
        'Networking opportunities',
        'Member resources library',
        'Email support'
      ],
      highlighted: false
    },
    {
      name: 'Elite',
      price: 299,
      period: 'month',
      description: 'For serious achievers',
      features: [
        'All Member benefits',
        'Quarterly mastermind sessions',
        'Private member events',
        'Priority support',
        'Guest pass (2/year)',
        'Exclusive opportunities'
      ],
      highlighted: true
    },
    {
      name: 'Inner Circle',
      price: null,
      custom: true,
      description: 'For visionary leaders',
      features: [
        'All Elite benefits',
        'Personal relationship manager',
        'One-on-one coaching sessions',
        'Custom opportunities',
        'Brand partnerships',
        'Speaking opportunities'
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">Membership</h1>
            <p className="text-lg text-muted-foreground">Choose the tier that aligns with your ambitions</p>
          </div>
        </section>

        {/* Membership Tiers */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {tiers.map((tier, i) => (
                <div
                  key={i}
                  className={`relative p-8 rounded-xl border transition-all ${
                    tier.highlighted
                      ? 'border-accent bg-accent/5 md:scale-105 shadow-xl'
                      : 'border-border hover:border-accent'
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}

                  <h3 className="font-heading text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

                  <div className="mb-6">
                    {tier.custom ? (
                      <div className="text-3xl font-bold text-accent">Custom Pricing</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-accent">${tier.price}</span>
                        <span className="text-muted-foreground">/{tier.period}</span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.custom ? '/contact' : '/signup'}
                    className={`block w-full py-2 px-4 rounded-lg font-semibold text-center transition-colors ${
                      tier.highlighted
                        ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                        : 'border border-accent text-accent hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {tier.custom ? 'Contact Sales' : 'Get Started'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl font-bold text-center mb-12">Membership FAQ</h2>
            
            <div className="space-y-6">
              {[
                {
                  q: 'Can I change my membership tier?',
                  a: 'Yes, you can upgrade or downgrade your membership at any time. Changes take effect at the start of your next billing cycle.'
                },
                {
                  q: 'Is there a long-term commitment?',
                  a: 'No, all memberships are month-to-month. You can cancel anytime without penalty.'
                },
                {
                  q: 'What if I want to cancel?',
                  a: 'You can cancel your membership directly from your dashboard. Your access continues until the end of your current billing period.'
                },
                {
                  q: 'Do you offer annual billing?',
                  a: 'Yes, annual billing is available with a 15% discount. Contact our team to learn more.'
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards, PayPal, and wire transfers. Payment is processed securely through Stripe.'
                }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-background rounded-xl border border-border">
                  <h3 className="font-heading font-bold text-lg mb-3">{item.q}</h3>
                  <p className="text-muted-foreground text-sm">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
