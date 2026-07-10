'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getPageBySlug } from '@/lib/db-service';
import { getFormByPlacement } from '@/lib/forms-service';
import { CustomFormRenderer } from '@/components/custom-form-renderer';
import { Page, CustomForm } from '@/lib/types';
import Link from 'next/link';

import { RESERVED_PAGE_SLUGS } from '@/lib/page-slug';

const RESERVED = Array.from(RESERVED_PAGE_SLUGS);

export default function DynamicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState<Page | null>(null);
  const [form, setForm] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (RESERVED.includes(slug)) {
      setNotFoundState(true);
      return;
    }
    Promise.all([
      getPageBySlug(slug),
      getFormByPlacement(slug),
    ]).then(([p, f]) => {
      if (!p || !p.isPublished) setNotFoundState(true);
      else setPage(p);
      setForm(f);
      setLoading(false);
    }).catch(() => {
      setNotFoundState(true);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (notFoundState || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        <Link href="/" className="text-accent">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">{page.title}</h1>
            {page.seo?.description && <p className="text-lg text-muted-foreground">{page.seo.description}</p>}
          </div>
        </section>
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto prose prose-invert">
            <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{page.content}</div>
          </div>
          {form && (
            <div className="max-w-lg mx-auto mt-12 p-6 bg-card rounded-xl border border-border">
              <CustomFormRenderer form={form} />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
