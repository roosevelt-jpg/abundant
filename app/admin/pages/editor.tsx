'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { getAllPages, updatePage, deletePage } from '@/lib/db-service';
import { Page } from '@/lib/types';
import { useApiAuth } from '@/hooks/useApiAuth';
import {
  isPlaceholderPageSlug,
  resolvePageSlug,
  slugifyPageTitle,
} from '@/lib/page-slug';

export default function AdminPagesEditor() {
  const { authFetch } = useApiAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Page>>({});
  const [slugLocked, setSlugLocked] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      setError(null);
      let allPages = await getAllPages();

      // Migrate legacy page-{timestamp} URLs to title-based slugs
      const taken = allPages.map((p) => p.slug);
      let migrated = false;
      for (const page of allPages) {
        if (!isPlaceholderPageSlug(page.slug)) continue;
        const nextSlug = resolvePageSlug({
          title: page.title || 'page',
          existingSlugs: taken.filter((s) => s !== page.slug),
          forceFromTitle: true,
        });
        if (nextSlug !== page.slug) {
          await updatePage(page.id, { slug: nextSlug });
          const idx = taken.indexOf(page.slug);
          if (idx >= 0) taken[idx] = nextSlug;
          migrated = true;
        }
      }
      if (migrated) allPages = await getAllPages();

      setPages(allPages);
    } catch (err) {
      console.error('Error loading pages:', err);
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (page: Page) => {
    setEditingId(page.id);
    const data = { ...page };
    if (isPlaceholderPageSlug(page.slug)) {
      data.slug = resolvePageSlug({
        title: page.title,
        existingSlugs: pages.filter((p) => p.id !== page.id).map((p) => p.slug),
        forceFromTitle: true,
      });
      setSlugLocked(false);
    } else {
      setSlugLocked(true);
    }
    setEditingData(data);
  };

  const handleTitleChange = (title: string) => {
    const next: Partial<Page> = { ...editingData, title };
    if (!slugLocked || isPlaceholderPageSlug(editingData.slug)) {
      next.slug = slugifyPageTitle(title);
      setSlugLocked(false);
    }
    setEditingData(next);
  };

  const handleSlugChange = (slug: string) => {
    setSlugLocked(true);
    setEditingData({ ...editingData, slug: slugifyPageTitle(slug) || slug });
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      setError(null);
      const title = (editingData.title || '').trim() || 'Untitled';
      const slug = resolvePageSlug({
        title,
        slug: editingData.slug,
        existingSlugs: pages.filter((p) => p.id !== editingId).map((p) => p.slug),
        forceFromTitle: isPlaceholderPageSlug(editingData.slug),
      });
      await updatePage(editingId, { ...editingData, title, slug });
      await loadPages();
      setEditingId(null);
      setEditingData({});
      setSlugLocked(false);
    } catch (err) {
      console.error('Error saving page:', err);
      setError('Failed to save page');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    try {
      setError(null);
      await deletePage(id);
      await loadPages();
    } catch (err) {
      console.error('Error deleting page:', err);
      setError('Failed to delete page');
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      setError(null);
      const res = await authFetch('/api/admin/pages', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Page' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create page');
      }
      const page: Page = await res.json();
      await loadPages();
      setEditingId(page.id);
      setEditingData(page);
      setSlugLocked(false);
    } catch (err) {
      console.error('Error creating page:', err);
      setError(err instanceof Error ? err.message : 'Failed to create page');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading pages...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Pages Management</h1>
          <p className="text-muted-foreground">Create and manage website pages — URLs use the page name</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          {creating ? 'Creating...' : 'Create Page'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {pages.map((page) => (
          <div key={page.id} className="p-6 bg-card rounded-xl border border-border">
            {editingId === page.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={editingData.title || ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">URL slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/</span>
                    <input
                      type="text"
                      value={editingData.slug || ''}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                      placeholder="privacy-policy"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-fills from the title. Edit to customize; reserved routes get a unique suffix.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    value={editingData.content || ''}
                    onChange={(e) => setEditingData({ ...editingData, content: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    rows={6}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Footer Placement</label>
                    <select
                      value={editingData.footerPlacement || 'none'}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          footerPlacement: e.target.value as Page['footerPlacement'],
                        })
                      }
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                    >
                      <option value="none">None</option>
                      <option value="platform">Platform</option>
                      <option value="company">Company</option>
                      <option value="connect">Connect</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Navbar Placement</label>
                    <select
                      value={editingData.navPlacement || 'none'}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          navPlacement: e.target.value as Page['navPlacement'],
                        })
                      }
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                    >
                      <option value="none">None</option>
                      <option value="top-level">Top-level nav item</option>
                      <option value="home">Under Home</option>
                      <option value="about">Under About</option>
                      <option value="events">Under Events</option>
                      <option value="membership">Under Membership</option>
                      <option value="contact">Under Contact</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingData.isPublished || false}
                    onChange={(e) => setEditingData({ ...editingData, isPublished: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">Published</label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg font-semibold hover:bg-green-500/20 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditingData({});
                      setSlugLocked(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg font-semibold hover:bg-destructive/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-lg mb-2">{page.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2 font-mono">/{page.slug}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{page.content}</p>
                  <div className="mt-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                        page.isPublished
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-yellow-500/10 text-yellow-600'
                      }`}
                    >
                      {page.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(page)}
                    className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5 text-accent" />
                  </button>
                  <button
                    onClick={() => handleDelete(page.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {pages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No pages yet. Click &quot;Create Page&quot; to get started.
          </div>
        )}
      </div>
    </div>
  );
}
