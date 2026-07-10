import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getStorage } from 'firebase-admin/storage';
import { getAdminApp } from '@/lib/firebase-admin';
import { getStorageBucketCandidates, isBucketNotFoundError } from '@/lib/storage-bucket';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const folder = String(formData.get('folder') || 'uploads').replace(/[^a-z0-9-_]/gi, '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 });
    }
    if (file.type && !ALLOWED.has(file.type) && !file.name.match(/\.(pdf|doc|docx|jpg|jpeg|png|webp)$/i)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const bucketCandidates = await getStorageBucketCandidates();
    if (bucketCandidates.length === 0) {
      return NextResponse.json({ error: 'Storage is not configured' }, { status: 500 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const path = `${folder}/${Date.now()}-${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const token = randomUUID();

    let url: string | undefined;
    let lastError: unknown;
    for (const bucketName of bucketCandidates) {
      try {
        const bucket = getStorage(getAdminApp()).bucket(bucketName);
        await bucket.file(path).save(buffer, {
          metadata: {
            contentType: file.type || 'application/octet-stream',
            metadata: { firebaseStorageDownloadTokens: token },
          },
        });
        url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
        break;
      } catch (err) {
        lastError = err;
        if (!isBucketNotFoundError(err)) throw err;
      }
    }
    if (!url) {
      console.error('[api/public/upload]', lastError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[api/public/upload]', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
