-- Check Data Integrity
-- Run this to see if the data actually exists in the database

SELECT 
    'Counts' as check_type,
    (SELECT count(*) FROM profiles) as profiles_count,
    (SELECT count(*) FROM academies) as academies_count,
    (SELECT count(*) FROM academy_members) as memberships_count;

-- Show sample members if they exist
SELECT * FROM academy_members LIMIT 5;

-- Check if your user is linked
SELECT 
    'My Membership' as check_type,
    * 
FROM academy_members 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'leonhatori@gmail.com');
