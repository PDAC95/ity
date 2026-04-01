'use server';

import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SignedUploadResult =
  | { data: { signedUrl: string; token: string; path: string }; error: null }
  | { data: null; error: string };

// ---------------------------------------------------------------------------
// Server Action: getSignedUploadUrl
// ---------------------------------------------------------------------------
// Returns a signed upload URL for the given path after validating ownership.
// Supported path prefixes:
//   profiles/{user_id}/avatar  — must match authenticated user's own id
//   schools/{school_id}/logo   — creator must own the school
//
// This bypasses Vercel's 4.5 MB serverless body limit by letting the browser
// upload directly to Supabase Storage via the signed URL.
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
    // profiles/{user_id}/...  — user_id must match the authenticated user
    const pathUserId = segments[1];
    if (!pathUserId || pathUserId !== user.id) {
      return { data: null, error: 'Forbidden: path does not belong to this user' };
    }
  } else if (prefix === 'schools') {
    // schools/{school_id}/...  — creator must own the school
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

  // Create signed upload URL
  const { data, error: storageError } = await supabase.storage
    .from('uploads')
    .createSignedUploadUrl(path, { upsert: true });

  if (storageError || !data) {
    return { data: null, error: storageError?.message ?? 'Failed to create signed upload URL' };
  }

  return {
    data: {
      signedUrl: data.signedUrl,
      token: data.token,
      path,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Helper: getPublicStorageUrl
// ---------------------------------------------------------------------------
// Pure function — no network request, no Supabase client needed.
// Constructs the public URL for any object in the uploads bucket.
// NEXT_PUBLIC_SUPABASE_URL is available in both server and client contexts.
// ---------------------------------------------------------------------------

export function getPublicStorageUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/uploads/${path}`;
}
