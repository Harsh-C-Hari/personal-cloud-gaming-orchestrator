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

CREATE TABLE IF NOT EXISTS recovery_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time REAL NOT NULL,
    service TEXT NOT NULL,
    event TEXT NOT NULL,
    details TEXT
);

CREATE TABLE IF NOT EXISTS session_history (

    session_id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    game_id TEXT NOT NULL,

    status TEXT NOT NULL
        CHECK(status IN ('completed', 'failed')),

    started_at REAL NOT NULL,

    ended_at REAL NOT NULL,

    played_seconds REAL NOT NULL,

    error TEXT,

    game_ended_at REAL,

    integrity_verified INTEGER,

    latest_manifest_verified INTEGER,

    backup_manifest_verified INTEGER,

    archive_verified INTEGER,

    backup_path TEXT,

    archive_path TEXT,

    restore_verified INTEGER,

    restore_source TEXT,

    restart_count INTEGER NOT NULL DEFAULT 0,

    last_restart_time REAL

);

CREATE INDEX IF NOT EXISTS idx_session_history_user
ON session_history(user_id);

CREATE INDEX IF NOT EXISTS idx_session_history_game
ON session_history(game_id);

CREATE INDEX IF NOT EXISTS idx_session_history_started
ON session_history(started_at);