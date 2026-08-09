'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { EventCalendar } from '@/components/event-calendar';
import { useLanguage } from '@/context/LanguageContext';
import { Event, EventTag } from '@/lib/types';
import { getAudienceGenderLabel } from '@/lib/event-eligibility';
import { Calendar, MapPin } from 'lucide-react';
import { isSameDay, format, startOfDay, isBefore } from 'date-fns';
import Link from 'next/link';
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
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<EventTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
