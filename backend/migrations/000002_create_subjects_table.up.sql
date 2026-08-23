CREATE TABLE IF NOT EXISTS subjects (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES  users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  exam_date TIMESTAMPTZ,

  type TEXT NOT NULL DEFAULT 'university',
    CHECK (type IN ('university', 'personal')),

  lecturer TEXT,
  lecturer_avatar_url TEXT
);