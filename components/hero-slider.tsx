'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';
import { HeroSlide, HeroSliderConfig } from '@/lib/types';

const DEFAULT_CONFIG: HeroSliderConfig = {
  slides: [],
  speed: 5000,
  transition: 'fade',
  autoplay: true,
  loop: true,
  pauseOnHover: true,
};

export const HeroSlider = () => {
  const { settings } = useSettings();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const config: HeroSliderConfig = settings?.heroSliderConfig ?? {
    ...DEFAULT_CONFIG,
    slides: settings?.heroSlider ?? [],
  };

  const slides = [...config.slides].sort((a, b) => a.order - b.order);

  const goTo = useCallback(
    (index: number) => {
      if (slides.length === 0) return;
      if (config.loop) {
        setCurrentSlide(((index % slides.length) + slides.length) % slides.length);
      } else {
        setCurrentSlide(Math.max(0, Math.min(index, slides.length - 1)));
      }
    },
    [slides.length, config.loop]
  );

  useEffect(() => {
    setCurrentSlide(0);
  }, [slides.length]);

  useEffect(() => {
    if (!config.autoplay || paused || slides.length <= 1) return;
    const interval = setInterval(() => goTo(currentSlide + 1), config.speed);
    return () => clearInterval(interval);
  }, [config.autoplay, config.speed, paused, currentSlide, slides.length, goTo]);

  if (slides.length === 0) return null;

  const slide = slides[currentSlide];

  return (
    <section
      className="relative w-full py-8 md:py-12 px-4 sm:px-6 lg:px-8"
      onMouseEnter={() => config.pauseOnHover && setPaused(true)}
      onMouseLeave={() => config.pauseOnHover && setPaused(false)}
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative w-full h-[400px] md:h-[550px] overflow-hidden rounded-lg">
          {slides.map((s, idx) => (
            <SlideItem
              key={s.id}
              slide={s}
              active={idx === currentSlide}
              transition={config.transition}
              index={idx}
              current={currentSlide}
            />
          ))}

          {slides.length > 1 && (
            <>
              <button
                onClick={() => goTo(currentSlide - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 transition-colors p-2 rounded-full"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={() => goTo(currentSlide + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 transition-colors p-2 rounded-full"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goTo(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/70 w-2'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

function SlideItem({
  slide,
  active,
  transition,
  index,
  current,
}: {
  slide: HeroSlide;
  active: boolean;
  transition: HeroSliderConfig['transition'];
  index: number;
  current: number;
}) {
  const transitionClass =
    transition === 'fade'
      ? `transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`
      : transition === 'slide'
        ? `transition-transform duration-700 ${active ? 'translate-x-0' : index < current ? '-translate-x-full' : 'translate-x-full'}`
        : active
          ? 'opacity-100'
          : 'opacity-0 hidden';

  return (
    <div
      className={`absolute inset-0 ${transitionClass}`}
      style={{
        backgroundImage: slide.image ? `url(${slide.image})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: slide.image ? undefined : 'var(--card)',
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex flex-col items-start justify-center text-left px-8 md:px-16">
        {slide.subtitle && (
          <span className="text-[#B8973A] text-sm md:text-base font-medium mb-4">{slide.subtitle}</span>
        )}
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-2xl leading-tight">
          {slide.title}
        </h1>
        {slide.cta && (
          <Link
            href={slide.cta.link}
            className="btn-gradient inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold mt-6"
          >
            {slide.cta.text}
          </Link>
        )}
      </div>
    </div>
  );
}
