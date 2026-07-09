import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const snap = await getAdminDb()
      .collection('chatLogs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as { id: string; sessionId: string; role: string; content: string; timestamp: number }));

    // Group by sessionId
    const sessions: Record<string, typeof logs> = {};
    logs.forEach((log) => {
      const sid = log.sessionId as string;
      if (!sessions[sid]) sessions[sid] = [];
      sessions[sid].push(log);
    });

    const grouped = Object.entries(sessions)
      .map(([sessionId, messages]) => ({
        sessionId,
        messages: messages.sort((a, b) => (a.timestamp as number) - (b.timestamp as number)),
        lastActivity: Math.max(...messages.map((m) => m.timestamp as number)),
      }))
      .sort((a, b) => b.lastActivity - a.lastActivity);

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('[api/admin/chat-logs]', error);
    const message = error instanceof Error ? error.message : 'Failed to load chat logs';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
