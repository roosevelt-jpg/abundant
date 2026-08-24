'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import { LegalDocumentContent, LegalPagesContent, LegalSection, Settings } from '@/lib/types';
import { useSettings } from '@/hooks/useSettings';
import { useApiAuth } from '@/hooks/useApiAuth';
import { getDefaultLegalPages } from '@/lib/content-page-defaults';

export default function AdminLegalPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const { settings: live } = useSettings();
  const { authFetch } = useApiAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [docKey, setDocKey] = useState<'privacy' | 'terms'>('privacy');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (userData && !hasPermission(userData, 'legal') && userData.role !== 'super_admin') {
      router.push('/admin/dashboard');
    }
  }, [userData, router]);

  useEffect(() => {
    if (live && !dirty) setSettings(live);
  }, [live, dirty]);

  const legal: LegalPagesContent = settings?.legalPages ?? getDefaultLegalPages();
  const doc: LegalDocumentContent = legal[docKey];

  const updateDoc = (partial: Partial<LegalDocumentContent>) => {
    setDirty(true);
    const nextDoc = {
      ...doc,
      ...partial,
      updatedAt: Date.now(),
      effectiveDate: partial.effectiveDate ?? doc.effectiveDate,
    };
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            legalPages: {
              ...legal,
              [docKey]: nextDoc,
              updatedAt: Date.now(),
            },
          }
        : prev
    );
  };

  const updateSection = (index: number, partial: Partial<LegalSection>) => {
    const sections = [...doc.sections];
    sections[index] = { ...sections[index], ...partial };
    updateDoc({ sections });
  };

  const addSection = () => {
    updateDoc({
      sections: [
        ...doc.sections,
        { id: `s-${Date.now()}`, title: 'New section', body: '', order: doc.sections.length },
      ],
    });
  };

  const removeSection = (index: number) => {
    updateDoc({
      sections: doc.sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })),
    });
  };

  const save = async () => {
    if (!settings?.legalPages) return;
    setSaving(true);
    try {
      const payload = {
        ...settings.legalPages,
        [docKey]: {
          ...settings.legalPages[docKey],
          effectiveDate: new Date().toISOString().slice(0, 10),
          updatedAt: Date.now(),
        },
        updatedAt: Date.now(),
      };
      const res = await authFetch('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ legalPages: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSettings((prev) => (prev ? { ...prev, legalPages: data.legalPages } : prev));
      setDirty(false);
      setMsg('Legal page saved (effective date updated)');
    } catch {
      setMsg('Error saving');
    } finally {
      setSaving(false);
    }
  };

  if (userData && !hasPermission(userData, 'legal') && userData.role !== 'super_admin') {
    return <div className="text-center py-12 text-muted-foreground">No permission</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1">Legal</h1>
          <p className="text-muted-foreground text-sm">
            Edit Privacy Policy and Terms of Service. Have a lawyer review before publishing live.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50"
        >
          <Save className="w-5 h-5" /> Save
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['privacy', 'terms'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setDocKey(k)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${docKey === k ? 'bg-accent text-accent-foreground' : 'border border-border'}`}
          >
            {k === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
          </button>
        ))}
      </div>

      {msg && <p className="mb-4 text-sm text-accent">{msg}</p>}

      <div className="space-y-4 max-w-3xl">
        <Field label="Title" value={doc.title} onChange={(v) => updateDoc({ title: v, effectiveDate: doc.effectiveDate })} />
        <Field label="Effective date" value={doc.effectiveDate} onChange={(v) => updateDoc({ effectiveDate: v })} />
        <TextArea label="Intro" value={doc.intro || ''} onChange={(v) => updateDoc({ intro: v, effectiveDate: doc.effectiveDate })} />
        <Field label="Contact email" value={doc.contactEmail} onChange={(v) => updateDoc({ contactEmail: v, effectiveDate: doc.effectiveDate })} />

        <div className="flex items-center justify-between pt-4">
          <h2 className="font-heading font-bold">Sections</h2>
          <button type="button" onClick={addSection} className="flex items-center gap-1 text-sm text-accent font-semibold">
            <Plus className="w-4 h-4" /> Add section
          </button>
        </div>

        {doc.sections.map((section, i) => (
          <div key={section.id} className="p-4 border border-border rounded-lg space-y-3">
            <div className="flex justify-between gap-2">
              <Field label="Section title" value={section.title} onChange={(v) => updateSection(i, { title: v })} />
              <button type="button" onClick={() => removeSection(i)} className="mt-6 p-2 text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <TextArea label="Body" value={section.body} onChange={(v) => updateSection(i, { body: v })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm flex-1">
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
