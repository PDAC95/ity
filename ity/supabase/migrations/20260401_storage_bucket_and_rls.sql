-- Phase 6: Storage Infrastructure
-- Creates the "uploads" public bucket and RLS policies for creator isolation.
-- Profile paths:  profiles/{user_id}/avatar  — scoped by auth.uid()
-- School paths:   schools/{school_id}/logo   — scoped by school ownership sub-select

-- ============================================================
-- 1. Create bucket (idempotent)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Public read policy — logos and avatars are public content
-- ============================================================
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- ============================================================
-- 3. Profile path policies — scoped by auth.uid() path prefix
--    Path structure: profiles/{user_id}/avatar
--    PostgreSQL arrays are 1-indexed:
--      foldername[1] = 'profiles'
--      foldername[2] = user_id
-- ============================================================
CREATE POLICY "Creator can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Creator can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Creator can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================================
-- 4. School path policies — scoped by school ownership sub-select
--    Path structure: schools/{school_id}/logo
--    PostgreSQL arrays are 1-indexed:
--      foldername[1] = 'schools'
--      foldername[2] = school_id (uuid)
-- ============================================================
CREATE POLICY "Creator can upload own school logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'schools'
  AND EXISTS (
    SELECT 1 FROM public.schools
    WHERE id = (storage.foldername(name))[2]::uuid
    AND creator_id = auth.uid()
  )
);

CREATE POLICY "Creator can update own school logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'schools'
  AND EXISTS (
    SELECT 1 FROM public.schools
    WHERE id = (storage.foldername(name))[2]::uuid
    AND creator_id = auth.uid()
  )
);

CREATE POLICY "Creator can delete own school logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'schools'
  AND EXISTS (
    SELECT 1 FROM public.schools
    WHERE id = (storage.foldername(name))[2]::uuid
    AND creator_id = auth.uid()
  )
);
