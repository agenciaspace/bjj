-- PRODUCTION RLS POLICIES
-- This enables RLS with safe, non-recursive policies

-- Step 1: Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

-- Step 2: PROFILES Policies
-- Everyone can read profiles (needed for displaying user info)
CREATE POLICY "profiles_select_all" ON profiles
    FOR SELECT USING (true);

-- Users can insert/update their own profile
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Step 3: ACADEMIES Policies
-- Everyone can view academies (needed for browsing/joining)
CREATE POLICY "academies_select_all" ON academies
    FOR SELECT USING (true);

-- Only authenticated users can create academies
CREATE POLICY "academies_insert_auth" ON academies
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Only owners can update their academies
CREATE POLICY "academies_update_owner" ON academies
    FOR UPDATE USING (auth.uid() = owner_id);

-- Step 4: ACADEMY_MEMBERS Policies (MOST IMPORTANT - NO RECURSION!)
-- Everyone can view memberships (needed for admin and member lists)
CREATE POLICY "members_select_all" ON academy_members
    FOR SELECT USING (true);

-- Users can insert themselves as members (joining)
CREATE POLICY "members_insert_self" ON academy_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own membership, or academy owners can update anyone's
CREATE POLICY "members_update_self_or_owner" ON academy_members
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        auth.uid() IN (SELECT owner_id FROM academies WHERE id = academy_members.academy_id)
    );

-- Only owners can delete memberships
CREATE POLICY "members_delete_owner" ON academy_members
    FOR DELETE USING (
        auth.uid() IN (SELECT owner_id FROM academies WHERE id = academy_members.academy_id)
    );

-- Step 5: TRAININGS Policies
-- Users can only see their own trainings
CREATE POLICY "trainings_select_own" ON trainings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert/update/delete their own trainings
CREATE POLICY "trainings_insert_own" ON trainings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trainings_update_own" ON trainings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "trainings_delete_own" ON trainings
    FOR DELETE USING (auth.uid() = user_id);

SELECT '✅ Production RLS enabled with safe policies!' as status;
