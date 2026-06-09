CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  lecturer TEXT,
  exam_date TEXT,
  lecturer_avatar_url TEXT
);