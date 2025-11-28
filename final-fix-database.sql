-- FINAL FIX - Rebuild Database Structure & RLS
-- This recreates foreign keys and fixes all RLS policies

-- Step 1: Drop all problematic RLS policies
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
DROP POLICY IF EXISTS "allow_read_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_read_academies" ON academies;
DROP POLICY IF EXISTS "allow_create_academy" ON academies;
DROP POLICY IF EXISTS "allow_update_own_academy" ON academies;
DROP POLICY IF EXISTS "allow_read_all_members" ON academy_members;
DROP POLICY IF EXISTS "allow_insert_membership" ON academy_members;
DROP POLICY IF EXISTS "allow_update_membership" ON academy_members;
DROP POLICY IF EXISTS "allow_read_all_trainings" ON trainings;
DROP POLICY IF EXISTS "allow_insert_own_training" ON trainings;
DROP POLICY IF EXISTS "allow_update_own_training" ON trainings;
DROP POLICY IF EXISTS "allow_delete_own_training" ON trainings;

-- Step 2: Recreate Foreign Keys (so Supabase can do JOINs)
-- Note: We can't use REFERENCES auth.users because we have demo profiles
-- So we'll skip the profiles->auth.users FK, but keep others

ALTER TABLE academy_members DROP CONSTRAINT IF EXISTS academy_members_academy_id_fkey;
ALTER TABLE academy_members 
    ADD CONSTRAINT academy_members_academy_id_fkey 
    FOREIGN KEY (academy_id) REFERENCES academies(id) 
    ON DELETE CASCADE;

-- Don't add user_id FK to auth.users (we have fake demo users)
-- But we can add it to profiles if we want
ALTER TABLE academy_members DROP CONSTRAINT IF EXISTS academy_members_user_id_fkey_profiles;
ALTER TABLE academy_members 
    ADD CONSTRAINT academy_members_user_id_fkey_profiles 
    FOREIGN KEY (user_id) REFERENCES profiles(id) 
    ON DELETE CASCADE;

-- Trainings FK
ALTER TABLE trainings DROP CONSTRAINT IF EXISTS trainings_user_id_fkey;
ALTER TABLE trainings 
    ADD CONSTRAINT trainings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) 
    ON DELETE CASCADE;

-- Academies FK
ALTER TABLE academies DROP CONSTRAINT IF EXISTS academies_owner_id_fkey;
ALTER TABLE academies 
    ADD CONSTRAINT academies_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES profiles(id) 
    ON DELETE SET NULL;

-- Step 3: Create SIMPLE RLS Policies (No Recursion!)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

-- Everyone can READ everything (perfect for demo/development)
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "public_read_academies" ON academies FOR SELECT USING (true);
CREATE POLICY "public_read_members" ON academy_members FOR SELECT USING (true);
CREATE POLICY "public_read_trainings" ON trainings FOR SELECT USING (true);

-- Users can INSERT/UPDATE their own data
CREATE POLICY "user_insert_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_update_profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "user_insert_training" ON trainings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_training" ON trainings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_training" ON trainings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_create_academy" ON academies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner_update_academy" ON academies FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "user_join_academy" ON academy_members FOR INSERT WITH CHECK (auth.uid() = user_id);

SELECT '✅ Database fixed: Foreign Keys recreated, RLS policies reset!' as status;
