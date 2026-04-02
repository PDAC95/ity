'use server';

import { createClient } from '@/lib/supabase/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ---------------------------------------------------------------------------
// AWS S3 client (singleton per cold start)
// ---------------------------------------------------------------------------

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SignedUploadResult =
  | { data: { signedUrl: string; path: string }; error: null }
  | { data: null; error: string };

// ---------------------------------------------------------------------------
// Server Action: getSignedUploadUrl
// ---------------------------------------------------------------------------
// Returns a presigned PUT URL for the given path after validating ownership.
// Supported path prefixes:
//   profiles/{user_id}/avatar  — must match authenticated user's own id
//   schools/{school_id}/logo   — creator must own the school
//
// Browser uploads directly to S3 via the presigned URL (bypasses Vercel's
// 4.5 MB serverless body limit).
// ---------------------------------------------------------------------------

export async function getSignedUploadUrl(
  path: string
): Promise<SignedUploadResult> {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Unauthorized' };
  }

  // Validate ownership based on path prefix
  const segments = path.split('/');
  const prefix = segments[0];

  if (prefix === 'profiles') {
    const pathUserId = segments[1];
    if (!pathUserId || pathUserId !== user.id) {
      return { data: null, error: 'Forbidden: path does not belong to this user' };
    }
  } else if (prefix === 'schools') {
    const schoolId = segments[1];
    if (!schoolId) {
      return { data: null, error: 'Invalid path: missing school id' };
    }

    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id')
      .eq('id', schoolId)
      .eq('creator_id', user.id)
      .single();

    if (schoolError || !school) {
      return { data: null, error: 'Forbidden: school not found or not owned by this user' };
    }
  } else {
    return { data: null, error: 'Invalid path prefix' };
  }

  // Generate presigned PUT URL (valid for 5 minutes)
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: path,
      ContentType: 'image/jpeg',
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return {
      data: { signedUrl, path },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create presigned URL';
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// Server Action: deleteStorageObject
// ---------------------------------------------------------------------------

export async function deleteStorageObject(path: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  // Validate ownership (same logic as upload)
  const segments = path.split('/');
  const prefix = segments[0];

  if (prefix === 'profiles') {
    if (segments[1] !== user.id) return { error: 'Forbidden' };
  } else if (prefix === 'schools') {
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('id', segments[1])
      .eq('creator_id', user.id)
      .single();
    if (!school) return { error: 'Forbidden' };
  } else {
    return { error: 'Invalid path prefix' };
  }

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: path }));
    return { error: null };
  } catch {
    return { error: 'Failed to delete object' };
  }
}

// ---------------------------------------------------------------------------
// Helper: getPublicStorageUrl
// ---------------------------------------------------------------------------
// Constructs the public URL for any object in the S3 bucket.
// Uses the standard S3 public URL format.
// ---------------------------------------------------------------------------

export async function getPublicStorageUrl(path: string): Promise<string> {
  return `https://${BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${path}`;
}
