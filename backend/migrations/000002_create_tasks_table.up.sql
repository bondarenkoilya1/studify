CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    deadline TEXT,
    status TEXT NOT NULL,
    subject_id BIGINT NOT NULL,

    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);