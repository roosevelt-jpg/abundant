'use client';

interface HostingerLogoProps {
  className?: string;
  height?: number;
  /** White wordmark on dark navy backgrounds */
  onDark?: boolean;
}

/** Hostinger brand mark + wordmark for admin Hosting pages. */
export function HostingerLogo({ className = '', height = 36, onDark = false }: HostingerLogoProps) {
  const mark = Math.round(height * 0.95);
  const wordColor = onDark ? '#FFFFFF' : '#673DE6';

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      role="img"
      aria-label="Hostinger"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 36 36"
        width={mark}
        height={mark}
        className="shrink-0"
        aria-hidden
      >
        <rect width="36" height="36" rx="9" fill="#673DE6" />
        <path fill="#fff" d="M10.5 11h4.2v6.8h6.6V11H25.5v18h-4.2v-7.2h-6.6V29h-4.2V11z" />
      </svg>
      <span
        className="font-bold tracking-tight leading-none select-none"
        style={{
          color: wordColor,
          fontSize: Math.round(height * 0.72),
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        Hostinger
      </span>
    </span>
  );
}
