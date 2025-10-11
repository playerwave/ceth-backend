-- ✅ Database Optimization Scripts สำหรับ Student Upload

-- 1. เพิ่ม Indexes สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_roles_id ON users(roles_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_users_id ON students(users_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_department_id ON students(department_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_grade_id ON students(grade_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grade_th_year ON grade(th_year);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_department_short_name ON department(department_short_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_department_name_tha ON department(department_name_tha);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_coop_grade_department ON event_coop(grade_id, department_id);

-- 2. เพิ่ม Composite Indexes สำหรับการค้นหาที่ซับซ้อน
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_coop_composite ON event_coop(grade_id, department_id, is_on_coop);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_composite ON students(users_id, department_id, grade_id);

-- 3. เพิ่ม Partial Indexes สำหรับข้อมูลที่ใช้บ่อย
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_students ON users(users_id) WHERE roles_id = 3;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_active ON students(students_id) WHERE status = 'Active';

-- 4. เพิ่ม Unique Constraint เพื่อป้องกันข้อมูลซ้ำ
ALTER TABLE students ADD CONSTRAINT unique_student_users_id UNIQUE (users_id);

-- 5. เพิ่ม Foreign Key Constraints เพื่อความสมบูรณ์ของข้อมูล
ALTER TABLE students ADD CONSTRAINT fk_students_users 
    FOREIGN KEY (users_id) REFERENCES users(users_id) ON DELETE CASCADE;

ALTER TABLE students ADD CONSTRAINT fk_students_department 
    FOREIGN KEY (department_id) REFERENCES department(department_id);

ALTER TABLE students ADD CONSTRAINT fk_students_grade 
    FOREIGN KEY (grade_id) REFERENCES grade(grade_id);

-- 6. เพิ่ม Check Constraints สำหรับข้อมูลที่ถูกต้อง
ALTER TABLE students ADD CONSTRAINT chk_students_soft_hours 
    CHECK (soft_hours >= 0);

ALTER TABLE students ADD CONSTRAINT chk_students_hard_hours 
    CHECK (hard_hours >= 0);

ALTER TABLE students ADD CONSTRAINT chk_students_risk_percentage 
    CHECK (risk_percentage >= 0 AND risk_percentage <= 100);

-- 7. เพิ่ม Trigger สำหรับการอัพเดท timestamp อัตโนมัติ
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_update_activity_date = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_modtime 
    BEFORE UPDATE ON students 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 8. เพิ่ม Materialized View สำหรับข้อมูลที่ใช้บ่อย
CREATE MATERIALIZED VIEW mv_student_summary AS
SELECT 
    s.students_id,
    u.username,
    s.first_name_tha,
    s.last_name_tha,
    s.first_name_eng,
    s.last_name_eng,
    d.department_name_tha,
    d.department_short_name,
    g.level as grade_level,
    g.th_year,
    s.soft_hours,
    s.hard_hours,
    s.risk_status,
    s.risk_percentage,
    s.education_status,
    s.status
FROM students s
JOIN users u ON s.users_id = u.users_id
LEFT JOIN department d ON s.department_id = d.department_id
LEFT JOIN grade g ON s.grade_id = g.grade_id
WHERE s.status = 'Active';

-- เพิ่ม Index สำหรับ Materialized View
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_student_username ON mv_student_summary(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_student_department ON mv_student_summary(department_short_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_student_grade ON mv_student_summary(grade_level);

-- 9. เพิ่ม Function สำหรับ Refresh Materialized View
CREATE OR REPLACE FUNCTION refresh_student_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_student_summary;
END;
$$ LANGUAGE plpgsql;

-- 10. เพิ่ม Function สำหรับการ Insert Students แบบ Batch
CREATE OR REPLACE FUNCTION batch_insert_students(
    student_data jsonb
) RETURNS TABLE(
    inserted_count integer,
    skipped_count integer
) AS $$
DECLARE
    student_record jsonb;
    inserted_count integer := 0;
    skipped_count integer := 0;
BEGIN
    FOR student_record IN SELECT * FROM jsonb_array_elements(student_data)
    LOOP
        BEGIN
            INSERT INTO students (
                first_name_tha, last_name_tha, first_name_eng, last_name_eng,
                users_id, department_id, soft_hours, hard_hours, status,
                faculty_id, email, risk_status, risk_percentage,
                education_status, grade_id
            ) VALUES (
                student_record->>'first_name_tha',
                student_record->>'last_name_tha',
                student_record->>'first_name_eng',
                student_record->>'last_name_eng',
                (student_record->>'users_id')::integer,
                (student_record->>'department_id')::integer,
                (student_record->>'soft_hours')::integer,
                (student_record->>'hard_hours')::integer,
                student_record->>'status',
                (student_record->>'faculty_id')::integer,
                student_record->>'email',
                student_record->>'risk_status',
                (student_record->>'risk_percentage')::integer,
                student_record->>'education_status',
                (student_record->>'grade_id')::integer
            );
            inserted_count := inserted_count + 1;
        EXCEPTION
            WHEN unique_violation THEN
                skipped_count := skipped_count + 1;
            WHEN OTHERS THEN
                skipped_count := skipped_count + 1;
        END;
    END LOOP;
    
    RETURN QUERY SELECT inserted_count, skipped_count;
END;
$$ LANGUAGE plpgsql;

-- 11. เพิ่ม Function สำหรับการ Insert Users แบบ Batch
CREATE OR REPLACE FUNCTION batch_insert_users(
    user_data jsonb
) RETURNS TABLE(
    inserted_count integer,
    skipped_count integer
) AS $$
DECLARE
    user_record jsonb;
    inserted_count integer := 0;
    skipped_count integer := 0;
BEGIN
    FOR user_record IN SELECT * FROM jsonb_array_elements(user_data)
    LOOP
        BEGIN
            INSERT INTO users (
                username, password, roles_id
            ) VALUES (
                user_record->>'username',
                user_record->>'password',
                (user_record->>'roles_id')::integer
            );
            inserted_count := inserted_count + 1;
        EXCEPTION
            WHEN unique_violation THEN
                skipped_count := skipped_count + 1;
            WHEN OTHERS THEN
                skipped_count := skipped_count + 1;
        END;
    END LOOP;
    
    RETURN QUERY SELECT inserted_count, skipped_count;
END;
$$ LANGUAGE plpgsql;

-- 12. เพิ่ม Function สำหรับการคำนวณ Risk แบบ Batch
CREATE OR REPLACE FUNCTION batch_calculate_risk(
    grade_id_param integer,
    department_id_param integer,
    hard_hours_param integer,
    soft_hours_param integer
) RETURNS TABLE(
    risk_status text,
    risk_percentage integer
) AS $$
DECLARE
    event_coop_record record;
    remaining_days integer;
    is_on_coop boolean;
    risk_percentage integer := 0;
    risk_status text := 'Normal';
BEGIN
    -- หา EventCoop
    SELECT remaining_days, is_on_coop
    INTO event_coop_record
    FROM event_coop
    WHERE grade_id = grade_id_param AND department_id = department_id_param
    LIMIT 1;
    
    IF NOT FOUND OR NOT event_coop_record.is_on_coop THEN
        RETURN QUERY SELECT 'Normal'::text, 0::integer;
        RETURN;
    END IF;
    
    remaining_days := event_coop_record.remaining_days;
    is_on_coop := event_coop_record.is_on_coop;
    
    -- คำนวณความเสี่ยง (simplified version)
    IF remaining_days <= 0 THEN
        risk_percentage := 100;
        risk_status := 'Risk';
    ELSIF remaining_days <= 30 THEN
        risk_percentage := 80;
        risk_status := 'Risk';
    ELSIF remaining_days <= 60 THEN
        risk_percentage := 60;
        risk_status := 'Risk';
    ELSIF remaining_days <= 90 THEN
        risk_percentage := 40;
        risk_status := 'Normal';
    ELSE
        risk_percentage := 20;
        risk_status := 'Normal';
    END IF;
    
    -- ปรับตาม hours
    IF hard_hours_param < 100 OR soft_hours_param < 100 THEN
        risk_percentage := risk_percentage + 20;
        IF risk_percentage > 100 THEN
            risk_percentage := 100;
        END IF;
        IF risk_percentage > 60 THEN
            risk_status := 'Risk';
        END IF;
    END IF;
    
    RETURN QUERY SELECT risk_status, risk_percentage;
END;
$$ LANGUAGE plpgsql;
