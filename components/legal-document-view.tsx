'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { LegalDocumentContent } from '@/lib/types';

export function LegalDocumentView({ doc }: { doc: LegalDocumentContent }) {
  const sections = [...(doc.sections || [])].sort((a, b) => a.order - b.order);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">{doc.title}</h1>
            <p className="text-sm text-muted-foreground">Effective date: {doc.effectiveDate}</p>
            {doc.intro && (
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed whitespace-pre-wrap">{doc.intro}</p>
            )}
          </div>
        </section>
        <section className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {sections.map((section) => (
              <div key={section.id}>
                <h2 className="font-heading text-xl font-bold mb-2">{section.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{section.body}</p>
              </div>
            ))}
            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Contact:{' '}
                <a href={`mailto:${doc.contactEmail}`} className="text-accent font-semibold">
                  {doc.contactEmail}
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
