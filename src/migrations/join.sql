CREATE TABLE IF NOT EXISTS join (
  join_id SERIAL PRIMARY KEY,
  students_id INT NOT NULL,
  teacher_id INT NOT NULL,
  join_date TIMESTAMP NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
  activity_detail_id INT NOT NULL,
  CONSTRAINT fk_students FOREIGN KEY (students_id) REFERENCES students(students_id),
  CONSTRAINT fk_teacher FOREIGN KEY (teacher_id) REFERENCES teacher(teacher_id),
  CONSTRAINT fk_activity_detail FOREIGN KEY (activity_detail_id) REFERENCES activity_detail(activity_detail_id)
);
