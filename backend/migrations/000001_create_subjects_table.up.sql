CREATE TABLE IF NOT EXISTS subjects (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  lecturer TEXT NOT NULL DEFAULT '',
  exam_date TIMESTAMPTZ,
  lecturer_avatar_url TEXT
);