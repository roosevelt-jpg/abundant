'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { createPage, getAllPages, updatePage, deletePage } from '@/lib/db-service';
import { Page } from '@/lib/types';

export default function AdminPagesEditor() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Page>>({});
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const allPages = await getAllPages();
      setPages(allPages);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (page: Page) => {
    setEditingId(page.id);
    setEditingData(page);
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      await updatePage(editingId, editingData);
      await loadPages();
      setEditingId(null);
      setEditingData({});
    } catch (error) {
      console.error('Error saving page:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    try {
      await deletePage(id);
      await loadPages();
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await createPage({
        title: 'New Page',
        slug: 'new-page',
        content: '',
        isPublished: false,
        createdBy: 'admin'
      });
      await loadPages();
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating page:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading pages...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Pages Management</h1>
          <p className="text-muted-foreground">Create and manage website pages with live Firestore sync</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Page
        </button>
      </div>

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
                    onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slug</label>
                  <input
                    type="text"
                    value={editingData.slug || ''}
                    onChange={(e) => setEditingData({ ...editingData, slug: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
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
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg font-semibold hover:bg-destructive/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-lg mb-2">{page.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">/{page.slug}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{page.content}</p>
                  <div className="mt-3">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                      page.isPublished
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-yellow-500/10 text-yellow-600'
                    }`}>
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
            No pages yet. Create your first page to get started.
          </div>
        )}
      </div>
    </div>
  );
}
