'use client';

/**
 * Enhanced Luma-style event admin editor.
 * Keeps tags/discounts tabs; expands event create/edit + guest check-in.
 */

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Users,
  X,
  DollarSign,
  Tag,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
  checkInAttendee,
  updateRegistrationStatus,
} from '@/lib/events-service';
import { deleteField } from 'firebase/firestore';
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
import {
  Event,
  EventRegistration,
  EventTag,
  EventDiscountCode,
  EventAudienceGender,
  EventFormat,
  EventRegistrationMode,
  EventTicketTier,
  EventHost,
} from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { PlacesAutocomplete } from '@/components/places-autocomplete';
import { ImageUpload } from '@/components/image-upload';
import { getAudienceGenderLabel } from '@/lib/event-eligibility';
import { ensureUniqueSlug, getEventPath, slugifyEventTitle } from '@/lib/event-utils';
import { generateRecurrenceStarts, recurrenceLabel } from '@/lib/event-recurrence';
import { useApiAuth } from '@/hooks/useApiAuth';
import Link from 'next/link';
import type { EventRecurrenceFrequency, EventInvite } from '@/lib/types';

type Tab = 'events' | 'tags' | 'discounts';

type EventFormState = {
  title: string;
  subtitle: string;
  description: string;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
  location: string;
  virtualLink: string;
  format: EventFormat;
  capacity: number;
  enableWaitlist: boolean;
  pricingType: 'free' | 'paid';
  price: number;
  currency: string;
  category: Event['category'];
  status: Event['status'];
  isPublic: boolean;
  registrationMode: EventRegistrationMode;
  showGuestList: boolean;
  audienceGender: EventAudienceGender;
  tags: string[];
  imageUrl: string;
  ticketTiers: EventTicketTier[];
  hosts: EventHost[];
  agenda: { id: string; time: string; title: string; speaker: string }[];
  speakers: { id: string; name: string; title: string; bio: string }[];
  recurrenceFrequency: EventRecurrenceFrequency;
  recurrenceCount: number;
};

const EMPTY_EVENT: EventFormState = {
  title: '',
  subtitle: '',
  description: '',
  date: '',
  time: '09:00',
  endDate: '',
  endTime: '11:00',
  location: '',
  virtualLink: '',
  format: 'in-person',
  capacity: 100,
  enableWaitlist: true,
  pricingType: 'free',
  price: 0,
  currency: 'usd',
  category: 'networking',
  status: 'upcoming',
  isPublic: true,
  registrationMode: 'open',
  showGuestList: false,
  audienceGender: 'mixed',
  tags: [],
  imageUrl: '',
  ticketTiers: [],
  hosts: [],
  agenda: [],
  speakers: [],
  recurrenceFrequency: 'none',
  recurrenceCount: 4,
};

function toLocalDate(ms: number) {
  return new Date(ms).toISOString().split('T')[0];
}
function toLocalTime(ms: number) {
  return new Date(ms).toTimeString().slice(0, 5);
}
function combineDateTime(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime();
}

export default function AdminEventsEditor() {
  const { userData } = useAuth();
  const { authFetch } = useApiAuth();
  const [tab, setTab] = useState<Tab>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<EventTag[]>([]);
  const [discountCodes, setDiscountCodes] = useState<EventDiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(EMPTY_EVENT);
  const [registrants, setRegistrants] = useState<EventRegistration[]>([]);
  const [viewRegistrants, setViewRegistrants] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [invites, setInvites] = useState<EventInvite[]>([]);
  const [inviteSending, setInviteSending] = useState(false);
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInMessage, setCheckInMessage] = useState('');

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
      const [ev, tg, dc] = await Promise.all([getAllEvents(), getAllEventTags(), getAllDiscountCodes()]);
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
    setEditingId(event.id);
    setForm({
      title: event.title,
      subtitle: event.subtitle || '',
      description: event.description,
      date: toLocalDate(event.date),
      time: toLocalTime(event.date),
      endDate: event.endDate ? toLocalDate(event.endDate) : '',
      endTime: event.endDate ? toLocalTime(event.endDate) : '11:00',
      location: event.location,
      virtualLink: event.virtualLink || '',
      format: event.format || (event.virtualLink ? 'hybrid' : 'in-person'),
      capacity: event.capacity || 100,
      enableWaitlist: event.enableWaitlist !== false,
      pricingType: event.pricingType || 'free',
      price: event.price || 0,
      currency: event.currency || 'usd',
      category: event.category || 'networking',
      status: event.status || 'upcoming',
      isPublic: event.isPublic !== false,
      registrationMode: event.registrationMode || 'open',
      showGuestList: !!event.showGuestList,
      audienceGender: event.audienceGender || 'mixed',
      tags: event.tags || [],
      imageUrl: event.imageUrl || '',
      ticketTiers: event.ticketTiers || [],
      hosts: event.hosts || [],
      agenda: (event.agenda || []).map((a, i) => ({
        id: a.id || `ag-${i}`,
        time: a.time,
        title: a.title,
        speaker: a.speaker || '',
      })),
      speakers: (event.speakers || []).map((s, i) => ({
        id: s.id || `sp-${i}`,
        name: s.name,
        title: s.title || '',
        bio: s.bio || '',
      })),
      recurrenceFrequency: 'none',
      recurrenceCount: event.recurrence?.count || 4,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.date) {
      alert('Please fill in title and date');
      return;
    }

    setSaving(true);
    try {
      const dateMs = combineDateTime(form.date, form.time);
      const endMs =
        form.endDate && form.endTime ? combineDateTime(form.endDate, form.endTime) : undefined;

      const baseSlug = slugifyEventTitle(form.title);
      const existingSlugs = events
        .filter((e) => e.id !== editingId)
        .map((e) => e.slug || '')
        .filter(Boolean);
      const slug = ensureUniqueSlug(baseSlug, existingSlugs);

      const hasTiers = form.ticketTiers.some((t) => t.name.trim());
      const pricingType = hasTiers
        ? form.ticketTiers.some((t) => t.price > 0)
          ? 'paid'
          : 'free'
        : form.pricingType;

      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        slug,
        subtitle: form.subtitle.trim() || '',
        description: form.description,
        date: dateMs,
        location: form.location,
        format: form.format,
        capacity: form.capacity,
        enableWaitlist: form.enableWaitlist,
        pricingType,
        currency: form.currency,
        category: form.category,
        status: form.status,
        isPublic: form.isPublic,
        registrationMode: form.registrationMode,
        showGuestList: form.showGuestList,
        audienceGender: form.audienceGender,
        tags: form.tags,
        imageUrl: form.imageUrl || '',
        ticketTiers: form.ticketTiers.filter((t) => t.name.trim()),
        hosts: form.hosts.filter((h) => h.name.trim()),
        agenda: form.agenda.filter((a) => a.title.trim()),
        speakers: form.speakers.filter((s) => s.name.trim()),
        createdBy: userData?.uid || 'admin',
      };

      if (endMs) payload.endDate = endMs;
      else if (editingId) payload.endDate = deleteField();

      if (form.virtualLink.trim()) payload.virtualLink = form.virtualLink.trim();
      else if (editingId) payload.virtualLink = deleteField();

      if (!hasTiers && pricingType === 'paid') payload.price = form.price;
      else if (editingId && !hasTiers && pricingType === 'free') payload.price = deleteField();

      if (editingId) {
        await updateEvent(editingId, payload as Parameters<typeof updateEvent>[1]);
      } else {
        const recurrence =
          form.recurrenceFrequency !== 'none'
            ? { frequency: form.recurrenceFrequency, count: form.recurrenceCount }
            : undefined;
        const starts = generateRecurrenceStarts(dateMs, {
          frequency: form.recurrenceFrequency,
          count: form.recurrenceCount,
        });
        const seriesId = starts.length > 1 ? `series-${Date.now()}` : undefined;
        const duration = endMs && endMs > dateMs ? endMs - dateMs : undefined;

        for (let i = 0; i < starts.length; i++) {
          const start = starts[i];
          const occSlug =
            i === 0 ? slug : ensureUniqueSlug(`${baseSlug}-${i + 1}`, [...existingSlugs, slug]);
          existingSlugs.push(occSlug);
          await createEvent({
            ...(payload as Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registered'>),
            slug: occSlug,
            date: start,
            endDate: duration ? start + duration : undefined,
            waitlistCount: 0,
            seriesId,
            seriesIndex: i,
            recurrence: i === 0 ? recurrence : undefined,
          });
        }
      }
      await loadAll();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving event:', err);
      alert(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await deleteEvent(id);
    await loadAll();
  };

  const viewEventRegistrants = async (eventId: string) => {
    const regs = await getEventRegistrations(eventId);
    setRegistrants(regs.sort((a, b) => b.registeredAt - a.registeredAt));
    setViewRegistrants(eventId);
    setCheckInInput('');
    setCheckInMessage('');
    setInviteEmails('');
    try {
      const res = await authFetch(`/api/admin/events/invites?eventId=${eventId}`);
      if (res.ok) setInvites(await res.json());
      else setInvites([]);
    } catch {
      setInvites([]);
    }
  };

  const handleSendInvites = async () => {
    if (!viewRegistrants || !inviteEmails.trim()) return;
    setInviteSending(true);
    try {
      const res = await authFetch('/api/admin/events/invites', {
        method: 'POST',
        body: JSON.stringify({ eventId: viewRegistrants, emails: inviteEmails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setInviteEmails('');
      setCheckInMessage(`Sent ${data.sent} invite(s)${data.errors?.length ? ` · ${data.errors.length} failed` : ''}`);
      const list = await authFetch(`/api/admin/events/invites?eventId=${viewRegistrants}`);
      if (list.ok) setInvites(await list.json());
    } catch (err) {
      setCheckInMessage(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setInviteSending(false);
    }
  };

  const handleDoorCheckIn = async () => {
    if (!viewRegistrants || !checkInInput.trim()) return;
    try {
      const res = await authFetch('/api/admin/events/check-in', {
        method: 'POST',
        body: JSON.stringify({ eventId: viewRegistrants, qrPayload: checkInInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check-in failed');
      setCheckInMessage(data.message || 'Checked in');
      setCheckInInput('');
      await viewEventRegistrants(viewRegistrants);
    } catch (err) {
      setCheckInMessage(err instanceof Error ? err.message : 'Check-in failed');
    }
  };

  const handleCheckIn = async (regId: string) => {
    await checkInAttendee(regId);
    if (viewRegistrants) await viewEventRegistrants(viewRegistrants);
  };

  const handleApprove = async (reg: EventRegistration) => {
    await updateRegistrationStatus(reg.id, 'registered');
    if (viewRegistrants) {
      const ev = events.find((e) => e.id === viewRegistrants);
      if (ev && reg.status === 'pending') {
        await updateEvent(viewRegistrants, { registered: (ev.registered || 0) + 1 });
      }
      if (ev && reg.status === 'waitlisted') {
        await updateEvent(viewRegistrants, {
          registered: (ev.registered || 0) + 1,
          waitlistCount: Math.max(0, (ev.waitlistCount || 1) - 1),
        });
      }
      await loadAll();
      await viewEventRegistrants(viewRegistrants);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await createEventTag(newTagName.trim());
    setNewTagName('');
    setTags(await getAllEventTags());
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Delete this tag?')) return;
    await deleteEventTag(id);
    setTags(await getAllEventTags());
  };

  const toggleEventTag = (tagId: string) => {
    setForm({
      ...form,
      tags: form.tags.includes(tagId) ? form.tags.filter((t) => t !== tagId) : [...form.tags, tagId],
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
    setDiscountCodes(await getAllDiscountCodes());
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Delete this discount code?')) return;
    await deleteDiscountCode(id);
    setDiscountCodes(await getAllDiscountCodes());
  };

  const getTagById = (id: string) => tags.find((t) => t.id === id);

  if (loading) return <div className="text-center py-12">Loading events...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">
            Create Luma-style event pages with tickets, waitlists, hosts, agenda, and guest check-in
          </p>
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
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border"
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
                    <td className="px-4 py-3 text-sm">
                      {dc.usedCount}
                      {dc.maxUses ? ` / ${dc.maxUses}` : ''}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteDiscount(dc.id)} className="p-1 hover:bg-destructive/10 rounded">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'events' && (
        <>
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-card rounded-xl border border-border max-w-3xl w-full p-6 my-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-bold text-lg">{editingId ? 'Edit Event' : 'Create Event'}</h2>
                  <button type="button" onClick={() => setShowModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">Basics</h3>
                    <ImageUpload
                      value={form.imageUrl}
                      onChange={(v) => setForm({ ...form, imageUrl: v })}
                      folder="events"
                      label="Cover image"
                      maxWidth={1600}
                      maxHeight={900}
                    />
                    <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
                    <Input label="Subtitle" value={form.subtitle} onChange={(v) => setForm({ ...form, subtitle: v })} />
                    <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Input label="Start date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
                      <Input label="Start time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
                      <Input label="End date" type="date" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
                      <Input label="End time" type="time" value={form.endTime} onChange={(v) => setForm({ ...form, endTime: v })} />
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">Location & format</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Format</label>
                        <select
                          value={form.format}
                          onChange={(e) => setForm({ ...form, format: e.target.value as EventFormat })}
                          className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                        >
                          <option value="in-person">In person</option>
                          <option value="virtual">Virtual</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value as Event['category'] })}
                          className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                        >
                          <option value="networking">Networking</option>
                          <option value="workshop">Workshop</option>
                          <option value="webinar">Webinar</option>
                          <option value="conference">Conference</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <PlacesAutocomplete
                      label="Location"
                      value={form.location}
                      onChange={(v) => setForm({ ...form, location: v })}
                      types={['establishment', 'geocode']}
                      placeholder="Search venue or address..."
                    />
                    {(form.format === 'virtual' || form.format === 'hybrid') && (
                      <Input label="Virtual link" value={form.virtualLink} onChange={(v) => setForm({ ...form, virtualLink: v })} />
                    )}
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">Registration</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Registration mode</label>
                        <select
                          value={form.registrationMode}
                          onChange={(e) => setForm({ ...form, registrationMode: e.target.value as EventRegistrationMode })}
                          className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                        >
                          <option value="open">Open RSVP</option>
                          <option value="approval">Require approval</option>
                          <option value="invite_only">Invite only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value as Event['status'] })}
                          className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                        >
                          <option value="draft">Draft</option>
                          <option value="upcoming">Published</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input label="Capacity" type="number" value={String(form.capacity)} onChange={(v) => setForm({ ...form, capacity: parseInt(v) || 0 })} />
                      <div>
                        <label className="block text-sm font-medium mb-2">Audience</label>
                        <select
                          value={form.audienceGender}
                          onChange={(e) => setForm({ ...form, audienceGender: e.target.value as EventAudienceGender })}
                          className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                        >
                          <option value="mixed">Open to all</option>
                          <option value="men">Men only</option>
                          <option value="women">Women only</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
                        Public event
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={form.enableWaitlist} onChange={(e) => setForm({ ...form, enableWaitlist: e.target.checked })} />
                        Enable waitlist when full
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={form.showGuestList} onChange={(e) => setForm({ ...form, showGuestList: e.target.checked })} />
                        Show guest list publicly
                      </label>
                    </div>
                    {!editingId && (
                      <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-muted/20">
                        <div>
                          <label className="block text-sm font-medium mb-2">Repeat</label>
                          <select
                            value={form.recurrenceFrequency}
                            onChange={(e) =>
                              setForm({ ...form, recurrenceFrequency: e.target.value as EventRecurrenceFrequency })
                            }
                            className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                          >
                            <option value="none">Does not repeat</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Every 2 weeks</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        {form.recurrenceFrequency !== 'none' && (
                          <Input
                            label="Number of events"
                            type="number"
                            value={String(form.recurrenceCount)}
                            onChange={(v) =>
                              setForm({ ...form, recurrenceCount: Math.min(52, Math.max(2, parseInt(v) || 2)) })
                            }
                          />
                        )}
                        {form.recurrenceFrequency !== 'none' && (
                          <p className="sm:col-span-2 text-xs text-muted-foreground">
                            Creates {form.recurrenceCount} linked events (
                            {recurrenceLabel({ frequency: form.recurrenceFrequency, count: form.recurrenceCount })})
                          </p>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-2">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleEventTag(tag.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              form.tags.includes(tag.id) ? 'bg-accent/10 border-accent text-accent' : 'border-border'
                            }`}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">Tickets</h3>
                      <button
                        type="button"
                        className="text-xs text-accent"
                        onClick={() =>
                          setForm({
                            ...form,
                            ticketTiers: [
                              ...form.ticketTiers,
                              { id: `tier-${Date.now()}`, name: '', description: '', price: 0 },
                            ],
                          })
                        }
                      >
                        + Add tier
                      </button>
                    </div>
                    {form.ticketTiers.length === 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">Type</label>
                          <select
                            value={form.pricingType}
                            onChange={(e) => setForm({ ...form, pricingType: e.target.value as 'free' | 'paid' })}
                            className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                          >
                            <option value="free">Free RSVP</option>
                            <option value="paid">Single paid ticket</option>
                          </select>
                        </div>
                        {form.pricingType === 'paid' && (
                          <Input label="Price ($)" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: parseFloat(v) || 0 })} />
                        )}
                      </div>
                    ) : (
                      form.ticketTiers.map((tier, i) => (
                        <div key={tier.id} className="p-3 border border-border rounded-lg space-y-2 relative">
                          <button
                            type="button"
                            className="absolute top-2 right-2"
                            onClick={() => setForm({ ...form, ticketTiers: form.ticketTiers.filter((t) => t.id !== tier.id) })}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                          <Input
                            label="Tier name"
                            value={tier.name}
                            onChange={(v) => {
                              const next = [...form.ticketTiers];
                              next[i] = { ...tier, name: v };
                              setForm({ ...form, ticketTiers: next });
                            }}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              label="Price ($)"
                              type="number"
                              value={String(tier.price)}
                              onChange={(v) => {
                                const next = [...form.ticketTiers];
                                next[i] = { ...tier, price: parseFloat(v) || 0 };
                                setForm({ ...form, ticketTiers: next });
                              }}
                            />
                            <Input
                              label="Description"
                              value={tier.description || ''}
                              onChange={(v) => {
                                const next = [...form.ticketTiers];
                                next[i] = { ...tier, description: v };
                                setForm({ ...form, ticketTiers: next });
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">Hosts</h3>
                      <button
                        type="button"
                        className="text-xs text-accent"
                        onClick={() =>
                          setForm({
                            ...form,
                            hosts: [...form.hosts, { id: `host-${Date.now()}`, name: '', title: '', bio: '' }],
                          })
                        }
                      >
                        + Add host
                      </button>
                    </div>
                    {form.hosts.map((host, i) => (
                      <div key={host.id} className="p-3 border border-border rounded-lg space-y-2">
                        <Input
                          label="Name"
                          value={host.name}
                          onChange={(v) => {
                            const next = [...form.hosts];
                            next[i] = { ...host, name: v };
                            setForm({ ...form, hosts: next });
                          }}
                        />
                        <Input
                          label="Title"
                          value={host.title || ''}
                          onChange={(v) => {
                            const next = [...form.hosts];
                            next[i] = { ...host, title: v };
                            setForm({ ...form, hosts: next });
                          }}
                        />
                        <Input
                          label="Bio"
                          value={host.bio || ''}
                          onChange={(v) => {
                            const next = [...form.hosts];
                            next[i] = { ...host, bio: v };
                            setForm({ ...form, hosts: next });
                          }}
                          textarea
                        />
                        <div className="grid sm:grid-cols-2 gap-2">
                          <Input
                            label="Email"
                            value={host.email || ''}
                            onChange={(v) => {
                              const next = [...form.hosts];
                              next[i] = { ...host, email: v };
                              setForm({ ...form, hosts: next });
                            }}
                          />
                          <Input
                            label="Website"
                            value={host.website || ''}
                            onChange={(v) => {
                              const next = [...form.hosts];
                              next[i] = { ...host, website: v };
                              setForm({ ...form, hosts: next });
                            }}
                          />
                          <Input
                            label="LinkedIn"
                            value={host.linkedin || ''}
                            onChange={(v) => {
                              const next = [...form.hosts];
                              next[i] = { ...host, linkedin: v };
                              setForm({ ...form, hosts: next });
                            }}
                          />
                          <Input
                            label="X / Twitter"
                            value={host.twitter || ''}
                            onChange={(v) => {
                              const next = [...form.hosts];
                              next[i] = { ...host, twitter: v };
                              setForm({ ...form, hosts: next });
                            }}
                          />
                          <Input
                            label="Instagram"
                            value={host.instagram || ''}
                            onChange={(v) => {
                              const next = [...form.hosts];
                              next[i] = { ...host, instagram: v };
                              setForm({ ...form, hosts: next });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">Agenda</h3>
                      <button
                        type="button"
                        className="text-xs text-accent"
                        onClick={() =>
                          setForm({
                            ...form,
                            agenda: [...form.agenda, { id: `ag-${Date.now()}`, time: '09:00', title: '', speaker: '' }],
                          })
                        }
                      >
                        + Add item
                      </button>
                    </div>
                    {form.agenda.map((item, i) => (
                      <div key={item.id} className="grid grid-cols-3 gap-2">
                        <Input
                          label="Time"
                          value={item.time}
                          onChange={(v) => {
                            const next = [...form.agenda];
                            next[i] = { ...item, time: v };
                            setForm({ ...form, agenda: next });
                          }}
                        />
                        <Input
                          label="Title"
                          value={item.title}
                          onChange={(v) => {
                            const next = [...form.agenda];
                            next[i] = { ...item, title: v };
                            setForm({ ...form, agenda: next });
                          }}
                        />
                        <Input
                          label="Speaker"
                          value={item.speaker}
                          onChange={(v) => {
                            const next = [...form.agenda];
                            next[i] = { ...item, speaker: v };
                            setForm({ ...form, agenda: next });
                          }}
                        />
                      </div>
                    ))}
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">Speakers</h3>
                      <button
                        type="button"
                        className="text-xs text-accent"
                        onClick={() =>
                          setForm({
                            ...form,
                            speakers: [...form.speakers, { id: `sp-${Date.now()}`, name: '', title: '', bio: '' }],
                          })
                        }
                      >
                        + Add speaker
                      </button>
                    </div>
                    {form.speakers.map((sp, i) => (
                      <div key={sp.id} className="p-3 border border-border rounded-lg space-y-2">
                        <Input
                          label="Name"
                          value={sp.name}
                          onChange={(v) => {
                            const next = [...form.speakers];
                            next[i] = { ...sp, name: v };
                            setForm({ ...form, speakers: next });
                          }}
                        />
                        <Input
                          label="Title"
                          value={sp.title}
                          onChange={(v) => {
                            const next = [...form.speakers];
                            next[i] = { ...sp, title: v };
                            setForm({ ...form, speakers: next });
                          }}
                        />
                        <Input
                          label="Bio"
                          value={sp.bio}
                          onChange={(v) => {
                            const next = [...form.speakers];
                            next[i] = { ...sp, bio: v };
                            setForm({ ...form, speakers: next });
                          }}
                          textarea
                        />
                      </div>
                    ))}
                  </section>
                </div>

                <div className="flex gap-3 pt-4 mt-4 border-t border-border">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save event'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {viewRegistrants && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg border border-border max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between mb-4">
                  <h2 className="font-heading font-bold">Guests ({registrants.length})</h2>
                  <button type="button" onClick={() => setViewRegistrants(null)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4 p-3 rounded-lg border border-border space-y-2">
                  <p className="text-sm font-semibold">Door check-in (QR / code)</p>
                  <div className="flex gap-2">
                    <input
                      value={checkInInput}
                      onChange={(e) => setCheckInInput(e.target.value)}
                      placeholder="Scan QR or paste AGC|eventId|CODE"
                      className="flex-1 px-3 py-2 text-sm bg-input border border-border rounded-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleDoorCheckIn}
                      className="px-3 py-2 text-sm bg-accent text-accent-foreground rounded-lg font-semibold"
                    >
                      Check in
                    </button>
                  </div>
                </div>

                <div className="mb-4 p-3 rounded-lg border border-border space-y-2">
                  <p className="text-sm font-semibold">Email invites</p>
                  <textarea
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    rows={3}
                    placeholder="guest@email.com, another@email.com"
                    className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg"
                  />
                  <button
                    type="button"
                    disabled={inviteSending}
                    onClick={handleSendInvites}
                    className="px-3 py-2 text-sm border border-accent text-accent rounded-lg disabled:opacity-50"
                  >
                    {inviteSending ? 'Sending...' : 'Send invites'}
                  </button>
                  {invites.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-1 max-h-28 overflow-y-auto">
                      {invites.map((inv) => (
                        <p key={inv.id}>
                          {inv.email} · {inv.code} · {inv.status}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {checkInMessage && <p className="text-xs mb-3 text-accent">{checkInMessage}</p>}

                {registrants.map((r) => (
                  <div key={r.id} className="p-3 border-b border-border text-sm flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{r.userName}</p>
                      <p className="text-muted-foreground">{r.userEmail}</p>
                      <p className="text-xs capitalize">
                        {r.status}
                        {r.ticketTierName ? ` · ${r.ticketTierName}` : ''}
                        {r.checkInCode ? ` · code ${r.checkInCode}` : ''}
                        {r.checkInTime ? ` · checked in ${new Date(r.checkInTime).toLocaleTimeString()}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(r.status === 'pending' || r.status === 'waitlisted') && (
                        <button
                          type="button"
                          onClick={() => handleApprove(r)}
                          className="px-2 py-1 text-xs border border-accent text-accent rounded"
                        >
                          Approve
                        </button>
                      )}
                      {(r.status === 'registered' || r.status === 'attended') && !r.checkInTime && (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(r.id)}
                          className="px-2 py-1 text-xs bg-accent text-accent-foreground rounded flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Check in
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {registrants.length === 0 && <p className="text-muted-foreground text-sm">No guests yet</p>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {event.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.imageUrl} alt="" className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-20 bg-gradient-to-r from-[#001F3F] to-[#B8973A]" />
                )}
                <div className="p-5">
                  <div className="flex justify-between mb-2 gap-2">
                    <h3 className="font-heading font-bold text-lg">{event.title}</h3>
                    <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-semibold rounded capitalize h-fit">
                      {event.status}
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
                  <div className="space-y-1.5 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.date).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location || 'TBA'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {event.registered}
                      {event.capacity ? ` / ${event.capacity}` : ''} · waitlist {event.waitlistCount || 0}
                    </div>
                    {event.pricingType === 'paid' && event.price != null && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />${event.price}
                      </div>
                    )}
                    {event.audienceGender && event.audienceGender !== 'mixed' && (
                      <div className="flex items-center gap-2 text-accent">
                        <Tag className="w-4 h-4" />
                        {getAudienceGenderLabel(event.audienceGender)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openEdit(event)} className="flex-1 min-w-[90px] p-2 border border-border rounded-lg text-sm flex items-center justify-center gap-1">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button type="button" onClick={() => viewEventRegistrants(event.id)} className="flex-1 min-w-[90px] p-2 border border-border rounded-lg text-sm">
                      Guests
                    </button>
                    <Link href={getEventPath(event)} target="_blank" className="p-2 border border-border rounded-lg text-sm flex items-center gap-1">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button type="button" onClick={() => handleDelete(event.id)} className="p-2 border border-destructive/20 rounded-lg text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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

function Input({
  label,
  value,
  onChange,
  type = 'text',
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
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
