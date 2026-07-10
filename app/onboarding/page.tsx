'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/context/AuthContext';
import { useApiAuth } from '@/hooks/useApiAuth';
import { MembershipTier, MemberRecord, MemberProfile, Taxonomies, User } from '@/lib/types';
import { getDefaultTaxonomies } from '@/lib/intake-defaults';
import { ImageUpload } from '@/components/image-upload';
import { MemberLocationFields } from '@/components/member-location-fields';

const STEPS = ['Profile', 'Directory', 'Preferred tier', 'Notifications'];

export default function OnboardingPage() {
  const { currentUser, userData, loading: authLoading, updateUserProfile } = useAuth();
  const { authFetch } = useApiAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomies>(getDefaultTaxonomies());
  const [member, setMember] = useState<MemberRecord | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [photoUrl, setPhotoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<User['gender'] | ''>(userData?.gender || '');
  const [location, setLocation] = useState<MemberProfile>({
    country: userData?.country || '',
    countryOfResidence: userData?.countryOfResidence || userData?.country || '',
    nationality: userData?.nationality || '',
    citizenship: userData?.citizenship || '',
    city: userData?.city || '',
    address: userData?.address || '',
  });
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [directoryVisibility, setDirectoryVisibility] = useState<'public' | 'members_only' | 'hidden'>('members_only');
  const [socialLinks, setSocialLinks] = useState({ x: '', instagram: '', linkedin: '' });
  const [availableForIntros, setAvailableForIntros] = useState(true);
  const [tier, setTier] = useState<'global' | 'founding_circle' | 'private' | ''>('');
  const [notificationPrefs, setNotificationPrefs] = useState({
    eventInvites: true,
    weeklyDigest: true,
    introRequests: true,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.replace('/login?redirect=/onboarding');
      return;
    }
    authFetch('/api/members/me')
      .then(async (r) => {
        const data = await r.json();
        if (data.member?.onboardingCompletedAt) {
          router.replace('/dashboard');
          return;
        }
        setMember(data.member);
        if (data.member?.bio) setBio(data.member.bio);
        if (data.member?.photoUrl) setPhotoUrl(data.member.photoUrl);
        if (data.member?.expertiseTags) setExpertiseTags(data.member.expertiseTags);
        if (data.member?.tier) setTier(data.member.tier);
      })
      .catch(() => undefined);
    fetch('/api/public/membership-tiers').then((r) => r.json()).then((d) => Array.isArray(d) && setTiers(d));
    fetch('/api/public/taxonomies').then((r) => r.json()).then((d) => d?.expertiseTags && setTaxonomies(d));
  }, [authLoading, currentUser, router, authFetch]);

  useEffect(() => {
    if (userData?.gender) setGender(userData.gender);
    if (userData) {
      setLocation((prev) => ({
        country: userData.country || prev.country || '',
        countryOfResidence: userData.countryOfResidence || userData.country || prev.countryOfResidence || '',
        nationality: userData.nationality || prev.nationality || '',
        citizenship: userData.citizenship || prev.citizenship || '',
        city: userData.city || prev.city || '',
        address: userData.address || prev.address || '',
      }));
    }
  }, [userData]);

  const save = async (complete = false) => {
    setSaving(true);
    setError('');
    try {
      if (step === 0 && !gender) throw new Error('Please select your gender — required for event eligibility');
      if (step === 0 && !(location.countryOfResidence || location.country)) {
        throw new Error('Please select your country of residence');
      }
      if (complete && !tier) throw new Error('Please select a preferred membership tier');
      const residence = location.countryOfResidence || location.country || '';
      const res = await authFetch('/api/members/me', {
        method: 'PATCH',
        body: JSON.stringify({
          photoUrl: photoUrl || undefined,
          bio,
          gender,
          expertiseTags,
          directoryVisibility,
          socialLinks,
          availableForIntros,
          notificationPrefs,
          tier: tier || undefined,
          complete,
          displayName: userData?.displayName || member?.displayName,
          country: residence,
          countryOfResidence: residence,
          nationality: location.nationality || residence,
          citizenship: location.citizenship || location.nationality || residence,
          city: location.city,
          address: location.address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      if (updateUserProfile) {
        try {
          await updateUserProfile({
            gender: gender || undefined,
            country: residence,
            countryOfResidence: residence,
            nationality: location.nationality || residence,
            citizenship: location.citizenship || location.nationality || residence,
            city: location.city,
            address: location.address,
            photoURL: photoUrl || undefined,
          });
        } catch {
          /* synced via API already */
        }
      }
      if (complete) router.push('/dashboard');
      else setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !currentUser) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading text-3xl font-bold mb-2">Welcome to Abundant</h1>
          <p className="text-sm text-muted-foreground mb-6">Complete onboarding to access your dashboard.</p>
          <div className="flex gap-2 mb-6 flex-wrap">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`text-xs px-3 py-1 rounded-full border ${
                  i === step ? 'bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white border-transparent' : 'border-border'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            {step === 0 && (
              <>
                <ImageUpload value={photoUrl} onChange={setPhotoUrl} folder="members" label="Profile photo" />
                <label className="block text-sm">
                  <span className="font-medium mb-1 block">Gender</span>
                  <select
                    value={gender || ''}
                    onChange={(e) => setGender(e.target.value as User['gender'])}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
                    required
                  >
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Required for men-only / women-only event access.
                  </span>
                </label>
                <MemberLocationFields value={location} onChange={setLocation} />
                <label className="block text-sm">
                  <span className="font-medium mb-1 block">Bio</span>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm" />
                </label>
                <div>
                  <p className="text-sm font-medium mb-2">Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {taxonomies.expertiseTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setExpertiseTags((prev) =>
                            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                          )
                        }
                        className={`px-3 py-1 rounded-full text-xs border ${
                          expertiseTags.includes(tag) ? 'bg-accent text-accent-foreground border-transparent' : 'border-border'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">Directory visibility</p>
                  {(['public', 'members_only', 'hidden'] as const).map((v) => (
                    <label key={v} className="flex items-center gap-2 text-sm mb-2">
                      <input type="radio" checked={directoryVisibility === v} onChange={() => setDirectoryVisibility(v)} />
                      <span className="capitalize">{v.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
                <label className="block text-sm">
                  LinkedIn
                  <input value={socialLinks.linkedin} onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })} className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm" />
                </label>
                <label className="block text-sm">
                  Instagram
                  <input value={socialLinks.instagram} onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })} className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm" />
                </label>
                <label className="block text-sm">
                  X / Twitter
                  <input value={socialLinks.x} onChange={(e) => setSocialLinks({ ...socialLinks, x: e.target.value })} className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm" />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={availableForIntros} onChange={(e) => setAvailableForIntros(e.target.checked)} />
                  Available for introductions
                </label>
              </>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Choose your preferred tier — <strong>no payment now</strong>. Access is free for everyone through August 31.
                  From September 1, upgrade when you register for events to unlock free-event access and paid-event discounts.
                </p>
                {tiers.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTier(t.id)}
                    className={`w-full text-left p-4 border rounded-xl ${
                      tier === t.id ? 'border-accent bg-accent/5' : 'border-border'
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <h3 className="font-heading font-bold">{t.name}</h3>
                      <span className="text-sm font-semibold">
                        ${t.priceMonthly}/mo
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t.tagline}</p>
                    <ul className="mt-2 text-xs text-muted-foreground list-disc pl-4">
                      {t.features.slice(0, 5).map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    {(t.paidEventDiscountPercent || 0) > 0 && (
                      <p className="text-xs text-accent mt-2 font-semibold">
                        {t.paidEventDiscountPercent}% off paid events when membership is active
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {(
                  [
                    ['eventInvites', 'Event invites'],
                    ['weeklyDigest', 'Weekly digest'],
                    ['introRequests', 'Introduction requests'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={notificationPrefs[key]}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [key]: e.target.checked })}
                    />
                    {label}
                  </label>
                ))}
              </div>
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
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => save(false)}
                  className="px-4 py-2 bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white rounded-lg text-sm font-semibold"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => save(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white rounded-lg text-sm font-semibold"
                >
                  {saving ? 'Finishing…' : 'Finish & go to dashboard'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
