CREATE TABLE shared_projects (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    author TEXT NOT NULL,
    author_avatar_url TEXT NOT NULL
);