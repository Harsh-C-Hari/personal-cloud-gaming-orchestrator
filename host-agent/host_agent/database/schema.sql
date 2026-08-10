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


CREATE TABLE IF NOT EXISTS session_events (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    time REAL NOT NULL,

    session_id TEXT NOT NULL,

    user_id TEXT,

    game_id TEXT,

    status TEXT NOT NULL,

    message TEXT
);

CREATE INDEX IF NOT EXISTS idx_session_events_session
ON session_events(session_id);

CREATE INDEX IF NOT EXISTS idx_session_events_user
ON session_events(user_id);

CREATE INDEX IF NOT EXISTS idx_session_events_time
ON session_events(time);


CREATE TABLE IF NOT EXISTS sunshine_stream_history (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    recorded_at REAL NOT NULL,

    app_name TEXT,

    started_at REAL NOT NULL,

    ended_at REAL NOT NULL,

    duration_seconds REAL NOT NULL,

    width INTEGER NOT NULL,

    height INTEGER NOT NULL,

    fps REAL NOT NULL,

    hdr INTEGER NOT NULL DEFAULT 0,

    stream_ended_intentionally INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sunshine_stream_history_recorded
ON sunshine_stream_history(recorded_at);

CREATE INDEX IF NOT EXISTS idx_sunshine_stream_history_started
ON sunshine_stream_history(started_at);

CREATE INDEX IF NOT EXISTS idx_sunshine_stream_history_app
ON sunshine_stream_history(app_name);



CREATE TABLE IF NOT EXISTS session_metadata (

    session_id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    game_id TEXT NOT NULL,

    exe_name TEXT NOT NULL,

    game_save_path TEXT NOT NULL,

    backup_path TEXT NOT NULL,

    state TEXT NOT NULL,

    created_at REAL NOT NULL,

    updated_at REAL NOT NULL,

    ended_at REAL,

    crash_recovery_required INTEGER,

    latest_save_hash TEXT,

    injected_save_hash TEXT,

    archive_hash TEXT,

    archive_path TEXT,

    latest_manifest_verified INTEGER,

    backup_manifest_verified INTEGER,

    archive_verified INTEGER,

    integrity_verified INTEGER,

    restore_verified INTEGER,

    restore_source TEXT,

    live_sync_triggered INTEGER NOT NULL DEFAULT 0,

    live_sync_count INTEGER NOT NULL DEFAULT 0,

    live_sync_last_time REAL,

    live_sync_preserved INTEGER NOT NULL DEFAULT 0,

    live_sync_hash TEXT,

    live_sync_fallback INTEGER NOT NULL DEFAULT 0,

    backup_failed INTEGER NOT NULL DEFAULT 0,

    archive_failed INTEGER NOT NULL DEFAULT 0,

    cleanup_result TEXT

);

CREATE INDEX IF NOT EXISTS idx_session_metadata_user
ON session_metadata(user_id);

CREATE INDEX IF NOT EXISTS idx_session_metadata_game
ON session_metadata(game_id);

CREATE INDEX IF NOT EXISTS idx_session_metadata_state
ON session_metadata(state);

CREATE INDEX IF NOT EXISTS idx_session_metadata_created
ON session_metadata(created_at);