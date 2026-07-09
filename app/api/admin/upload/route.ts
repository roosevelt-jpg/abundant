import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getStorage } from 'firebase-admin/storage';
import { requireAdmin } from '@/lib/api-auth';
import { getAdminApp } from '@/lib/firebase-admin';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function getBucketName(): string {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    ''
  );
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const formData = await req.formData();
    const file = formData.get('file');
    const folder = String(formData.get('folder') || 'uploads').replace(/[^a-z0-9-_]/gi, '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/') || !ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported image type. Use JPG, PNG, WebP, or GIF.' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be under 8MB' }, { status: 400 });
    }

    const bucketName = getBucketName();
    if (!bucketName) {
      return NextResponse.json({ error: 'Storage bucket is not configured' }, { status: 500 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
    const path = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${safeExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const token = randomUUID();

    const bucket = getStorage(getAdminApp()).bucket(bucketName);
    const fileRef = bucket.file(path);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: { firebaseStorageDownloadTokens: token },
      },
      resumable: false,
    });

    const encodedPath = encodeURIComponent(path);
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[api/admin/upload]', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    const status =
      message === 'Unauthorized' || message === 'Forbidden'
        ? 401
        : message.includes('not configured')
          ? 500
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
