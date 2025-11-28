-- PRODUCTION RLS MIGRATION
-- Safe, non-recursive policies for all tables
-- Run this to enable proper Row Level Security

-- ============================================
-- STEP 1: Clean Slate - Remove All Policies
-- ============================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- ============================================
-- STEP 2: Enable RLS on All Tables
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: PROFILES - Public Read, Own Edit
-- ============================================

-- Everyone can see profiles (needed for member lists, academy displays)
CREATE POLICY "profiles_public_read" ON profiles
    FOR SELECT 
    USING (true);

-- Users can create their own profile
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- ============================================
-- STEP 4: ACADEMIES - Public Read, Owner Control
-- ============================================

-- Everyone can see academies (needed for browsing/joining)
CREATE POLICY "academies_public_read" ON academies
    FOR SELECT 
    USING (true);

-- Authenticated users can create academies
CREATE POLICY "academies_insert_authenticated" ON academies
    FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

-- Only owners can update their academy
CREATE POLICY "academies_update_owner" ON academies
    FOR UPDATE 
    USING (auth.uid() = owner_id);

-- Only owners can delete their academy
CREATE POLICY "academies_delete_owner" ON academies
    FOR DELETE 
    USING (auth.uid() = owner_id);

-- ============================================
-- STEP 5: ACADEMY_MEMBERS - No Recursion!
-- ============================================

-- Everyone can see members (needed for admin dashboard, member counts)
CREATE POLICY "members_public_read" ON academy_members
    FOR SELECT 
    USING (true);

-- Users can join academies (insert themselves as pending)
CREATE POLICY "members_insert_self" ON academy_members
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own membership OR owners can update any member
-- KEY: We check the academies table, NOT academy_members (no recursion!)
CREATE POLICY "members_update_self_or_owner" ON academy_members
    FOR UPDATE 
    USING (
        auth.uid() = user_id  -- User managing their own membership
        OR
        EXISTS (  -- OR user owns the academy
            SELECT 1 FROM academies 
            WHERE academies.id = academy_members.academy_id 
            AND academies.owner_id = auth.uid()
        )
    );

-- Users can leave OR owners can remove members
CREATE POLICY "members_delete_self_or_owner" ON academy_members
    FOR DELETE 
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM academies 
            WHERE academies.id = academy_members.academy_id 
            AND academies.owner_id = auth.uid()
        )
    );

-- ============================================
-- STEP 6: TRAININGS - Completely Private
-- ============================================

-- Users can only see their own trainings
CREATE POLICY "trainings_select_own" ON trainings
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own trainings
CREATE POLICY "trainings_insert_own" ON trainings
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own trainings
CREATE POLICY "trainings_update_own" ON trainings
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Users can delete their own trainings
CREATE POLICY "trainings_delete_own" ON trainings
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================
-- STEP 7: Verification
-- ============================================

-- Show all policies created
SELECT 
    tablename,
    policyname,
    cmd as operation,
    permissive,
    CASE 
        WHEN qual IS NOT NULL THEN '✓ Has USING'
        ELSE '✗ No USING'
    END as using_check,
    CASE 
        WHEN with_check IS NOT NULL THEN '✓ Has WITH CHECK'
        ELSE '✗ No WITH CHECK'
    END as check_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify RLS is enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'academies', 'academy_members', 'trainings')
ORDER BY tablename;

SELECT '✅ Production RLS successfully enabled!' as result;
