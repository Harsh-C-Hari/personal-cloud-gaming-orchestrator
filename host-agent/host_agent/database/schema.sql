CREATE TABLE IF NOT EXISTS users (

    username TEXT PRIMARY KEY,

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL
        CHECK(role IN ('admin','user')),

    created_at REAL NOT NULL

);

CREATE TABLE IF NOT EXISTS session_stats (

    id INTEGER PRIMARY KEY,

    total_sessions INTEGER NOT NULL DEFAULT 0,

    successful_sessions INTEGER NOT NULL DEFAULT 0,

    failed_sessions INTEGER NOT NULL DEFAULT 0,

    recovered_sessions INTEGER NOT NULL DEFAULT 0,

    total_playtime_seconds REAL NOT NULL DEFAULT 0

);

INSERT OR IGNORE INTO session_stats (
    id,
    total_sessions,
    successful_sessions,
    failed_sessions,
    recovered_sessions,
    total_playtime_seconds
)
VALUES (
    1,
    0,
    0,
    0,
    0,
    0
);