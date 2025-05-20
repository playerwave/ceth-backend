CREATE TABLE activity (
  activity_id SERIAL PRIMARY KEY,
  activity_name VARCHAR(255) NOT NULL,
  presenter_company_name VARCHAR(255),
  type VARCHAR(10) NOT NULL CHECK (type IN ('Soft', 'Hard')),
  description TEXT,
  seat INT,
  recieve_hours INT,
  event_format VARCHAR(10) CHECK (event_format IN ('Online', 'Onsite', 'Course')),
  create_activity_date TIMESTAMP DEFAULT NOW(),
  special_start_register_date TIMESTAMP,
  start_register_date TIMESTAMP,
  end_register_date TIMESTAMP,
  start_activity_date TIMESTAMP,
  end_activity_date TIMESTAMP,
  image_url VARCHAR(255),
  activity_status VARCHAR(10) NOT NULL CHECK (activity_status IN ('Private', 'Public')),
  activity_state VARCHAR(50) NOT NULL CHECK (
    activity_state IN (
      'Not Start',
      'Special Open Register',
      'Open Register',
      'Close Register',
      'Start Activity',
      'End Activity',
      'Start Assessment',
      'End Assessment'
    )
  ),
  status VARCHAR(10) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  last_update_activity_date TIMESTAMP DEFAULT NOW(),
  url VARCHAR(255),
  assessment_id INT,
  room_id INT,
  CONSTRAINT fk_assessment FOREIGN KEY (assessment_id) REFERENCES assessment(assessment_id),
  CONSTRAINT fk_room FOREIGN KEY (room_id) REFERENCES room(room_id)
);
