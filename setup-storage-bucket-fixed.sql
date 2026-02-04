-- ============================================
-- Storage Bucket Setup for BJJ Academy App (Fixed)
-- ============================================
-- Run this script in Supabase SQL Editor
-- This ensures the avatars storage bucket exists with proper policies
-- 
-- NOTE: This version avoids commands that require owner permissions

-- Step 1: Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create policies
-- Note: If policies already exist, these will fail - that's expected and safe

-- Step 2.1: Public read access to avatars
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public Avatar Access'
    ) THEN
        CREATE POLICY "Public Avatar Access"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars');
    END IF;
END $$;

-- Step 2.2: Allow authenticated users to upload avatars
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'User Avatar Upload'
    ) THEN
        CREATE POLICY "User Avatar Upload"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
        );
    END IF;
END $$;

-- Step 2.3: Allow users to update their own avatars
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'User Avatar Update'
    ) THEN
        CREATE POLICY "User Avatar Update"
        ON storage.objects FOR UPDATE
        USING (
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- Step 2.4: Allow users to delete their own avatars
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'User Avatar Delete'
    ) THEN
        CREATE POLICY "User Avatar Delete"
        ON storage.objects FOR DELETE
        USING (
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- Verify setup
SELECT 
    '✅ Storage bucket setup complete!' as status,
    'avatars' as bucket_name,
    public as is_public
FROM storage.buckets
WHERE id = 'avatars';

-- Also verify policies are created
SELECT 
    '✅ Policies created successfully!' as status,
    policyname as policy_name,
    permissive as is_permissive
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname IN ('Public Avatar Access', 'User Avatar Upload', 'User Avatar Update', 'User Avatar Delete');
