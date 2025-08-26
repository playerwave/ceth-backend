-- Quick test data for check-in system

-- 1. Add role if not exists
INSERT INTO roles (roles_name) VALUES ('Student') ON CONFLICT DO NOTHING;

-- 2. Add user
INSERT INTO users (username, password, roles_id) 
VALUES ('65160169', '1234', (SELECT roles_id FROM roles WHERE roles_name = 'Student'))
ON CONFLICT (username) DO NOTHING;

-- 3. Add student
INSERT INTO students (users_id, first_name, last_name, email, soft_hours, hard_hours, risk_status, education_status)
VALUES (
    (SELECT users_id FROM users WHERE username = '65160169'),
    'ทดสอบ',
    'นักเรียน',
    'test@student.com',
    0,
    0,
    'Normal',
    'Studying'
) ON CONFLICT (users_id) DO NOTHING;

-- 4. Check if data was added
SELECT 'Users count:' as info, COUNT(*) as count FROM users WHERE username = '65160169'
UNION ALL
SELECT 'Students count:', COUNT(*) FROM students s 
JOIN users u ON s.users_id = u.users_id 
WHERE u.username = '65160169';
