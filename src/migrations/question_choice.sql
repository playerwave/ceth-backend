CREATE TABLE IF NOT EXISTS question_choice (
  question_choice_id SERIAL PRIMARY KEY,
  question_id INT NOT NULL,
  choice_id INT NOT NULL,
  set_number INT NOT NULL,
  CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES question(question_id),
  CONSTRAINT fk_choice FOREIGN KEY (choice_id) REFERENCES choice(choice_id),
  CONSTRAINT fk_set_number FOREIGN KEY (set_number) REFERENCES set_number(set_number_id)
);
