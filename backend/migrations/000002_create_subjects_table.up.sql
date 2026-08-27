CREATE TABLE IF NOT EXISTS subjects (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES  users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  note TEXT CHECK (char_length(note) <= 200),

  type TEXT NOT NULL DEFAULT 'university',
    CHECK (type IN ('university', 'personal')),

  scope TEXT NOT NULL DEFAULT 'other',
    CHECK (scope IN ('technology', 'healthcare', 'humanities', 'business', 'social', 'science', 'other')),

  exam_date TIMESTAMPTZ,

  lecturer TEXT,
  lecturer_avatar_url TEXT
);