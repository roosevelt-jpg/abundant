'use client';

import { HomePartnersSection } from '@/lib/types';

interface PartnersMarqueeProps {
  section: HomePartnersSection;
}

function PartnerLogoItem({ name, logoUrl, url }: { name: string; logoUrl: string; url?: string }) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name}
      className="h-10 sm:h-12 w-auto max-w-[140px] object-contain opacity-80 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
      loading="lazy"
      decoding="async"
    />
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center px-6 sm:px-8 shrink-0"
        aria-label={name}
      >
        {image}
      </a>
    );
  }

  return <div className="flex items-center justify-center px-6 sm:px-8 shrink-0">{image}</div>;
}

export function PartnersMarquee({ section }: PartnersMarqueeProps) {
  const partners = [...section.partners].sort((a, b) => a.order - b.order).filter((p) => p.logoUrl);
  if (!section.enabled || partners.length === 0) return null;

  const duration = Math.max(10, section.speed || 40);
  const loop = [...partners, ...partners];

  return (
    <section className="py-10 md:py-12 border-t border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <h2 className="font-heading text-xl md:text-2xl font-bold text-center">{section.title}</h2>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"
          aria-hidden
        />

        <div
          className="partners-marquee-track items-center py-2"
          style={{ ['--partners-marquee-duration' as string]: `${duration}s` }}
        >
          {loop.map((partner, index) => (
            <PartnerLogoItem
              key={`${partner.id}-${index}`}
              name={partner.name}
              logoUrl={partner.logoUrl}
              url={partner.url}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
