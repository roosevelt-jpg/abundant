'use client';

import { useSettings } from '@/hooks/useSettings';
import { getDefaultLegalPages } from '@/lib/content-page-defaults';
import { LegalDocumentView } from '@/components/legal-document-view';

export default function PrivacyPage() {
  const { settings } = useSettings();
  const legal = settings?.legalPages ?? getDefaultLegalPages();
  return <LegalDocumentView doc={legal.privacy} />;
}
