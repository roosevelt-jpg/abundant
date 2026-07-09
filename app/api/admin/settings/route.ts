import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getAdminSettings, saveAdminSettings } from '@/lib/settings-server';
import { Settings } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const settings = await getAdminSettings();
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load settings';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const updates = (await req.json()) as Partial<Settings>;
    const settings = await saveAdminSettings(updates, admin.uid);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[api/admin/settings PATCH]', error);
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
