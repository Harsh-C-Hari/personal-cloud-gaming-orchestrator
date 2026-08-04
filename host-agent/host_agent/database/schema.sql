CREATE TABLE IF NOT EXISTS users (

    username TEXT PRIMARY KEY,

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL
        CHECK(role IN ('admin','user')),

    created_at REAL NOT NULL

);