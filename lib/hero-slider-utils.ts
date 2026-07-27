import { HeroSliderConfig, HeroTransition } from '@/lib/types';

export const DEFAULT_HERO_SLIDER_CONFIG: Omit<HeroSliderConfig, 'slides'> = {
  speed: 5000,
  transition: 'fade',
  transitionDuration: 700,
  autoplay: true,
  loop: true,
  pauseOnHover: true,
  showArrows: true,
  showDots: true,
  kenBurns: false,
  mobileImageFirst: false,
  contentAlignment: 'left',
};

export function resolveHeroSliderConfig(
  config?: Partial<HeroSliderConfig> | null,
  slides: HeroSliderConfig['slides'] = []
): HeroSliderConfig {
  const normalizedSlides = slides.map((slide) => {
    const ctaLink = slide.cta?.link === '/signup' ? '/apply' : slide.cta?.link;
    const secondaryLink =
      slide.secondaryCta?.link === '/signup' ? '/apply' : slide.secondaryCta?.link;
    return {
      ...slide,
      cta: slide.cta ? { ...slide.cta, link: ctaLink || '/apply' } : slide.cta,
      secondaryCta: slide.secondaryCta
        ? { ...slide.secondaryCta, link: secondaryLink || slide.secondaryCta.link }
        : slide.secondaryCta,
    };
  });

  return {
    ...DEFAULT_HERO_SLIDER_CONFIG,
    ...config,
    slides: normalizedSlides,
  };
}

type SlideMotionStyle = { transitionDuration?: string };

type SlideMotion = {
  className: string;
  style?: SlideMotionStyle;
};

export function getHeroSlideMotion(
  transition: HeroTransition,
  isActive: boolean,
  durationMs: number
): SlideMotion {
  const style = { transitionDuration: `${durationMs}ms` };
  const base = 'absolute inset-0 transition-all ease-in-out';

  switch (transition) {
    case 'none':
      return {
        className: isActive ? 'relative opacity-100 z-10' : 'absolute inset-0 opacity-0 z-0 pointer-events-none',
        style,
      };
    case 'slide':
      return {
        className: `${base} ${isActive ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-full z-0 pointer-events-none'}`,
        style,
      };
    case 'slide-up':
      return {
        className: `${base} ${isActive ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-8 z-0 pointer-events-none'}`,
        style,
      };
    case 'slide-down':
      return {
        className: `${base} ${isActive ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 -translate-y-8 z-0 pointer-events-none'}`,
        style,
      };
    case 'zoom':
      return {
        className: `${base} ${isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'}`,
        style,
      };
    case 'blur':
      return {
        className: `${base} ${isActive ? 'opacity-100 blur-0 z-10' : 'opacity-0 blur-sm z-0 pointer-events-none'}`,
        style,
      };
    case 'fade':
    default:
      return {
        className: `${base} ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`,
        style,
      };
  }
}

export function getHeroTextMotion(
  transition: HeroTransition,
  isActive: boolean,
  durationMs: number
): SlideMotion {
  const style = { transitionDuration: `${durationMs}ms` };
  const base = 'transition-all ease-in-out';

  if (!isActive) {
    return {
      className: `${base} opacity-0 absolute inset-0 pointer-events-none translate-y-3`,
      style,
    };
  }

  switch (transition) {
    case 'slide':
      return { className: `${base} opacity-100 relative translate-x-0`, style };
    case 'slide-up':
      return { className: `${base} opacity-100 relative translate-y-0`, style };
    case 'slide-down':
      return { className: `${base} opacity-100 relative translate-y-0`, style };
    case 'zoom':
      return { className: `${base} opacity-100 relative scale-100`, style };
    case 'blur':
      return { className: `${base} opacity-100 relative blur-0`, style };
    case 'none':
      return { className: isActive ? 'relative opacity-100' : 'absolute inset-0 opacity-0 pointer-events-none', style };
    case 'fade':
    default:
      return { className: `${base} opacity-100 relative translate-y-0`, style };
  }
}

export const HERO_TRANSITION_OPTIONS: { value: HeroTransition; label: string; description: string }[] = [
  { value: 'fade', label: 'Fade', description: 'Smooth crossfade between slides' },
  { value: 'slide', label: 'Slide horizontal', description: 'Slides move left to right' },
  { value: 'slide-up', label: 'Slide up', description: 'Content rises into view' },
  { value: 'slide-down', label: 'Slide down', description: 'Content drops into view' },
  { value: 'zoom', label: 'Zoom', description: 'Subtle scale-in effect' },
  { value: 'blur', label: 'Blur fade', description: 'Soft blur transition' },
  { value: 'none', label: 'Instant', description: 'No animation' },
];
