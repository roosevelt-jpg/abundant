'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { getAllPlans, createPlan, updatePlan, deletePlan } from '@/lib/membership-service';
import { MembershipPlan } from '@/lib/types';

export default function AdminBillingSettings() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<MembershipPlan>>({});
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await getAllPlans();
      setPlans(data);
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    await createPlan({
      name: 'New Plan',
      price: 99,
      currency: 'usd',
      interval: 'month',
      benefits: ['Community access'],
      tier: 'member',
      active: true,
      order: plans.length,
    });
    setShowNew(false);
    await loadPlans();
  };

  const handleSave = async () => {
    if (!editingId) return;
    await updatePlan(editingId, editingData);
    setEditingId(null);
    setEditingData({});
    await loadPlans();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    await deletePlan(id);
    await loadPlans();
  };

  if (loading) return <div className="text-center py-12">Loading plans...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Membership Plans</h1>
          <p className="text-muted-foreground">Manage plans — synced to member dashboard and Stripe</p>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold">
          <Plus className="w-5 h-5" /> New Plan
        </button>
      </div>

      <div className="space-y-6">
        {plans.map((plan) => (
          <div key={plan.id} className="p-6 bg-card rounded-xl border border-border">
            {editingId === plan.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input value={editingData.name || ''} onChange={(e) => setEditingData({ ...editingData, name: e.target.value })} placeholder="Name" className="px-4 py-2 bg-input border border-border rounded-lg" />
                  <input type="number" value={editingData.price ?? ''} onChange={(e) => setEditingData({ ...editingData, price: parseFloat(e.target.value) })} placeholder="Price" className="px-4 py-2 bg-input border border-border rounded-lg" />
                </div>
                <select value={editingData.interval || 'month'} onChange={(e) => setEditingData({ ...editingData, interval: e.target.value as 'month' | 'year' })} className="w-full px-4 py-2 bg-input border border-border rounded-lg">
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
                <textarea
                  value={(editingData.benefits || plan.benefits).join('\n')}
                  onChange={(e) => setEditingData({ ...editingData, benefits: e.target.value.split('\n').filter(Boolean) })}
                  placeholder="Benefits (one per line)"
                  rows={4}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                />
                <div className="flex gap-3">
                  <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg font-semibold"><Save className="w-4 h-4" /> Save</button>
                  <button onClick={() => setEditingId(null)} className="px-4 py-2 border border-border rounded-lg">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading font-bold text-lg">{plan.name}</h3>
                  <p className="text-2xl font-bold my-2">${plan.price}/{plan.interval}</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {plan.benefits.map((b, i) => <li key={i}>• {b}</li>)}
                  </ul>
                  <span className={`inline-block mt-3 px-2 py-1 text-xs font-semibold rounded ${plan.active ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-500'}`}>
                    {plan.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(plan.id); setEditingData(plan); }} className="p-2 hover:bg-accent/10 rounded"><Edit className="w-5 h-5 text-accent" /></button>
                  <button onClick={() => handleDelete(plan.id)} className="p-2 hover:bg-destructive/10 rounded"><Trash2 className="w-5 h-5 text-destructive" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {plans.length === 0 && <p className="text-center py-12 text-muted-foreground">No plans yet. Create your first membership plan.</p>}
      </div>

      <div className="mt-12 p-6 bg-card rounded-xl border border-border">
        <h2 className="font-heading font-bold text-lg mb-4">Stripe Integration</h2>
        <p className="text-muted-foreground text-sm mb-4">Configure Stripe keys in Settings → Integrations. Webhook URL: <code className="bg-background px-2 py-1 rounded text-xs">/api/webhooks/stripe</code></p>
      </div>
    </div>
  );
}
