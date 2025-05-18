CREATE TABLE IF NOT EXISTS department (
  department_id SERIAL PRIMARY KEY,
  department_name VARCHAR(255) UNIQUE NOT NULL,
  faculty_id INT NOT NULL,
  CONSTRAINT fk_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
);
