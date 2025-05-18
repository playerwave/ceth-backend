CREATE TABLE IF NOT EXISTS answer (
  choose_id SERIAL PRIMARY KEY,
  join_id INT NOT NULL,
  question_id INT NOT NULL,
  choice_id INT NOT NULL,
  answer TEXT,
  CONSTRAINT fk_join FOREIGN KEY (join_id) REFERENCES join(join_id),
  CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES question(question_id),
  CONSTRAINT fk_choice FOREIGN KEY (choice_id) REFERENCES choice(choice_id)
);
