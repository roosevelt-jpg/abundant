import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import { AppProviders } from '@/components/app-providers'
import { getPublicSettings } from '@/lib/settings-server'
import { getDefaultSettings } from '@/lib/db-service'
import { getSiteUrl } from '@/lib/site-url'

const cormorantGaramond = Cormorant_Garamond({ 
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const inter = Inter({ 
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const SITE_URL = getSiteUrl()

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
}

export async function generateMetadata(): Promise<Metadata> {
  let settings = getDefaultSettings()
  try {
    settings = await getPublicSettings()
  } catch {
    // defaults
  }

  const title = settings.siteName || 'Abundant Global Club'
  const description =
    settings.description || 'A Global Network of Success'
  const logo =
    settings.branding?.logoUrl ||
    settings.branding?.logoUrlDark ||
    `${SITE_URL}/logo-text.png`

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    applicationName: title,
    authors: [{ name: title }],
    generator: 'Abundant Global Club',
    keywords: ['Abundant Global Club', 'membership', 'networking', 'Dubai', 'global network'],
    alternates: {
      canonical: '/',
    },
    icons: {
      icon: settings.branding?.faviconUrl || '/favicon.ico',
      apple: settings.branding?.faviconUrl || '/favicon.png',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: SITE_URL,
      siteName: title,
      title,
      description,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: title,
        },
        {
          url: logo,
          alt: `${title} logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image'],
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let initialSettings = getDefaultSettings();
  try {
    initialSettings = await getPublicSettings();
  } catch (error) {
    console.error('[layout] Failed to load public settings:', error);
  }

  const faviconUrl = initialSettings.branding?.faviconUrl || '/favicon.ico';
  const title = initialSettings.siteName || 'Abundant Global Club';
  const description = initialSettings.description || 'A Global Network of Success';
  const ogImage = `${SITE_URL}/opengraph-image`;

  return (
    <html lang="en" className={`${cormorantGaramond.variable} ${inter.variable} dark`}>
      <head>
        <link rel="icon" href={faviconUrl} />
        <link rel="apple-touch-icon" href={faviconUrl} />
        {/* Explicit OG tags for crawlers that skim <head> early (WhatsApp, etc.) */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={title} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={title} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        {initialSettings.branding?.logoUrl ? (
          <link rel="preload" as="image" href={initialSettings.branding.logoUrl} />
        ) : null}
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <AppProviders initialSettings={initialSettings}>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AppProviders>
      </body>
    </html>
  )
}
