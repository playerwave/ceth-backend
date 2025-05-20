CREATE TABLE IF NOT EXISTS choice (
  choice_id SERIAL PRIMARY KEY,
  choice_text TEXT NOT NULL,
  question_id INT NOT NULL,
  CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES question(question_id)
);
