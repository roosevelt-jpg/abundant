'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { FaqItem } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/faqs')
      .then((r) => r.json())
      .then(setFaqs)
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about Abundant Global Club
            </p>
          </div>
        </section>

        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : faqs.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No FAQs published yet. Check back soon.</p>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq) => {
                  const isOpen = openId === faq.id;
                  return (
                    <div key={faq.id} className="bg-card rounded-xl border border-border overflow-hidden">
                      <button
                        onClick={() => setOpenId(isOpen ? null : faq.id)}
                        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-accent/5 transition-colors"
                      >
                        <span className="font-semibold">{faq.question}</span>
                        {isOpen ? <ChevronUp className="w-5 h-5 flex-shrink-0 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 flex-shrink-0 text-muted-foreground" />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-muted-foreground text-sm whitespace-pre-wrap border-t border-border pt-4">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
