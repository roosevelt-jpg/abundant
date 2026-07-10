'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ContentCtaBlock, ContentHero } from '@/components/content-page-hero';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import { getDefaultResourcesPage } from '@/lib/content-page-defaults';
import { ResourceItem } from '@/lib/types';
import { Lock, Download, FileText } from 'lucide-react';

export default function ResourcesPage() {
  const { settings } = useSettings();
  const { userData } = useAuth();
  const page = settings?.resourcesPage ?? getDefaultResourcesPage();
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<ResourceItem | null>(null);
  const isMember = !!userData && (userData.role === 'member' || userData.role === 'admin' || userData.role === 'super_admin');

  useEffect(() => {
    fetch('/api/public/resources')
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['All', ...(page.categories || [])], [page.categories]);

  const filtered = useMemo(() => {
    if (category === 'All') return items;
    return items.filter((i) => i.category === category);
  }, [items, category]);

  const canView = (item: ResourceItem) => item.access === 'public' || isMember;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ContentHero eyebrow={page.hero.eyebrow} headline={page.hero.headline} subtext={page.hero.subtext} />

        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    category === c
                      ? 'bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white border-transparent'
                      : 'border-border text-muted-foreground hover:border-accent'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No resources published yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className="text-left p-5 bg-card border border-border rounded-xl hover:border-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-heading font-bold text-base">{item.title}</h3>
                      {item.access === 'members' && <Lock className="w-4 h-4 text-accent flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.category}
                      {item.access === 'members' ? ' · Members only' : ' · Public'}
                      {item.readTime ? ` · ${item.readTime}` : ''}
                      {item.format === 'download' ? ' · Download' : ''}
                      {item.format === 'photo_essay' ? ' · Photo essay' : ''}
                    </p>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.summary}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <ContentCtaBlock
          title={page.submitCta.title}
          body={
            settings?.contactEmail
              ? `${page.submitCta.body} Contact ${settings.contactEmail}.`
              : page.submitCta.body
          }
          buttonText={page.submitCta.buttonText}
          buttonLink={page.submitCta.buttonLink}
        />
      </main>
      <Footer />

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="font-heading text-xl font-bold mb-2">{selected.title}</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {selected.category}
              {selected.access === 'members' ? ' · Members only' : ' · Public'}
              {selected.readTime ? ` · ${selected.readTime}` : ''}
            </p>

            {!canView(selected) ? (
              <div className="text-center py-6">
                <Lock className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-heading font-bold mb-2">{page.lockedTitle}</h3>
                <p className="text-sm text-muted-foreground mb-4">{page.lockedBody}</p>
                <Link
                  href={page.lockedCtaLink}
                  className="inline-flex px-4 py-2 bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white rounded-lg text-sm font-semibold"
                >
                  {page.lockedCtaText}
                </Link>
              </div>
            ) : (
              <div>
                {selected.body && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">{selected.body}</p>
                )}
                {selected.format === 'download' && selected.downloadUrl && (
                  <a
                    href={selected.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-semibold"
                  >
                    <Download className="w-4 h-4" /> Download (PDF)
                  </a>
                )}
                {selected.format !== 'download' && !selected.body && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Full content coming soon.
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-6 w-full py-2 border border-border rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
