'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ContentPage } from '@/lib/types';

export const AboutDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'contentPages'),
          where('isPublished', '==', true)
        );
        const snapshot = await getDocs(q);
        const pagesData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as ContentPage))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setPages(pagesData);
      } catch (error) {
        console.error('[v0] Error fetching content pages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  if (!pages || pages.length === 0) {
    return (
      <Link href="/about" className="text-sm hover:text-accent transition-colors text-white">
        About
      </Link>
    );
  }

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1 text-sm hover:text-accent transition-colors text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        About
        <ChevronDown className="w-4 h-4" />
      </button>

      <div className="absolute left-0 mt-0 w-48 bg-navy-footer border border-accent/20 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <Link
          href="/about"
          className="block px-4 py-2 text-sm text-white hover:bg-accent/10 hover:text-accent transition-colors first:rounded-t-lg"
        >
          About Main
        </Link>

        {pages.map((page) => (
          <Link
            key={page.id}
            href={`/about/${page.slug}`}
            className="block px-4 py-2 text-sm text-white hover:bg-accent/10 hover:text-accent transition-colors last:rounded-b-lg"
          >
            {page.navLabel || page.title}
          </Link>
        ))}
      </div>
    </div>
  );
};
