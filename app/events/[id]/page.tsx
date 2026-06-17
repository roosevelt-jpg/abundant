'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Calendar, MapPin, Users, Zap, Check } from 'lucide-react';
import type { Event } from '@/lib/types';

export default function EventDetails() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, userData } = useAuth();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events`);
      if (response.ok) {
        const events: Event[] = await response.json();
        const foundEvent = events.find(e => e.id === eventId);
        if (foundEvent) {
          setEvent(foundEvent);
          // Check if user is already registered
          if (currentUser && foundEvent.attendees?.includes(currentUser.uid)) {
            setIsRegistered(true);
          }
        }
      }
    } catch (error) {
      console.error('[v0] Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Check gender restriction
    if (event?.genderRestriction && event.genderRestriction !== 'mixed') {
      alert(`This event is restricted to ${event.genderRestriction === 'men-only' ? 'men only' : 'women only'}`);
      return;
    }

    setRegistering(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          userName: userData?.displayName || currentUser.email || 'Guest',
          userEmail: currentUser.email || '',
        }),
      });

      if (response.ok) {
        setIsRegistered(true);
        // Refresh event to get updated registration count
        await fetchEvent();
        alert('Successfully registered for the event!');
      } else {
        alert('Failed to register for event');
      }
    } catch (error) {
      console.error('[v0] Error registering:', error);
      alert('Error registering for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!confirm('Are you sure you want to unregister from this event?')) return;

    setRegistering(true);
    try {
      const token = await currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsRegistered(false);
        await fetchEvent();
        alert('Successfully unregistered from the event');
      }
    } catch (error) {
      console.error('[v0] Error unregistering:', error);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-card rounded-lg border border-border h-96 animate-pulse"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-muted-foreground text-lg">Event not found</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 text-accent hover:text-accent/80 font-medium"
          >
            ← Back to Events
          </button>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Header */}
            <div className="p-8 bg-accent/5 border-b border-border">
              <div className="flex gap-4 mb-6 flex-wrap">
                <span className={`inline-block px-4 py-2 ${getEventTypeColor(event.eventType)} text-sm font-semibold rounded-full`}>
                  {event.eventType === 'in-person' ? '📍 In-Person' : event.eventType === 'online' ? '🌐 Online' : '🌍 Hybrid'}
                </span>
                {event.registrationType === 'paid' && event.price && (
                  <span className="inline-block px-4 py-2 bg-orange-500/10 text-orange-600 text-sm font-semibold rounded-full">
                    💰 ${event.price}
                  </span>
                )}
                {event.registrationType === 'rsvp' && (
                  <span className="inline-block px-4 py-2 bg-indigo-500/10 text-indigo-600 text-sm font-semibold rounded-full">
                    📋 RSVP Required
                  </span>
                )}
                {event.genderRestriction && event.genderRestriction !== 'mixed' && (
                  <span className="inline-block px-4 py-2 bg-pink-500/10 text-pink-600 text-sm font-semibold rounded-full">
                    {event.genderRestriction === 'men-only' ? '👨 Men Only' : '👩 Women Only'}
                  </span>
                )}
              </div>

              <h1 className="font-heading text-4xl font-bold mb-2">{event.title}</h1>
              <p className="text-lg text-muted-foreground">{event.description}</p>
            </div>

            {/* Content */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                {/* Details */}
                <div className="space-y-4">
                  <h2 className="font-heading text-2xl font-bold">Event Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex gap-4">
                      <Calendar className="w-6 h-6 text-accent flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date & Time</p>
                        <p className="font-semibold">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                          {event.time && ` at ${event.time}`}
                        </p>
                      </div>
                    </div>

                    {event.location && event.eventType !== 'online' && (
                      <div className="flex gap-4">
                        <MapPin className="w-6 h-6 text-accent flex-shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-semibold">{event.location}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Users className="w-6 h-6 text-accent flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Capacity</p>
                        <p className="font-semibold">{event.registrations || 0} / {event.expectedAttendees || 'Unlimited'} registered</p>
                      </div>
                    </div>

                    {event.registrationType === 'paid' && event.price && (
                      <div className="flex gap-4">
                        <Zap className="w-6 h-6 text-accent flex-shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-semibold">${event.price}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Full description */}
                <div className="space-y-4">
                  <h2 className="font-heading text-2xl font-bold">About This Event</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>

              {/* Sidebar - Registration */}
              <div className="md:col-span-1">
                <div className="bg-accent/5 rounded-lg border border-accent/20 p-6 sticky top-24">
                  <h3 className="font-heading font-bold text-lg mb-4">Event Registration</h3>
                  
                  {isRegistered ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 flex gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-green-900 dark:text-green-100">Registered!</p>
                          <p className="text-sm text-green-800 dark:text-green-200">You are registered for this event</p>
                        </div>
                      </div>
                      <button
                        onClick={handleUnregister}
                        disabled={registering}
                        className="w-full py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors font-semibold disabled:opacity-50"
                      >
                        {registering ? 'Processing...' : 'Unregister'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="w-full py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold disabled:opacity-50"
                    >
                      {registering ? 'Processing...' : event.registrationType === 'paid' ? `Register for $${event.price}` : 'Register Now'}
                    </button>
                  )}

                  <div className="mt-6 space-y-3 text-sm">
                    {event.eventType === 'online' && (
                      <p className="text-muted-foreground">
                        ✓ This is an online event. Join link will be sent to your email.
                      </p>
                    )}
                    {event.registrationType === 'paid' && (
                      <p className="text-muted-foreground">
                        ✓ Payment secured by Stripe
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      ✓ Confirmation email will be sent upon registration
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-sm w-full p-6">
            <h2 className="font-heading font-bold text-lg mb-4">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to register for this event.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAuthModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push('/login')}
                className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
