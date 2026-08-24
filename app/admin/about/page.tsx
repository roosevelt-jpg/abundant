'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, EyeOff } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { LoadState } from '@/components/load-state';
import { ImageUpload } from '@/components/image-upload';
import { useApiAuth } from '@/hooks/useApiAuth';
import {
  AboutPageContent,
  SideBySideCard,
  Settings,
} from '@/lib/types';

export default function AboutPageBuilder() {
  const { settings: live, loading, error, retry } = useSettings();
  const { authFetch } = useApiAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgError, setMsgError] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (live && !dirty) setSettings(live);
  }, [live, dirty]);

  const content: AboutPageContent = settings?.aboutContent ?? {
    teamMembers: [],
    updatedAt: Date.now(),
  };

  const updateContent = (partial: Partial<AboutPageContent>) => {
    setDirty(true);
    setSettings((prev) =>
      prev ? { ...prev, aboutContent: { ...content, ...partial, updatedAt: Date.now() } } : prev
    );
  };

  const handleSave = async () => {
    if (!settings?.aboutContent) return;
    try {
      setSaving(true);
      const res = await authFetch('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ aboutContent: settings.aboutContent }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }
      setSettings((prev) => (prev ? { ...prev, aboutContent: data.aboutContent } : prev));
      setDirty(false);
      setMsgError(false);
      setMsg('About page saved!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsgError(true);
      setMsg(err instanceof Error ? err.message : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const updateCard = (key: 'foundersMessage' | 'missionVision', card: SideBySideCard) => {
    updateContent({ [key]: card });
  };

  const addMember = () => {
    updateContent({
      teamMembers: [
        ...content.teamMembers,
        {
          id: `tm-${Date.now()}`,
          name: '',
          title: '',
          bio: '',
          photoUrl: '',
          social: {},
          suspended: false,
          order: content.teamMembers.length,
        },
      ],
    });
  };

  return (
    <LoadState loading={loading} error={error} onRetry={retry}>
      {settings && (
        <div className="max-w-4xl">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold mb-2">About Page Builder</h1>
            <p className="text-muted-foreground">Edit modular sections — changes appear on the public About page</p>
          </div>

          {msg && (
            <div
              className={`fixed bottom-6 right-6 z-50 p-3 rounded-lg text-sm shadow-lg border ${
                msgError
                  ? 'bg-destructive/10 text-destructive border-destructive/30'
                  : 'bg-green-500/10 text-green-600 border-green-600/30'
              }`}
            >
              {msg}
            </div>
          )}

          <div className="space-y-8">
            <section className="p-6 bg-card rounded-xl border border-border space-y-4">
              <h2 className="font-heading font-bold text-lg">Page Header</h2>
              <input
                value={content.pageTitle || ''}
                onChange={(e) => updateContent({ pageTitle: e.target.value })}
                placeholder="About Abundant Global Club"
                className="w-full px-4 py-2 bg-input border border-border rounded-lg"
              />
              <textarea
                value={content.pageSubtitle || ''}
                onChange={(e) => updateContent({ pageSubtitle: e.target.value })}
                placeholder="Cultivating excellence through global community..."
                rows={2}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg"
              />
            </section>

            <section className="p-6 bg-card rounded-xl border border-border">
              <div className="flex justify-between mb-4">
                <div>
                  <h2 className="font-heading font-bold text-lg">Highlight Cards</h2>
                  <p className="text-xs text-muted-foreground mt-1">Mission, vision, values — text columns at the top of the page</p>
                </div>
                <button
                  onClick={() =>
                    updateContent({
                      highlightCards: [
                        ...(content.highlightCards || []),
                        { id: `h-${Date.now()}`, title: '', text: '', order: (content.highlightCards || []).length },
                      ],
                    })
                  }
                  className="text-sm text-accent flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {(content.highlightCards || []).map((card, i) => (
                <div key={card.id} className="mb-4 p-4 bg-background rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Card {i + 1}</span>
                    <button
                      onClick={() =>
                        updateContent({
                          highlightCards: (content.highlightCards || []).filter((x) => x.id !== card.id),
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                  <input
                    value={card.title}
                    onChange={(e) => {
                      const cards = [...(content.highlightCards || [])];
                      cards[i] = { ...card, title: e.target.value };
                      updateContent({ highlightCards: cards });
                    }}
                    placeholder="e.g. Our Mission"
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
                  />
                  <textarea
                    value={card.text}
                    onChange={(e) => {
                      const cards = [...(content.highlightCards || [])];
                      cards[i] = { ...card, text: e.target.value };
                      updateContent({ highlightCards: cards });
                    }}
                    placeholder="Card text..."
                    rows={3}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
                  />
                </div>
              ))}
            </section>

            <CardEditor
              title="Founder's Message"
              card={content.foundersMessage}
              onChange={(c) => updateCard('foundersMessage', c)}
              defaultId="founder"
            />
            <CardEditor
              title="Mission / Vision"
              card={content.missionVision}
              onChange={(c) => updateCard('missionVision', c)}
              defaultId="mission"
            />

            <section className="p-6 bg-card rounded-xl border border-border">
              <div className="flex justify-between mb-4">
                <h2 className="font-heading font-bold text-lg">Team Members</h2>
                <button onClick={addMember} className="text-sm text-accent flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
              </div>
              {content.teamMembers.map((m, i) => (
                <div key={m.id} className={`mb-4 p-4 bg-background rounded-lg space-y-3 ${m.suspended ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Member {i + 1}</span>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const members = [...content.teamMembers];
                        members[i] = { ...m, suspended: !m.suspended };
                        updateContent({ teamMembers: members });
                      }} title={m.suspended ? 'Show' : 'Suspend'}>
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => updateContent({ teamMembers: content.teamMembers.filter((x) => x.id !== m.id) })}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                  <ImageUpload value={m.photoUrl} onChange={(url) => {
                    const members = [...content.teamMembers];
                    members[i] = { ...m, photoUrl: url };
                    updateContent({ teamMembers: members });
                  }} folder="team" label="Portrait" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input value={m.name} onChange={(e) => { const members = [...content.teamMembers]; members[i] = { ...m, name: e.target.value }; updateContent({ teamMembers: members }); }} placeholder="Name" className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
                    <input value={m.title} onChange={(e) => { const members = [...content.teamMembers]; members[i] = { ...m, title: e.target.value }; updateContent({ teamMembers: members }); }} placeholder="Title" className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <textarea value={m.bio} onChange={(e) => { const members = [...content.teamMembers]; members[i] = { ...m, bio: e.target.value }; updateContent({ teamMembers: members }); }} placeholder="Bio — leave a blank line between paragraphs" rows={5} className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm" />
                    <p className="text-xs text-muted-foreground mt-1">Leave a blank line between paragraphs; line breaks are preserved on the public page.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['linkedin', 'twitter', 'instagram', 'facebook', 'email', 'phone', 'whatsapp'] as const).map((key) => (
                      <input key={key} value={m.social[key] || ''} onChange={(e) => {
                        const members = [...content.teamMembers];
                        members[i] = { ...m, social: { ...m.social, [key]: e.target.value } };
                        updateContent({ teamMembers: members });
                      }} placeholder={key} className="px-2 py-1.5 bg-input border border-border rounded text-xs" />
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50">
              <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save About Page'}
            </button>
          </div>
        </div>
      )}
    </LoadState>
  );
}

function CardEditor({
  title,
  card,
  onChange,
  defaultId,
}: {
  title: string;
  card?: SideBySideCard;
  onChange: (card: SideBySideCard) => void;
  defaultId: string;
}) {
  const c = card ?? { id: defaultId, title: '', text: '', imageUrl: '', imagePosition: 'left' as const, order: 0 };

  return (
    <section className="p-6 bg-card rounded-xl border border-border space-y-4">
      <h2 className="font-heading font-bold text-lg">{title}</h2>
      <input value={c.title} onChange={(e) => onChange({ ...c, title: e.target.value })} placeholder="Section title" className="w-full px-4 py-2 bg-input border border-border rounded-lg" />
      <textarea value={c.text} onChange={(e) => onChange({ ...c, text: e.target.value })} placeholder="Message text" rows={4} className="w-full px-4 py-2 bg-input border border-border rounded-lg" />
      <ImageUpload value={c.imageUrl} onChange={(url) => onChange({ ...c, imageUrl: url })} folder="about" label="Image" />
      <div>
        <label className="block text-sm font-medium mb-2">Image Position</label>
        <select value={c.imagePosition} onChange={(e) => onChange({ ...c, imagePosition: e.target.value as 'left' | 'right' })} className="px-4 py-2 bg-input border border-border rounded-lg">
          <option value="left">Image Left</option>
          <option value="right">Image Right</option>
        </select>
      </div>
    </section>
  );
}
