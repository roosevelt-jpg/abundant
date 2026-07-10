'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { usePathname } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_GREETING =
  "Hello! Welcome to Abundant Global Club. I'm here to help you learn about our community, events, and membership.";

export function ChatbotWidget() {
  const { settings } = useSettings();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [leadComplete, setLeadComplete] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadError, setLeadError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatbot = settings?.chatbot;
  const assistantName = chatbot?.assistantName || settings?.siteName || 'Abundant Assistant';
  const greeting = chatbot?.greetingMessage || DEFAULT_GREETING;
  const collectLead = chatbot?.collectLeadInfo !== false;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, leadComplete]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sid = sessionStorage.getItem('chatSessionId');
    const leadDone = sessionStorage.getItem('chatLeadComplete') === 'true';
    if (sid) setSessionId(sid);
    if (leadDone) setLeadComplete(true);
  }, []);

  const startChatSession = useCallback(() => {
    const sid = sessionId || `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setSessionId(sid);
    sessionStorage.setItem('chatSessionId', sid);
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: greeting }]);
    }
  }, [sessionId, greeting, messages.length]);

  if (!chatbot?.enabled) return null;
  if (pathname?.startsWith('/admin')) return null;
  if (pathname === '/about') return null;

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError('');
    if (!leadForm.email.trim() || !leadForm.phone.trim() || !leadForm.address.trim()) {
      setLeadError('Please provide your email, phone, and address.');
      return;
    }
    setLeadSaving(true);
    const sid = sessionId || `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setSessionId(sid);
    sessionStorage.setItem('chatSessionId', sid);
    try {
      const res = await fetch('/api/chat/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, ...leadForm }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      setLeadComplete(true);
      sessionStorage.setItem('chatLeadComplete', 'true');
      setMessages([{ role: 'assistant', content: greeting }]);
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : 'Could not save your details');
    } finally {
      setLeadSaving(false);
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    const nextMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const history = nextMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId, history }),
      });
      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
        sessionStorage.setItem('chatSessionId', data.sessionId);
      }
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'Sorry, the assistant is unavailable right now.' },
        ]);
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Sorry, something went wrong.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!collectLead || leadComplete) startChatSession();
  };

  const inputCls =
    'w-full px-2.5 py-1.5 text-xs bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent';

  return (
    <>
      {open && (
        <div className="fixed z-[100] bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.5rem)] right-3 sm:right-5 w-[min(calc(100vw-1.5rem),300px)] max-h-[min(420px,70dvh)] bg-card border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-accent/5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-3.5 h-3.5 text-accent" />
              </div>
              <h3 className="font-heading font-bold text-xs truncate">{assistantName}</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-0.5 hover:bg-accent/10 rounded flex-shrink-0"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {collectLead && !leadComplete ? (
            <div className="p-3 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-2.5 leading-snug">
                {chatbot.leadPromptMessage ||
                  'Welcome! Please share your contact details so our team can follow up with you.'}
              </p>
              {leadError && <p className="text-[11px] text-destructive mb-2">{leadError}</p>}
              <form onSubmit={submitLead} className="space-y-2">
                <div>
                  <label className="block text-[11px] font-medium mb-0.5">Name (optional)</label>
                  <input
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className={inputCls}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-0.5">Email</label>
                  <input
                    type="email"
                    required
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className={inputCls}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-0.5">Phone</label>
                  <input
                    type="tel"
                    required
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className={inputCls}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-0.5">Address</label>
                  <input
                    required
                    value={leadForm.address}
                    onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })}
                    className={inputCls}
                    placeholder="Street, City, Country"
                  />
                </div>
                <button
                  type="submit"
                  disabled={leadSaving}
                  className="w-full py-1.5 text-xs bg-accent text-accent-foreground rounded-md font-semibold disabled:opacity-50"
                >
                  {leadSaving ? 'Saving...' : 'Start Chat'}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-[140px] max-h-[280px]">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`text-xs p-2 rounded-md max-w-[90%] whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-accent text-accent-foreground ml-auto'
                        : 'bg-background border border-border'
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                {loading && (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Typing...
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="p-2 border-t border-border flex gap-1.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Ask about events, membership..."
                  className="flex-1 px-2.5 py-1.5 bg-input border border-border rounded-md text-xs"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="p-1.5 bg-accent text-accent-foreground rounded-md disabled:opacity-50 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className="fixed z-[100] bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 sm:right-5 bg-accent text-accent-foreground rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform ring-2 ring-accent/30"
        aria-label={open ? 'Close chat' : `Open ${assistantName}`}
        aria-expanded={open}
      >
        {open ? <X className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </button>
    </>
  );
}
