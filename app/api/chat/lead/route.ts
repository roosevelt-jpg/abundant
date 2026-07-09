import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { ChatLead } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, name, email, phone, address } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    if (!email?.trim() || !phone?.trim() || !address?.trim()) {
      return NextResponse.json({ error: 'Email, phone, and address are required' }, { status: 400 });
    }

    const db = getAdminDb();
    const existing = await db
      .collection('chatLeads')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();

    const payload: Omit<ChatLead, 'id'> = {
      sessionId,
      name: name?.trim() || undefined,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined,
      source: 'chatbot',
      createdAt: existing.empty ? Date.now() : (existing.docs[0].data() as ChatLead).createdAt,
      updatedAt: Date.now(),
    };

    if (existing.empty) {
      const ref = db.collection('chatLeads').doc();
      const lead: ChatLead = { id: ref.id, ...payload };
      await ref.set(lead);
      return NextResponse.json(lead);
    }

    const ref = existing.docs[0].ref;
    await ref.update(payload);
    return NextResponse.json({ id: ref.id, ...payload });
  } catch (error) {
    console.error('[api/chat/lead]', error);
    return NextResponse.json({ error: 'Failed to save contact info' }, { status: 500 });
  }
}
