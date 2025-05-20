CREATE TABLE IF NOT EXISTS activity_detail (
  activity_detail_id SERIAL PRIMARY KEY,
  join_id INT NOT NULL,
  activity_id INT NOT NULL,
  activity_food_id INT NOT NULL,
  register_date TIMESTAMP,
  time_in TIMESTAMP,
  time_out TIMESTAMP,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Registered', 'Cancelled')),
  CONSTRAINT fk_join FOREIGN KEY (join_id) REFERENCES join(join_id),
  CONSTRAINT fk_activity FOREIGN KEY (activity_id) REFERENCES activity(activity_id),
  CONSTRAINT fk_activity_food FOREIGN KEY (activity_food_id) REFERENCES activity_food(activity_food_id)
);
