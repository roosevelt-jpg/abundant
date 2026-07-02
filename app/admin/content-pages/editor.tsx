'use client';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { ContentPage } from '@/lib/types';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Edit, Trash2, Plus, Eye, EyeOff } from 'lucide-react';

export default function ContentPageEditor() {
  const { currentUser, userData } = useAuth();
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPage, setNewPage] = useState<{
    title: string;
    slug: string;
    subtitle: string;
    description: string;
    navLabel: string;
    category: 'about' | 'what-we-do' | 'why-agc' | 'leadership' | 'careers' | 'custom';
    isPublished: boolean;
    order: number;
  }>({
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    navLabel: '',
    category: 'about',
    isPublished: false,
    order: 0,
  });

  const categories = [
    { value: 'about', label: 'About' },
    { value: 'what-we-do', label: 'What We Do' },
    { value: 'why-agc', label: 'Why AGC' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'careers', label: 'Careers' },
    { value: 'custom', label: 'Custom Page' },
  ];

  if (!currentUser || userData?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const pagesRef = collection(db, 'contentPages');
      const snapshot = await getDocs(pagesRef);
      const pagesData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as ContentPage))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setPages(pagesData);
    } catch (error) {
      console.error('[v0] Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleCreate = () => {
    setEditingId(null);
    setNewPage({
      title: '',
      slug: '',
      subtitle: '',
      description: '',
      navLabel: '',
      category: 'about',
      isPublished: false,
      order: pages.length,
    });
    setShowModal(true);
  };

  const handleEdit = (page: ContentPage) => {
    setEditingId(page.id);
    setNewPage({
      title: page.title,
      slug: page.slug,
      subtitle: page.subtitle || '',
      description: page.description || '',
      navLabel: page.navLabel,
      category: page.category,
      isPublished: page.isPublished,
      order: page.order,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!newPage.title || !newPage.slug || !newPage.navLabel) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        const pageRef = doc(db, 'contentPages', editingId);
        await updateDoc(pageRef, {
          ...newPage,
          updatedAt: serverTimestamp(),
        });
      } else {
        const pageRef = doc(collection(db, 'contentPages'));
        await setDoc(pageRef, {
          ...newPage,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setShowModal(false);
      loadPages();
    } catch (error) {
      console.error('[v0] Error saving page:', error);
      alert('Failed to save page');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'contentPages', id));
      loadPages();
    } catch (error) {
      console.error('[v0] Error deleting page:', error);
    }
  };

  const handleTogglePublish = async (page: ContentPage) => {
    try {
      const pageRef = doc(db, 'contentPages', page.id);
      await updateDoc(pageRef, {
        isPublished: !page.isPublished,
        updatedAt: serverTimestamp(),
      });
      loadPages();
    } catch (error) {
      console.error('[v0] Error toggling publish:', error);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading pages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Pages</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
        >
          <Plus className="w-4 h-4" />
          New Page
        </button>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((page) => (
          <div key={page.id} className="p-4 bg-card rounded-lg border border-border hover:border-accent/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{page.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {categories.find((c) => c.value === page.category)?.label} • {page.navLabel}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                page.isPublished
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-gray-500/10 text-gray-600'
              }`}>
                {page.isPublished ? '✓ Published' : '• Draft'}
              </span>
            </div>

            {page.subtitle && (
              <p className="text-sm text-muted-foreground mb-2">{page.subtitle}</p>
            )}

            {page.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{page.description}</p>
            )}

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => handleTogglePublish(page)}
                className="flex items-center gap-1 px-3 py-2 text-xs rounded hover:bg-muted transition-colors"
              >
                {page.isPublished ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    Publish
                  </>
                )}
              </button>
              <button
                onClick={() => handleEdit(page)}
                className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-500/10 text-blue-600 rounded hover:bg-blue-500/20 transition-colors"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(page.id)}
                className="flex items-center gap-1 px-3 py-2 text-xs bg-red-500/10 text-red-600 rounded hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Page' : 'Create New Page'}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Page Title *</label>
                  <input
                    type="text"
                    value={newPage.title}
                    onChange={(e) => {
                      setNewPage({
                        ...newPage,
                        title: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }}
                    placeholder="e.g., About Abundant"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Navigation Label *</label>
                  <input
                    type="text"
                    value={newPage.navLabel}
                    onChange={(e) => setNewPage({ ...newPage, navLabel: e.target.value })}
                    placeholder="e.g., About Us"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={newPage.slug}
                    onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="auto-generated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={newPage.category}
                    onChange={(e) => setNewPage({ ...newPage, category: e.target.value as any })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={newPage.subtitle}
                    onChange={(e) => setNewPage({ ...newPage, subtitle: e.target.value })}
                    placeholder="Page subtitle (optional)"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newPage.description}
                    onChange={(e) => setNewPage({ ...newPage, description: e.target.value })}
                    placeholder="Page description (optional)"
                    rows={4}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Display Order</label>
                  <input
                    type="number"
                    value={newPage.order}
                    onChange={(e) => setNewPage({ ...newPage, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPage.isPublished}
                    onChange={(e) => setNewPage({ ...newPage, isPublished: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Publish immediately</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  {editingId ? 'Update' : 'Create'} Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
