-- สร้างตาราง event_coop
CREATE TABLE IF NOT EXISTS event_coop (
    eventcoop_id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL,
    grade_id INTEGER NOT NULL,
    date TIMESTAMP,
    remaining_days INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- เพิ่ม Foreign Key Constraints
ALTER TABLE event_coop 
ADD CONSTRAINT fk_event_coop_department 
FOREIGN KEY (department_id) REFERENCES department(department_id);

ALTER TABLE event_coop 
ADD CONSTRAINT fk_event_coop_grade 
FOREIGN KEY (grade_id) REFERENCES grade(grade_id);

-- เพิ่ม Indexes
CREATE INDEX IF NOT EXISTS idx_event_coop_department_id ON event_coop(department_id);
CREATE INDEX IF NOT EXISTS idx_event_coop_grade_id ON event_coop(grade_id);
CREATE INDEX IF NOT EXISTS idx_event_coop_date ON event_coop(date);

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO event_coop (department_id, grade_id, date, remaining_days) VALUES
(1, 1, '2024-06-15 00:00:00', 120),
(1, 2, '2024-06-20 00:00:00', 125),
(1, 3, '2024-06-25 00:00:00', 130),
(1, 4, '2024-07-01 00:00:00', 135);

-- ตรวจสอบข้อมูล
SELECT 
    ec.eventcoop_id,
    ec.department_id,
    ec.grade_id,
    ec.date,
    ec.remaining_days,
    d.department_name_tha,
    g.grade_name
FROM event_coop ec
LEFT JOIN department d ON ec.department_id = d.department_id
LEFT JOIN grade g ON ec.grade_id = g.grade_id
ORDER BY d.department_name_tha, g.grade_id, ec.date;
