CREATE TABLE IF NOT EXISTS room (
  room_id SERIAL PRIMARY KEY,
  faculty_id INT NOT NULL,
  room_name VARCHAR(255) UNIQUE NOT NULL,
  floor VARCHAR(255) NOT NULL,
  seat_number INT NOT NULL,
  building_id INT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Available')),
  CONSTRAINT fk_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
  CONSTRAINT fk_building FOREIGN KEY (building_id) REFERENCES building(building_id)
);
