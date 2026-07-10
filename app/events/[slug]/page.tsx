'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/context/AuthContext';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Event, EventRegistration, EventTag } from '@/lib/types';
import { canUserRegisterForEvent, getAudienceGenderLabel } from '@/lib/event-eligibility';
import {
  formatEventWhen,
  getEffectiveTicketTiers,
  getEventDisplayPrice,
  isEventFull,
} from '@/lib/event-utils';
import { downloadIcs, googleCalendarUrl } from '@/lib/ics';
import {
  Calendar,
  MapPin,
  Users,
  Video,
  Ticket,
  Download,
  ExternalLink,
  ArrowLeft,
  Clock,
  User,
  Link2,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function PublicEventPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = String(params.slug || '');
  const { currentUser, userData } = useAuth();
  const { authFetch } = useApiAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [tags, setTags] = useState<EventTag[]>([]);
  const [guests, setGuests] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTierId, setSelectedTierId] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [inviteCode, setInviteCode] = useState(searchParams.get('invite') || '');
  const [ticketQr, setTicketQr] = useState<{ qrUrl: string; checkInCode: string } | null>(null);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`/api/public/events/${encodeURIComponent(slug)}`).then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      }),
      fetch('/api/public/event-tags').then((r) => r.json()),
    ])
      .then(([ev, tagData]) => {
        setEvent(ev);
        setTags(Array.isArray(tagData) ? tagData : []);
        if (ev) {
          const tiers = getEffectiveTicketTiers(ev);
          setSelectedTierId(tiers[0]?.id || '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!event?.showGuestList) return;
    fetch(`/api/public/events/${encodeURIComponent(slug)}/guests`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setGuests(Array.isArray(data) ? data : []))
      .catch(() => setGuests([]));
  }, [event?.showGuestList, slug]);

  useEffect(() => {
    if (!event?.id || !currentUser) return;
    authFetch(`/api/events/my-ticket?eventId=${event.id}`)
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.qrUrl) setTicketQr({ qrUrl: data.qrUrl, checkInCode: data.checkInCode });
      })
      .catch(() => setTicketQr(null));
  }, [event?.id, currentUser, authFetch, message]);

  const tagMap = useMemo(() => Object.fromEntries(tags.map((t) => [t.id, t])), [tags]);
  const tiers = event ? getEffectiveTicketTiers(event) : [];
  const selectedTier = tiers.find((t) => t.id === selectedTierId) || tiers[0];
  const priceInfo = event ? getEventDisplayPrice(event) : { label: 'Free', amount: 0 };
  const full = event ? isEventFull(event) : false;
  const eligibility = event ? canUserRegisterForEvent(userData, event) : { allowed: true };

  const handleRegister = async () => {
    if (!event) return;
    if (!currentUser) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/events/${slug}`)}`;
      return;
    }
    if (!eligibility.allowed) {
      setMessage(eligibility.reason || 'Not eligible');
      return;
    }

    setRegistering(true);
    setMessage('');
    try {
      const isPaid = (selectedTier?.price ?? 0) > 0 || event.pricingType === 'paid';
      if (isPaid && !full) {
        const res = await authFetch('/api/events/checkout', {
          method: 'POST',
          body: JSON.stringify({
            eventId: event.id,
            ticketTierId: selectedTier?.id,
            discountCode: discountCode.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Checkout failed');
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      const res = await authFetch('/api/events/register', {
        method: 'POST',
        body: JSON.stringify({
          eventId: event.id,
          ticketTierId: selectedTier?.id,
          joinWaitlist: full && event.enableWaitlist,
          inviteCode: inviteCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      if (data.status === 'waitlisted') {
        setMessage('You’re on the waitlist. We’ll notify you if a spot opens.');
      } else if (data.status === 'pending') {
        setMessage('Request sent. The host will review your RSVP.');
      } else {
        setMessage('You’re registered! Add this event to your calendar below.');
      }
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              registered: (prev.registered || 0) + (data.status === 'registered' ? 1 : 0),
              waitlistCount:
                data.status === 'waitlisted' ? (prev.waitlistCount || 0) + 1 : prev.waitlistCount,
            }
          : prev
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">Loading event...</main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-muted-foreground">Event not found</p>
          <Link href="/events" className="text-accent font-semibold">
            ← Back to events
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const formatLabel =
    event.format === 'virtual' ? 'Virtual' : event.format === 'hybrid' ? 'Hybrid' : 'In person';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="relative w-full aspect-[21/9] max-h-[360px] bg-muted overflow-hidden">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#001F3F] via-[#002850] to-[#B8973A]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative pb-16">
          <Link href="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent mb-4">
            <ArrowLeft className="w-4 h-4" /> All events
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-8">
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent capitalize">
                    {formatLabel}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground capitalize">
                    {event.category}
                  </span>
                  {(event.tags || []).map((id) => {
                    const tag = tagMap[id];
                    return tag ? (
                      <span
                        key={id}
                        className="px-2.5 py-1 rounded-full text-xs border"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ) : null;
                  })}
                </div>
                <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">{event.title}</h1>
                {event.subtitle && <p className="text-lg text-muted-foreground mb-4">{event.subtitle}</p>}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" /> {formatEventWhen(event)}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" /> {event.location || 'Location TBA'}
                  </p>
                  {event.virtualLink && (
                    <p className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-accent" /> Virtual access after registration
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    {event.registered || 0}
                    {event.capacity ? ` / ${event.capacity}` : ''} going
                    {event.waitlistCount ? ` · ${event.waitlistCount} waitlisted` : ''}
                  </p>
                  {event.audienceGender && event.audienceGender !== 'mixed' && (
                    <p className="text-accent">{getAudienceGenderLabel(event.audienceGender)}</p>
                  )}
                </div>
              </div>

              <section className="space-y-3">
                <h2 className="font-heading text-xl font-bold">About</h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{event.description}</p>
              </section>

              {(event.hosts?.length ?? 0) > 0 && (
                <section className="space-y-3">
                  <h2 className="font-heading text-xl font-bold">Hosted by</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {event.hosts!.map((host) => (
                      <div key={host.id} className="flex gap-3 p-4 rounded-xl border border-border bg-card">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {host.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={host.imageUrl} alt={host.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-accent" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold">{host.name}</p>
                          {host.title && <p className="text-xs text-muted-foreground">{host.title}</p>}
                          {host.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{host.bio}</p>}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {host.website && (
                              <a href={host.website} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent inline-flex items-center gap-1">
                                <Link2 className="w-3 h-3" /> Website
                              </a>
                            )}
                            {host.linkedin && (
                              <a href={host.linkedin} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent">
                                LinkedIn
                              </a>
                            )}
                            {host.twitter && (
                              <a href={host.twitter} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent">
                                X
                              </a>
                            )}
                            {host.instagram && (
                              <a href={host.instagram} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent">
                                Instagram
                              </a>
                            )}
                            {host.email && (
                              <a href={`mailto:${host.email}`} className="text-[11px] text-accent">
                                Email
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(event.agenda?.length ?? 0) > 0 && (
                <section className="space-y-3">
                  <h2 className="font-heading text-xl font-bold">Agenda</h2>
                  <div className="space-y-2">
                    {event.agenda!.map((item, i) => (
                      <div key={item.id || i} className="flex gap-3 p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-1 text-xs font-semibold text-accent w-20 flex-shrink-0">
                          <Clock className="w-3.5 h-3.5" /> {item.time}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          {item.speaker && <p className="text-xs text-muted-foreground">{item.speaker}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(event.speakers?.length ?? 0) > 0 && (
                <section className="space-y-3">
                  <h2 className="font-heading text-xl font-bold">Speakers</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {event.speakers!.map((sp, i) => (
                      <div key={sp.id || i} className="p-4 rounded-xl border border-border bg-card">
                        <p className="font-semibold">{sp.name}</p>
                        {sp.title && <p className="text-xs text-accent">{sp.title}</p>}
                        {sp.bio && <p className="text-xs text-muted-foreground mt-1">{sp.bio}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {event.showGuestList && guests.length > 0 && (
                <section className="space-y-3">
                  <h2 className="font-heading text-xl font-bold">Going ({guests.length})</h2>
                  <div className="flex flex-wrap gap-2">
                    {guests.slice(0, 40).map((g) => (
                      <span key={g.id} className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium">
                        {g.userName}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="lg:sticky lg:top-24 h-fit space-y-4">
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tickets</p>
                  <p className="font-heading text-2xl font-bold">{priceInfo.label}</p>
                </div>

                {tiers.length > 1 && (
                  <div className="space-y-2">
                    {tiers.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTierId(tier.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedTierId === tier.id ? 'border-accent bg-accent/5' : 'border-border'
                        }`}
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-sm">{tier.name}</span>
                          <span className="text-sm font-semibold">{tier.price > 0 ? `$${tier.price}` : 'Free'}</span>
                        </div>
                        {tier.description && (
                          <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {(selectedTier?.price ?? 0) > 0 && (
                  <div>
                    <label className="block text-xs font-medium mb-1">Discount code</label>
                    <input
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg"
                      placeholder="Optional"
                    />
                  </div>
                )}

                {(event.registrationMode === 'invite_only' || inviteCode) && (
                  <div>
                    <label className="block text-xs font-medium mb-1">Invite code</label>
                    <input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg font-mono"
                      placeholder="Required for invite-only"
                    />
                  </div>
                )}

                {ticketQr && (
                  <div className="text-center p-3 rounded-lg border border-accent/30 bg-accent/5 space-y-2">
                    <p className="text-xs font-semibold text-accent">Your ticket QR</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ticketQr.qrUrl} alt="Check-in QR" className="mx-auto w-40 h-40 rounded bg-white p-2" />
                    <p className="text-[11px] font-mono text-muted-foreground">{ticketQr.checkInCode}</p>
                    <p className="text-[11px] text-muted-foreground">Show this at the door</p>
                  </div>
                )}

                {message && (
                  <p className="text-xs p-2 rounded-lg bg-accent/10 text-accent">{message}</p>
                )}

                {!eligibility.allowed && currentUser && (
                  <p className="text-xs text-destructive">{eligibility.reason}</p>
                )}

                <button
                  type="button"
                  disabled={
                    registering ||
                    !!ticketQr ||
                    (event.registrationMode === 'invite_only' && !inviteCode.trim())
                  }
                  onClick={handleRegister}
                  className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  {ticketQr
                    ? 'You’re registered'
                    : registering
                      ? 'Please wait...'
                      : full && event.enableWaitlist
                        ? 'Join waitlist'
                        : full
                          ? 'Sold out'
                          : event.registrationMode === 'approval'
                            ? 'Request to join'
                            : (selectedTier?.price ?? 0) > 0
                              ? 'Get tickets'
                              : 'RSVP'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => downloadIcs(event)}
                    className="flex-1 text-xs py-2 border border-border rounded-lg flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> .ics
                  </button>
                  <a
                    href={googleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs py-2 border border-border rounded-lg flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Google
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
