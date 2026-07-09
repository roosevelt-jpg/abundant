'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Testimonial } from '@/lib/types';

export default function AdminTestimonialsEditor() {
  const { authFetch } = useApiAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTestimonial, setNewTestimonial] = useState({
    authorName: '',
    authorTitle: '',
    content: '',
  });

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const { getAllTestimonials } = await import('@/lib/testimonials-service');
      const data = await getAllTestimonials();
      setTestimonials(data);
    } catch (err) {
      console.error('Error loading testimonials:', err);
      setError('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleAddTestimonial = async () => {
    if (!newTestimonial.authorName || !newTestimonial.content) {
      setError('Please fill in author name and content');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const res = await authFetch('/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify(newTestimonial),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add testimonial');
      }
      setNewTestimonial({ authorName: '', authorTitle: '', content: '' });
      setShowModal(false);
      await loadTestimonials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add testimonial');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: string, isPublished: boolean) => {
    try {
      setError(null);
      const res = await authFetch('/api/admin/testimonials', {
        method: 'PATCH',
        body: JSON.stringify({ id, isPublished: !isPublished }),
      });
      if (!res.ok) throw new Error('Failed to update testimonial');
      await loadTestimonials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update testimonial');
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      setError(null);
      const res = await authFetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete testimonial');
      await loadTestimonials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete testimonial');
    }
  };

  const published = testimonials.filter((t) => t.isPublished).length;
  const pending = testimonials.filter((t) => !t.isPublished).length;

  if (loading) return <div className="text-center py-12">Loading testimonials...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Testimonials</h1>
          <p className="text-muted-foreground">Manage member testimonials and reviews</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Testimonial
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-card rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Published</p>
          <p className="text-3xl font-bold text-accent">{published}</p>
        </div>
        <div className="p-4 bg-card rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Pending Approval</p>
          <p className="text-3xl font-bold text-yellow-600">{pending}</p>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg">Add Testimonial</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-background rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Author Name</label>
                <input
                  type="text"
                  value={newTestimonial.authorName}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, authorName: e.target.value })}
                  placeholder="Author name"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role/Title</label>
                <input
                  type="text"
                  value={newTestimonial.authorTitle}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, authorTitle: e.target.value })}
                  placeholder="e.g., Entrepreneur"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Testimonial Content</label>
                <textarea
                  value={newTestimonial.content}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                  placeholder="Write the testimonial content..."
                  rows={4}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTestimonial}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Testimonial'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className={`p-6 bg-card rounded-lg border transition-colors ${
              testimonial.isPublished
                ? 'border-green-500/20 bg-green-500/5'
                : 'border-yellow-500/20 bg-yellow-500/5'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{testimonial.authorName}</h3>
                {testimonial.authorTitle && (
                  <p className="text-sm text-muted-foreground">{testimonial.authorTitle}</p>
                )}
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                testimonial.isPublished
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-yellow-500/10 text-yellow-600'
              }`}>
                {testimonial.isPublished ? 'Published' : 'Pending'}
              </span>
            </div>

            <p className="text-sm mb-4 italic text-muted-foreground">&ldquo;{testimonial.content}&rdquo;</p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePublish(testimonial.id, testimonial.isPublished)}
                className="flex-1 flex items-center justify-center gap-2 p-2 border border-border rounded-lg hover:bg-accent/10 transition-colors text-sm font-medium"
              >
                {testimonial.isPublished ? (
                  <><EyeOff className="w-4 h-4" /> Unpublish</>
                ) : (
                  <><Eye className="w-4 h-4" /> Publish</>
                )}
              </button>
              <button
                onClick={() => handleDeleteTestimonial(testimonial.id)}
                className="flex-1 flex items-center justify-center gap-2 p-2 border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors text-sm font-medium text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}

        {testimonials.length === 0 && (
          <p className="text-center py-12 text-muted-foreground">No testimonials yet. Click &quot;Add Testimonial&quot; to create one.</p>
        )}
      </div>
    </div>
  );
}
