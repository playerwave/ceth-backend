CREATE TABLE IF NOT EXISTS assessment (
  assessment_id SERIAL PRIMARY KEY,
  assessment_name VARCHAR(255) NOT NULL,
  description TEXT,
  create_date TIMESTAMP NOT NULL,
  last_update TIMESTAMP NOT NULL,
  assessment_status VARCHAR(20) NOT NULL CHECK (assessment_status IN ('Not finished', 'Finished', 'Unsuccessful')),
  set_number_id INT NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  CONSTRAINT fk_set_number FOREIGN KEY (set_number_id) REFERENCES set_number(set_number_id)
);
