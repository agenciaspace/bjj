-- Diagnostic Script
-- Run this to check why members are not showing up

SELECT 
    'User Check' as check_name,
    email,
    id
FROM auth.users 
WHERE email = 'leonhatori@gmail.com';

SELECT 
    'Academy Check' as check_name,
    name,
    id
FROM academies;

SELECT 
    'Member Check' as check_name,
    academy_id,
    user_id,
    status
FROM academy_members;

-- Check if RLS is enabled (if you have permissions to see this)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'academy_members';
