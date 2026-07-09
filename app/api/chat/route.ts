import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { Settings } from '@/lib/types';
import { buildChatContext, buildChatSystemPrompt } from '@/lib/chat-context';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, history = [] } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const db = getAdminDb();
    const settingsSnap = await db.collection('settings').doc(SETTINGS_DOC_ID).get();
    const settings = settingsSnap.data() as Settings | undefined;

    if (!settings?.chatbot?.enabled) {
      return NextResponse.json({ error: 'Chatbot is disabled' }, { status: 503 });
    }

    const apiKey = settings.integrations?.anthropic?.apiKey;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chatbot AI is not configured. Add an API key in Settings → Integrations.' }, { status: 503 });
    }

    const context = await buildChatContext();
    const systemPrompt = buildChatSystemPrompt(settings, context);

    const messages: ChatMessage[] = [
      ...(history as ChatMessage[]).slice(-10),
      { role: 'user', content: message.trim() },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', await response.text());
      return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';

    const sid = sessionId || `session-${Date.now()}`;
    const ts = Date.now();

    await db.collection('chatLogs').add({ sessionId: sid, role: 'user', content: message.trim(), timestamp: ts });
    await db.collection('chatLogs').add({ sessionId: sid, role: 'assistant', content: reply, timestamp: ts + 1 });

    return NextResponse.json({ reply, sessionId: sid });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
