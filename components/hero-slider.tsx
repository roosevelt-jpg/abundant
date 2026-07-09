'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';
import { HeroSlide, HeroSliderConfig, Settings } from '@/lib/types';

const DEFAULT_CONFIG: HeroSliderConfig = {
  slides: [],
  speed: 5000,
  transition: 'fade',
  autoplay: true,
  loop: true,
  pauseOnHover: true,
};

const DEFAULT_SLIDE: HeroSlide = {
  id: 'default',
  image: '',
  badge: 'Welcome to Abundant',
  title: 'Abundant Global Club',
  description: 'Join an exclusive community of high-achievers, entrepreneurs, and visionaries committed to abundant living and collective success.',
  cta: { text: 'Join Now', link: '/signup' },
  secondaryCta: { text: 'Learn More', link: '/about' },
  order: 0,
};

interface HeroSliderProps {
  fallbackSiteName?: string;
  fallbackDescription?: string;
}

export const HeroSlider = ({ fallbackSiteName, fallbackDescription }: HeroSliderProps) => {
  const { settings } = useSettings();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const config: HeroSliderConfig = settings?.heroSliderConfig ?? {
    ...DEFAULT_CONFIG,
    slides: settings?.heroSlider ?? [],
  };

  const slides = [...config.slides].sort((a, b) => a.order - b.order);
  const hasSlides = slides.length > 0;

  const displaySlides: HeroSlide[] = hasSlides
    ? slides
    : [
        {
          ...DEFAULT_SLIDE,
          title: fallbackSiteName || settings?.siteName || DEFAULT_SLIDE.title,
          description: fallbackDescription || settings?.description || DEFAULT_SLIDE.description,
        },
      ];

  const goTo = useCallback(
    (index: number) => {
      if (displaySlides.length === 0) return;
      if (config.loop || !hasSlides) {
        setCurrentSlide(((index % displaySlides.length) + displaySlides.length) % displaySlides.length);
      } else {
        setCurrentSlide(Math.max(0, Math.min(index, displaySlides.length - 1)));
      }
    },
    [displaySlides.length, config.loop, hasSlides]
  );

  useEffect(() => {
    setCurrentSlide(0);
  }, [displaySlides.length]);

  useEffect(() => {
    if (!hasSlides || !config.autoplay || paused || displaySlides.length <= 1) return;
    const interval = setInterval(() => goTo(currentSlide + 1), config.speed);
    return () => clearInterval(interval);
  }, [hasSlides, config.autoplay, config.speed, paused, currentSlide, displaySlides.length, goTo]);

  const slide = displaySlides[currentSlide];
  const showControls = hasSlides && displaySlides.length > 1;

  return (
    <section
      className="relative overflow-hidden py-16 md:py-24 lg:py-28 px-4 sm:px-6 lg:px-8"
      onMouseEnter={() => config.pauseOnHover && setPaused(true)}
      onMouseLeave={() => config.pauseOnHover && setPaused(false)}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left: synced text content */}
          <div className="relative min-h-[280px] md:min-h-[320px]">
            {displaySlides.map((s, idx) => (
              <div
                key={s.id}
                className={`transition-all duration-700 ${
                  idx === currentSlide
                    ? 'opacity-100 translate-y-0 relative'
                    : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
                }`}
              >
                {s.badge && (
                  <span className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">
                    {s.badge}
                  </span>
                )}
                <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-foreground leading-tight">
                  {s.title}
                </h1>
                {(s.description || s.subtitle) && (
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
                    {s.description || s.subtitle}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  {s.cta && (
                    <Link
                      href={s.cta.link}
                      className="btn-gradient inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold"
                    >
                      {s.cta.text} <ArrowRight className="w-5 h-5" />
                    </Link>
                  )}
                  {s.secondaryCta && (
                    <Link
                      href={s.secondaryCta.link}
                      className="inline-flex items-center justify-center px-6 py-3 border border-border hover:bg-card transition-colors rounded-lg font-semibold"
                    >
                      {s.secondaryCta.text}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right: synced image */}
          <div className="relative aspect-square max-h-[480px] w-full mx-auto lg:mx-0">
            {displaySlides.map((s, idx) => (
              <div
                key={`img-${s.id}`}
                className={`absolute inset-0 rounded-2xl overflow-hidden transition-all duration-700 ${
                  config.transition === 'slide'
                    ? idx === currentSlide
                      ? 'opacity-100 translate-x-0'
                      : idx < currentSlide
                        ? 'opacity-0 -translate-x-full'
                        : 'opacity-0 translate-x-full'
                    : idx === currentSlide
                      ? 'opacity-100'
                      : 'opacity-0'
                }`}
              >
                {s.image ? (
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-accent opacity-50 mb-4">∞</div>
                      <p className="text-muted-foreground">Unlimited Possibilities</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {showControls && (
              <>
                <button
                  onClick={() => goTo(currentSlide - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => goTo(currentSlide + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {showControls && (
          <div className="flex justify-center gap-2 mt-8">
            {displaySlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'bg-accent w-8' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
