CREATE TABLE IF NOT EXISTS eventcoop (
  eventcoop_id SERIAL PRIMARY KEY,
  department_id INT NOT NULL,
  grade_id INT NOT NULL,
  date TIMESTAMP NOT NULL,
  CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES department(department_id),
  CONSTRAINT fk_grade FOREIGN KEY (grade_id) REFERENCES grade(grade_id)
);
