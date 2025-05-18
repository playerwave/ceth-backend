CREATE TABLE IF NOT EXISTS roles (
  roles_id SERIAL PRIMARY KEY,
  roles_name VARCHAR(20) UNIQUE NOT NULL CHECK (roles_name IN ('Student', 'Teacher', 'Admin'))
);
