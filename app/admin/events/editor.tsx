'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus, Trash2, Edit, X, Calendar, MapPin } from 'lucide-react';
import { GooglePlacesAutocomplete } from '@/components/google-places-autocomplete';
import type { Event } from '@/lib/types';

export default function AdminEventsEditor() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    imageBanner: '',
    expectedAttendees: 0,
    isPublic: false,
    stripeProductId: '',
    price: 0,
    eventType: 'hybrid' as 'in-person' | 'online' | 'hybrid',
    registrationType: 'free' as 'free' | 'paid' | 'rsvp',
    genderRestriction: 'mixed' as 'mixed' | 'men-only' | 'women-only',
    category: 'networking' as 'networking' | 'workshop' | 'webinar' | 'conference' | 'other'
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('[v0] Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    return await currentUser?.getIdToken();
  };

  const handleSaveEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      alert('Please fill in title and date');
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        alert('Not authenticated');
        return;
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/events/${editingId}` : '/api/events';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newEvent),
      });

      if (response.ok) {
        await fetchEvents();
        resetForm();
        setShowModal(false);
      } else {
        alert('Failed to save event');
      }
    } catch (error) {
      console.error('[v0] Error saving event:', error);
      alert('Error saving event');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setEvents(events.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error('[v0] Error deleting event:', error);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingId(event.id);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time || '',
      location: event.location || '',
      imageBanner: (event as any).imageBanner || '',
      expectedAttendees: event.expectedAttendees || 0,
      isPublic: event.isPublic,
      stripeProductId: event.stripeProductId || '',
      price: event.price || 0,
      eventType: event.eventType || 'hybrid',
      registrationType: event.registrationType || 'free',
      genderRestriction: event.genderRestriction || 'mixed',
      category: event.category || 'networking'
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      imageBanner: '',
      expectedAttendees: 0,
      isPublic: false,
      stripeProductId: '',
      price: 0,
      eventType: 'hybrid',
      registrationType: 'free',
      genderRestriction: 'mixed',
      category: 'networking'
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">Manage and schedule events</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      {/* Add/Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg">{editingId ? 'Edit' : 'Create'} Event</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-background rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Event Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event title"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <GooglePlacesAutocomplete
                    value={newEvent.location}
                    onChange={(location) => setNewEvent({ ...newEvent, location })}
                    placeholder="Enter event location..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event description..."
                  rows={3}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Event Image Banner</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const response = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                          });
                          if (response.ok) {
                            const data = await response.json();
                            setNewEvent({ ...newEvent, imageBanner: data.url });
                          }
                        } catch (error) {
                          console.error('[v0] Error uploading image:', error);
                          alert('Failed to upload image');
                        }
                      }
                    }}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Upload an image file for the event banner (JPG, PNG, WebP)</p>
                {newEvent.imageBanner && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-border h-32">
                    <img src={newEvent.imageBanner} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Expected Attendees</label>
                  <input
                    type="number"
                    value={newEvent.expectedAttendees}
                    onChange={(e) => setNewEvent({ ...newEvent, expectedAttendees: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price (optional)</label>
                  <input
                    type="number"
                    value={newEvent.price}
                    onChange={(e) => setNewEvent({ ...newEvent, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Event Type</label>
                  <select
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value as 'in-person' | 'online' | 'hybrid' })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="in-person">In-Person</option>
                    <option value="online">Online</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Registration Type</label>
                  <select
                    value={newEvent.registrationType}
                    onChange={(e) => setNewEvent({ ...newEvent, registrationType: e.target.value as 'free' | 'paid' | 'rsvp' })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="rsvp">RSVP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Gender Restriction</label>
                  <select
                    value={newEvent.genderRestriction}
                    onChange={(e) => setNewEvent({ ...newEvent, genderRestriction: e.target.value as 'mixed' | 'men-only' | 'women-only' })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="men-only">Men Only</option>
                    <option value="women-only">Women Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as 'networking' | 'workshop' | 'webinar' | 'conference' | 'other' })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="networking">Networking</option>
                    <option value="workshop">Workshop</option>
                    <option value="webinar">Webinar</option>
                    <option value="conference">Conference</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEvent.isPublic}
                  onChange={(e) => setNewEvent({ ...newEvent, isPublic: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">{newEvent.isPublic ? '✓ Published' : '• Draft Mode'} - {newEvent.isPublic ? 'Event is visible to public' : 'Event is saved as draft'}</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
                >
                  {editingId ? 'Update' : 'Create'}
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
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No events yet</p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90"
          >
            Create First Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className={`p-6 bg-card rounded-lg border transition-colors ${
                event.isPublic
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-gray-500/20 bg-gray-500/5'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    event.isPublic
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-gray-500/10 text-gray-600'
                  }`}>
                    {event.isPublic ? '✓ Published' : '• Draft'}
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-500/10 text-blue-600">
                    {event.eventType || 'Hybrid'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.date).toLocaleDateString()} {event.time && `at ${event.time}`}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                )}
                <div className="text-muted-foreground">
                  {event.registrationType === 'paid' && event.price ? `$${event.price}` : event.registrationType === 'free' ? 'Free' : 'RSVP'}
                </div>
                <div className="text-muted-foreground">
                  {event.genderRestriction === 'mixed' ? 'Mixed' : event.genderRestriction === 'men-only' ? 'Men Only' : 'Women Only'}
                </div>
                <div className="text-muted-foreground col-span-2">
                  Expected: {event.expectedAttendees} attendees
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(event)}
                  className="flex-1 flex items-center justify-center gap-2 p-2 border border-border rounded-lg hover:bg-accent/10 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
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
