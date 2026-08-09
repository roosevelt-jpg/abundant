'use client';

import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';
import { getDefaultLegalPages } from '@/lib/content-page-defaults';
import { LegalDocumentView } from '@/components/legal-document-view';

export default function PrivacyPage() {
  const { settings } = useSettings();
  const { t } = useLanguage();
  const legal = settings?.legalPages ?? getDefaultLegalPages();
  return (
    <LegalDocumentView
      doc={{
        ...legal.privacy,
        title: t('legal.privacyTitle', legal.privacy.title || 'Privacy Policy'),
      }}
    />
  );
}
