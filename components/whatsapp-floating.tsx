'use client';

import { useSettings } from '@/hooks/useSettings';
import { WhatsAppButton } from '@/components/whatsapp-button';

export function WhatsAppFloating() {
  const { settings } = useSettings();
  return <WhatsAppButton settings={settings} />;
}
