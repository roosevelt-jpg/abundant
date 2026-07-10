import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getStorage } from 'firebase-admin/storage';
import { getAdminApp, getAdminDb } from '@/lib/firebase-admin';
import { getStorageBucketCandidates, isBucketNotFoundError } from '@/lib/storage-bucket';
import { JobApplication } from '@/lib/types';

const MAX_CV_BYTES = 5 * 1024 * 1024;
const ALLOWED_CV = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fullName = String(formData.get('fullName') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const linkedinOrPortfolio = String(formData.get('linkedinOrPortfolio') || '').trim();
    const coverNote = String(formData.get('coverNote') || '').trim();
    const jobId = String(formData.get('jobId') || '').trim() || undefined;
    const jobTitle = String(formData.get('jobTitle') || '').trim() || undefined;
    const isGeneral = formData.get('isGeneral') === 'true' || !jobId;
    const cv = formData.get('cv');

    if (!fullName || !email || !coverNote) {
      return NextResponse.json({ error: 'Name, email, and cover note are required' }, { status: 400 });
    }
    if (coverNote.length > 500) {
      return NextResponse.json({ error: 'Cover note must be 500 characters or fewer' }, { status: 400 });
    }

    let cvUrl: string | undefined;
    if (cv instanceof File && cv.size > 0) {
      if (cv.size > MAX_CV_BYTES) {
        return NextResponse.json({ error: 'CV must be under 5MB' }, { status: 400 });
      }
      if (cv.type && !ALLOWED_CV.has(cv.type) && !cv.name.match(/\.(pdf|doc|docx)$/i)) {
        return NextResponse.json({ error: 'CV must be PDF or Word document' }, { status: 400 });
      }

      const bucketCandidates = await getStorageBucketCandidates();
      if (bucketCandidates.length === 0) {
        return NextResponse.json({ error: 'File upload is not configured' }, { status: 500 });
      }

      const ext = cv.name.split('.').pop()?.toLowerCase() || 'pdf';
      const safeExt = ['pdf', 'doc', 'docx'].includes(ext) ? ext : 'pdf';
      const path = `job-applications/${Date.now()}-${randomUUID()}.${safeExt}`;
      const buffer = Buffer.from(await cv.arrayBuffer());
      const token = randomUUID();

      let lastError: unknown;
      for (const bucketName of bucketCandidates) {
        try {
          const bucket = getStorage(getAdminApp()).bucket(bucketName);
          const file = bucket.file(path);
          await file.save(buffer, {
            metadata: {
              contentType: cv.type || 'application/pdf',
              metadata: { firebaseStorageDownloadTokens: token },
            },
          });
          const encodedPath = encodeURIComponent(path);
          cvUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;
          break;
        } catch (err) {
          lastError = err;
          if (!isBucketNotFoundError(err)) throw err;
        }
      }
      if (!cvUrl) {
        console.error('[api/careers/apply] upload failed', lastError);
        return NextResponse.json({ error: 'Could not upload CV' }, { status: 500 });
      }
    }

    const db = getAdminDb();
    const ref = db.collection('jobApplications').doc();
    const application: JobApplication = {
      id: ref.id,
      jobId,
      jobTitle,
      isGeneral,
      fullName,
      email,
      linkedinOrPortfolio: linkedinOrPortfolio || undefined,
      cvUrl,
      coverNote,
      status: 'new',
      submittedAt: Date.now(),
    };
    await ref.set(application);
    return NextResponse.json({ ok: true, id: application.id });
  } catch (error) {
    console.error('[api/careers/apply]', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
