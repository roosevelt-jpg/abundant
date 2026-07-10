'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Pencil, X, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import { PressItem, PressPageContent, Settings } from '@/lib/types';
import {
  getAllPressItems,
  createPressItem,
  updatePressItem,
  deletePressItem,
} from '@/lib/press-service';
import { useSettings } from '@/hooks/useSettings';
import { useApiAuth } from '@/hooks/useApiAuth';
import { getDefaultPressPage } from '@/lib/content-page-defaults';
import { ImageUpload } from '@/components/image-upload';

const EMPTY_ITEM = {
  outletName: '',
  outletLogoUrl: '',
  headline: '',
  dateLabel: '',
  url: '',
  isPublished: false,
};

export default function AdminPressPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const { settings: live, retry } = useSettings();
  const { authFetch } = useApiAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [items, setItems] = useState<PressItem[]>([]);
  const [tab, setTab] = useState<'page' | 'items'>('page');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PressItem | null>(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (userData && !hasPermission(userData, 'press') && userData.role !== 'super_admin') {
      router.push('/admin/dashboard');
      return;
    }
    loadItems();
  }, [userData, router]);

  useEffect(() => {
    if (live && !dirty) setSettings(live);
  }, [live, dirty]);

  const page: PressPageContent = settings?.pressPage ?? getDefaultPressPage();

  const loadItems = async () => {
    try {
      setItems(await getAllPressItems());
    } catch {
      setMsg('Failed to load press items');
    }
  };

  const updatePage = (partial: Partial<PressPageContent>) => {
    setDirty(true);
    setSettings((prev) =>
      prev ? { ...prev, pressPage: { ...page, ...partial, updatedAt: Date.now() } } : prev
    );
  };

  const savePage = async () => {
    if (!settings?.pressPage) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ pressPage: settings.pressPage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSettings((prev) => (prev ? { ...prev, pressPage: data.pressPage } : prev));
      setDirty(false);
      retry();
      setMsg('Page content saved');
    } catch {
      setMsg('Error saving');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_ITEM);
    setShowModal(true);
  };

  const openEdit = (item: PressItem) => {
    setEditing(item);
    setForm({
      outletName: item.outletName,
      outletLogoUrl: item.outletLogoUrl || '',
      headline: item.headline,
      dateLabel: item.dateLabel,
      url: item.url,
      isPublished: item.isPublished,
    });
    setShowModal(true);
  };

  const handleSaveItem = async () => {
    if (!form.headline.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      const payload = {
        outletName: form.outletName.trim(),
        outletLogoUrl: form.outletLogoUrl.trim() || undefined,
        headline: form.headline.trim(),
        dateLabel: form.dateLabel.trim(),
        url: form.url.trim(),
        isPublished: form.isPublished,
      };
      if (editing) await updatePressItem(editing.id, payload);
      else await createPressItem(payload);
      setShowModal(false);
      await loadItems();
    } catch {
      setMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (userData && !hasPermission(userData, 'press') && userData.role !== 'super_admin') {
    return <div className="text-center py-12 text-muted-foreground">No permission</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1">Press & Media</h1>
          <p className="text-muted-foreground text-sm">Edit /press page, coverage, and media kit</p>
        </div>
        {tab === 'items' && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold">
            <Plus className="w-5 h-5" /> Add coverage
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
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === t ? 'bg-accent text-accent-foreground' : 'border border-border'}`}
          >
            {t === 'page' ? 'Page content' : 'In the Press'}
          </button>
        ))}
      </div>

      {msg && <p className="mb-4 text-sm text-accent">{msg}</p>}

      {tab === 'page' && (
        <div className="space-y-4 max-w-2xl">
          <Field label="Eyebrow" value={page.hero.eyebrow} onChange={(v) => updatePage({ hero: { ...page.hero, eyebrow: v } })} />
          <Field label="Headline" value={page.hero.headline} onChange={(v) => updatePage({ hero: { ...page.hero, headline: v } })} />
          <TextArea label="Subtext" value={page.hero.subtext} onChange={(v) => updatePage({ hero: { ...page.hero, subtext: v } })} />
          <Field label="In the Press title" value={page.inThePressTitle} onChange={(v) => updatePage({ inThePressTitle: v })} />
          <Field label="Media kit title" value={page.mediaKitTitle} onChange={(v) => updatePage({ mediaKitTitle: v })} />
          <TextArea label="Media kit body" value={page.mediaKitBody} onChange={(v) => updatePage({ mediaKitBody: v })} />
          {(page.mediaKitDownloads || []).map((d, i) => (
            <div key={d.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border border-border rounded-lg">
              <Field
                label="Download label"
                value={d.label}
                onChange={(v) => {
                  const next = [...page.mediaKitDownloads];
                  next[i] = { ...d, label: v };
                  updatePage({ mediaKitDownloads: next });
                }}
              />
              <Field
                label="Download URL"
                value={d.url}
                onChange={(v) => {
                  const next = [...page.mediaKitDownloads];
                  next[i] = { ...d, url: v };
                  updatePage({ mediaKitDownloads: next });
                }}
              />
            </div>
          ))}
          <Field label="Boilerplate title" value={page.boilerplateTitle} onChange={(v) => updatePage({ boilerplateTitle: v })} />
          <TextArea label="Boilerplate" value={page.boilerplate} onChange={(v) => updatePage({ boilerplate: v })} />
          <Field label="Media contact title" value={page.mediaContactTitle} onChange={(v) => updatePage({ mediaContactTitle: v })} />
          <TextArea label="Media contact body" value={page.mediaContactBody} onChange={(v) => updatePage({ mediaContactBody: v })} />
          <Field label="Press email" value={page.mediaContactEmail} onChange={(v) => updatePage({ mediaContactEmail: v })} />
        </div>
      )}

      {tab === 'items' && (
        <div className="space-y-3">
          {items.length === 0 && <p className="text-sm text-muted-foreground">No coverage yet.</p>}
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 p-4 bg-card border border-border rounded-lg">
              <div className="min-w-0">
                <p className="font-semibold truncate">{item.headline}</p>
                <p className="text-xs text-muted-foreground">
                  {item.outletName} · {item.dateLabel} · {item.isPublished ? 'Published' : 'Draft'}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => updatePressItem(item.id, { isPublished: !item.isPublished }).then(loadItems)}>
                  {item.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></button>
                <button type="button" onClick={() => confirm('Delete?') && deletePressItem(item.id).then(loadItems)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="font-heading font-bold">{editing ? 'Edit coverage' : 'New coverage'}</h2>
              <button type="button" onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Outlet name" value={form.outletName} onChange={(v) => setForm({ ...form, outletName: v })} />
              <ImageUpload
                label="Outlet logo"
                folder="press"
                value={form.outletLogoUrl}
                onChange={(url) => setForm({ ...form, outletLogoUrl: url })}
              />
              <Field label="Headline" value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} />
              <Field label="Date label" value={form.dateLabel} onChange={(v) => setForm({ ...form, dateLabel: v })} />
              <Field label="Article URL" value={form.url} onChange={(v) => setForm({ ...form, url: v })} />
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
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full px-3 py-2 bg-input border border-border rounded-lg" />
    </label>
  );
}
