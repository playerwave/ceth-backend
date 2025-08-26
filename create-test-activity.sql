-- สร้างข้อมูลกิจกรรมทดสอบสำหรับระบบ Check-in/Check-out

-- 1. เพิ่มข้อมูลพื้นฐาน (ถ้ายังไม่มี)
INSERT INTO faculty (faculty_name) VALUES ('คณะทดสอบ') ON CONFLICT DO NOTHING;
INSERT INTO department (department_name, faculty_id) VALUES ('สาขาทดสอบ', 1) ON CONFLICT DO NOTHING;
INSERT INTO grade (level) VALUES ('1') ON CONFLICT DO NOTHING;
INSERT INTO eventcoop (eventcoop_name) VALUES ('กิจกรรมทดสอบ') ON CONFLICT DO NOTHING;
INSERT INTO building (building_name) VALUES ('อาคารทดสอบ') ON CONFLICT DO NOTHING;
INSERT INTO room (room_name, building_id) VALUES ('ห้องทดสอบ', 1) ON CONFLICT DO NOTHING;
INSERT INTO assessment (assessment_name) VALUES ('การประเมินทดสอบ') ON CONFLICT DO NOTHING;

-- 2. เพิ่มกิจกรรมทดสอบ
INSERT INTO activity (
    activity_name,
    presenter_company_name,
    type,
    description,
    seat,
    recieve_hours,
    event_format,
    start_activity_date,
    end_activity_date,
    start_register_date,
    end_register_date,
    activity_state,
    activity_status,
    status,
    room_id,
    assessment_id,
    registered_count
) VALUES (
    'test activity 1',
    'บริษัททดสอบ',
    'Workshop',
    'กิจกรรมทดสอบสำหรับระบบ Check-in/Check-out',
    50,
    2,
    'Onsite',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    'Open Register',
    'Public',
    'Active',
    1, -- room_id
    1, -- assessment_id
    0
) ON CONFLICT DO NOTHING;

-- 3. เพิ่ม activity_detail สำหรับนักเรียนทดสอบ
INSERT INTO activity_detail (
    activity_id,
    register_date,
    time_in,
    time_out,
    status
) VALUES (
    1, -- activity_id ของกิจกรรมที่เพิ่งสร้าง
    NOW(),
    NULL, -- ยังไม่ได้ check-in
    NULL, -- ยังไม่ได้ check-out
    'Registered'
) ON CONFLICT DO NOTHING;

-- 4. เพิ่ม join record สำหรับนักเรียน
INSERT INTO "join" (
    students_id,
    activity_detail_id,
    join_date,
    status
) VALUES (
    (SELECT students_id FROM students WHERE users_id = (SELECT users_id FROM users WHERE username = '65160169')),
    (SELECT activity_detail_id FROM activity_detail WHERE activity_id = 1 ORDER BY activity_detail_id DESC LIMIT 1),
    NOW(),
    'Pending'
) ON CONFLICT DO NOTHING;

-- 5. ตรวจสอบข้อมูลที่เพิ่ม
SELECT 
    a.activity_id,
    a.activity_name,
    a.event_format,
    a.activity_state,
    ad.activity_detail_id,
    ad.status as detail_status,
    j.join_id,
    j.status as join_status,
    s.first_name,
    s.last_name,
    u.username
FROM activity a
JOIN activity_detail ad ON a.activity_id = ad.activity_id
JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
JOIN students s ON j.students_id = s.students_id
JOIN users u ON s.users_id = u.users_id
WHERE a.activity_name = 'test activity 1';
