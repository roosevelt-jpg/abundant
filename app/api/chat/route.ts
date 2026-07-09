import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const db = getAdminDb();
    const settingsSnap = await db.collection('settings').doc(SETTINGS_DOC_ID).get();
    const settings = settingsSnap.data();

    if (!settings?.chatbot?.enabled) {
      return NextResponse.json({ error: 'Chatbot is disabled' }, { status: 503 });
    }

    const apiKey = settings.integrations?.anthropic?.apiKey;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API not configured' }, { status: 503 });
    }

    // RAG-lite: gather platform content for context
    const [pagesSnap, eventsSnap, plansSnap] = await Promise.all([
      db.collection('pages').where('isPublished', '==', true).limit(10).get(),
      db.collection('events').where('isPublic', '==', true).limit(5).get(),
      db.collection('membershipPlans').where('active', '==', true).limit(5).get(),
    ]);

    const context = [
      `Site: ${settings.siteName} — ${settings.description}`,
      ...pagesSnap.docs.map((d) => `Page "${d.data().title}": ${d.data().content?.slice(0, 300)}`),
      ...eventsSnap.docs.map((d) => {
        const e = d.data();
        return `Event "${e.title}" on ${new Date(e.date).toLocaleDateString()} at ${e.location} (${e.pricingType})`;
      }),
      ...plansSnap.docs.map((d) => {
        const p = d.data();
        return `Plan "${p.name}": $${p.price}/${p.interval} — ${p.benefits?.join(', ')}`;
      }),
      ...(settings.chatbot?.knowledgeSnippets || []).map((s: { question: string; answer: string }) => `Q: ${s.question} A: ${s.answer}`),
    ].join('\n');

    const systemPrompt = `${settings.chatbot.systemPrompt}\nPersona: ${settings.chatbot.persona}\n\nPlatform knowledge:\n${context}`;

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
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';

    // Log conversation
    const sid = sessionId || `session-${Date.now()}`;
    await db.collection('chatLogs').add({
      sessionId: sid,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });
    await db.collection('chatLogs').add({
      sessionId: sid,
      role: 'assistant',
      content: reply,
      timestamp: Date.now(),
    });

    return NextResponse.json({ reply, sessionId: sid });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
