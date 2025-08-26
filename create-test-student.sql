-- สร้างข้อมูลนักเรียนทดสอบสำหรับระบบ Check-in/Check-out

-- 1. เพิ่ม Role สำหรับ Student (ถ้ายังไม่มี)
INSERT INTO roles (roles_name) 
VALUES ('Student') 
ON CONFLICT (roles_name) DO NOTHING;

-- 2. เพิ่ม User สำหรับนักเรียน
INSERT INTO users (username, password, roles_id) 
VALUES ('65160169', '1234', (SELECT roles_id FROM roles WHERE roles_name = 'Student'))
ON CONFLICT (username) DO NOTHING;

-- 3. เพิ่มข้อมูลนักเรียน
INSERT INTO students (
    users_id, 
    first_name, 
    last_name, 
    email, 
    soft_hours, 
    hard_hours, 
    risk_status, 
    education_status,
    faculty_id,
    department_id,
    grade_id,
    eventcoop_id
) 
VALUES (
    (SELECT users_id FROM users WHERE username = '65160169'),
    'ทดสอบ',
    'นักเรียน',
    'test@student.com',
    0,
    0,
    'Normal',
    'Studying',
    1, -- faculty_id (ต้องมีในฐานข้อมูล)
    1, -- department_id (ต้องมีในฐานข้อมูล)
    1, -- grade_id (ต้องมีในฐานข้อมูล)
    1  -- eventcoop_id (ต้องมีในฐานข้อมูล)
)
ON CONFLICT (users_id) DO NOTHING;

-- 4. ตรวจสอบข้อมูลที่เพิ่ม
SELECT 
    u.username,
    u.password,
    s.first_name,
    s.last_name,
    r.roles_name
FROM users u
JOIN students s ON u.users_id = s.users_id
JOIN roles r ON u.roles_id = r.roles_id
WHERE u.username = '65160169';
