'use client';

import { useState, useEffect } from 'react';
import { Settings } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface HeroSliderProps {
  settings?: Settings | null;
}

export const HeroSlider = ({ settings: initialSettings }: HeroSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(initialSettings || null);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      return;
    }

    // Load settings on client side if not provided
    const loadSettings = async () => {
      try {
        const { getSettings } = await import('@/lib/db-service');
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error('[v0] Error loading settings:', error);
      }
    };
    loadSettings();
  }, [initialSettings]);

  const slides = settings?.heroSlider || [];

  if (!slides || slides.length === 0) {
    return null;
  }

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 8000);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <section className="relative w-full py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative w-full h-[400px] md:h-[550px] overflow-hidden rounded-lg">
          {/* Slides */}
          {slides.map((s, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${s.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/30" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-start justify-center text-left px-8 md:px-16">
                {s.subtitle && (
                  <span className="text-[#B8973A] text-sm md:text-base font-medium mb-4">
                    {s.subtitle}
                  </span>
                )}
                <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 max-w-2xl leading-tight">
                  {s.title}
                </h1>
                {s.cta && (
                  <Link
                    href={s.cta.link}
                    className="btn-gradient inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold mt-6"
                  >
                    {s.cta.text}
                  </Link>
                )}
              </div>
            </div>
          ))}

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 transition-colors p-2 rounded-full"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 transition-colors p-2 rounded-full"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/70 w-2'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
