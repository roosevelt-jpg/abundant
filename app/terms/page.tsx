'use client';

import { useSettings } from '@/hooks/useSettings';
import { getDefaultLegalPages } from '@/lib/content-page-defaults';
import { LegalDocumentView } from '@/components/legal-document-view';

export default function TermsPage() {
  const { settings } = useSettings();
  const legal = settings?.legalPages ?? getDefaultLegalPages();
  return <LegalDocumentView doc={legal.terms} />;
}
