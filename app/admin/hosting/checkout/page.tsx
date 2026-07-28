'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Check, ChevronLeft, Info, Server } from 'lucide-react';
import { useApiAuth } from '@/hooks/useApiAuth';
import {
  calculateHostingOrder,
  formatUsd,
  HostingPeriodMonths,
  HostingPlanId,
} from '@/lib/hosting-plans';

const CARD_OPTIONS = {
  style: {
    base: {
      color: '#0F1B2E',
      fontFamily: 'inherit',
      fontSize: '16px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#8B95A5' },
      iconColor: '#B8973A',
    },
    invalid: {
      color: '#B42318',
      iconColor: '#B42318',
    },
  },
  hidePostalCode: false,
};

function HostingPaymentInner({
  clientSecret,
  orderId,
  paymentIntentId,
  totalLabel,
  onSuccess,
  onBack,
}: {
  clientSecret: string;
  orderId: string;
  paymentIntentId: string;
  totalLabel: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { authFetch } = useApiAuth();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) {
      setError('Card form not ready');
      return;
    }

    setPaying(true);
    setError('');
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        const res = await authFetch('/api/admin/hosting/complete', {
          method: 'POST',
          body: JSON.stringify({ orderId, paymentIntentId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not finalize order');
        onSuccess();
        return;
      }

      setError(`Unexpected payment status: ${paymentIntent?.status || 'unknown'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-[#0F1B2E] mb-1">Payment details</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your card to pay {totalLabel}. Card processing runs behind the scenes — you stay on
          Abundant (no Stripe Checkout redirect).
        </p>
        <div className="rounded-xl border border-border bg-white px-4 py-4 shadow-sm">
          <CardElement options={CARD_OPTIONS} />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={paying}
          className="px-4 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted/50 disabled:opacity-50"
        >
          Back to summary
        </button>
        <button
          type="submit"
          disabled={!stripe || paying}
          className="flex-1 min-h-[48px] rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#001F3F] to-[#B8973A] disabled:opacity-50"
        >
          {paying ? 'Processing…' : `Pay ${totalLabel}`}
        </button>
      </div>
    </form>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { authFetch, isAuthenticated } = useApiAuth();

  const planId = (searchParams.get('plan') || 'startup') as HostingPlanId;
  const initialPeriod = (Number(searchParams.get('period')) === 24 ? 24 : 12) as HostingPeriodMonths;

  const [period, setPeriod] = useState<HostingPeriodMonths>(initialPeriod);
  const [step, setStep] = useState<'summary' | 'payment' | 'done'>('summary');
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/api/admin/hosting/config');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        if (cancelled) return;
        setConfigured(!!data.configured);
        setPublishableKey(data.publishableKey || null);
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once when auth ready
  }, [isAuthenticated]);

  const order = useMemo(() => {
    try {
      return calculateHostingOrder(planId, period);
    } catch {
      return null;
    }
  }, [planId, period]);

  const startPayment = async () => {
    if (!order || !configured) return;
    setStarting(true);
    setError('');
    try {
      const res = await authFetch('/api/admin/hosting/payment-intent', {
        method: 'POST',
        body: JSON.stringify({ planId, periodMonths: period }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start payment');
      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
      setPaymentIntentId(data.paymentIntentId);
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start payment');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground p-2">Loading checkout…</p>;
  }

  if (!order) {
    return (
      <div className="p-2">
        <p className="text-destructive text-sm mb-3">Invalid plan selected.</p>
        <Link href="/admin/hosting" className="text-[#B8973A] text-sm font-semibold">
          ← Back to plans
        </Link>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#B8973A]/15 flex items-center justify-center mb-4">
          <Check className="w-7 h-7 text-[#B8973A]" strokeWidth={3} />
        </div>
        <h1 className="font-heading text-3xl font-bold mb-2">Payment successful</h1>
        <p className="text-muted-foreground mb-2">
          Your {order.plan.fullName} hosting plan ({period} months) is confirmed.
        </p>
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 mb-6">
          <Check className="w-4 h-4" strokeWidth={3} />
          abundantglobalclub.com — Hosting Active
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          A receipt will be sent to your admin email.
        </p>
        <Link
          href="/admin/hosting"
          className="inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#001F3F] to-[#B8973A]"
        >
          Back to Hosting
        </Link>
      </div>
    );
  }

  const elementsOptions: StripeElementsOptions | undefined = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#B8973A',
            colorBackground: '#ffffff',
            colorText: '#0F1B2E',
            colorDanger: '#B42318',
            borderRadius: '10px',
            fontFamily: 'inherit',
          },
        },
      }
    : undefined;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={() => (step === 'payment' ? setStep('summary') : router.push('/admin/hosting'))}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 'payment' ? 'Order summary' : 'Plans'}
        </button>
        <span className="inline-flex items-center gap-2 font-bold text-[#0F1B2E]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hostinger-logo.svg" alt="" className="h-7 w-7" />
          Hostinger
        </span>
      </div>

      {!configured && (
        <div className="mb-6 rounded-xl border border-[#B8973A]/40 bg-[#B8973A]/10 px-4 py-3 text-sm">
          Add Hosting Plan (Stripe) keys in{' '}
          <Link href="/admin/settings?tab=integrations" className="font-semibold text-[#B8973A] underline">
            Settings → Integrations
          </Link>{' '}
          before continuing.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-6 items-start">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          {step === 'summary' ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-[#001F3F] text-[#B8973A] flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-heading text-xl font-bold">{order.plan.fullName} plan</h1>
                  <p className="text-xs text-muted-foreground">{order.plan.tagline}</p>
                </div>
              </div>

              <label className="block text-sm font-medium mb-2">Period</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <select
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value) as HostingPeriodMonths)}
                  className="w-full sm:max-w-[220px] px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                >
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                </select>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-bold text-[#0F1B2E]">
                    {formatUsd(order.pricing.priceMonthly)}
                    <span className="text-sm font-semibold text-muted-foreground">/mo</span>
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatUsd(order.pricing.priceOriginalMonthly)}/mo
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#B8973A]/15 text-[#8A7028]">
                    Save {formatUsd(order.savings)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-5">
                Renews after {period} months at {formatUsd(order.pricing.renewMonthly)}/mo for {period}{' '}
                months. Cancel anytime.
              </p>

              {period === 12 && (
                <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-[#001F3F] text-white px-4 py-3">
                  <div className="flex-1 text-sm">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#B8973A] text-[#001F3F] font-bold text-xs mr-2">
                      %
                    </span>
                    Switch to a 24-month subscription for the <strong>biggest savings</strong>.
                  </div>
                  <button
                    type="button"
                    onClick={() => setPeriod(24)}
                    className="shrink-0 px-4 py-2 rounded-lg bg-white text-[#001F3F] text-sm font-semibold hover:bg-[#D4AF87]"
                  >
                    Get deal
                  </button>
                </div>
              )}

              <p className="flex items-start gap-2 text-sm text-[#0F1B2E]">
                <Check className="w-4 h-4 text-[#B8973A] shrink-0 mt-0.5" strokeWidth={3} />
                <span>
                  Great news! You get a <strong>FREE</strong> domain for 1 year with this order.
                </span>
              </p>
            </>
          ) : (
            stripePromise &&
            elementsOptions && (
              <Elements stripe={stripePromise} options={elementsOptions} key={clientSecret}>
                <HostingPaymentInner
                  clientSecret={clientSecret}
                  orderId={orderId}
                  paymentIntentId={paymentIntentId}
                  totalLabel={formatUsd(order.total)}
                  onSuccess={() => setStep('done')}
                  onBack={() => setStep('summary')}
                />
              </Elements>
            )
          )}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm lg:sticky lg:top-6">
          <h2 className="font-heading text-lg font-bold mb-4">Order summary</h2>
          <ul className="space-y-3 text-sm">
            {order.lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{line.label}</span>
                <span className="text-right shrink-0">
                  {line.originalAmount > line.amount && (
                    <span className="text-muted-foreground line-through mr-2">
                      {formatUsd(line.originalAmount)}
                    </span>
                  )}
                  <span className="font-semibold">{formatUsd(line.amount)}</span>
                </span>
              </li>
            ))}
            <li className="flex justify-between gap-3 pt-2 border-t border-border">
              <span className="text-muted-foreground inline-flex items-center gap-1">
                Taxes <Info className="w-3.5 h-3.5" />
              </span>
              <span className="font-semibold">{formatUsd(order.tax)}</span>
            </li>
            <li className="flex justify-between gap-3 items-baseline pt-2">
              <span className="font-bold text-base">Total</span>
              <span className="text-right">
                <span className="text-muted-foreground line-through mr-2 text-sm">
                  {formatUsd(order.originalTotal)}
                </span>
                <span className="text-2xl font-bold text-[#0F1B2E]">{formatUsd(order.total)}</span>
              </span>
            </li>
          </ul>

          {step === 'summary' && (
            <button
              type="button"
              onClick={startPayment}
              disabled={!configured || starting || !publishableKey}
              className="mt-6 w-full min-h-[48px] rounded-xl font-semibold text-white bg-gradient-to-r from-[#001F3F] to-[#B8973A] disabled:opacity-40"
            >
              {starting ? 'Preparing…' : 'Continue'}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function AdminHostingCheckoutPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading checkout…</p>}>
      <CheckoutContent />
    </Suspense>
  );
}
