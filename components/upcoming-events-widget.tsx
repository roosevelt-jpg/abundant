'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Event } from '@/lib/types';

export function UpcomingEventsWidget() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      if (response.ok) {
        const data: Event[] = await response.json();
        
        // Filter published and upcoming events
        const now = new Date();
        const upcomingEvents = data
          .filter(e => e.isPublic && new Date(e.date) >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 4);
        
        setEvents(upcomingEvents);
      }
    } catch (error) {
      console.error('[v0] Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground">Loading events...</p>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Upcoming Events</h2>
            <p className="text-lg text-muted-foreground">Join our community for exclusive networking and learning opportunities</p>
          </div>
          <Link href="/events" className="hidden sm:flex items-center gap-2 text-accent hover:gap-3 transition-all font-semibold">
            View All <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {events.map((event) => {
            const eventDate = new Date(event.date);
            const isToday = eventDate.toDateString() === new Date().toDateString();
            const isSoon = (eventDate.getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000;
            
            return (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="h-full p-6 bg-background rounded-xl border border-border hover:border-accent transition-all hover:shadow-lg">
                  {/* Event Status Badge */}
                  <div className="flex gap-2 mb-4">
                    {isToday && (
                      <span className="px-3 py-1 bg-red-500/20 text-red-600 text-xs font-bold rounded-full">
                        TODAY
                      </span>
                    )}
                    {isSoon && !isToday && (
                      <span className="px-3 py-1 bg-accent/20 text-accent text-xs font-bold rounded-full">
                        COMING SOON
                      </span>
                    )}
                  </div>

                  {/* Event Title */}
                  <h3 className="font-heading font-bold text-lg mb-3 line-clamp-2 hover:text-accent transition-colors">
                    {event.title}
                  </h3>

                  {/* Event Type Badge */}
                  {event.eventType && (
                    <p className="text-xs font-semibold text-accent mb-3 uppercase tracking-wide">
                      {event.eventType}
                    </p>
                  )}

                  {/* Event Details */}
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}

                    {event.attendees && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{event.attendees.length} registered</span>
                      </div>
                    )}
                  </div>

                  {/* Event Description */}
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {event.description}
                    </p>
                  )}

                  {/* CTA */}
                  <div className="pt-4 border-t border-border">
                    <span className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors flex items-center gap-2">
                      View Details <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile View All Link */}
        <div className="sm:hidden text-center">
          <Link href="/events" className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-semibold">
            View All Events <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
