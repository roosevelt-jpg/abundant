'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Pencil, X, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import { ResourceAccess, ResourceFormat, ResourceItem, ResourcesPageContent, Settings } from '@/lib/types';
import {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
} from '@/lib/resources-service';
import { useSettings } from '@/hooks/useSettings';
import { useApiAuth } from '@/hooks/useApiAuth';
import { getDefaultResourcesPage } from '@/lib/content-page-defaults';

const EMPTY_ITEM = {
  title: '',
  category: 'Playbooks',
  summary: '',
  body: '',
  access: 'public' as ResourceAccess,
  format: 'article' as ResourceFormat,
  readTime: '',
  downloadUrl: '',
  isPublished: false,
};

export default function AdminResourcesPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const { settings: live, retry } = useSettings();
  const { authFetch } = useApiAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [tab, setTab] = useState<'page' | 'items'>('page');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ResourceItem | null>(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (userData && !hasPermission(userData, 'resources') && userData.role !== 'super_admin') {
      router.push('/admin/dashboard');
      return;
    }
    loadItems();
  }, [userData, router]);

  useEffect(() => {
    if (live && !dirty) setSettings(live);
  }, [live, dirty]);

  const page: ResourcesPageContent = settings?.resourcesPage ?? getDefaultResourcesPage();

  const loadItems = async () => {
    try {
      setItems(await getAllResources());
    } catch {
      setMsg('Failed to load resources');
    }
  };

  const updatePage = (partial: Partial<ResourcesPageContent>) => {
    setDirty(true);
    setSettings((prev) =>
      prev
        ? { ...prev, resourcesPage: { ...page, ...partial, updatedAt: Date.now() } }
        : prev
    );
  };

  const savePage = async () => {
    if (!settings?.resourcesPage) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ resourcesPage: settings.resourcesPage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSettings((prev) => (prev ? { ...prev, resourcesPage: data.resourcesPage } : prev));
      setDirty(false);
      retry();
      setMsg('Page content saved');
    } catch {
      setMsg('Error saving page');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_ITEM, category: page.categories[0] || 'Playbooks' });
    setShowModal(true);
  };

  const openEdit = (item: ResourceItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      category: item.category,
      summary: item.summary || '',
      body: item.body || '',
      access: item.access,
      format: item.format,
      readTime: item.readTime || '',
      downloadUrl: item.downloadUrl || '',
      isPublished: item.isPublished,
    });
    setShowModal(true);
  };

  const handleSaveItem = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        summary: form.summary.trim() || undefined,
        body: form.body.trim() || undefined,
        access: form.access,
        format: form.format,
        readTime: form.readTime.trim() || undefined,
        downloadUrl: form.downloadUrl.trim() || undefined,
        isPublished: form.isPublished,
      };
      if (editing) await updateResource(editing.id, payload);
      else await createResource(payload);
      setShowModal(false);
      await loadItems();
    } catch {
      setMsg('Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  if (userData && !hasPermission(userData, 'resources') && userData.role !== 'super_admin') {
    return <div className="text-center py-12 text-muted-foreground">No permission</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1">Resources</h1>
          <p className="text-muted-foreground text-sm">Edit /resources page copy and library items</p>
        </div>
        {tab === 'items' && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold">
            <Plus className="w-5 h-5" /> Add resource
          </button>
        )}
        {tab === 'page' && (
          <button onClick={savePage} disabled={saving || !dirty} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50">
            <Save className="w-5 h-5" /> Save page
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(['page', 'items'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-accent text-accent-foreground' : 'border border-border'}`}
          >
            {t === 'page' ? 'Page content' : 'Library items'}
          </button>
        ))}
      </div>

      {msg && <p className="mb-4 text-sm text-accent">{msg}</p>}

      {tab === 'page' && (
        <div className="space-y-4 max-w-2xl">
          <Field label="Eyebrow" value={page.hero.eyebrow} onChange={(v) => updatePage({ hero: { ...page.hero, eyebrow: v } })} />
          <Field label="Headline" value={page.hero.headline} onChange={(v) => updatePage({ hero: { ...page.hero, headline: v } })} />
          <TextArea label="Subtext" value={page.hero.subtext} onChange={(v) => updatePage({ hero: { ...page.hero, subtext: v } })} />
          <Field
            label="Categories (comma-separated)"
            value={page.categories.join(', ')}
            onChange={(v) =>
              updatePage({
                categories: v.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
          />
          <Field label="Locked title" value={page.lockedTitle} onChange={(v) => updatePage({ lockedTitle: v })} />
          <TextArea label="Locked body" value={page.lockedBody} onChange={(v) => updatePage({ lockedBody: v })} />
          <Field label="Locked CTA text" value={page.lockedCtaText} onChange={(v) => updatePage({ lockedCtaText: v })} />
          <Field label="Locked CTA link" value={page.lockedCtaLink} onChange={(v) => updatePage({ lockedCtaLink: v })} />
          <Field label="Submit CTA title" value={page.submitCta.title} onChange={(v) => updatePage({ submitCta: { ...page.submitCta, title: v } })} />
          <TextArea label="Submit CTA body" value={page.submitCta.body} onChange={(v) => updatePage({ submitCta: { ...page.submitCta, body: v } })} />
          <Field label="Submit CTA button" value={page.submitCta.buttonText} onChange={(v) => updatePage({ submitCta: { ...page.submitCta, buttonText: v } })} />
          <Field label="Submit CTA link" value={page.submitCta.buttonLink} onChange={(v) => updatePage({ submitCta: { ...page.submitCta, buttonLink: v } })} />
        </div>
      )}

      {tab === 'items' && (
        <div className="space-y-3">
          {items.length === 0 && <p className="text-muted-foreground text-sm">No resources yet. Add illustrative items like “Raising Your First Fund”.</p>}
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 p-4 bg-card border border-border rounded-lg">
              <div className="min-w-0">
                <p className="font-semibold truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.category} · {item.access} · {item.isPublished ? 'Published' : 'Draft'}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button type="button" onClick={() => updateResource(item.id, { isPublished: !item.isPublished }).then(loadItems)}>
                  {item.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></button>
                <button type="button" onClick={() => confirm('Delete?') && deleteResource(item.id).then(loadItems)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="font-heading font-bold">{editing ? 'Edit resource' : 'New resource'}</h2>
              <button type="button" onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <label className="block text-sm">
                <span className="font-medium mb-1 block">Category</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-input border border-border rounded-lg">
                  {page.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium mb-1 block">Access</span>
                <select value={form.access} onChange={(e) => setForm({ ...form, access: e.target.value as ResourceAccess })} className="w-full px-3 py-2 bg-input border border-border rounded-lg">
                  <option value="public">Public</option>
                  <option value="members">Members only</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium mb-1 block">Format</span>
                <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as ResourceFormat })} className="w-full px-3 py-2 bg-input border border-border rounded-lg">
                  <option value="article">Article</option>
                  <option value="download">Download</option>
                  <option value="photo_essay">Photo essay</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <Field label="Read time / meta" value={form.readTime} onChange={(v) => setForm({ ...form, readTime: v })} />
              <Field label="Download URL" value={form.downloadUrl} onChange={(v) => setForm({ ...form, downloadUrl: v })} />
              <TextArea label="Summary" value={form.summary} onChange={(v) => setForm({ ...form, summary: v })} />
              <TextArea label="Body" value={form.body} onChange={(v) => setForm({ ...form, body: v })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                Published
              </label>
              <button type="button" onClick={handleSaveItem} disabled={saving} className="w-full py-2 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="font-medium mb-1 block">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 bg-input border border-border rounded-lg" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="font-medium mb-1 block">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full px-3 py-2 bg-input border border-border rounded-lg" />
    </label>
  );
}
