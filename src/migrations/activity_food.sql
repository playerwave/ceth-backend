CREATE TABLE IF NOT EXISTS activity_food (
  activity_food_id SERIAL PRIMARY KEY,
  activity_id INT NOT NULL,
  food_id INT NOT NULL,
  CONSTRAINT fk_activity FOREIGN KEY (activity_id) REFERENCES activity(activity_id),
  CONSTRAINT fk_food FOREIGN KEY (food_id) REFERENCES food(food_id)
);
