'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { MembershipTier, Taxonomies } from '@/lib/types';
import { getDefaultTaxonomies } from '@/lib/intake-defaults';

export default function AdminMembershipTiersPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const { authFetch } = useApiAuth();
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomies>(getDefaultTaxonomies());
  const [tab, setTab] = useState<'tiers' | 'taxonomies'>('tiers');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (userData && !hasPermission(userData, 'billing') && userData.role !== 'super_admin') {
      router.push('/admin/dashboard');
      return;
    }
    load();
  }, [userData, router]);

  const load = async () => {
    const res = await authFetch('/api/admin/membership-tiers');
    const data = await res.json();
    if (data.tiers) setTiers(data.tiers);
    if (data.taxonomies) setTaxonomies(data.taxonomies);
  };

  const saveTier = async (tier: MembershipTier) => {
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/membership-tiers', {
        method: 'PATCH',
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTiers(data.tiers);
      setMsg('Tier saved');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const saveTaxonomies = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/membership-tiers', {
        method: 'PATCH',
        body: JSON.stringify({ taxonomies }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTaxonomies(data.taxonomies);
      setMsg('Taxonomies saved');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (userData && !hasPermission(userData, 'billing') && userData.role !== 'super_admin') {
    return <div className="text-center py-12 text-muted-foreground">No permission</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-2">Membership tiers & taxonomies</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Single source of truth for public pricing, application tier options, and onboarding.
      </p>
      <div className="flex gap-2 mb-6">
        {(['tiers', 'taxonomies'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize ${tab === t ? 'bg-accent text-accent-foreground' : 'border border-border'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {msg && <p className="text-sm text-accent mb-4">{msg}</p>}

      {tab === 'tiers' && (
        <div className="space-y-4">
          {tiers.map((tier, idx) => (
            <div key={tier.id} className="p-4 border border-border rounded-xl space-y-3 bg-card">
              <p className="text-xs text-muted-foreground font-mono">{tier.id}</p>
              <input
                value={tier.name}
                onChange={(e) => {
                  const next = [...tiers];
                  next[idx] = { ...tier, name: e.target.value };
                  setTiers(next);
                }}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg font-semibold"
              />
              <input
                value={tier.tagline}
                onChange={(e) => {
                  const next = [...tiers];
                  next[idx] = { ...tier, tagline: e.target.value };
                  setTiers(next);
                }}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Monthly
                  <input
                    type="number"
                    value={tier.priceMonthly}
                    onChange={(e) => {
                      const next = [...tiers];
                      next[idx] = { ...tier, priceMonthly: parseFloat(e.target.value) || 0 };
                      setTiers(next);
                    }}
                    className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg"
                  />
                </label>
                <label className="text-sm">
                  Annual
                  <input
                    type="number"
                    value={tier.priceAnnual}
                    onChange={(e) => {
                      const next = [...tiers];
                      next[idx] = { ...tier, priceAnnual: parseFloat(e.target.value) || 0 };
                      setTiers(next);
                    }}
                    className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg"
                  />
                </label>
                  <label className="text-sm">
                    Paid event discount %
                    <input
                      type="number"
                      value={tier.paidEventDiscountPercent ?? 0}
                      onChange={(e) => {
                        const next = [...tiers];
                        next[idx] = { ...tier, paidEventDiscountPercent: parseFloat(e.target.value) || 0 };
                        setTiers(next);
                      }}
                      className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg"
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tier.freeEventAccess !== false}
                    onChange={(e) => {
                      const next = [...tiers];
                      next[idx] = { ...tier, freeEventAccess: e.target.checked };
                      setTiers(next);
                    }}
                  />
                  Free event access (when membership active)
                </label>
                <textarea
                  value={tier.features.join('\n')}
                  onChange={(e) => {
                    const next = [...tiers];
                    next[idx] = {
                      ...tier,
                      features: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                    };
                    setTiers(next);
                  }}
                  rows={4}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
                  placeholder="One feature per line"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tier.visible}
                    onChange={(e) => {
                      const next = [...tiers];
                      next[idx] = { ...tier, visible: e.target.checked };
                      setTiers(next);
                    }}
                  />
                  Visible
                </label>
              <button
                type="button"
                disabled={saving}
                onClick={() => saveTier(tiers[idx])}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-semibold"
              >
                <Save className="w-4 h-4" /> Save tier
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'taxonomies' && (
        <div className="space-y-4 max-w-2xl">
          {(
            [
              ['industries', 'Industries'],
              ['howHeard', 'How did you hear about us'],
              ['memberGoals', 'Member goals'],
              ['resourceCategories', 'Resource categories'],
              ['expertiseTags', 'Expertise tags'],
              ['eventTopics', 'Event topics'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="font-medium mb-1 block">{label} (one per line)</span>
              <textarea
                value={taxonomies[key].join('\n')}
                onChange={(e) =>
                  setTaxonomies({
                    ...taxonomies,
                    [key]: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                  })
                }
                rows={5}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg"
              />
            </label>
          ))}
          <button
            type="button"
            disabled={saving}
            onClick={saveTaxonomies}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-semibold"
          >
            <Save className="w-4 h-4" /> Save taxonomies
          </button>
        </div>
      )}
    </div>
  );
}
