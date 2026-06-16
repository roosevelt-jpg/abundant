'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial, publishTestimonial } from '@/lib/testimonials-service';
import { Testimonial } from '@/lib/types';

export default function AdminTestimonialsEditor() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Testimonial>>({});

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const allTestimonials = await getAllTestimonials();
      setTestimonials(allTestimonials);
    } catch (error) {
      console.error('Error loading testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setEditingData(testimonial);
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      await updateTestimonial(editingId, editingData);
      await loadTestimonials();
      setEditingId(null);
      setEditingData({});
    } catch (error) {
      console.error('Error saving testimonial:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await deleteTestimonial(id);
      await loadTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
    }
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      await publishTestimonial(id, !isPublished);
      await loadTestimonials();
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await createTestimonial({
        authorName: 'New Member',
        content: 'Share your success story here...',
        rating: 5,
        isPublished: false
      });
      await loadTestimonials();
    } catch (error) {
      console.error('Error creating testimonial:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`text-lg ${i <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Loading testimonials...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Member Testimonials</h1>
          <p className="text-muted-foreground">Manage and showcase member success stories</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Testimonial
        </button>
      </div>

      <div className="space-y-6">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="p-6 bg-card rounded-xl border border-border">
            {editingId === testimonial.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Author Name</label>
                    <input
                      type="text"
                      value={editingData.authorName || ''}
                      onChange={(e) => setEditingData({ ...editingData, authorName: e.target.value })}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Author Title</label>
                    <input
                      type="text"
                      value={editingData.authorTitle || ''}
                      onChange={(e) => setEditingData({ ...editingData, authorTitle: e.target.value })}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Testimonial Content</label>
                  <textarea
                    value={editingData.content || ''}
                    onChange={(e) => setEditingData({ ...editingData, content: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    rows={5}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        onClick={() => setEditingData({ ...editingData, rating: i })}
                        className={`text-2xl transition-colors ${
                          i <= (editingData.rating || 0) ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingData.isPublished || false}
                    onChange={(e) => setEditingData({ ...editingData, isPublished: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">Published</label>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg font-semibold hover:bg-green-500/20 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditingData({});
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg font-semibold hover:bg-destructive/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3">
                    {renderStars(testimonial.rating)}
                  </div>
                  
                  <h3 className="font-heading font-bold text-lg mb-1">{testimonial.authorName}</h3>
                  {testimonial.authorTitle && (
                    <p className="text-sm text-muted-foreground mb-3">{testimonial.authorTitle}</p>
                  )}
                  
                  <p className="text-sm leading-relaxed mb-3">{testimonial.content}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`inline-block px-2 py-1 rounded ${
                      testimonial.isPublished
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {testimonial.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleTogglePublish(testimonial.id, testimonial.isPublished)}
                    className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    {testimonial.isPublished ? (
                      <Eye className="w-5 h-5 text-accent" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(testimonial)}
                    className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5 text-accent" />
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {testimonials.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No testimonials yet. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
