'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, Users, X, DollarSign } from 'lucide-react';
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
} from '@/lib/events-service';
import { Event, EventRegistration } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { PlacesAutocomplete } from '@/components/places-autocomplete';

const EMPTY_EVENT = {
  title: '',
  description: '',
  date: '',
  time: '09:00',
  location: '',
  virtualLink: '',
  capacity: 100,
  pricingType: 'free' as 'free' | 'paid',
  price: 0,
  currency: 'usd',
  category: 'networking' as Event['category'],
  isPublic: true,
};

export default function AdminEventsEditor() {
  const { userData } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [registrants, setRegistrants] = useState<EventRegistration[]>([]);
  const [viewRegistrants, setViewRegistrants] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getAllEvents();
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_EVENT);
    setShowModal(true);
  };

  const openEdit = (event: Event) => {
    const d = new Date(event.date);
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      date: d.toISOString().split('T')[0],
      time: d.toTimeString().slice(0, 5),
      location: event.location,
      virtualLink: event.virtualLink || '',
      capacity: event.capacity || 100,
      pricingType: event.pricingType || 'free',
      price: event.price || 0,
      currency: event.currency || 'usd',
      category: event.category,
      isPublic: event.isPublic,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.date) {
      alert('Please fill in title and date');
      return;
    }

    const [year, month, day] = form.date.split('-').map(Number);
    const [hours, minutes] = form.time.split(':').map(Number);
    const dateMs = new Date(year, month - 1, day, hours, minutes).getTime();

    const payload = {
      title: form.title,
      description: form.description,
      date: dateMs,
      location: form.location,
      virtualLink: form.virtualLink || undefined,
      capacity: form.capacity,
      pricingType: form.pricingType,
      price: form.pricingType === 'paid' ? form.price : undefined,
      currency: form.currency,
      category: form.category,
      isPublic: form.isPublic,
      status: 'upcoming' as const,
      createdBy: userData?.uid || 'admin',
      imageUrl: '',
    };

    try {
      if (editingId) {
        await updateEvent(editingId, payload);
      } else {
        await createEvent(payload);
      }
      await loadEvents();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await deleteEvent(id);
    await loadEvents();
  };

  const viewEventRegistrants = async (eventId: string) => {
    const regs = await getEventRegistrations(eventId);
    setRegistrants(regs);
    setViewRegistrants(eventId);
  };

  if (loading) return <div className="text-center py-12">Loading events...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">Manage events — synced live to the public site</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold"
        >
          <Plus className="w-5 h-5" /> Create Event
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg border border-border max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg">{editingId ? 'Edit Event' : 'Create Event'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
                <Input label="Time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
              </div>
              <PlacesAutocomplete
                label="Location"
                value={form.location}
                onChange={(v) => setForm({ ...form, location: v })}
                types={['establishment', 'geocode']}
                placeholder="Search for venue or address..."
                required
              />
              <Input label="Virtual Link (optional)" value={form.virtualLink} onChange={(v) => setForm({ ...form, virtualLink: v })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={form.pricingType}
                    onChange={(e) => setForm({ ...form, pricingType: e.target.value as 'free' | 'paid' })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                {form.pricingType === 'paid' && (
                  <Input label="Price ($)" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: parseFloat(v) || 0 })} />
                )}
              </div>
              <Input label="Capacity" type="number" value={String(form.capacity)} onChange={(v) => setForm({ ...form, capacity: parseInt(v) || 0 })} />
            </div>
            <div className="flex gap-3 pt-4 mt-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg">Cancel</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}

      {viewRegistrants && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="font-heading font-bold">Registrants ({registrants.length})</h2>
              <button onClick={() => setViewRegistrants(null)}><X className="w-5 h-5" /></button>
            </div>
            {registrants.map((r) => (
              <div key={r.id} className="p-3 border-b border-border text-sm">
                <p className="font-medium">{r.userName}</p>
                <p className="text-muted-foreground">{r.userEmail}</p>
                <p className="text-xs capitalize">{r.paymentStatus || 'free'} · {r.status}</p>
              </div>
            ))}
            {registrants.length === 0 && <p className="text-muted-foreground text-sm">No registrants yet</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map((event) => (
          <div key={event.id} className="p-6 bg-card rounded-xl border border-border">
            <div className="flex justify-between mb-3">
              <h3 className="font-heading font-bold text-lg">{event.title}</h3>
              <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-semibold rounded capitalize">
                {event.pricingType || 'free'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
            <div className="space-y-2 mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{new Date(event.date).toLocaleString()}</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{event.location}</div>
              <div className="flex items-center gap-2"><Users className="w-4 h-4" />{event.registered} registered</div>
              {event.pricingType === 'paid' && event.price && (
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" />${event.price}</div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(event)} className="flex-1 p-2 border border-border rounded-lg text-sm flex items-center justify-center gap-1"><Edit className="w-4 h-4" />Edit</button>
              <button onClick={() => viewEventRegistrants(event.id)} className="flex-1 p-2 border border-border rounded-lg text-sm">Registrants</button>
              <button onClick={() => handleDelete(event.id)} className="p-2 border border-destructive/20 rounded-lg text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {events.length === 0 && <p className="text-center py-12 text-muted-foreground">No events yet</p>}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', textarea = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean;
}) {
  const cls = 'w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent';
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} className={cls} rows={3} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}
