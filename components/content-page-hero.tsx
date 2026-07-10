'use client';

import Link from 'next/link';

export function ContentHero({
  eyebrow,
  headline,
  subtext,
}: {
  eyebrow: string;
  headline: string;
  subtext: string;
}) {
  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#001F3F] via-[#0a2a4a] to-[#1a3a2a]">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#B8973A] mb-3 uppercase">{eyebrow}</p>
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">{headline}</h1>
        <p className="text-base sm:text-lg text-gray-200 leading-relaxed">{subtext}</p>
      </div>
    </section>
  );
}

export function ContentCtaBlock({
  title,
  body,
  buttonText,
  buttonLink,
}: {
  title: string;
  body: string;
  buttonText: string;
  buttonLink: string;
}) {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center border border-border rounded-xl p-8 bg-card">
        <h2 className="font-heading text-2xl font-bold mb-3">{title}</h2>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed whitespace-pre-wrap">{body}</p>
        <Link
          href={buttonLink}
          className="inline-flex px-5 py-2.5 bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white rounded-lg text-sm font-semibold"
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}
