CREATE TABLE IF NOT EXISTS teacher (
  teacher_id SERIAL PRIMARY KEY,
  users_id INT NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  faculty_id INT NOT NULL,
  CONSTRAINT fk_users FOREIGN KEY (users_id) REFERENCES users(users_id),
  CONSTRAINT fk_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
);
    