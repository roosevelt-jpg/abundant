'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="font-heading text-6xl font-bold mb-4">404</h1>
        <p className="text-2xl text-muted-foreground mb-8">Page not found</p>
        <Link href="/" className="inline-block px-6 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
}
