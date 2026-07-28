'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { EventCalendar } from '@/components/event-calendar';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Event, EventTag } from '@/lib/types';
import { canUserRegisterForEvent, getAudienceGenderLabel } from '@/lib/event-eligibility';
import { useSettings } from '@/hooks/useSettings';
import { Calendar, MapPin, Users, X, Download, ExternalLink, Tag, Percent } from 'lucide-react';
import { isSameDay, format, startOfDay, isBefore } from 'date-fns';
import { downloadIcs, googleCalendarUrl } from '@/lib/ics';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getEventDisplayPrice, getEventPath } from '@/lib/event-utils';

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <EventsContent />
    </Suspense>
  );
}

function EventsContent() {
  const { t } = useLanguage();
  const { currentUser, userData } = useAuth();
  const { authFetch } = useApiAuth();
  const { settings } = useSettings();
  const paidPlansEnabled = settings?.membershipAccess?.paidPlansEnabled === true;
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<EventTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState<string | null>(null);
  const [showCalendarOptions, setShowCalendarOptions] = useState<Event | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountPreview, setDiscountPreview] = useState<{ finalPrice: number; discountAmount: number } | null>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/events?limit=all').then((r) => r.json()),
      fetch('/api/public/event-tags').then((r) => r.json()),
    ])
      .then(([data, tagData]) => {
        setEvents(Array.isArray(data) ? data : []);
        setTags(Array.isArray(tagData) ? tagData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const regId = searchParams.get('registered');
    if (regId) {
      const ev = events.find((e) => e.id === regId);
      if (ev) {
        setRegistered(regId);
        setShowCalendarOptions(ev);
      }
    }
  }, [searchParams, events]);

  const tagMap = useMemo(() => Object.fromEntries(tags.map((tg) => [tg.id, tg])), [tags]);

  const today = useMemo(() => startOfDay(new Date()), []);

  const calendarEvents = useMemo(() => {
    let list = events;
    if (filter !== 'all') list = list.filter((e) => e.pricingType === filter);
    return list;
  }, [events, filter]);

  const filtered = useMemo(() => {
    let list = events;

    if (selectedDate) {
      list = list.filter((e) => isSameDay(new Date(e.date), selectedDate));
    } else if (timeFilter === 'upcoming') {
      list = list.filter((e) => !isBefore(startOfDay(new Date(e.date)), today));
    } else if (timeFilter === 'past') {
      list = list.filter((e) => isBefore(startOfDay(new Date(e.date)), today));
    }

    if (filter !== 'all') list = list.filter((e) => e.pricingType === filter);

    if (timeFilter === 'past' && !selectedDate) {
      return list.sort((a, b) => b.date - a.date);
    }
    return list.sort((a, b) => a.date - b.date);
  }, [events, filter, timeFilter, selectedDate, today]);

  const listHeading = selectedDate
    ? format(selectedDate, 'MMMM d, yyyy')
    : timeFilter === 'past'
      ? t('events.past', 'Past Events')
      : timeFilter === 'all'
        ? t('events.all', 'All Events')
        : t('events.upcoming', 'Upcoming Events');

  const emptyMessage = selectedDate
    ? t('events.none', 'No events on this date')
    : timeFilter === 'past'
      ? t('events.emptyPast', 'No past events')
      : timeFilter === 'all'
        ? t('events.emptyAll', 'No events found')
        : t('events.empty', 'No upcoming events');

  const handleSelectDate = (date: Date) => {
    setSelectedDate((prev) => (prev && isSameDay(date, prev) ? null : date));
  };

  const handleTimeFilterChange = (value: 'upcoming' | 'past' | 'all') => {
    setTimeFilter(value);
    setSelectedDate(null);
  };

  const getEligibility = (event: Event) =>
    canUserRegisterForEvent(userData, event, null, paidPlansEnabled);

  const handleValidateDiscount = async () => {
    if (!selectedEvent || !discountCode.trim()) return;
    setValidatingDiscount(true);
    try {
      const res = await authFetch('/api/events/validate-discount', {
        method: 'POST',
        body: JSON.stringify({
          code: discountCode.trim(),
          eventId: selectedEvent.id,
          price: selectedEvent.price,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiscountPreview({ finalPrice: data.finalPrice, discountAmount: data.discountAmount });
      } else {
        setDiscountPreview(null);
        alert(data.error || 'Invalid discount code');
      }
    } catch {
      alert('Failed to validate discount code');
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleRegister = async (event: Event) => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    const eligibility = getEligibility(event);
    if (!eligibility.allowed) {
      alert(eligibility.reason);
      return;
    }

    setRegistering(true);
    try {
      if (event.pricingType === 'paid') {
        const res = await authFetch('/api/events/checkout', {
          method: 'POST',
          body: JSON.stringify({
            eventId: event.id,
            discountCode: discountCode.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else alert(data.error || 'Checkout failed');
      } else {
        const res = await authFetch('/api/events/register', {
          method: 'POST',
          body: JSON.stringify({ eventId: event.id }),
        });
        const data = await res.json();
        if (res.ok) {
          setRegistered(event.id);
          setShowCalendarOptions(event);
        } else {
          alert(data.error || 'Registration failed');
        }
      }
    } catch {
      alert('Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const openEvent = (event: Event) => {
    setSelectedEvent(event);
    setDiscountCode('');
    setDiscountPreview(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4">{t('events.title', 'Events')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{t('events.subtitle', 'Join us for exclusive networking and learning opportunities')}</p>
          </div>
        </section>

        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex flex-wrap gap-2">
                {(['upcoming', 'past', 'all'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleTimeFilterChange(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      timeFilter === f && !selectedDate
                        ? 'bg-accent text-accent-foreground'
                        : 'border border-border hover:border-accent/50'
                    }`}
                  >
                    {t(`events.filter.${f}`, f === 'upcoming' ? 'Upcoming' : f === 'past' ? 'Past' : 'All')}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(['all', 'free', 'paid'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                      filter === f ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f === 'all' ? t('events.filter.all', 'All') : t(`events.filter.${f}`, f)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <EventCalendar
                  events={calendarEvents}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                />
              </div>

              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-heading font-bold text-lg">{listHeading}</h3>
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(null)}
                      className="text-sm text-accent font-medium hover:underline"
                    >
                      {t('events.clearDate', 'Clear date')}
                    </button>
                  )}
                </div>

                {loading ? (
                  <p className="text-muted-foreground py-8">{t('common.loading', 'Loading...')}</p>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-dashed border-border">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">{emptyMessage}</p>
                    {timeFilter === 'upcoming' && !selectedDate && (
                      <Link href="/contact" className="text-accent text-sm font-semibold mt-2 inline-block">
                        {t('events.suggest', 'Suggest an event →')}
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filtered.map((e) => (
                      <EventCard
                        key={e.id}
                        event={e}
                        tagMap={tagMap}
                        isPast={isBefore(startOfDay(new Date(e.date)), today)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-card rounded-xl border border-border max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h2 className="font-heading font-bold text-xl">{selectedEvent.title}</h2>
              <button onClick={() => setSelectedEvent(null)}><X className="w-5 h-5" /></button>
            </div>

            {(selectedEvent.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {selectedEvent.tags!.map((tagId) => {
                  const tag = tagMap[tagId];
                  return tag ? (
                    <span key={tagId} className="px-2 py-0.5 text-xs rounded-full border" style={{ borderColor: tag.color, color: tag.color }}>
                      {tag.name}
                    </span>
                  ) : null;
                })}
              </div>
            )}

            <p className="text-muted-foreground text-sm mb-4">{selectedEvent.description}</p>
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p className="flex items-center gap-2"><Calendar className="w-4 h-4" />{new Date(selectedEvent.date).toLocaleString()}</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4" />{selectedEvent.location}</p>
              <p className="flex items-center gap-2"><Users className="w-4 h-4" />{selectedEvent.registered} registered</p>
              {selectedEvent.audienceGender && selectedEvent.audienceGender !== 'mixed' && (
                <p className="flex items-center gap-2 text-accent"><Tag className="w-4 h-4" />{getAudienceGenderLabel(selectedEvent.audienceGender)}</p>
              )}
              <p className="capitalize font-medium text-accent">
                {selectedEvent.pricingType === 'paid'
                  ? discountPreview
                    ? `$${discountPreview.finalPrice} (was $${selectedEvent.price})`
                    : `$${selectedEvent.price}`
                  : 'Free'}
              </p>
            </div>

            {selectedEvent.pricingType === 'paid' && (
              <div className="mb-4 p-3 bg-background/50 rounded-lg border border-border">
                <label className="block text-sm font-medium mb-2">Discount Code (optional)</label>
                <div className="flex gap-2">
                  <input
                    value={discountCode}
                    onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountPreview(null); }}
                    placeholder="MEMBER20"
                    className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={handleValidateDiscount}
                    disabled={validatingDiscount || !discountCode.trim()}
                    className="px-3 py-2 border border-border rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <Percent className="w-3 h-3" /> Apply
                  </button>
                </div>
                {discountPreview && (
                  <p className="text-xs text-green-600 mt-2">You save ${discountPreview.discountAmount.toFixed(2)}</p>
                )}
              </div>
            )}

            {currentUser && !getEligibility(selectedEvent).allowed ? (
              <p className="text-sm text-destructive mb-4">{getEligibility(selectedEvent).reason}</p>
            ) : null}

            <button
              onClick={() => handleRegister(selectedEvent)}
              disabled={registering || registered === selectedEvent.id || (currentUser ? !getEligibility(selectedEvent).allowed : false)}
              className="w-full py-2 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50"
            >
              {registered === selectedEvent.id ? 'Registered ✓' : registering ? 'Processing...' : !currentUser ? 'Sign in to Register' : 'Register'}
            </button>
          </div>
        </div>
      )}

      {showCalendarOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border max-w-sm w-full p-6 text-center">
            <h3 className="font-heading font-bold text-lg mb-2">You&apos;re registered!</h3>
            <p className="text-sm text-muted-foreground mb-6">Add this event to your calendar</p>
            <div className="space-y-2">
              <button onClick={() => downloadIcs(showCalendarOptions)} className="w-full flex items-center justify-center gap-2 py-2 border border-border rounded-lg text-sm hover:bg-accent/10">
                <Download className="w-4 h-4" /> Download .ics
              </button>
              <a href={googleCalendarUrl(showCalendarOptions)} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-2 border border-border rounded-lg text-sm hover:bg-accent/10">
                <ExternalLink className="w-4 h-4" /> Google Calendar
              </a>
              <button onClick={() => setShowCalendarOptions(null)} className="w-full py-2 text-sm text-muted-foreground mt-2">Close</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function EventCard({
  event,
  tagMap,
  compact = false,
  isPast = false,
}: {
  event: Event;
  tagMap: Record<string, EventTag>;
  compact?: boolean;
  isPast?: boolean;
}) {
  const { t } = useLanguage();
  const price = getEventDisplayPrice(event);
  return (
    <Link
      href={getEventPath(event)}
      className={`text-left bg-card rounded-xl border border-border hover:border-accent transition-all w-full block ${compact ? 'p-4' : 'overflow-hidden'}`}
    >
      {!compact && (
        event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className="w-full h-36 object-cover" />
        ) : (
          <div className="w-full h-24 bg-gradient-to-r from-[#001F3F] to-[#B8973A]" />
        )
      )}
      <div className={compact ? '' : 'p-6'}>
        <div className="flex flex-wrap gap-1 mb-2">
          {isPast && (
            <span className="inline-block px-2 py-0.5 bg-muted text-muted-foreground text-xs font-semibold rounded">
              {t('events.pastBadge', 'Past')}
            </span>
          )}
          <span className="inline-block px-2 py-0.5 bg-accent/10 text-accent text-xs font-semibold rounded capitalize">
            {price.label}
          </span>
          {event.format && (
            <span className="inline-block px-2 py-0.5 bg-muted text-muted-foreground text-xs font-semibold rounded capitalize">
              {event.format}
            </span>
          )}
          {event.audienceGender && event.audienceGender !== 'mixed' && (
            <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-600 text-xs font-semibold rounded">
              {getAudienceGenderLabel(event.audienceGender)}
            </span>
          )}
          {event.tags?.map((tagId) => {
            const tag = tagMap[tagId];
            return tag ? (
              <span key={tagId} className="inline-block px-2 py-0.5 text-xs rounded border" style={{ borderColor: tag.color, color: tag.color }}>
                {tag.name}
              </span>
            ) : null;
          })}
        </div>
        <h3 className="font-heading font-bold mb-1 break-words">{event.title}</h3>
        {event.subtitle && !compact && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{event.subtitle}</p>
        )}
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><Calendar className="w-3 h-3" />{new Date(event.date).toLocaleDateString()}</p>
          <p className="flex items-center gap-2"><MapPin className="w-3 h-3" />{event.location || 'Location TBA'}</p>
        </div>
      </div>
    </Link>
  );
}
