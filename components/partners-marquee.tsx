'use client';

import { HomePartnersSection } from '@/lib/types';

interface PartnersMarqueeProps {
  section: HomePartnersSection;
}

function PartnerLogoItem({
  name,
  logoUrl,
  url,
  logoHeight,
  grayscale,
}: {
  name: string;
  logoUrl: string;
  url?: string;
  logoHeight: number;
  grayscale: boolean;
}) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name}
      className={`w-auto object-contain opacity-80 hover:opacity-100 transition-[opacity,filter] duration-300 ${
        grayscale ? 'grayscale hover:grayscale-0' : ''
      }`}
      style={{ height: logoHeight, maxWidth: Math.round(logoHeight * 3.2) }}
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
        className="flex items-center justify-center shrink-0"
        aria-label={name}
      >
        {image}
      </a>
    );
  }

  return <div className="flex items-center justify-center shrink-0">{image}</div>;
}

export function PartnersMarquee({ section }: PartnersMarqueeProps) {
  const partners = [...section.partners].sort((a, b) => a.order - b.order).filter((p) => p.logoUrl);
  if (!section.enabled || partners.length === 0) return null;

  const duration = Math.max(8, Math.min(180, section.speed || 40));
  const direction = section.direction === 'right' ? 'right' : 'left';
  const easing = section.easing === 'ease' || section.easing === 'ease-in-out' ? section.easing : 'linear';
  const pauseOnHover = section.pauseOnHover !== false;
  const grayscale = section.grayscale === true;
  const showEdgeFade = section.showEdgeFade !== false;
  const gap = Math.max(16, Math.min(120, section.gap || 48));
  const logoHeight = Math.max(24, Math.min(120, section.logoHeight || 48));
  const loop = [...partners, ...partners];

  return (
    <section className="py-10 md:py-12 border-t border-border bg-card/30">
      {section.title ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-center">{section.title}</h2>
        </div>
      ) : null}

      <div className="relative overflow-hidden">
        {showEdgeFade ? (
          <>
            <div
              className="absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"
              aria-hidden
            />
            <div
              className="absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"
              aria-hidden
            />
          </>
        ) : null}

        <div
          className="partners-marquee-track items-center py-2"
          data-direction={direction}
          data-pause-on-hover={pauseOnHover ? 'true' : 'false'}
          style={{
            ['--partners-marquee-duration' as string]: `${duration}s`,
            ['--partners-marquee-easing' as string]: easing,
            ['--partners-marquee-gap' as string]: `${gap}px`,
          }}
        >
          {loop.map((partner, index) => (
            <PartnerLogoItem
              key={`${partner.id}-${index}`}
              name={partner.name}
              logoUrl={partner.logoUrl}
              url={partner.url}
              logoHeight={logoHeight}
              grayscale={grayscale}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
