import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getStorage } from 'firebase-admin/storage';
import { requireAdmin } from '@/lib/api-auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { getStorageBucketCandidates, isBucketNotFoundError } from '@/lib/storage-bucket';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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

    const bucketCandidates = await getStorageBucketCandidates();
    if (bucketCandidates.length === 0) {
      return NextResponse.json(
        { error: 'Storage bucket is not configured. Set it under Settings → Integrations → Firebase Client SDK.' },
        { status: 500 }
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
    const path = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${safeExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const token = randomUUID();

    let lastError: Error | null = null;

    for (const bucketName of bucketCandidates) {
      try {
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

        return NextResponse.json({ url, bucket: bucketName });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (isBucketNotFoundError(error)) continue;
        throw error;
      }
    }

    console.error('[api/admin/upload] bucket candidates failed:', bucketCandidates, lastError);
    return NextResponse.json(
      {
        error:
          'Firebase Storage bucket not found. Enable Storage in Firebase Console and verify the Storage Bucket in Settings → Integrations matches your project (e.g. abundantglobalclub.firebasestorage.app).',
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('[api/admin/upload]', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    const status =
      message === 'Unauthorized' || message === 'Forbidden'
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
