'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, Plus } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { updateSettings } from '@/lib/db-service';
import { LoadState } from '@/components/load-state';
import { ChatLead, ChatbotConfig, Settings } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useApiAuth } from '@/hooks/useApiAuth';

interface ChatSession {
  sessionId: string;
  lastActivity: number;
  messages: { id: string; role: string; content: string; timestamp: number }[];
}

const DEFAULT_CHATBOT: ChatbotConfig = {
  enabled: false,
  assistantName: 'Abundant Assistant',
  greetingMessage:
    "Hello! Welcome to Abundant Global Club. I'm here to help you learn about our community, events, and membership.",
  systemPrompt: 'You are a helpful assistant for Abundant Global Club.',
  persona: 'Professional, warm, and welcoming',
  knowledgeSnippets: [],
  whatsappGroups: [],
  resources: [],
  collectLeadInfo: true,
  leadPromptMessage: 'Welcome! Please share your contact details so our team can follow up with you.',
  updatedAt: Date.now(),
};

export default function ChatbotAdminPage() {
  const { settings: liveSettings, loading, error, retry } = useSettings();
  const { userData } = useAuth();
  const { authFetch } = useApiAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'config' | 'leads' | 'logs'>('config');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [leads, setLeads] = useState<ChatLead[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);

  useEffect(() => {
    if (liveSettings) setSettings(liveSettings);
  }, [liveSettings]);

  useEffect(() => {
    if (tab === 'logs') loadLogs();
    if (tab === 'leads') loadLeads();
  }, [tab]);

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await authFetch('/api/admin/chat-logs');
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error('Failed to load chat logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      setLeadsLoading(true);
      const res = await authFetch('/api/admin/chat-leads');
      if (res.ok) setLeads(await res.json());
    } catch (err) {
      console.error('Failed to load chat leads:', err);
    } finally {
      setLeadsLoading(false);
    }
  };

  const chatbot: ChatbotConfig = {
    ...DEFAULT_CHATBOT,
    ...settings?.chatbot,
    knowledgeSnippets: settings?.chatbot?.knowledgeSnippets ?? [],
    whatsappGroups: settings?.chatbot?.whatsappGroups ?? [],
    resources: settings?.chatbot?.resources ?? [],
  };

  const updateChatbot = (partial: Partial<ChatbotConfig>) => {
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

  const inputCls = 'w-full px-4 py-2 bg-input border border-border rounded-lg text-sm';

  return (
    <LoadState loading={loading} error={error} onRetry={retry}>
      {settings && (
        <div className="max-w-4xl">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold mb-2">Chatbot</h1>
            <p className="text-muted-foreground">
              Configure the site assistant, knowledge sources, community links, and lead capture. Enable the AI API key under Settings → Integrations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {(['config', 'leads', 'logs'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-accent text-accent-foreground' : 'border border-border'}`}
              >
                {t === 'leads' ? 'CRM Leads' : t === 'logs' ? 'Conversation Logs' : 'Configuration'}
              </button>
            ))}
          </div>

          {message && <div className="mb-4 p-3 bg-green-500/10 text-green-600 rounded-lg text-sm">{message}</div>}

          {tab === 'config' ? (
            <div className="space-y-6">
              <label className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                <input
                  type="checkbox"
                  checked={chatbot.enabled}
                  onChange={(e) => updateChatbot({ enabled: e.target.checked })}
                />
                <div>
                  <span className="font-medium">Enable chatbot site-wide</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Shows a floating widget on all public pages (bottom-right)</p>
                </div>
              </label>

              <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                <h2 className="font-heading font-bold">Assistant & Greeting</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Assistant Name</label>
                    <input
                      value={chatbot.assistantName || ''}
                      onChange={(e) => updateChatbot({ assistantName: e.target.value })}
                      className={inputCls}
                      placeholder="Abundant Assistant"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Persona / Tone</label>
                    <input
                      value={chatbot.persona}
                      onChange={(e) => updateChatbot({ persona: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Greeting Message</label>
                  <textarea
                    value={chatbot.greetingMessage}
                    onChange={(e) => updateChatbot({ greetingMessage: e.target.value })}
                    rows={2}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">System Prompt</label>
                  <textarea
                    value={chatbot.systemPrompt}
                    onChange={(e) => updateChatbot({ systemPrompt: e.target.value })}
                    rows={4}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                <h2 className="font-heading font-bold">Lead Capture (CRM)</h2>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={chatbot.collectLeadInfo}
                    onChange={(e) => updateChatbot({ collectLeadInfo: e.target.checked })}
                  />
                  <span className="text-sm font-medium">Collect email, phone, and address before chat</span>
                </label>
                <div>
                  <label className="block text-sm font-medium mb-2">Lead Form Prompt</label>
                  <textarea
                    value={chatbot.leadPromptMessage || ''}
                    onChange={(e) => updateChatbot({ leadPromptMessage: e.target.value })}
                    rows={2}
                    className={inputCls}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Submitted leads appear in the CRM Leads tab for future email outreach.
                </p>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                <h2 className="font-heading font-bold">Contact Info to Share</h2>
                <p className="text-xs text-muted-foreground">The bot will provide these when users ask for contact details or how to reach you.</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      value={chatbot.sharePhone || ''}
                      onChange={(e) => updateChatbot({ sharePhone: e.target.value })}
                      className={inputCls}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={chatbot.shareEmail || ''}
                      onChange={(e) => updateChatbot({ shareEmail: e.target.value })}
                      className={inputCls}
                      placeholder="hello@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <input
                      value={chatbot.shareAddress || ''}
                      onChange={(e) => updateChatbot({ shareAddress: e.target.value })}
                      className={inputCls}
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="font-heading font-bold">WhatsApp Groups</h2>
                    <p className="text-xs text-muted-foreground">Bot shares these links when users ask to join the community</p>
                  </div>
                  <button
                    onClick={() =>
                      updateChatbot({
                        whatsappGroups: [
                          ...chatbot.whatsappGroups,
                          { id: `wa-${Date.now()}`, name: '', link: '', description: '' },
                        ],
                      })
                    }
                    className="flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Add Group
                  </button>
                </div>
                {chatbot.whatsappGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No WhatsApp groups configured.</p>
                ) : (
                  chatbot.whatsappGroups.map((g, i) => (
                    <div key={g.id} className="mb-4 p-4 bg-background rounded-lg space-y-2 relative">
                      <button
                        onClick={() =>
                          updateChatbot({ whatsappGroups: chatbot.whatsappGroups.filter((x) => x.id !== g.id) })
                        }
                        className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded"
                        title="Remove group"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                      <input
                        placeholder="Group name (e.g. General Community)"
                        value={g.name}
                        onChange={(e) => {
                          const groups = [...chatbot.whatsappGroups];
                          groups[i] = { ...g, name: e.target.value };
                          updateChatbot({ whatsappGroups: groups });
                        }}
                        className={inputCls}
                      />
                      <input
                        placeholder="WhatsApp invite link (https://chat.whatsapp.com/...)"
                        value={g.link}
                        onChange={(e) => {
                          const groups = [...chatbot.whatsappGroups];
                          groups[i] = { ...g, link: e.target.value };
                          updateChatbot({ whatsappGroups: groups });
                        }}
                        className={inputCls}
                      />
                      <input
                        placeholder="Short description (optional)"
                        value={g.description || ''}
                        onChange={(e) => {
                          const groups = [...chatbot.whatsappGroups];
                          groups[i] = { ...g, description: e.target.value };
                          updateChatbot({ whatsappGroups: groups });
                        }}
                        className={inputCls}
                      />
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="font-heading font-bold">Custom Knowledge</h2>
                    <p className="text-xs text-muted-foreground">
                      Additional info for the bot. It also reads FAQs, pages, events, membership plans, and About/Home content automatically.
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between mb-3">
                    <h3 className="text-sm font-semibold">Resources</h3>
                    <button
                      onClick={() =>
                        updateChatbot({
                          resources: [
                            ...chatbot.resources,
                            { id: `res-${Date.now()}`, title: '', content: '', order: chatbot.resources.length },
                          ],
                        })
                      }
                      className="text-sm text-accent hover:underline"
                    >
                      + Add Resource
                    </button>
                  </div>
                  {chatbot.resources.map((r, i) => (
                    <div key={r.id} className="mb-3 p-4 bg-background rounded-lg space-y-2 relative">
                      <button
                        onClick={() => updateChatbot({ resources: chatbot.resources.filter((x) => x.id !== r.id) })}
                        className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                      <input
                        placeholder="Title"
                        value={r.title}
                        onChange={(e) => {
                          const resources = [...chatbot.resources];
                          resources[i] = { ...r, title: e.target.value };
                          updateChatbot({ resources });
                        }}
                        className={inputCls}
                      />
                      <textarea
                        placeholder="Content the bot should know"
                        value={r.content}
                        onChange={(e) => {
                          const resources = [...chatbot.resources];
                          resources[i] = { ...r, content: e.target.value };
                          updateChatbot({ resources });
                        }}
                        rows={2}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between mb-3">
                    <h3 className="text-sm font-semibold">Q&A Snippets</h3>
                    <button
                      onClick={() =>
                        updateChatbot({
                          knowledgeSnippets: [
                            ...chatbot.knowledgeSnippets,
                            { id: `snip-${Date.now()}`, question: '', answer: '' },
                          ],
                        })
                      }
                      className="text-sm text-accent hover:underline"
                    >
                      + Add Snippet
                    </button>
                  </div>
                  {chatbot.knowledgeSnippets.map((s, i) => (
                    <div key={s.id} className="mb-4 p-4 bg-background rounded-lg space-y-2 relative">
                      <button
                        onClick={() =>
                          updateChatbot({ knowledgeSnippets: chatbot.knowledgeSnippets.filter((x) => x.id !== s.id) })
                        }
                        className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                      <input
                        placeholder="Question"
                        value={s.question}
                        onChange={(e) => {
                          const snippets = [...chatbot.knowledgeSnippets];
                          snippets[i] = { ...s, question: e.target.value };
                          updateChatbot({ knowledgeSnippets: snippets });
                        }}
                        className={inputCls}
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
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          ) : tab === 'leads' ? (
            <div className="space-y-4">
              {leadsLoading ? (
                <p className="text-muted-foreground">Loading leads...</p>
              ) : leads.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No chatbot leads yet</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Email</th>
                        <th className="text-left p-3 font-medium">Phone</th>
                        <th className="text-left p-3 font-medium">Address</th>
                        <th className="text-left p-3 font-medium">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id} className="border-t border-border">
                          <td className="p-3">{lead.name || '—'}</td>
                          <td className="p-3">{lead.email || '—'}</td>
                          <td className="p-3">{lead.phone || '—'}</td>
                          <td className="p-3 max-w-[200px] truncate" title={lead.address}>{lead.address || '—'}</td>
                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            {new Date(lead.updatedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {logsLoading ? (
                <p className="text-muted-foreground">Loading conversation logs...</p>
              ) : sessions.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No conversations yet</p>
              ) : (
                sessions.map((session) => (
                  <div key={session.sessionId} className="p-4 bg-card rounded-xl border border-border">
                    <div className="flex justify-between mb-3 text-xs text-muted-foreground">
                      <span>Session: {session.sessionId.slice(0, 20)}...</span>
                      <span>{new Date(session.lastActivity).toLocaleString()}</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {session.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-accent/10' : 'bg-background'}`}
                        >
                          <span className="text-xs font-semibold capitalize">{msg.role}: </span>
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </LoadState>
  );
}
