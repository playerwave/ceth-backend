-- Quick test activity data

-- 1. Add basic data if not exists
INSERT INTO faculty (faculty_name) VALUES ('คณะทดสอบ') ON CONFLICT DO NOTHING;
INSERT INTO department (department_name, faculty_id) VALUES ('สาขาทดสอบ', 1) ON CONFLICT DO NOTHING;
INSERT INTO grade (level) VALUES ('1') ON CONFLICT DO NOTHING;
INSERT INTO eventcoop (eventcoop_name) VALUES ('กิจกรรมทดสอบ') ON CONFLICT DO NOTHING;
INSERT INTO building (building_name) VALUES ('อาคารทดสอบ') ON CONFLICT DO NOTHING;
INSERT INTO room (room_name, building_id) VALUES ('ห้องทดสอบ', 1) ON CONFLICT DO NOTHING;
INSERT INTO assessment (assessment_name) VALUES ('การประเมินทดสอบ') ON CONFLICT DO NOTHING;

-- 2. Add activity
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
    'กิจกรรมทดสอบ',
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
    1,
    1,
    0
) ON CONFLICT DO NOTHING;

-- 3. Add activity_detail for student
INSERT INTO activity_detail (activity_id, register_date, time_in, time_out, status)
VALUES (1, NOW(), NULL, NULL, 'Registered')
ON CONFLICT DO NOTHING;

-- 4. Add join record
INSERT INTO "join" (students_id, activity_detail_id, join_date, status)
VALUES (
    (SELECT students_id FROM students s JOIN users u ON s.users_id = u.users_id WHERE u.username = '65160169'),
    (SELECT activity_detail_id FROM activity_detail WHERE activity_id = 1 ORDER BY activity_detail_id DESC LIMIT 1),
    NOW(),
    'Pending'
) ON CONFLICT DO NOTHING;

-- 5. Check data
SELECT 'Activity count:' as info, COUNT(*) as count FROM activity WHERE activity_name = 'test activity 1'
UNION ALL
SELECT 'Activity detail count:', COUNT(*) FROM activity_detail WHERE activity_id = 1
UNION ALL
SELECT 'Join count:', COUNT(*) FROM "join" j 
JOIN activity_detail ad ON j.activity_detail_id = ad.activity_detail_id 
WHERE ad.activity_id = 1;
