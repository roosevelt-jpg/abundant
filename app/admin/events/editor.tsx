'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, Users } from 'lucide-react';
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '@/lib/events-service';
import { Event } from '@/lib/types';

export default function AdminEventsEditor() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Event>>({});
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingId(event.id);
    setEditingData(event);
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      await updateEvent(editingId, editingData);
      await loadEvents();
      setEditingId(null);
      setEditingData({});
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 7);
      
      await createEvent({
        title: 'New Event',
        description: 'Event description',
        date: eventDate.getTime(),
        location: 'Dubai, UAE',
        category: 'networking',
        status: 'draft',
        isPublic: false,
        createdBy: 'admin'
      });
      await loadEvents();
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading events...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Events Management</h1>
          <p className="text-muted-foreground">Create and manage events with real-time Firestore sync</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="p-6 bg-card rounded-xl border border-border">
            {editingId === event.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={editingData.title || ''}
                      onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={editingData.category || 'networking'}
                      onChange={(e) => setEditingData({ ...editingData, category: e.target.value as any })}
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

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={editingData.description || ''}
                    onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="datetime-local"
                      value={new Date(editingData.date || Date.now()).toISOString().slice(0, 16)}
                      onChange={(e) => setEditingData({ ...editingData, date: new Date(e.target.value).getTime() })}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <input
                      type="text"
                      value={editingData.location || ''}
                      onChange={(e) => setEditingData({ ...editingData, location: e.target.value })}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Capacity</label>
                    <input
                      type="number"
                      value={editingData.capacity || ''}
                      onChange={(e) => setEditingData({ ...editingData, capacity: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={editingData.status || 'draft'}
                      onChange={(e) => setEditingData({ ...editingData, status: e.target.value as any })}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="draft">Draft</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingData.isPublic || false}
                    onChange={(e) => setEditingData({ ...editingData, isPublic: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">Public</label>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg font-semibold hover:bg-green-500/20 transition-colors"
                  >
                    Save Changes
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
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-heading font-bold text-lg">{event.title}</h3>
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                      event.status === 'upcoming' ? 'bg-blue-500/10 text-blue-600' :
                      event.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                      event.status === 'cancelled' ? 'bg-red-500/10 text-red-600' :
                      'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {event.registered} registered {event.capacity ? `/ ${event.capacity}` : ''}
                    </div>
                  </div>
                  
                  <p className="mt-3 text-sm line-clamp-2">{event.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5 text-accent" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No events yet. Create your first event to get started.
          </div>
        )}
      </div>
    </div>
  );
}
