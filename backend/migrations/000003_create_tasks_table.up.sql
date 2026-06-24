CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    deadline TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'not_completed',
    subject_id BIGINT NOT NULL,
    description TEXT NOT NULL DEFAULT '',

    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CHECK (status IN ('not_completed', 'ongoing', 'completed'))
);