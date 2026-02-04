-- ============================================
-- Storage Bucket Setup for BJJ Academy App
-- ============================================
-- Run this script in Supabase SQL Editor
-- This ensures the avatars storage bucket exists with proper policies

-- Step 1: Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies (if any)
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "User Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "User Avatar Update" ON storage.objects;
DROP POLICY IF EXISTS "User Avatar Delete" ON storage.objects;

-- Step 4: Grant public read access to avatars
-- This allows anyone to view profile photos
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Step 5: Allow authenticated users to upload avatars
CREATE POLICY "User Avatar Upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- Step 6: Allow users to update their own avatars
CREATE POLICY "User Avatar Update"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 7: Allow users to delete their own avatars
CREATE POLICY "User Avatar Delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 8: Grant permissions on storage.buckets
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

-- Verify setup
SELECT 
    '✅ Storage bucket setup complete!' as status,
    'avatars' as bucket_name,
    public as is_public
FROM storage.buckets
WHERE id = 'avatars';