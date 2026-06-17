'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus, Trash2, Edit, X, Eye, EyeOff } from 'lucide-react';
import type { Page } from '@/lib/types';

export default function AdminPagesEditor() {
  const { currentUser } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPage, setNewPage] = useState({
    title: '',
    slug: '',
    content: '',
    metaDescription: '',
    isPublished: false,
    displayLocation: 'custom' as const
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pages');
      if (response.ok) {
        const data = await response.json();
        setPages(data);
      }
    } catch (error) {
      console.error('[v0] Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    return await currentUser?.getIdToken();
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleSavePage = async () => {
    if (!newPage.title || !newPage.content) {
      alert('Please fill in title and content');
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        alert('Not authenticated');
        return;
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/pages/${editingId}` : '/api/pages';

      const pageData = {
        ...newPage,
        slug: newPage.slug || generateSlug(newPage.title)
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(pageData),
      });

      if (response.ok) {
        await fetchPages();
        resetForm();
        setShowModal(false);
      } else {
        alert('Failed to save page');
      }
    } catch (error) {
      console.error('[v0] Error saving page:', error);
      alert('Error saving page');
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/pages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPages(pages.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('[v0] Error deleting page:', error);
    }
  };

  const handlePublish = async (id: string, currentStatus: boolean) => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/pages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (response.ok) {
        await fetchPages();
      }
    } catch (error) {
      console.error('[v0] Error updating page:', error);
    }
  };

  const handleEdit = (page: Page) => {
    setEditingId(page.id);
    setNewPage({
      title: page.title,
      slug: page.slug,
      content: page.content,
      metaDescription: page.metaDescription || '',
      isPublished: page.isPublished,
      displayLocation: page.displayLocation || 'custom'
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setNewPage({
      title: '',
      slug: '',
      content: '',
      metaDescription: '',
      isPublished: false,
      displayLocation: 'custom'
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Pages Management</h1>
          <p className="text-muted-foreground">Create and manage website pages with live Firestore sync</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Page
        </button>
      </div>

      {/* Create/Edit Page Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg">{editingId ? 'Edit' : 'Create'} Page</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-background rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Page Title</label>
                <input
                  type="text"
                  value={newPage.title}
                  onChange={(e) => {
                    setNewPage({ ...newPage, title: e.target.value });
                    if (!editingId && !newPage.slug) {
                      setNewPage((prev) => ({ ...prev, slug: generateSlug(e.target.value) }));
                    }
                  }}
                  placeholder="Page title"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug (URL path)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/</span>
                  <input
                    type="text"
                    value={newPage.slug}
                    onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                    placeholder="page-slug"
                    className="flex-1 px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Meta Description (SEO)</label>
                <textarea
                  value={newPage.metaDescription}
                  onChange={(e) => setNewPage({ ...newPage, metaDescription: e.target.value })}
                  placeholder="Brief description for search engines..."
                  rows={2}
                  maxLength={160}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-muted-foreground mt-1">{newPage.metaDescription.length}/160</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Page Content</label>
                <textarea
                  value={newPage.content}
                  onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
                  placeholder="Page content (supports Markdown)..."
                  rows={8}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Display Location</label>
                <select
                  value={newPage.displayLocation}
                  onChange={(e) => setNewPage({ ...newPage, displayLocation: e.target.value as any })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="custom">Custom URL only</option>
                  <option value="footer">Footer</option>
                  <option value="navigation">Navigation Menu</option>
                  <option value="both">Footer & Navigation</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPage.isPublished}
                  onChange={(e) => setNewPage({ ...newPage, isPublished: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Publish page publicly</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePage}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 bg-muted rounded-lg animate-pulse h-24"></div>
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No pages yet. Create your first page to get started.</p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90"
          >
            Create First Page
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`p-6 bg-card rounded-lg border transition-colors ${
                page.isPublished
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-gray-500/20 bg-gray-500/5'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{page.title}</h3>
                    <code className="text-xs bg-muted px-2 py-1 rounded">/{page.slug}</code>
                  </div>
                  <p className="text-sm text-muted-foreground">{page.metaDescription}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${
                  page.isPublished
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-gray-500/10 text-gray-600'
                }`}>
                  {page.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="text-xs text-muted-foreground mb-4 p-3 bg-muted rounded">
                <p className="line-clamp-2">{page.content}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(page)}
                  className="flex-1 flex items-center justify-center gap-2 p-2 border border-border rounded-lg hover:bg-accent/10 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handlePublish(page.id, page.isPublished)}
                  className="flex-1 flex items-center justify-center gap-2 p-2 border border-border rounded-lg hover:bg-accent/10 transition-colors text-sm font-medium"
                >
                  {page.isPublished ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Publish
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeletePage(page.id)}
                  className="flex-1 flex items-center justify-center gap-2 p-2 border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors text-sm font-medium text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

