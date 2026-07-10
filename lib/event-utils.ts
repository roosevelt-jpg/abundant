import { Event, EventTicketTier } from '@/lib/types';

export function slugifyEventTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function ensureUniqueSlug(base: string, existing: string[], excludeId?: string): string {
  let slug = base || 'event';
  let n = 2;
  const taken = new Set(existing);
  while (taken.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export function getEventDisplayPrice(event: Event): { label: string; amount: number } {
  const tiers = (event.ticketTiers || []).filter((t) => t.name.trim());
  if (tiers.length > 0) {
    const prices = tiers.map((t) => t.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === 0 && max === 0) return { label: 'Free', amount: 0 };
    if (min === max) return { label: `$${min}`, amount: min };
    return { label: `From $${min}`, amount: min };
  }
  if (event.pricingType === 'free' || !event.price) return { label: 'Free', amount: 0 };
  return { label: `$${event.price}`, amount: event.price };
}

export function getEffectiveTicketTiers(event: Event): EventTicketTier[] {
  const tiers = (event.ticketTiers || []).filter((t) => t.name.trim());
  if (tiers.length > 0) return tiers;
  if (event.pricingType === 'paid' && event.price != null) {
    return [{ id: 'general', name: 'General Admission', price: event.price, sold: event.registered }];
  }
  return [{ id: 'general', name: 'RSVP', price: 0, sold: event.registered }];
}

export function isEventFull(event: Event): boolean {
  if (!event.capacity) return false;
  return (event.registered || 0) >= event.capacity;
}

export function formatEventWhen(event: Event): string {
  const start = new Date(event.date);
  const end = event.endDate ? new Date(event.endDate) : null;
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const startDate = start.toLocaleDateString(undefined, dateOpts);
  const startTime = start.toLocaleTimeString(undefined, timeOpts);
  if (!end) return `${startDate} · ${startTime}`;
  const sameDay = start.toDateString() === end.toDateString();
  const endTime = end.toLocaleTimeString(undefined, timeOpts);
  if (sameDay) return `${startDate} · ${startTime} – ${endTime}`;
  return `${startDate} ${startTime} – ${end.toLocaleDateString(undefined, dateOpts)} ${endTime}`;
}

export function getEventPath(event: Event): string {
  return `/events/${event.slug || event.id}`;
}
