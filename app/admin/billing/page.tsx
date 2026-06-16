'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  features: string[];
}

export default function AdminBillingSettings() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      interval: 'month',
      description: 'Perfect for individuals',
      features: ['Access to all events', 'Community forum', 'Monthly newsletter']
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 79,
      interval: 'month',
      description: 'For serious entrepreneurs',
      features: ['Everything in Basic', '1-on-1 mentoring', 'Priority support', 'Exclusive content']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      interval: 'month',
      description: 'Custom solution',
      features: ['Everything in Pro', 'Custom training', 'Dedicated account manager', 'API access']
    }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<SubscriptionPlan>>({});

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingId(plan.id);
    setEditingData({ ...plan });
  };

  const handleSave = () => {
    if (!editingId) return;
    setPlans(plans.map(p => p.id === editingId ? { ...p, ...editingData } : p));
    setEditingId(null);
    setEditingData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage billing plans and pricing</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors">
          <Plus className="w-5 h-5" />
          New Plan
        </button>
      </div>

      <div className="space-y-6">
        {plans.map((plan) => (
          <div key={plan.id} className="p-6 bg-card rounded-xl border border-border">
            {editingId === plan.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={editingData.name || ''}
                      onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price</label>
                    <input
                      type="number"
                      value={editingData.price || ''}
                      onChange={(e) => setEditingData({ ...editingData, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <input
                    type="text"
                    value={editingData.description || ''}
                    onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-500/10 text-green-600 rounded-lg font-semibold hover:bg-green-500/20 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg font-semibold hover:bg-destructive/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-lg mb-2">{plan.name}</h3>
                  <p className="text-2xl font-bold mb-2">${plan.price}/{plan.interval}</p>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="space-y-1 text-sm">
                    {plan.features.map((feature, idx) => (
                      <p key={idx} className="text-muted-foreground">• {feature}</p>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5 text-accent" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stripe Integration Info */}
      <div className="mt-12 p-6 bg-card rounded-xl border border-border">
        <h2 className="font-heading font-bold text-lg mb-4">Stripe Integration</h2>
        <p className="text-muted-foreground text-sm mb-4">
          To sync plans with Stripe, create products and prices in your Stripe dashboard. The app will automatically fetch and display them on the pricing page.
        </p>
        <div className="space-y-2 text-sm">
          <p><strong>Public Key:</strong> <code className="bg-background px-2 py-1 rounded text-xs">{process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'Not configured'}</code></p>
          <p><strong>Webhook URL:</strong> <code className="bg-background px-2 py-1 rounded text-xs">/api/webhooks/stripe</code></p>
        </div>
      </div>
    </div>
  );
}
