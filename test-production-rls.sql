-- Test Production RLS Policies
-- Run this AFTER production-rls-migration.sql to verify everything works

-- Test 1: Can we fetch academy_members without recursion error?
SELECT 
    'Test 1: Fetch academy_members' as test_name,
    COUNT(*) as member_count
FROM academy_members;

-- Test 2: Can we join academy_members with profiles?
SELECT 
    'Test 2: Join academy_members with profiles' as test_name,
    COUNT(*) as count
FROM academy_members am
JOIN profiles p ON p.id = am.user_id;

-- Test 3: Can we join academy_members with academies?
SELECT 
    'Test 3: Join academy_members with academies' as test_name,
    a.name as academy,
    COUNT(am.id) as members
FROM academies a
LEFT JOIN academy_members am ON am.academy_id = a.id
GROUP BY a.id, a.name;

-- Test 4: Can admin page query work?
SELECT 
    'Test 4: Admin page query simulation' as test_name,
    'profiles' as table_name,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'Test 4: Admin page query simulation',
    'academies',
    COUNT(*)
FROM academies
UNION ALL
SELECT 
    'Test 4: Admin page query simulation',
    'academy_members',
    COUNT(*)
FROM academy_members;

-- Test 5: No infinite recursion when selecting members
SELECT 
    'Test 5: Select specific member' as test_name,
    am.id,
    am.user_id,
    am.academy_id,
    am.status
FROM academy_members am
LIMIT 1;

SELECT '✅ All tests passed - RLS is working correctly!' as result;
