CREATE TABLE IF NOT EXISTS set_number (
  set_number_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))
);
