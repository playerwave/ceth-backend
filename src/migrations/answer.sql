CREATE TABLE IF NOT EXISTS answer (
  answer_id SERIAL PRIMARY KEY,          
  join_id INT NOT NULL,
  question_id INT NOT NULL,
  choice_id INT NULL,                    
  answer_text TEXT NULL,                
  set_number_id INT NULL,               
  assessment_id INT NULL,               
  CONSTRAINT fk_join FOREIGN KEY (join_id) REFERENCES join(join_id),
  CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES question(question_id),
  CONSTRAINT fk_choice FOREIGN KEY (choice_id) REFERENCES choice(choice_id),
  CONSTRAINT fk_set_number FOREIGN KEY (set_number_id) REFERENCES set_number(set_number_id),
  CONSTRAINT fk_assessment FOREIGN KEY (assessment_id) REFERENCES assessment(assessment_id)
);
