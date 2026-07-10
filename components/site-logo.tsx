'use client';

import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/context/ThemeContext';

const DEFAULT_LOGO = '/logo-text.png';

interface SiteLogoProps {
  className?: string;
  height?: number;
  variant?: 'header' | 'footer';
}

/** Blends away opaque dark PNG backgrounds on navy header/footer. */
const DARK_SURFACE_LOGO_CLASS =
  'block bg-transparent mix-blend-lighten [filter:none] [box-shadow:none] [text-shadow:none]';

export function SiteLogo({ className = '', height, variant = 'header' }: SiteLogoProps) {
  const { settings, loading } = useSettings();
  const { resolvedTheme } = useTheme();

  const h = height ?? (variant === 'footer' ? 60 : 40);

  const customLogo =
    (resolvedTheme === 'dark' && settings.branding?.logoUrlDark) ||
    settings.branding?.logoUrl;

  if (!customLogo && loading) {
    return (
      <span
        className={className}
        style={{ display: 'inline-block', height: h, minWidth: h * 2 }}
        aria-hidden
      />
    );
  }

  const logoUrl = customLogo || DEFAULT_LOGO;
  const onDarkSurface = variant === 'header' || variant === 'footer';

  return (
    <span className="inline-flex items-center leading-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={settings.siteName || 'Abundant Global Club'}
        className={`${onDarkSurface ? DARK_SURFACE_LOGO_CLASS : 'block bg-transparent'} ${className}`}
        style={{ height: h, width: 'auto' }}
        fetchPriority={variant === 'header' ? 'high' : 'auto'}
        decoding="async"
      />
    </span>
  );
}
