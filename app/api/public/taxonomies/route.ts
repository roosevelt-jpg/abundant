import { NextResponse } from 'next/server';
import { getTaxonomies } from '@/lib/intake-service';
import { ensureSeededContent } from '@/lib/seed-content';

export async function GET() {
  try {
    await ensureSeededContent();
    const taxonomies = await getTaxonomies();
    return NextResponse.json(taxonomies);
  } catch (error) {
    console.error('[api/public/taxonomies]', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
