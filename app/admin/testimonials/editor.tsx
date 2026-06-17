'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus, Trash2, Eye, EyeOff, X } from 'lucide-react';
import type { Testimonial } from '@/lib/types';

export default function AdminTestimonialsEditor() {
  const { currentUser } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTestimonial, setNewTestimonial] = useState({
    authorName: '',
    authorTitle: '',
    content: '',
    rating: 5,
    isPublished: false
  });

  // Fetch testimonials
  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/testimonials');
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data);
      }
    } catch (error) {
      console.error('[v0] Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    return await currentUser?.getIdToken();
  };

  const handleAddTestimonial = async () => {
    if (!newTestimonial.authorName || !newTestimonial.content) {
      alert('Please fill in author name and content');
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        alert('Not authenticated');
        return;
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/testimonials/${editingId}` : '/api/testimonials';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newTestimonial),
      });

      if (response.ok) {
        await fetchTestimonials();
        setNewTestimonial({ authorName: '', authorTitle: '', content: '', rating: 5, isPublished: false });
        setEditingId(null);
        setShowModal(false);
      } else {
        alert('Failed to save testimonial');
      }
    } catch (error) {
      console.error('[v0] Error saving testimonial:', error);
      alert('Error saving testimonial');
    }
  };

  const handlePublish = async (id: string, currentStatus: boolean) => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/testimonials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (response.ok) {
        await fetchTestimonials();
      }
    } catch (error) {
      console.error('[v0] Error updating testimonial:', error);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/testimonials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTestimonials(testimonials.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('[v0] Error deleting testimonial:', error);
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setNewTestimonial({
      authorName: testimonial.authorName,
      authorTitle: testimonial.authorTitle || '',
      content: testimonial.content,
      rating: testimonial.rating,
      isPublished: testimonial.isPublished,
    });
    setShowModal(true);
  };

  const published = testimonials.filter(t => t.isPublished).length;
  const pending = testimonials.filter(t => !t.isPublished).length;

  const openAddModal = () => {
    setEditingId(null);
    setNewTestimonial({ authorName: '', authorTitle: '', content: '', rating: 5, isPublished: false });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Testimonials</h1>
          <p className="text-muted-foreground">Manage member testimonials and reviews</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Testimonial
        </button>
      </div>

      {/* Stats */}
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

      {/* Add Testimonial Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg">{editingId ? 'Edit' : 'Add'} Testimonial</h2>
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
                <label className="block text-sm font-medium mb-2">Title/Position</label>
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

              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <select
                  value={newTestimonial.rating}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTestimonial.isPublished}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, isPublished: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Publish immediately</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTestimonial}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
                >
                  {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 bg-muted rounded-lg animate-pulse h-32"></div>
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No testimonials yet</p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90"
          >
            Add First Testimonial
          </button>
        </div>
      ) : (
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
                <p className="text-sm text-muted-foreground">{testimonial.authorTitle}</p>
                <div className="flex gap-1 mt-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-500">★</span>
                  ))}
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                testimonial.isPublished
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-yellow-500/10 text-yellow-600'
              }`}>
                {testimonial.isPublished ? 'Published' : 'Pending'}
              </span>
            </div>

            <p className="text-sm mb-4 italic text-muted-foreground">"{testimonial.content}"</p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(testimonial)}
                className="flex-1 flex items-center justify-center gap-2 p-2 border border-border rounded-lg hover:bg-accent/10 transition-colors text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handlePublish(testimonial.id, testimonial.isPublished)}
                className="flex-1 flex items-center justify-center gap-2 p-2 border border-border rounded-lg hover:bg-accent/10 transition-colors text-sm font-medium"
              >
                {testimonial.isPublished ? 'Unpublish' : 'Publish'}
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
        </div>
      )}
    </div>
  );
}
