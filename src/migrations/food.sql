CREATE TABLE IF NOT EXISTS food (
  food_id SERIAL PRIMARY KEY,
  food_name VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  faculty_id INT NOT NULL,
  CONSTRAINT fk_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
);
