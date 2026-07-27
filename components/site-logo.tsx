'use client';

import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/context/ThemeContext';

const DEFAULT_LOGO = '/logo-text.png';

interface SiteLogoProps {
  className?: string;
  height?: number;
  /** header/footer = dark surfaces (blend fix). admin = light sidebar/panels. */
  variant?: 'header' | 'footer' | 'admin';
}

/** Blends away opaque dark PNG backgrounds on navy public header/footer. */
const DARK_SURFACE_LOGO_CLASS =
  'block bg-transparent mix-blend-lighten [filter:none] [box-shadow:none] [text-shadow:none]';

export function SiteLogo({ className = '', height, variant = 'header' }: SiteLogoProps) {
  const { settings, loading } = useSettings();
  const { resolvedTheme } = useTheme();

  const customLogo =
    (resolvedTheme === 'dark' && settings.branding?.logoUrlDark) ||
    settings.branding?.logoUrl;

  // Public header/footer always use the bundled transparent wordmark — uploaded
  // branding logos often carry an opaque background that shows as a box on navy.
  const logoUrl =
    variant === 'header' || variant === 'footer'
      ? DEFAULT_LOGO
      : customLogo || DEFAULT_LOGO;

  const adminHeight = height ?? 36;
  const onDarkSurface = variant === 'header' || variant === 'footer';
    return (
      <span
        className={className}
        style={{ display: 'inline-block', height: adminHeight, minWidth: adminHeight * 2 }}
        aria-hidden
      />
    );
  }

  return (
    <span className="inline-flex items-center leading-none min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={settings.siteName || 'Abundant Global Club'}
        className={`${onDarkSurface ? DARK_SURFACE_LOGO_CLASS : 'block bg-transparent'} ${className}`}
        style={
          variant === 'admin'
            ? { height: adminHeight, width: 'auto', maxWidth: '100%' }
            : { width: 'auto', maxWidth: '100%' }
        }
        fetchPriority={variant === 'header' ? 'high' : 'auto'}
        decoding="async"
      />
    </span>
  );
}
