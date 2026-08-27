CREATE TABLE IF NOT EXISTS subjects (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES  users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  exam_date TIMESTAMPTZ,

  type TEXT NOT NULL DEFAULT 'university',
    CHECK (type IN ('university', 'personal')),

  scope TEXT NOT NULL DEFAULT 'other',
    CHECK (scope IN ('technology', 'healthcare', 'humanities', 'business', 'social', 'science', 'other')),


  lecturer TEXT,
  lecturer_avatar_url TEXT
);