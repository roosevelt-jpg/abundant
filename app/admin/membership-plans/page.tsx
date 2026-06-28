'use client';

import { useState, useEffect } from 'react';
import { MembershipPlan } from '@/lib/types';
import { createMembershipPlan, updateMembershipPlan, deleteMembershipPlan } from '@/app/admin/actions';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MembershipPlan>>({
    name: '',
    slug: '',
    description: '',
    price: 0,
    billingCycle: 'monthly',
    features: [],
    accessLevel: 1,
    isPublic: true,
    status: 'active',
    order: 0,
  });
  const [featureInput, setFeatureInput] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/membership-plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('[v0] Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), featureInput]
      });
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: (formData.features || []).filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const result = await updateMembershipPlan(editingId, formData);
        if (result.success) {
          loadPlans();
          setEditingId(null);
        }
      } else {
        const result = await createMembershipPlan(formData as Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>);
        if (result.success) {
          loadPlans();
        }
      }
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: 0,
        billingCycle: 'monthly',
        features: [],
        accessLevel: 1,
        isPublic: true,
        status: 'active',
        order: 0,
      });
      setShowForm(false);
    } catch (error) {
      console.error('[v0] Error saving plan:', error);
    }
  };

  const handleEdit = (plan: MembershipPlan) => {
    setFormData(plan);
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      const result = await deleteMembershipPlan(id);
      if (result.success) {
        loadPlans();
      }
    }
  };

  if (loading) {
    return <div className="p-6">Loading membership plans...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Membership Plans</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              name: '',
              slug: '',
              description: '',
              price: 0,
              billingCycle: 'monthly',
              features: [],
              accessLevel: 1,
              isPublic: true,
              status: 'active',
              order: 0,
            });
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Create Plan
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Edit Plan' : 'Create Plan'}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Elite Member"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., elite"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Plan description for members"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Billing Cycle</label>
                  <select
                    value={formData.billingCycle || 'monthly'}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'monthly' | 'annual' })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Features</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                    className="flex-1 border rounded px-3 py-2"
                    placeholder="Add a feature..."
                  />
                  <button
                    onClick={handleAddFeature}
                    className="bg-secondary text-white px-3 py-2 rounded"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.features || []).map((feature, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                      <span>{feature}</span>
                      <button
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-red-500"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-primary text-white py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Save
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-gray-600">${plan.price}/{plan.billingCycle}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {plan.status}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
            
            <div className="space-y-2 mb-4">
              {plan.features?.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="text-sm flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  {feature}
                </div>
              ))}
              {plan.features && plan.features.length > 3 && (
                <div className="text-sm text-gray-600">+{plan.features.length - 3} more</div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(plan)}
                className="flex-1 bg-blue-500 text-white py-2 rounded flex items-center justify-center gap-1"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="flex-1 bg-red-500 text-white py-2 rounded flex items-center justify-center gap-1"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
