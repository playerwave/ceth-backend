CREATE TABLE IF NOT EXISTS certificate (
  certificate_id SERIAL PRIMARY KEY,
  students_id INT NOT NULL,
  teacher_id INT NOT NULL,
  activity_id INT NOT NULL,
  date TIMESTAMP NOT NULL,
  hours INT NOT NULL,
  img VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Pass', 'Fail')),
  CONSTRAINT fk_students FOREIGN KEY (students_id) REFERENCES students(students_id),
  CONSTRAINT fk_teacher FOREIGN KEY (teacher_id) REFERENCES teacher(teacher_id),
  CONSTRAINT fk_activity FOREIGN KEY (activity_id) REFERENCES activity(activity_id)
);
