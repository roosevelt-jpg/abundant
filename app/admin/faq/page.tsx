'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Pencil, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import { FaqItem } from '@/lib/types';
import { getAllFaqs, createFaq, updateFaq, deleteFaq, reorderFaqs } from '@/lib/faq-service';

export default function AdminFaqPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [form, setForm] = useState({ question: '', answer: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userData && !hasPermission(userData, 'faq') && userData.role !== 'super_admin') {
      router.push('/admin/dashboard');
      return;
    }
    loadFaqs();
  }, [userData, router]);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      setFaqs(await getAllFaqs());
    } catch {
      setError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ question: '', answer: '' });
    setShowModal(true);
  };

  const openEdit = (faq: FaqItem) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      setError('Question and answer are required');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      if (editing) {
        await updateFaq(editing.id, { question: form.question.trim(), answer: form.answer.trim() });
      } else {
        await createFaq(
          { question: form.question.trim(), answer: form.answer.trim(), isPublished: false },
          userData?.uid
        );
      }
      setShowModal(false);
      await loadFaqs();
    } catch {
      setError('Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (faq: FaqItem) => {
    await updateFaq(faq.id, { isPublished: !faq.isPublished });
    await loadFaqs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    await deleteFaq(id);
    await loadFaqs();
  };

  const moveFaq = async (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= faqs.length) return;
    const ids = faqs.map((f) => f.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    await reorderFaqs(ids);
    await loadFaqs();
  };

  if (userData && !hasPermission(userData, 'faq') && userData.role !== 'super_admin') {
    return <div className="text-center py-12 text-muted-foreground">You do not have permission to manage FAQs</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">FAQ Management</h1>
          <p className="text-muted-foreground">Create and publish questions and answers for the public FAQ page</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold"
        >
          <Plus className="w-5 h-5" /> Add FAQ
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border max-w-lg w-full p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-heading font-bold">{editing ? 'Edit FAQ' : 'New FAQ'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Question</label>
                <input
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                  placeholder="What is Abundant Global Club?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Answer</label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                  placeholder="Abundant Global Club is..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading FAQs...</p>
      ) : faqs.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No FAQs yet. Add your first question.</p>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={faq.id} className="p-5 bg-card rounded-xl border border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${faq.isPublished ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-500'}`}>
                      {faq.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => moveFaq(index, -1)} disabled={index === 0} className="p-1.5 border border-border rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => moveFaq(index, 1)} disabled={index === faqs.length - 1} className="p-1.5 border border-border rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                  <button onClick={() => openEdit(faq)} className="p-1.5 border border-border rounded"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => togglePublish(faq)} className="p-1.5 border border-border rounded" title={faq.isPublished ? 'Unpublish' : 'Publish'}>
                    {faq.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(faq.id)} className="p-1.5 border border-destructive/20 rounded text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
