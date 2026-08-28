CREATE TABLE lecturers (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    position TEXT NOT NULL DEFAULT 'lecturer',
      CHECK (position IN ('lecturer', 'practical_instructor', 'lab_instructor', 'assistant'))
)