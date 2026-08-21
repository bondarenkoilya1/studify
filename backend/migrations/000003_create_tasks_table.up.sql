CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,

    subject_id BIGINT NOT NULL,

    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',

    estimated_time INTEGER,
    scheduled_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ,

    status TEXT NOT NULL DEFAULT 'not_completed',
    difficulty TEXT NOT NULL DEFAULT 'low',
    priority TEXT NOT NULL DEFAULT 'low',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,

    CHECK (status IN ('not_completed', 'ongoing', 'completed')),
    CHECK (difficulty IN ('low', 'medium', 'high')),
    CHECK (priority IN ('low', 'medium', 'high')),
    CHECK (type IN ('exam', 'credit', 'coursework', 'project', 'other')),

    CHECK (estimated_time IS NULL OR estimated_time > 0)
);