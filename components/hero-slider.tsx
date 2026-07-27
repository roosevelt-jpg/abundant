'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';
import { HeroSlide } from '@/lib/types';
import {
  getHeroSlideMotion,
  getHeroTextMotion,
  resolveHeroSliderConfig,
} from '@/lib/hero-slider-utils';

const DEFAULT_SLIDE: HeroSlide = {
  id: 'default',
  image: '',
  badge: 'Welcome to Abundant',
  title: 'Abundant Global Club',
  description:
    'Join an exclusive community of high-achievers, entrepreneurs, and visionaries committed to abundant living and collective success.',
  cta: { text: 'Join Now', link: '/apply' },
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

  const config = resolveHeroSliderConfig(
    settings?.heroSliderConfig,
    settings?.heroSliderConfig?.slides ?? settings?.heroSlider ?? []
  );

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

  const showControls = hasSlides && displaySlides.length > 1;
  const showArrows = showControls && config.showArrows;
  const showDots = showControls && config.showDots;
  const duration = config.transitionDuration ?? 700;
  const textAlign = config.contentAlignment === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <section
      className="relative overflow-hidden py-5 sm:py-8 lg:py-14 px-4 sm:px-6 lg:px-8"
      onMouseEnter={() => config.pauseOnHover && setPaused(true)}
      onMouseLeave={() => config.pauseOnHover && setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Hero slider"
    >
      <div className="max-w-7xl mx-auto">
        {/* Mobile/tablet: stacked full-width. Desktop: ~30% text / ~70% image */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2.1fr)] gap-5 sm:gap-6 lg:gap-8 items-center">
          {/* Text content */}
          <div
            className={`relative flex flex-col justify-center ${textAlign} ${
              config.mobileImageFirst ? 'order-2 lg:order-1' : 'order-1'
            }`}
          >
            {displaySlides.map((s, idx) => {
              const motion = getHeroTextMotion(config.transition, idx === currentSlide, duration);
              return (
                <div key={s.id} className={`${motion.className} w-full`} style={motion.style}>
                  {s.badge && (
                    <span className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium mb-3">
                      {s.badge}
                    </span>
                  )}
                  <h1 className="font-heading text-[1.75rem] sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold mb-3 leading-[1.15] break-words">
                    {s.title}
                  </h1>
                  {(s.description || s.subtitle) && (
                    <p
                      className={`text-sm sm:text-base text-muted-foreground mb-5 leading-relaxed max-w-none lg:max-w-md ${
                        config.contentAlignment === 'center' ? 'mx-auto' : ''
                      }`}
                    >
                      {s.description || s.subtitle}
                    </p>
                  )}
                  <div
                    className={`flex flex-col sm:flex-row gap-3 w-full sm:w-auto ${
                      config.contentAlignment === 'center' ? 'justify-center sm:mx-auto' : ''
                    }`}
                  >
                    {s.cta && (
                      <Link
                        href={s.cta.link}
                        className="btn-gradient inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-lg font-semibold text-sm min-h-[44px]"
                      >
                        {s.cta.text} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                    {s.secondaryCta && (
                      <Link
                        href={s.secondaryCta.link}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-3 sm:py-2.5 border border-border hover:bg-card transition-colors rounded-lg font-semibold text-sm min-h-[44px]"
                      >
                        {s.secondaryCta.text}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Image */}
          <div
            className={`relative w-full min-w-0 ${
              config.mobileImageFirst ? 'order-1 lg:order-2' : 'order-2'
            }`}
          >
            <div className="relative w-full aspect-[16/10] min-h-[180px] max-h-[240px] sm:min-h-[260px] sm:max-h-[360px] md:max-h-[400px] lg:min-h-[320px] lg:max-h-[480px] mx-auto lg:mx-0 rounded-xl sm:rounded-2xl overflow-hidden bg-muted/30 ring-1 ring-border/50 shadow-sm">
              {displaySlides.map((s, idx) => {
                const motion = getHeroSlideMotion(config.transition, idx === currentSlide, duration);
                return (
                  <div key={`img-${s.id}`} className={motion.className} style={motion.style}>
                    {s.image ? (
                      <img
                        key={config.kenBurns ? `${s.id}-${currentSlide}` : s.id}
                        src={s.image}
                        alt={s.title}
                        className={`w-full h-full object-cover ${config.kenBurns && idx === currentSlide ? 'animate-hero-ken-burns' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                        <div className="text-center px-4">
                          <div className="text-5xl sm:text-6xl font-bold text-accent opacity-50 mb-2">∞</div>
                          <p className="text-sm text-muted-foreground">Unlimited Possibilities</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {showArrows && (
                <>
                  <button
                    type="button"
                    onClick={() => goTo(currentSlide - 1)}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 active:bg-black/70 backdrop-blur-sm text-white p-2.5 sm:p-2 rounded-full transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(currentSlide + 1)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 active:bg-black/70 backdrop-blur-sm text-white p-2.5 sm:p-2 rounded-full transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-5 sm:h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {showDots && (
          <div className="flex justify-center gap-2 mt-4 sm:mt-6" role="tablist" aria-label="Slide navigation">
            {displaySlides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={idx === currentSlide}
                aria-label={`Go to slide ${idx + 1}: ${s.title}`}
                onClick={() => goTo(idx)}
                className="rounded-full transition-all duration-300 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
              >
                <span
                  className={`block h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                    idx === currentSlide
                      ? 'bg-accent w-6 sm:w-8'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5 sm:w-2'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
