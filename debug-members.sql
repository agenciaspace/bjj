-- Debug: Why are academy members not showing?

-- 1. Check if academy_members table has data
SELECT 'Total academy_members in DB' as check_name, COUNT(*) as count
FROM academy_members;

-- 2. Check members for specific academy
SELECT 'Members of Gracie Barra' as check_name, COUNT(*) as count
FROM academy_members
WHERE academy_id = 'a1234567-89ab-cdef-0123-456789abcdef';

-- 3. Show actual member records
SELECT 
    'Member Details' as check_name,
    am.id,
    am.academy_id,
    am.user_id,
    am.status,
    p.name as student_name
FROM academy_members am
LEFT JOIN profiles p ON p.id = am.user_id
WHERE am.academy_id = 'a1234567-89ab-cdef-0123-456789abcdef';

-- 4. Check if RLS is blocking the query (run as your user)
SET ROLE authenticated;
SELECT 
    'What I can see as authenticated user' as check_name,
    COUNT(*) as visible_count
FROM academy_members;

-- 5. Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'academy_members';
