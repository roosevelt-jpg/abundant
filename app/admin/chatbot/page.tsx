'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { updateSettings } from '@/lib/db-service';
import { LoadState } from '@/components/load-state';
import { Settings } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

export default function ChatbotAdminPage() {
  const { settings: liveSettings, loading, error, retry } = useSettings();
  const { userData } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (liveSettings) setSettings(liveSettings);
  }, [liveSettings]);

  const chatbot = settings?.chatbot ?? {
    enabled: false,
    systemPrompt: '',
    persona: '',
    knowledgeSnippets: [],
    updatedAt: Date.now(),
  };

  const updateChatbot = (partial: Partial<typeof chatbot>) => {
    setSettings((prev) =>
      prev ? { ...prev, chatbot: { ...chatbot, ...partial, updatedAt: Date.now() } } : prev
    );
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await updateSettings({ chatbot: settings.chatbot }, userData?.uid || 'admin');
      setMessage('Saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Error saving');
    } finally {
      setSaving(false);
    }
  };

  const addSnippet = () => {
    updateChatbot({
      knowledgeSnippets: [
        ...chatbot.knowledgeSnippets,
        { id: `snip-${Date.now()}`, question: '', answer: '' },
      ],
    });
  };

  return (
    <LoadState loading={loading} error={error} onRetry={retry}>
      {settings && (
        <div className="max-w-3xl">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold mb-2">Chatbot</h1>
            <p className="text-muted-foreground">Configure the AI assistant powered by Anthropic</p>
          </div>

          {message && <div className="mb-4 p-3 bg-green-500/10 text-green-600 rounded-lg text-sm">{message}</div>}

          <div className="space-y-6">
            <label className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
              <input
                type="checkbox"
                checked={chatbot.enabled}
                onChange={(e) => updateChatbot({ enabled: e.target.checked })}
              />
              <span className="font-medium">Enable chatbot site-wide</span>
            </label>

            <div className="p-6 bg-card rounded-xl border border-border space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">System Prompt</label>
                <textarea
                  value={chatbot.systemPrompt}
                  onChange={(e) => updateChatbot({ systemPrompt: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Persona / Tone</label>
                <input
                  value={chatbot.persona}
                  onChange={(e) => updateChatbot({ persona: e.target.value })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg"
                />
              </div>
            </div>

            <div className="p-6 bg-card rounded-xl border border-border">
              <div className="flex justify-between mb-4">
                <h2 className="font-heading font-bold">Knowledge Snippets</h2>
                <button onClick={addSnippet} className="text-sm text-accent hover:underline">+ Add</button>
              </div>
              {chatbot.knowledgeSnippets.map((s, i) => (
                <div key={s.id} className="mb-4 p-4 bg-background rounded-lg space-y-2">
                  <input
                    placeholder="Question"
                    value={s.question}
                    onChange={(e) => {
                      const snippets = [...chatbot.knowledgeSnippets];
                      snippets[i] = { ...s, question: e.target.value };
                      updateChatbot({ knowledgeSnippets: snippets });
                    }}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
                  />
                  <textarea
                    placeholder="Answer"
                    value={s.answer}
                    onChange={(e) => {
                      const snippets = [...chatbot.knowledgeSnippets];
                      snippets[i] = { ...s, answer: e.target.value };
                      updateChatbot({ knowledgeSnippets: snippets });
                    }}
                    rows={2}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50"
            >
              <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </LoadState>
  );
}
