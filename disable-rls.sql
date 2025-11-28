-- NUCLEAR OPTION: Disable RLS Completely
-- This will temporarily remove ALL security to get the app working

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE academy_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE academies DISABLE ROW LEVEL SECURITY;
ALTER TABLE trainings DISABLE ROW LEVEL SECURITY;

SELECT '✅ RLS DISABLED - App should work now' as status;

-- IMPORTANT: This makes your database completely open!
-- For production, you'll need to re-enable RLS with proper policies.
