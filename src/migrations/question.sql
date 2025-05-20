CREATE TABLE IF NOT EXISTS question (
  question_id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type_id INT NOT NULL,
  CONSTRAINT fk_question_type FOREIGN KEY (question_type_id) REFERENCES question_type(question_type_id)
);

ALTER TABLE question
ADD COLUMN question_number INT NOT NULL;

ALTER TABLE question
ADD COLUMN set_number INT NOT NULL;

ALTER TABLE question
ADD CONSTRAINT fk_set_number FOREIGN KEY (set_number) REFERENCES set_number(set_number_id);
