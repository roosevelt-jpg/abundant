'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, Users, X, DollarSign, Tag, Percent } from 'lucide-react';
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
} from '@/lib/events-service';
import {
  getAllEventTags,
  seedDefaultEventTags,
  createEventTag,
  deleteEventTag,
} from '@/lib/event-tags-service';
import {
  getAllDiscountCodes,
  createDiscountCode,
  deleteDiscountCode,
} from '@/lib/discount-codes-service';
import { Event, EventRegistration, EventTag, EventDiscountCode, EventAudienceGender } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { PlacesAutocomplete } from '@/components/places-autocomplete';
import { getAudienceGenderLabel } from '@/lib/event-eligibility';

type Tab = 'events' | 'tags' | 'discounts';

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
  audienceGender: 'mixed' as EventAudienceGender,
  tags: [] as string[],
};

export default function AdminEventsEditor() {
  const { userData } = useAuth();
  const [tab, setTab] = useState<Tab>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<EventTag[]>([]);
  const [discountCodes, setDiscountCodes] = useState<EventDiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [registrants, setRegistrants] = useState<EventRegistration[]>([]);
  const [viewRegistrants, setViewRegistrants] = useState<string | null>(null);

  const [newTagName, setNewTagName] = useState('');
  const [discountForm, setDiscountForm] = useState({
    code: '',
    eventIds: [] as string[],
    discountType: 'percent' as 'percent' | 'fixed',
    discountValue: 10,
    maxUses: '',
    expiresAt: '',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      await seedDefaultEventTags();
      const [ev, tg, dc] = await Promise.all([
        getAllEvents(),
        getAllEventTags(),
        getAllDiscountCodes(),
      ]);
      setEvents(ev);
      setTags(tg);
      setDiscountCodes(dc);
    } catch (err) {
      console.error('Error loading:', err);
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
      audienceGender: event.audienceGender || 'mixed',
      tags: event.tags || [],
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
      audienceGender: form.audienceGender,
      tags: form.tags,
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
      await loadAll();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await deleteEvent(id);
    await loadAll();
  };

  const viewEventRegistrants = async (eventId: string) => {
    const regs = await getEventRegistrations(eventId);
    setRegistrants(regs);
    setViewRegistrants(eventId);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await createEventTag(newTagName.trim());
    setNewTagName('');
    const tg = await getAllEventTags();
    setTags(tg);
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Delete this tag?')) return;
    await deleteEventTag(id);
    const tg = await getAllEventTags();
    setTags(tg);
  };

  const toggleEventTag = (tagId: string) => {
    const current = form.tags;
    setForm({
      ...form,
      tags: current.includes(tagId)
        ? current.filter((t) => t !== tagId)
        : [...current, tagId],
    });
  };

  const handleCreateDiscount = async () => {
    if (!discountForm.code.trim()) {
      alert('Enter a discount code');
      return;
    }
    await createDiscountCode({
      code: discountForm.code,
      eventIds: discountForm.eventIds,
      discountType: discountForm.discountType,
      discountValue: discountForm.discountValue,
      maxUses: discountForm.maxUses ? parseInt(discountForm.maxUses) : undefined,
      expiresAt: discountForm.expiresAt ? new Date(discountForm.expiresAt).getTime() : undefined,
      active: true,
      createdBy: userData?.uid || 'admin',
    });
    setDiscountForm({ code: '', eventIds: [], discountType: 'percent', discountValue: 10, maxUses: '', expiresAt: '' });
    const dc = await getAllDiscountCodes();
    setDiscountCodes(dc);
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Delete this discount code?')) return;
    await deleteDiscountCode(id);
    const dc = await getAllDiscountCodes();
    setDiscountCodes(dc);
  };

  const getTagById = (id: string) => tags.find((t) => t.id === id);

  if (loading) return <div className="text-center py-12">Loading events...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">Manage events, tags, and member discount codes</p>
        </div>
        {tab === 'events' && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold"
          >
            <Plus className="w-5 h-5" /> Create Event
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-border">
        {(['events', 'tags', 'discounts'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${
              tab === t ? 'border-accent text-accent' : 'border-transparent text-muted-foreground'
            }`}
          >
            {t === 'discounts' ? 'Discount Codes' : t}
          </button>
        ))}
      </div>

      {tab === 'tags' && (
        <div className="max-w-2xl">
          <div className="flex gap-2 mb-6">
            <input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name..."
              className="flex-1 px-4 py-2 bg-input border border-border rounded-lg"
            />
            <button onClick={handleCreateTag} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold">
              Add Tag
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border border-border"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                {tag.name}
                <button onClick={() => handleDeleteTag(tag.id)} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === 'discounts' && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 bg-card rounded-xl border border-border space-y-4">
            <h2 className="font-heading font-bold">Create Discount Code</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Code" value={discountForm.code} onChange={(v) => setDiscountForm({ ...discountForm, code: v.toUpperCase() })} />
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={discountForm.discountType}
                  onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value as 'percent' | 'fixed' })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed amount ($)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={discountForm.discountType === 'percent' ? 'Discount %' : 'Discount $'}
                type="number"
                value={String(discountForm.discountValue)}
                onChange={(v) => setDiscountForm({ ...discountForm, discountValue: parseFloat(v) || 0 })}
              />
              <Input label="Max Uses (optional)" type="number" value={discountForm.maxUses} onChange={(v) => setDiscountForm({ ...discountForm, maxUses: v })} />
            </div>
            <Input label="Expires (optional)" type="date" value={discountForm.expiresAt} onChange={(v) => setDiscountForm({ ...discountForm, expiresAt: v })} />
            <div>
              <label className="block text-sm font-medium mb-2">Applies to Events (leave empty for all)</label>
              <div className="flex flex-wrap gap-2">
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      const ids = discountForm.eventIds;
                      setDiscountForm({
                        ...discountForm,
                        eventIds: ids.includes(ev.id) ? ids.filter((i) => i !== ev.id) : [...ids, ev.id],
                      });
                    }}
                    className={`px-3 py-1 rounded-lg text-xs border ${
                      discountForm.eventIds.includes(ev.id) ? 'bg-accent/10 border-accent text-accent' : 'border-border'
                    }`}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleCreateDiscount} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold">
              Create Code
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-background/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Discount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Events</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Used</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discountCodes.map((dc) => (
                  <tr key={dc.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-sm">{dc.code}</td>
                    <td className="px-4 py-3 text-sm">
                      {dc.discountType === 'percent' ? `${dc.discountValue}%` : `$${dc.discountValue}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {dc.eventIds.length === 0 ? 'All events' : `${dc.eventIds.length} event(s)`}
                    </td>
                    <td className="px-4 py-3 text-sm">{dc.usedCount}{dc.maxUses ? ` / ${dc.maxUses}` : ''}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteDiscount(dc.id)} className="p-1 hover:bg-destructive/10 rounded">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {discountCodes.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No discount codes yet</p>}
          </div>
        </div>
      )}

      {tab === 'events' && (
        <>
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
                  <div>
                    <label className="block text-sm font-medium mb-2">Audience</label>
                    <select
                      value={form.audienceGender}
                      onChange={(e) => setForm({ ...form, audienceGender: e.target.value as EventAudienceGender })}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                    >
                      <option value="mixed">Open to all (Mixed)</option>
                      <option value="men">Men only</option>
                      <option value="women">Women only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleEventTag(tag.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            form.tags.includes(tag.id)
                              ? 'bg-accent/10 border-accent text-accent'
                              : 'border-border text-muted-foreground'
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
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
                    <p className="text-xs capitalize">
                      {r.paymentStatus || 'free'} · {r.status}
                      {r.discountCode && ` · Code: ${r.discountCode}`}
                    </p>
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
                {(event.tags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {event.tags!.map((tagId) => {
                      const tag = getTagById(tagId);
                      return tag ? (
                        <span key={tagId} className="px-2 py-0.5 text-xs rounded-full border" style={{ borderColor: tag.color, color: tag.color }}>
                          {tag.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{new Date(event.date).toLocaleString()}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{event.location}</div>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4" />{event.registered} registered</div>
                  {event.audienceGender && event.audienceGender !== 'mixed' && (
                    <div className="flex items-center gap-2 text-accent"><Tag className="w-4 h-4" />{getAudienceGenderLabel(event.audienceGender)}</div>
                  )}
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
        </>
      )}
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
