import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { ChatbotWidget } from '@/components/chatbot-widget';
import { WhatsAppFloating } from '@/components/whatsapp-floating';
import { getPublicSettings } from '@/lib/settings-server'
import { getDefaultSettings } from '@/lib/db-service'

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

export const metadata: Metadata = {
  title: 'Abundant Global Club',
  description: 'A Global Network of Success',
  generator: 'v0.app',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
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

  return (
    <html lang="en" className={`${cormorantGaramond.variable} ${inter.variable} dark`}>
      <head>
        {initialSettings.branding?.logoUrl ? (
          <link rel="preload" as="image" href={initialSettings.branding.logoUrl} />
        ) : null}
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <AuthProvider>
          <SettingsProvider initialSettings={initialSettings}>
            <ThemeProvider>
              <LanguageProvider>
                {children}
                <ChatbotWidget />
                <WhatsAppFloating />
                {process.env.NODE_ENV === 'production' && <Analytics />}
              </LanguageProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
