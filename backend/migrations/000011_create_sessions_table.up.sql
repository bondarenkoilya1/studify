CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    os TEXT,
    browser TEXT,
    device TEXT,
    country TEXT,
    last_login TIMESTAMP
);