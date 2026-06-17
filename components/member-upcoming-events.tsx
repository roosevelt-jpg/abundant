'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Event } from '@/lib/types';

export default function MemberUpcomingEvents() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [currentUser]);

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
          .slice(0, 6);
        
        setEvents(upcomingEvents);

        // Get user's registered events
        if (currentUser) {
          const userRegistered = upcomingEvents.filter(e => 
            e.attendees?.includes(currentUser.uid)
          );
          setRegisteredEvents(userRegistered);
        }
      }
    } catch (error) {
      console.error('[v0] Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-muted rounded-lg animate-pulse h-24"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold mb-2">My Registered Events</h2>
        <p className="text-sm text-muted-foreground">Events you've signed up for</p>
      </div>

      {registeredEvents.length === 0 ? (
        <div className="p-6 border border-dashed border-border rounded-lg text-center">
          <p className="text-muted-foreground mb-4">You haven't registered for any events yet</p>
          <Link 
            href="/events" 
            className="inline-block px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registeredEvents.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="p-4 bg-card rounded-lg border border-green-500/20 hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-green-600 mb-1">✓ Registered</p>
                  <h3 className="font-semibold line-clamp-2">{event.title}</h3>
                </div>
                {event.eventType === 'online' && <span className="text-lg">🌐</span>}
                {event.eventType === 'in-person' && <span className="text-lg">📍</span>}
                {event.eventType === 'hybrid' && <span className="text-lg">🌍</span>}
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.date).toLocaleDateString()}
                  {event.time && ` at ${event.time}`}
                </div>
                {event.location && event.eventType !== 'online' && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div>
        <h2 className="font-heading text-xl font-bold mb-2">Upcoming Events</h2>
        <p className="text-sm text-muted-foreground">Available events in the next month</p>
      </div>

      {events.length === 0 ? (
        <div className="p-6 border border-dashed border-border rounded-lg text-center text-muted-foreground">
          No upcoming events scheduled
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => {
            const isRegistered = registeredEvents.some(re => re.id === event.id);
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className={`p-4 bg-card rounded-lg border transition-colors ${
                  isRegistered
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-border hover:border-accent'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2">{event.title}</h3>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded ${
                      event.eventType === 'in-person' ? 'bg-blue-500/10 text-blue-600' :
                      event.eventType === 'online' ? 'bg-purple-500/10 text-purple-600' :
                      'bg-green-500/10 text-green-600'
                    }`}>
                      {event.eventType === 'in-person' ? '📍 In-Person' : 
                       event.eventType === 'online' ? '🌐 Online' : 
                       '🌍 Hybrid'}
                    </span>
                  </div>
                  {isRegistered && <span className="text-sm font-semibold text-green-600">✓</span>}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  {event.registrationType === 'paid' && event.price && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <Clock className="w-4 h-4" />
                      ${event.price}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link
        href="/events"
        className="inline-block px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold text-sm"
      >
        View All Events →
      </Link>
    </div>
  );
}
