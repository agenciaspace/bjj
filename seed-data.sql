-- Demo Data for BJJ App
-- This creates a demo academy and sample trainings for your account

-- 1. Create demo academy (owned by you)
INSERT INTO academies (id, name, owner_id, join_code)
VALUES (
    'a1234567-89ab-cdef-0123-456789abcdef',
    'Gracie Barra São Paulo',
    (SELECT id FROM auth.users WHERE email = 'leonhatori@gmail.com' LIMIT 1),
    'GBSP2024'
) ON CONFLICT (id) DO NOTHING;

-- 2. Add yourself as an active member
INSERT INTO academy_members (academy_id, user_id, status)
VALUES (
    'a1234567-89ab-cdef-0123-456789abcdef',
    (SELECT id FROM auth.users WHERE email = 'leonhatori@gmail.com' LIMIT 1),
    'active'
) ON CONFLICT (academy_id, user_id) DO NOTHING;

-- 3. Create sample trainings for demonstration
INSERT INTO trainings (user_id, date, duration, technique, notes, academy)
VALUES 
    ((SELECT id FROM auth.users WHERE email = 'leonhatori@gmail.com' LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 90, 'Guard Pass Fundamentals', 'Learned basic knee slice pass', 'Gracie Barra São Paulo'),
    ((SELECT id FROM auth.users WHERE email = 'leonhatori@gmail.com' LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 120, 'Competition Prep', 'Sparring focused on tournament scenarios', 'Gracie Barra São Paulo'),
    ((SELECT id FROM auth.users WHERE email = 'leonhatori@gmail.com' LIMIT 1), CURRENT_DATE - INTERVAL '3 days', 60, 'Mount Escapes', 'Practiced elbow escape', 'Gracie Barra São Paulo'),
    ((SELECT id FROM auth.users WHERE email = 'leonhatori@gmail.com' LIMIT 1), CURRENT_DATE - INTERVAL '5 days', 90, 'Leg Locks', 'Straight ankle lock defense', 'Gracie Barra São Paulo'),
    ((SELECT id FROM auth.users WHERE email = 'leonhatori@gmail.com' LIMIT 1), CURRENT_DATE - INTERVAL '7 days', 120, 'Open Guard', 'Spider guard and lasso variations', 'Gracie Barra São Paulo');

-- 4. Create second demo academy: Ibirapuera Fight Club
INSERT INTO academies (id, name, owner_id, join_code)
VALUES (
    'b2345678-90bc-def0-1234-567890abcdef',
    'Ibirapuera Fight Club',
    (SELECT id FROM auth.users WHERE email = 'leonhatori@gmail.com' LIMIT 1),
    'IFC2024'
) ON CONFLICT (id) DO NOTHING;

-- 5. Add yourself as member of Ibirapuera Fight Club
INSERT INTO academy_members (academy_id, user_id, status)
VALUES (
    'b2345678-90bc-def0-1234-567890abcdef',
    (SELECT id FROM auth.users WHERE email = 'leonhatori@gmail.com' LIMIT 1),
    'active'
) ON CONFLICT (academy_id, user_id) DO NOTHING;

-- 6. Add trainings for Ibirapuera Fight Club
INSERT INTO trainings (user_id, date, duration, technique, notes, academy)
VALUES 
    ((SELECT id FROM auth.users WHERE email = 'leonhatori@gmail.com' LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 60, 'No-Gi Takedowns', 'Wrestling for BJJ', 'Ibirapuera Fight Club'),
    ((SELECT id FROM auth.users WHERE email = 'leonhatori@gmail.com' LIMIT 1), CURRENT_DATE - INTERVAL '4 days', 90, 'Submission Defense', 'Escaping armbars and triangles', 'Ibirapuera Fight Club');

-- Success message
SELECT 
    '✅ Demo data created successfully!' as status,
    '📌 Academies created: Gracie Barra São Paulo (GBSP2024), Ibirapuera Fight Club (IFC2024)' as academy_info,
    '📝 Sample trainings added to your profile for both academies' as trainings_info,
    '💡 You are now a member of both academies!' as next_steps;
