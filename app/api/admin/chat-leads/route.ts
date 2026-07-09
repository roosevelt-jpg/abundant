import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { ChatLead } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await getAdminDb().collection('chatLeads').orderBy('updatedAt', 'desc').limit(200).get();
    const leads: ChatLead[] = snap.docs.map((d) => d.data() as ChatLead);
    return NextResponse.json(leads);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to load leads';
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
