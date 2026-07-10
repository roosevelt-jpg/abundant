'use client';

import { ReactNode } from 'react';
import { Settings } from '@/lib/types';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { FirebaseBootstrap } from '@/components/firebase-bootstrap';
import { FirebaseConfigSync } from '@/components/firebase-config-sync';
import { ChatbotWidget } from '@/components/chatbot-widget';
import { WhatsAppFloating } from '@/components/whatsapp-floating';
import { PushNotificationProvider } from '@/components/push-notification-provider';

export function AppProviders({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: Settings;
}) {
  return (
    <AuthProvider>
      <SettingsProvider initialSettings={initialSettings}>
        <FirebaseBootstrap initialSettings={initialSettings} />
        <FirebaseConfigSync />
        <ThemeProvider>
          <LanguageProvider>
            <PushNotificationProvider />
            {children}
            <ChatbotWidget />
            <WhatsAppFloating />
          </LanguageProvider>
        </ThemeProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
