'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HeroSlider } from '@/components/hero-slider';
import { YouTubeWidget } from '@/components/youtube-widget';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Event } from '@/lib/types';
import { useSettings } from '@/hooks/useSettings';
import { resolveHomePage } from '@/lib/home-page';
import { HomeFeatureIconComponent } from '@/lib/home-icons';
import { getEventDisplayPrice, getEventPath } from '@/lib/event-utils';
import { PartnersMarquee } from '@/components/partners-marquee';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const { settings } = useSettings();
  const home = resolveHomePage(settings?.homePage);

  useEffect(() => {
    setMounted(true);
    fetch('/api/public/events?limit=3')
      .then((r) => r.json())
      .then(setUpcomingEvents)
      .catch(() => setUpcomingEvents([]));
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  const featureCards = [...home.featuresSection.cards].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <HeroSlider
          fallbackSiteName={settings?.siteName}
          fallbackDescription={settings?.description}
        />

        <YouTubeWidget settings={settings} />

        <section className="py-8 md:py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
              <div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold">{home.eventsSection.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{home.eventsSection.subtitle}</p>
              </div>
              <Link href="/events" className="text-accent hover:text-accent/80 font-semibold text-sm whitespace-nowrap">
                {home.eventsSection.linkText} →
              </Link>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map((event) => {
                  const price = getEventDisplayPrice(event);
                  return (
                    <Link
                      key={event.id}
                      href={getEventPath(event)}
                      className="bg-card rounded-lg border border-border hover:border-accent transition-colors overflow-hidden block"
                    >
                      {event.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.imageUrl} alt="" className="w-full h-36 object-cover" />
                      ) : (
                        <div className="w-full h-24 bg-gradient-to-r from-[#001F3F] to-[#B8973A]" />
                      )}
                      <div className="p-4">
                        <span className="inline-block px-2 py-0.5 bg-accent/10 text-accent text-xs font-semibold rounded capitalize mb-2">
                          {price.label}
                        </span>
                        <h3 className="font-heading font-bold mb-1 line-clamp-2">{event.title}</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          {new Date(event.date).toLocaleDateString()} · {event.location}
                        </p>
                        <span className="text-xs text-accent font-semibold">Register →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-card/50 rounded-lg border border-border">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{home.eventsSection.emptyMessage}</p>
                <Link href="/events" className="text-accent text-xs font-semibold mt-2 inline-block">
                  {home.eventsSection.linkText}
                </Link>
              </div>
            )}
          </div>
        </section>

        {featureCards.length > 0 && (
          <section className="py-8 md:py-10 px-4 sm:px-6 lg:px-8 bg-card/50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="font-heading text-2xl md:text-3xl font-bold">{home.featuresSection.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">{home.featuresSection.subtitle}</p>
              </div>
              <div className={`grid gap-4 ${
                featureCards.length >= 4
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                  : featureCards.length === 3
                    ? 'grid-cols-1 sm:grid-cols-3'
                    : featureCards.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 max-w-sm mx-auto'
              }`}>
                {featureCards.map((feature) => (
                  <div key={feature.id} className="p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors">
                    <HomeFeatureIconComponent icon={feature.icon} className="w-6 h-6 text-accent mb-3" />
                    <h3 className="font-heading font-bold text-base mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {home.ctaSection.enabled && (
          <section className="py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#B8973A] to-[#001F3F]">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-heading text-2xl md:text-3xl font-bold mb-3 text-white">{home.ctaSection.title}</h2>
              <p className="text-sm md:text-base mb-5 text-gray-100">{home.ctaSection.subtitle}</p>
              <Link
                href={home.ctaSection.buttonLink}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-white text-[#B8973A] rounded-lg font-semibold hover:bg-gray-100 transition-colors gap-2 text-sm"
              >
                {home.ctaSection.buttonText} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        <PartnersMarquee section={home.partnersSection} />
      </main>

      <Footer />
    </div>
  );
}
