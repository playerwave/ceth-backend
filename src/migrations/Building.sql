CREATE TABLE IF NOT EXISTS building (
  building_id SERIAL PRIMARY KEY,
  faculty_id INT NOT NULL,
  building_name VARCHAR(255) UNIQUE NOT NULL,
  CONSTRAINT fk_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
);
