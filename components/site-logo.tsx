'use client';

import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/context/ThemeContext';

const DEFAULT_LOGO = '/logo-text.png';

interface SiteLogoProps {
  className?: string;
  height?: number;
  variant?: 'header' | 'footer';
}

export function SiteLogo({ className = '', height, variant = 'header' }: SiteLogoProps) {
  const { settings, loading } = useSettings();
  const { resolvedTheme } = useTheme();

  const h = height ?? (variant === 'footer' ? 60 : 40);

  const customLogo =
    (resolvedTheme === 'dark' && settings.branding?.logoUrlDark) ||
    settings.branding?.logoUrl;

  // Avoid flashing the hardcoded fallback while settings are still loading
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

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={settings.siteName || 'Abundant Global Club'}
      className={className}
      style={{ height: h, width: 'auto' }}
      fetchPriority={variant === 'header' ? 'high' : 'auto'}
      decoding="async"
    />
  );
}
