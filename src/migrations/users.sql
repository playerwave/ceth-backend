CREATE TABLE IF NOT EXISTS users (
  users_id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  roles_id INT NOT NULL,
  CONSTRAINT fk_roles FOREIGN KEY (roles_id) REFERENCES roles(roles_id)
);
