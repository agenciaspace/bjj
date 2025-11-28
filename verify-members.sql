-- Query simples para verificar se há membros
SELECT 
    a.name as academy_name,
    COUNT(am.id) as member_count
FROM academies a
LEFT JOIN academy_members am ON am.academy_id = a.id
GROUP BY a.id, a.name
ORDER BY a.name;

-- Ver os membros individuais
SELECT 
    a.name as academy_name,
    p.name as student_name,
    am.status
FROM academy_members am
JOIN academies a ON a.id = am.academy_id
LEFT JOIN profiles p ON p.id = am.user_id
ORDER BY a.name, p.name;
