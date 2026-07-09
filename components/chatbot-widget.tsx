'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatbotWidget() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!settings?.chatbot?.enabled) return null;

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId }),
      });
      const data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || data.error || 'Error' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-heading font-bold">Abundant Assistant</h3>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-accent/10 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Hi! Ask me anything about Abundant Global Club.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`text-sm p-3 rounded-lg max-w-[85%] ${
                m.role === 'user' ? 'bg-accent text-accent-foreground ml-auto' : 'bg-background border border-border'
              }`}>
                {m.content}
              </div>
            ))}
            {loading && <p className="text-xs text-muted-foreground">Thinking...</p>}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm"
            />
            <button onClick={send} disabled={loading} className="p-2 bg-accent text-accent-foreground rounded-lg disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 bg-accent text-accent-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </>
  );
}
