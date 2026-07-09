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
  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();

  const logoUrl =
    (resolvedTheme === 'dark' && settings?.branding?.logoUrlDark) ||
    settings?.branding?.logoUrl ||
    DEFAULT_LOGO;

  const h = height ?? (variant === 'footer' ? 60 : 40);

  return (
    <img
      src={logoUrl}
      alt={settings?.siteName || 'Abundant Global Club'}
      className={className}
      style={{ height: h, width: 'auto' }}
    />
  );
}
