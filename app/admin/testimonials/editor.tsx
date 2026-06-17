'use client';

import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, X } from 'lucide-react';

const DEFAULT_TESTIMONIALS = [
  {
    id: '1',
    author: 'Sarah Johnson',
    role: 'Entrepreneur',
    content: 'Abundant Global Club transformed my business network and opened doors I never knew existed.',
    status: 'published',
    createdAt: Date.now()
  },
  {
    id: '2',
    author: 'Ahmed Al-Mansouri',
    role: 'Business Owner',
    content: 'The exclusive events and networking opportunities have been invaluable for my growth.',
    status: 'pending',
    createdAt: Date.now()
  },
  {
    id: '3',
    author: 'Maria Garcia',
    role: 'Executive',
    content: 'Being part of this elite community has accelerated my professional development significantly.',
    status: 'published',
    createdAt: Date.now()
  }
];

export default function AdminTestimonialsEditor() {
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);
  const [showModal, setShowModal] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    author: '',
    role: '',
    content: ''
  });

  const handleAddTestimonial = () => {
    if (!newTestimonial.author || !newTestimonial.content) {
      alert('Please fill in author name and content');
      return;
    }

    const testimonial = {
      id: String(testimonials.length + 1),
      ...newTestimonial,
      status: 'pending',
      createdAt: Date.now()
    };

    setTestimonials([...testimonials, testimonial]);
    setNewTestimonial({ author: '', role: '', content: '' });
    setShowModal(false);
  };

  const handlePublish = (id: string) => {
    setTestimonials(testimonials.map(t => 
      t.id === id ? { ...t, status: t.status === 'published' ? 'pending' : 'published' } : t
    ));
  };

  const handleDeleteTestimonial = (id: string) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      setTestimonials(testimonials.filter(t => t.id !== id));
    }
  };

  const published = testimonials.filter(t => t.status === 'published').length;
  const pending = testimonials.filter(t => t.status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Testimonials</h1>
          <p className="text-muted-foreground">Manage member testimonials and reviews</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
                  value={newTestimonial.author}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, author: e.target.value })}
                  placeholder="Author name"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role/Title</label>
                <input
                  type="text"
                  value={newTestimonial.role}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
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
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
                >
                  Add Testimonial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Testimonials List */}
      <div className="space-y-4">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className={`p-6 bg-card rounded-lg border transition-colors ${
              testimonial.status === 'published'
                ? 'border-green-500/20 bg-green-500/5'
                : 'border-yellow-500/20 bg-yellow-500/5'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{testimonial.author}</h3>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                testimonial.status === 'published'
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-yellow-500/10 text-yellow-600'
              }`}>
                {testimonial.status === 'published' ? 'Published' : 'Pending'}
              </span>
            </div>

            <p className="text-sm mb-4 italic text-muted-foreground">"{testimonial.content}"</p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePublish(testimonial.id)}
                className="flex-1 flex items-center justify-center gap-2 p-2 border border-border rounded-lg hover:bg-accent/10 transition-colors text-sm font-medium"
              >
                {testimonial.status === 'published' ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Publish
                  </>
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
      </div>
    </div>
  );
}
