'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Calendar, MapPin, Users, Zap, Heart } from 'lucide-react';
import Link from 'next/link';
import type { Event } from '@/lib/types';

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [filterType, setFilterType] = useState<'all' | 'in-person' | 'online' | 'hybrid'>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      if (response.ok) {
        const data: Event[] = await response.json();
        // Filter only published events
        const publishedEvents = data.filter(e => e.isPublic);
        setEvents(publishedEvents);
        filterEventsList(publishedEvents, 'upcoming', 'all');
      }
    } catch (error) {
      console.error('[v0] Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEventsList = (eventsList: Event[], status: 'all' | 'upcoming' | 'past', type: 'all' | 'in-person' | 'online' | 'hybrid') => {
    let filtered = eventsList;

    // Filter by status
    const now = new Date();
    if (status === 'upcoming') {
      filtered = filtered.filter(e => new Date(e.date) >= now);
    } else if (status === 'past') {
      filtered = filtered.filter(e => new Date(e.date) < now);
    }

    // Filter by type
    if (type !== 'all') {
      filtered = filtered.filter(e => e.eventType === type);
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setFilteredEvents(filtered);
  };

  const handleStatusFilter = (status: 'all' | 'upcoming' | 'past') => {
    setFilterStatus(status);
    filterEventsList(events, status, filterType);
  };

  const handleTypeFilter = (type: 'all' | 'in-person' | 'online' | 'hybrid') => {
    setFilterType(type);
    filterEventsList(events, filterStatus, type);
  };

  const getEventTypeColor = (type?: string) => {
    switch (type) {
      case 'in-person':
        return 'bg-blue-500/10 text-blue-600';
      case 'online':
        return 'bg-purple-500/10 text-purple-600';
      case 'hybrid':
        return 'bg-green-500/10 text-green-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getRegistrationBadge = (type?: string, price?: number) => {
    if (type === 'paid' && price && price > 0) {
      return { text: `$${price}`, color: 'bg-orange-500/10 text-orange-600' };
    } else if (type === 'rsvp') {
      return { text: 'RSVP', color: 'bg-indigo-500/10 text-indigo-600' };
    }
    return { text: 'Free', color: 'bg-green-500/10 text-green-600' };
  };

  const upcomingEvents = filteredEvents.length > 0 ? filteredEvents.slice(0, 3) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">Events</h1>
            <p className="text-lg text-muted-foreground">Join us for exclusive networking and learning opportunities</p>
          </div>
        </section>

        {/* Filter Section */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Event Status</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleStatusFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterStatus === 'all'
                        ? 'bg-accent text-accent-foreground'
                        : 'border border-border hover:bg-accent/10'
                    }`}
                  >
                    All Events
                  </button>
                  <button
                    onClick={() => handleStatusFilter('upcoming')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterStatus === 'upcoming'
                        ? 'bg-accent text-accent-foreground'
                        : 'border border-border hover:bg-accent/10'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => handleStatusFilter('past')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterStatus === 'past'
                        ? 'bg-accent text-accent-foreground'
                        : 'border border-border hover:bg-accent/10'
                    }`}
                  >
                    Past Events
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Event Type</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleTypeFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === 'all'
                        ? 'bg-accent text-accent-foreground'
                        : 'border border-border hover:bg-accent/10'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => handleTypeFilter('in-person')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === 'in-person'
                        ? 'bg-blue-600 text-white'
                        : 'border border-border hover:bg-blue-500/10'
                    }`}
                  >
                    In-Person
                  </button>
                  <button
                    onClick={() => handleTypeFilter('online')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === 'online'
                        ? 'bg-purple-600 text-white'
                        : 'border border-border hover:bg-purple-500/10'
                    }`}
                  >
                    Online
                  </button>
                  <button
                    onClick={() => handleTypeFilter('hybrid')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === 'hybrid'
                        ? 'bg-green-600 text-white'
                        : 'border border-border hover:bg-green-500/10'
                    }`}
                  >
                    Hybrid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Events Grid */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-xl border border-border animate-pulse h-80"></div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No events found matching your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => {
                  const regBadge = getRegistrationBadge(event.registrationType, event.price);
                  return (
                    <div key={event.id} className="bg-card rounded-xl border border-border hover:border-accent/50 transition-all overflow-hidden flex flex-col">
                      <div className="p-6 bg-accent/10 text-center text-5xl h-24 flex items-center justify-center">
                        {event.category === 'networking' && '🤝'}
                        {event.category === 'workshop' && '🛠️'}
                        {event.category === 'webinar' && '💻'}
                        {event.category === 'conference' && '🎤'}
                        {event.category === 'other' && '🎯'}
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <span className={`inline-block px-3 py-1 ${getEventTypeColor(event.eventType)} text-xs font-semibold rounded-full`}>
                            {event.eventType === 'in-person' ? '📍 In-Person' : event.eventType === 'online' ? '🌐 Online' : '🌍 Hybrid'}
                          </span>
                          <span className={`inline-block px-3 py-1 ${regBadge.color} text-xs font-semibold rounded-full`}>
                            {regBadge.text}
                          </span>
                          {event.genderRestriction !== 'mixed' && (
                            <span className="inline-block px-3 py-1 bg-pink-500/10 text-pink-600 text-xs font-semibold rounded-full">
                              {event.genderRestriction === 'men-only' ? '👨 Men Only' : '👩 Women Only'}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-heading text-lg font-bold mb-2">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                        
                        <div className="space-y-3 mb-6 text-sm text-muted-foreground flex-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            {new Date(event.date).toLocaleDateString()} {event.time && `at ${event.time}`}
                          </div>
                          {event.location && event.eventType !== 'online' && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              {event.location}
                            </div>
                          )}
                          {event.expectedAttendees && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 flex-shrink-0" />
                              {event.registrations || 0} / {event.expectedAttendees} registered
                            </div>
                          )}
                        </div>

                        <Link
                          href={`/events/${event.id}`}
                          className="w-full py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold text-center"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
