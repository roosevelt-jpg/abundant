import { readFile } from 'fs/promises';
import { join } from 'path';
import { ImageResponse } from 'next/og';

export const alt = 'Abundant Global Club';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadLogoDataUrl(): Promise<string | null> {
  for (const name of ['logo-text.png', 'logo.png'] as const) {
    try {
      const buf = await readFile(join(process.cwd(), 'public', name));
      return `data:image/png;base64,${buf.toString('base64')}`;
    } catch {
      // try next
    }
  }
  return null;
}

export default async function OpenGraphImage() {
  const logoSrc = await loadLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F1B2E 0%, #001F3F 48%, #1a2f1a 100%)',
          padding: 64,
        }}
      >
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt="Abundant Global Club"
            width={720}
            height={220}
            style={{
              objectFit: 'contain',
              maxWidth: 720,
              maxHeight: 220,
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#B8973A',
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: 6,
              fontFamily: 'Georgia, serif',
            }}
          >
            ABUNDANT GLOBAL CLUB
          </div>
        )}
        <div
          style={{
            marginTop: 36,
            color: '#FFFFFF',
            fontSize: 32,
            fontFamily: 'system-ui, sans-serif',
            opacity: 0.92,
            textAlign: 'center',
          }}
        >
          A Global Network of Success
        </div>
        <div
          style={{
            marginTop: 20,
            color: '#D4AF87',
            fontSize: 22,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: 2,
          }}
        >
          abundantglobalclub.com
        </div>
      </div>
    ),
    { ...size }
  );
}
