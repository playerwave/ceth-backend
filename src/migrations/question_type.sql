CREATE TABLE IF NOT EXISTS question_type (
  question_type_id SERIAL PRIMARY KEY,
  question_name VARCHAR(50) NOT NULL CHECK (question_name IN ('Fix Single answer', 'Single answer', 'Multiple answer', 'Text answer'))
);
