'use client';

import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';
import { getDefaultLegalPages } from '@/lib/content-page-defaults';
import { LegalDocumentView } from '@/components/legal-document-view';

export default function TermsPage() {
  const { settings } = useSettings();
  const { t } = useLanguage();
  const legal = settings?.legalPages ?? getDefaultLegalPages();
  return (
    <LegalDocumentView
      doc={{
        ...legal.terms,
        title: t('legal.termsTitle', legal.terms.title || 'Terms of Service'),
      }}
    />
  );
}
