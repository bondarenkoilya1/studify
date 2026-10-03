CREATE TABLE IF NOT EXISTS subjects (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES  users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
    UNIQUE (user_id, name),

  note VARCHAR(200),

  type TEXT NOT NULL DEFAULT 'university',
  scope TEXT NOT NULL DEFAULT 'other',
  exam_type TEXT NOT NULL DEFAULT 'exam',

  exam_date TIMESTAMPTZ,
  course SMALLINT,
  term SMALLINT,

  thumbnail_url TEXT,

  CHECK (type IN ('university', 'personal')),
  CHECK (scope IN ('technology', 'healthcare', 'humanities', 'business', 'social', 'science', 'other')),
  CHECK (exam_type IN ('exam', 'credit', 'coursework', 'project', 'other')),
  CHECK (course BETWEEN 1 AND 6),
  CHECK (term BETWEEN 1 AND 4)
);

-- Refactor table by specifying exactly some  field for university and other for personal. OR*