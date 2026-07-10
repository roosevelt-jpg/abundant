'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ContentHero } from '@/components/content-page-hero';
import { useSettings } from '@/hooks/useSettings';
import { getDefaultPressPage } from '@/lib/content-page-defaults';
import { PressItem } from '@/lib/types';
import { ExternalLink, Download } from 'lucide-react';

export default function PressPage() {
  const { settings } = useSettings();
  const page = settings?.pressPage ?? getDefaultPressPage();
  const [items, setItems] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/press')
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ContentHero eyebrow={page.hero.eyebrow} headline={page.hero.headline} subtext={page.hero.subtext} />

        <section className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl font-bold mb-6">{page.inThePressTitle}</h2>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground">No press coverage listed yet.</p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl hover:border-accent transition-colors"
                  >
                    {item.outletLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.outletLogoUrl} alt="" className="w-12 h-12 object-contain rounded bg-white p-1" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gradient-to-br from-[#001F3F] to-[#B8973A] flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-bold mb-1">{item.headline}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.outletName}
                        {item.dateLabel ? `, ${item.dateLabel}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-accent font-semibold inline-flex items-center gap-1 flex-shrink-0">
                      Read article <ExternalLink className="w-3 h-3" />
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-10 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl font-bold mb-2">{page.mediaKitTitle}</h2>
            <p className="text-sm text-muted-foreground mb-6">{page.mediaKitBody}</p>
            <div className="flex flex-wrap gap-3">
              {(page.mediaKitDownloads || []).map((d) =>
                d.url ? (
                  <a
                    key={d.id}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:border-accent"
                  >
                    <Download className="w-4 h-4 text-accent" /> {d.label}
                  </a>
                ) : (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground opacity-60"
                  >
                    <Download className="w-4 h-4" /> {d.label}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        <section className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl font-bold mb-3">{page.boilerplateTitle}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{page.boilerplate}</p>
          </div>
        </section>

        <section className="py-10 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-2xl font-bold mb-2">{page.mediaContactTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{page.mediaContactBody}</p>
            <a href={`mailto:${page.mediaContactEmail}`} className="text-accent font-semibold">
              {page.mediaContactEmail}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
