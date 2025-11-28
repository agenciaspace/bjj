-- RESET RLS POLICIES (Fix Infinite Recursion)
-- This removes all problematic policies and creates simple non-recursive ones

-- 1. Drop ALL existing policies to clean slate
DROP POLICY IF EXISTS "Enable all access for profiles" ON profiles;
DROP POLICY IF EXISTS "Enable all access for members" ON academy_members;
DROP POLICY IF EXISTS "Enable all access for academies" ON academies;
DROP POLICY IF EXISTS "Enable all access for trainings" ON trainings;
DROP POLICY IF EXISTS "Admin view all members" ON academy_members;
DROP POLICY IF EXISTS "Users view own memberships" ON academy_members;
DROP POLICY IF EXISTS "Owners view academy members" ON academy_members;
DROP POLICY IF EXISTS "Admin view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are visible" ON profiles;
DROP POLICY IF EXISTS "Admin view all academies" ON academies;
DROP POLICY IF EXISTS "Academies are viewable by everyone" ON academies;
DROP POLICY IF EXISTS "Users can join academies" ON academy_members;
DROP POLICY IF EXISTS "Owners/Admin can update member status" ON academy_members;
DROP POLICY IF EXISTS "Admin Access All" ON profiles;
DROP POLICY IF EXISTS "Admin Access All Members" ON academy_members;
DROP POLICY IF EXISTS "Admin Access All Academies" ON academies;

-- 2. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

-- 3. Create SIMPLE, NON-RECURSIVE policies

-- Profiles: Everyone can see all profiles
CREATE POLICY "allow_read_profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "allow_update_own_profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "allow_insert_own_profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Academies: Everyone can see all academies
CREATE POLICY "allow_read_academies" ON academies
    FOR SELECT USING (true);

CREATE POLICY "allow_create_academy" ON academies
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "allow_update_own_academy" ON academies
    FOR UPDATE USING (auth.uid() = owner_id);

-- Academy Members: Simple non-recursive policies
CREATE POLICY "allow_read_all_members" ON academy_members
    FOR SELECT USING (true);

CREATE POLICY "allow_insert_membership" ON academy_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_update_membership" ON academy_members
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM academies WHERE academies.id = academy_members.academy_id AND academies.owner_id = auth.uid())
    );

-- Trainings: Users can manage their own trainings
CREATE POLICY "allow_read_all_trainings" ON trainings
    FOR SELECT USING (true);

CREATE POLICY "allow_insert_own_training" ON trainings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_update_own_training" ON trainings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "allow_delete_own_training" ON trainings
    FOR DELETE USING (auth.uid() = user_id);

SELECT '✅ RLS Policies Reset Successfully - No More Recursion!' as status;
