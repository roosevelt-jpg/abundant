'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ApplyPlanPicker } from '@/components/apply-plan-picker';
import { CountrySelect } from '@/components/country-select';
import { membershipApplicationSchema, MembershipApplicationInput } from '@/lib/intake-schemas';
import { getDefaultTaxonomies } from '@/lib/intake-defaults';
import { MembershipTier, Taxonomies, TierInterest } from '@/lib/types';

const STEPS = ['Identity', 'Professional', 'Fit & intent', 'Trust & legal'];

export default function ApplyPage() {
  const [step, setStep] = useState(0);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomies>(getDefaultTaxonomies());
  const [paidPlansEnabled, setPaidPlansEnabled] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const form = useForm<MembershipApplicationInput>({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      city: '',
      country: '',
      nationality: '',
      citizenship: '',
      gender: 'male',
      role: '',
      company: '',
      industry: '',
      linkedinUrl: '',
      whyJoin: '',
      goals: [],
      tierInterest: 'free',
      referredByMember: false,
      referrerName: '',
      howHeard: '',
      termsAccepted: false,
      marketingConsent: false,
    },
    mode: 'onBlur',
  });

  const { register, handleSubmit, watch, setValue, getValues, formState: { isSubmitting } } = form;
  const referred = watch('referredByMember');
  const goals = watch('goals') || [];
  const tierInterest = watch('tierInterest');
  const errors = fieldErrors;

  useEffect(() => {
    fetch('/api/public/taxonomies')
      .then((r) => r.json())
      .then((d) => d?.industries && setTaxonomies(d))
      .catch(() => undefined);
    fetch('/api/public/membership-tiers')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setTiers(d))
      .catch(() => undefined);
    fetch('/api/public/settings')
      .then((r) => r.json())
      .then((d) => setPaidPlansEnabled(d?.membershipAccess?.paidPlansEnabled === true))
      .catch(() => undefined);
  }, []);

  const stepFields: (keyof MembershipApplicationInput)[][] = [
    ['fullName', 'email', 'phone', 'city', 'country', 'nationality', 'citizenship', 'gender'],
    ['role', 'company', 'industry', 'linkedinUrl', 'yearsExperience'],
    ['whyJoin', 'goals'],
    ['referredByMember', 'referrerName', 'howHeard', 'termsAccepted', 'marketingConsent'],
  ];

  const validateStep = () => {
    const values = getValues();
    const parsed = membershipApplicationSchema.safeParse(values);
    if (parsed.success) {
      setFieldErrors({});
      return true;
    }
    const next: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] || '');
      if (key && stepFields[step].includes(key as keyof MembershipApplicationInput) && !next[key]) {
        next[key] = issue.message;
      }
    }
    // If validating mid-flow, only block when current step fields have errors
    const stepHasError = stepFields[step].some((f) => next[f as string]);
    if (step < STEPS.length - 1) {
      // Partial: check required fields on this step only via a lighter parse of subset
      const subsetErrors: Record<string, string> = {};
      for (const field of stepFields[step]) {
        const v = values[field];
        if (field === 'goals' && (!Array.isArray(v) || v.length === 0)) subsetErrors.goals = 'Select at least one goal';
        else if (field === 'whyJoin' && String(v || '').length < 40) subsetErrors.whyJoin = 'Please share at least a few sentences';
        else if (field === 'termsAccepted' && !v) subsetErrors.termsAccepted = 'You must accept the terms';
        else if (field === 'referrerName' && values.referredByMember && !String(v || '').trim()) {
          subsetErrors.referrerName = 'Referrer name is required';
        } else if (
          ['fullName', 'email', 'phone', 'city', 'country', 'nationality', 'citizenship', 'gender', 'role', 'company', 'industry', 'howHeard'].includes(field) &&
          !String(v || '').trim()
        ) {
          subsetErrors[field] = 'Required';
        } else if (field === 'gender' && !v) {
          subsetErrors.gender = 'Please select your gender';
        }
      }
      setFieldErrors(subsetErrors);
      return Object.keys(subsetErrors).length === 0;
    }
    setFieldErrors(next);
    return !stepHasError && parsed.success;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = handleSubmit(async (data) => {
    setServerError('');
    const parsed = membershipApplicationSchema.safeParse(data);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || '');
        if (key && !next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    try {
      const res = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit');
      setDone(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to submit');
    }
  });

  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-lg text-center bg-card border border-border rounded-xl p-8">
            <h1 className="font-heading text-3xl font-bold mb-3">Thank you</h1>
            <p className="text-muted-foreground mb-6">
              We&apos;ll review your application and follow up within 5–7 business days. No account is created until you&apos;re approved.
            </p>
            <Link href="/" className="text-accent font-semibold">
              Return home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const inputCls = 'w-full px-4 py-2 bg-input border border-border rounded-lg text-sm';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h1 className="font-heading text-3xl font-bold mb-2">Join Abundant</h1>
            <p className="text-sm text-muted-foreground">
              Choose a plan, then complete your application. Applying does not create an account — we&apos;ll invite you if approved.
            </p>
          </div>

          <ApplyPlanPicker
            tiers={tiers}
            selected={tierInterest}
            paidPlansEnabled={paidPlansEnabled}
            onSelect={(tier: TierInterest) => setValue('tierInterest', tier, { shouldValidate: true })}
          />

          <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 mb-8 flex-wrap">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`text-xs px-3 py-1 rounded-full border ${
                  i === step ? 'bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white border-transparent' : 'border-border text-muted-foreground'
                }`}
              >
                {i + 1}. {label}
              </div>
            ))}
          </div>

          {serverError && <p className="mb-4 text-sm text-destructive">{serverError}</p>}

          <form onSubmit={onSubmit} className="space-y-4 bg-card border border-border rounded-xl p-6">
            {step === 0 && (
              <>
                <Field label="Full name" error={errors.fullName}>
                  <input {...register('fullName')} className={inputCls} />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input type="email" {...register('email')} className={inputCls} />
                </Field>
                <Field label="Phone" error={errors.phone}>
                  <input {...register('phone')} className={inputCls} />
                </Field>
                <Field label="City" error={errors.city}>
                  <input {...register('city')} className={inputCls} />
                </Field>
                <div>
                  <CountrySelect
                    label="Country of Residence"
                    value={watch('country') || ''}
                    onChange={(code) => {
                      setValue('country', code, { shouldValidate: true });
                      if (!getValues('nationality')) setValue('nationality', code);
                      if (!getValues('citizenship')) setValue('citizenship', code);
                    }}
                    required
                  />
                  {errors.country && <span className="text-xs text-destructive mt-1 block">{errors.country}</span>}
                </div>
                <div>
                  <CountrySelect
                    label="Nationality"
                    value={watch('nationality') || ''}
                    onChange={(code) => setValue('nationality', code, { shouldValidate: true })}
                    required
                  />
                  {errors.nationality && <span className="text-xs text-destructive mt-1 block">{errors.nationality}</span>}
                </div>
                <div>
                  <CountrySelect
                    label="Citizenship"
                    value={watch('citizenship') || ''}
                    onChange={(code) => setValue('citizenship', code, { shouldValidate: true })}
                    required
                  />
                  {errors.citizenship && <span className="text-xs text-destructive mt-1 block">{errors.citizenship}</span>}
                </div>
                <Field label="Gender" error={errors.gender}>
                  <select {...register('gender')} className={inputCls}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </Field>
                <p className="text-[11px] text-muted-foreground">
                  Used to gate men-only / women-only events automatically after you join.
                </p>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Role / title" error={errors.role}>
                  <input {...register('role')} className={inputCls} />
                </Field>
                <Field label="Company" error={errors.company}>
                  <input {...register('company')} className={inputCls} />
                </Field>
                <Field label="Industry" error={errors.industry}>
                  <select {...register('industry')} className={inputCls}>
                    <option value="">Select…</option>
                    {taxonomies.industries.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </Field>
                <Field label="LinkedIn URL (optional)" error={errors.linkedinUrl}>
                  <input {...register('linkedinUrl')} className={inputCls} placeholder="https://" />
                </Field>
                <Field label="Years of experience (optional)" error={errors.yearsExperience}>
                  <input type="number" {...register('yearsExperience')} className={inputCls} />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Why do you want to join?" error={errors.whyJoin}>
                  <textarea {...register('whyJoin')} rows={5} className={inputCls} />
                </Field>
                <div>
                  <p className="text-sm font-medium mb-2">Goals</p>
                  <div className="space-y-2">
                    {taxonomies.memberGoals.map((g) => (
                      <label key={g} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={goals.includes(g)}
                          onChange={(e) => {
                            const next = e.target.checked ? [...goals, g] : goals.filter((x) => x !== g);
                            setValue('goals', next, { shouldValidate: true });
                          }}
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                  {errors.goals && <p className="text-xs text-destructive mt-1">{errors.goals}</p>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected plan:{' '}
                  <strong className="text-foreground capitalize">
                    {tierInterest === 'free' ? 'Free Member' : tierInterest.replace(/_/g, ' ')}
                  </strong>
                  {' '}
                  <button
                    type="button"
                    className="text-accent underline"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    Change
                  </button>
                </p>
              </>
            )}

            {step === 3 && (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register('referredByMember')} />
                  Referred by a member
                </label>
                {referred && (
                  <Field label="Referrer name" error={errors.referrerName}>
                    <input {...register('referrerName')} className={inputCls} />
                  </Field>
                )}
                <Field label="How did you hear about us?" error={errors.howHeard}>
                  <select {...register('howHeard')} className={inputCls}>
                    <option value="">Select…</option>
                    {taxonomies.howHeard.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </Field>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" {...register('termsAccepted')} className="mt-1" />
                  <span>
                    I accept the{' '}
                    <Link href="/terms" className="text-accent">Terms</Link> and{' '}
                    <Link href="/privacy" className="text-accent">Privacy Policy</Link>
                  </span>
                </label>
                {errors.termsAccepted && <p className="text-xs text-destructive">{errors.termsAccepted}</p>}
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" {...register('marketingConsent')} className="mt-1" />
                  <span>Send me occasional updates (optional — not required)</span>
                </label>
              </>
            )}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 border border-border rounded-lg text-sm disabled:opacity-40"
              >
                Back
              </button>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next} className="px-4 py-2 bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white rounded-lg text-sm font-semibold">
                  Continue
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                  {isSubmitting ? 'Submitting…' : 'Submit application'}
                </button>
              )}
            </div>
          </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium mb-1 block">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
    </label>
  );
}
