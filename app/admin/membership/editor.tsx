'use client';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { MembershipPlan } from '@/lib/types';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Trash2, Plus, Edit2 } from 'lucide-react';

export default function MembershipPlansEditor() {
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    billingCycle: 'monthly' as 'monthly' | 'annual',
    features: [] as string[],
    maxEventRegistrations: 0,
    prioritySupport: false,
    accessLevel: 1,
    stripeProductId: '',
    stripePriceId: '',
    isPublic: false,
    status: 'draft' as 'draft' | 'active' | 'discontinued',
    order: 0,
    color: '#3b82f6',
    badge: '',
    isMostPopular: false,
  });
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    loadPlans();
  }, [currentUser]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const plansRef = collection(db, 'membershipPlans');
      const snapshot = await getDocs(plansRef);
      const plansData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MembershipPlan[];
      setPlans(plansData.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (error) {
      console.error('[v0] Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newPlan.name || !newPlan.slug) {
      alert('Please fill in name and slug');
      return;
    }

    try {
      if (editingId) {
        const planRef = doc(db, 'membershipPlans', editingId);
        await updateDoc(planRef, {
          ...newPlan,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'membershipPlans'), {
          ...newPlan,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: currentUser?.uid,
        });
      }
      resetForm();
      await loadPlans();
      setShowModal(false);
    } catch (error) {
      console.error('[v0] Error saving plan:', error);
      alert('Failed to save plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await deleteDoc(doc(db, 'membershipPlans', id));
      await loadPlans();
    } catch (error) {
      console.error('[v0] Error deleting plan:', error);
      alert('Failed to delete plan');
    }
  };

  const handleEdit = (plan: MembershipPlan) => {
    setEditingId(plan.id);
    setNewPlan({
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price: plan.price,
      billingCycle: plan.billingCycle,
      features: plan.features || [],
      maxEventRegistrations: plan.maxEventRegistrations || 0,
      prioritySupport: plan.prioritySupport || false,
      accessLevel: plan.accessLevel,
      stripeProductId: plan.stripeProductId || '',
      stripePriceId: plan.stripePriceId || '',
      isPublic: plan.isPublic,
      status: plan.status,
      order: plan.order || 0,
      color: plan.color || '#3b82f6',
      badge: plan.badge || '',
      isMostPopular: plan.isMostPopular || false,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setNewPlan({
      name: '',
      slug: '',
      description: '',
      price: 0,
      billingCycle: 'monthly',
      features: [],
      maxEventRegistrations: 0,
      prioritySupport: false,
      accessLevel: 1,
      stripeProductId: '',
      stripePriceId: '',
      isPublic: false,
      status: 'draft',
      order: 0,
      color: '#3b82f6',
      badge: '',
      isMostPopular: false,
    });
    setFeatureInput('');
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setNewPlan({
        ...newPlan,
        features: [...newPlan.features, featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setNewPlan({
      ...newPlan,
      features: newPlan.features.filter((_, i) => i !== index),
    });
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Membership Plans</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {editingId ? 'Edit Plan' : 'Create Plan'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Plan Name</label>
                  <input
                    type="text"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    placeholder="e.g., Elite Member"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slug</label>
                  <input
                    type="text"
                    value={newPlan.slug}
                    onChange={(e) => setNewPlan({ ...newPlan, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="e.g., elite"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  placeholder="Plan description for members"
                  rows={3}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Billing Cycle</label>
                  <select
                    value={newPlan.billingCycle}
                    onChange={(e) => setNewPlan({ ...newPlan, billingCycle: e.target.value as 'monthly' | 'annual' })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Access Level</label>
                  <select
                    value={newPlan.accessLevel}
                    onChange={(e) => setNewPlan({ ...newPlan, accessLevel: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="1">Member (1)</option>
                    <option value="2">Elite (2)</option>
                    <option value="3">Inner Circle (3)</option>
                    <option value="4">Founder (4)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Events</label>
                  <input
                    type="number"
                    value={newPlan.maxEventRegistrations}
                    onChange={(e) => setNewPlan({ ...newPlan, maxEventRegistrations: parseInt(e.target.value) })}
                    placeholder="Unlimited: 0"
                    min="0"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <input
                    type="number"
                    value={newPlan.order}
                    onChange={(e) => setNewPlan({ ...newPlan, order: parseInt(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Badge/Label</label>
                  <input
                    type="text"
                    value={newPlan.badge}
                    onChange={(e) => setNewPlan({ ...newPlan, badge: e.target.value })}
                    placeholder="e.g., Most Popular"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <input
                    type="color"
                    value={newPlan.color}
                    onChange={(e) => setNewPlan({ ...newPlan, color: e.target.value })}
                    className="w-full h-10 bg-input border border-border rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Features</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addFeature();
                      }
                    }}
                    placeholder="Add a feature..."
                    className="flex-1 px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    onClick={addFeature}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {newPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between px-3 py-2 bg-muted rounded">
                      <span className="text-sm">✓ {feature}</span>
                      <button
                        onClick={() => removeFeature(index)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPlan.prioritySupport}
                    onChange={(e) => setNewPlan({ ...newPlan, prioritySupport: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Priority Support</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPlan.isMostPopular}
                    onChange={(e) => setNewPlan({ ...newPlan, isMostPopular: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Mark as Most Popular</span>
                </label>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={newPlan.status}
                    onChange={(e) => setNewPlan({ ...newPlan, status: e.target.value as 'draft' | 'active' | 'discontinued' })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPlan.isPublic}
                    onChange={(e) => setNewPlan({ ...newPlan, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-semibold">
                    {newPlan.isPublic ? '✓ Published' : '• Draft'} - Members can see and subscribe
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
                >
                  {editingId ? 'Update Plan' : 'Create Plan'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="p-6 bg-card rounded-lg border-2 border-border hover:border-accent/50 transition-colors"
            style={{ borderTopColor: plan.color || '#3b82f6', borderTopWidth: '4px' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  {plan.isMostPopular && (
                    <span className="px-2 py-1 text-xs font-bold bg-accent text-white rounded">
                      Most Popular
                    </span>
                  )}
                </div>
                {plan.badge && <p className="text-sm text-accent">{plan.badge}</p>}
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  plan.isPublic
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-gray-500/10 text-gray-600'
                }`}
              >
                {plan.isPublic ? '✓ Published' : '• Draft'}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="text-2xl font-bold">
                ${plan.price}
                <span className="text-sm text-muted-foreground font-normal">
                  /{plan.billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="text-muted-foreground">
                Access Level: <span className="font-semibold">{['', 'Member', 'Elite', 'Inner Circle', 'Founder'][plan.accessLevel]}</span>
              </div>
              {(plan.maxEventRegistrations || 0) > 0 && (
                <div className="text-muted-foreground">
                  Max Events: <span className="font-semibold">{plan.maxEventRegistrations}</span>
                </div>
              )}
              {plan.prioritySupport && (
                <div className="text-accent font-semibold">✓ Priority Support</div>
              )}
              <div className="text-xs text-muted-foreground">
                {plan.subscribers || 0} subscriber{plan.subscribers !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(plan)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <p className="text-muted-foreground mb-4">No membership plans created yet</p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
          >
            Create First Plan
          </button>
        </div>
      )}
    </div>
  );
}
