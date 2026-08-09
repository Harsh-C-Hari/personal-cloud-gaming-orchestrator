# Phase 25 — Database Schema (v2, simplified)

> Revision note: this version merges `session_runtime_state` into
> `session_metadata` and drops the `migration_state` table, per the
> critical review. See bottom of file for what changed and why.

Engine: **SQLite** (stdlib `sqlite3`), single file at `data/pcgo.db`.
Pragmas set on every connection: `PRAGMA foreign_keys=ON;`,
`PRAGMA journal_mode=WAL;`, `PRAGMA busy_timeout=5000;`.

All timestamps stored as Unix epoch **REAL** (matches existing
`time.time()` usage throughout the codebase — no format conversion
needed during import). Booleans stored as `INTEGER` (0/1) — standard
SQLite practice, cast at the repository boundary.

---

## `users` - Migration Complete

Replaces `data/users.json`.

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `username` | TEXT | UNIQUE NOT NULL |
| `password_hash` | TEXT | NOT NULL |
| `role` | TEXT | NOT NULL, CHECK (`role` IN ('admin','user')) |
| `created_at` | REAL | NOT NULL |

Why: relational, queried by unique key, with an existing business rule
("cannot delete last admin") best enforced with a `COUNT(*) WHERE
role='admin'` query rather than scanning a list in Python.

---

## `games`

Replaces `games.json`.

| Column | Type | Constraints |
|---|---|---|
| `game_id` | TEXT | PRIMARY KEY |
| `name` | TEXT | NOT NULL |
| `exe_name` | TEXT | NOT NULL |
| `exe_path` | TEXT | NOT NULL |
| `save_path` | TEXT | NOT NULL |
| `process_name` | TEXT | NOT NULL |
| `save_filter_mode` | TEXT | NOT NULL |
| `save_filter_prefix` | TEXT | NOT NULL, JSON array as text |
| `save_filter_contains` | TEXT | NOT NULL, JSON array as text |
| `save_filter_suffix` | TEXT | NOT NULL, JSON array as text |

`save_filter_*` stays as JSON-in-TEXT, not a normalized child table:
these lists are always read/written as one unit (`SaveFilters`
dataclass) and never individually queried — a child table would add a
join with no query benefit.

`game_id` is the primary key (not a surrogate int) because it's
already used as a stable string identifier throughout
`session_service.py`, `save_manager.py`, and the frontend.

### Revised Scope: games.json remains a host configuration file alongside config.json. Phase 25 migrates runtime and user data to SQLite while retaining host-specific configuration in JSON.

---

## `session_metadata`

Replaces **both** `metadata/session_metadata.json` **and**
`data/active_sessions.json`. One row per session — active sessions and
completed-but-not-yet-cleaned-up sessions are simply rows in the same
table, distinguished by `status`. This is the single biggest
simplification from the review: v1 had a second table
(`session_runtime_state`) linked 1:1 to this one purely to isolate a
"hot write path" that, at this project's scale (a handful of
concurrent sessions on one host), doesn't need isolating. One table,
one repository, one row per session.

| Column | Type | Constraints |
|---|---|---|
| `session_id` | TEXT | PRIMARY KEY |
| `user_id` | TEXT | NOT NULL, FK → `users(username)` ON DELETE RESTRICT |
| `game_id` | TEXT | NOT NULL, FK → `games(game_id)` ON DELETE RESTRICT |
| `exe_name` | TEXT | NOT NULL |
| `game_save_path` | TEXT | NOT NULL |
| `backup_path` | TEXT | NOT NULL |
| `state` | TEXT | NOT NULL |
| `status` | TEXT | NULL — runtime status (`starting`/`running`/`stopping`/`cleaning`/`completed`/`failed`); NULL once the row is pruned after cleanup |
| `created_at` | INTEGER | NOT NULL |
| `updated_at` | INTEGER | NOT NULL |
| `ended_at` | INTEGER | NULL |
| `started_at` | REAL | NULL |
| `played_seconds` | REAL | NULL |
| `game_ended_at` | REAL | NULL |
| `duration` | INTEGER | NULL |
| `warning` | INTEGER | NULL |
| `expires_at` | REAL | NULL |
| `warning_at` | REAL | NULL |
| `warning_sent` | INTEGER | NOT NULL DEFAULT 0 |
| `skip_timer` | INTEGER | NOT NULL DEFAULT 0 |
| `stream_active` | INTEGER | NOT NULL DEFAULT 0 |
| `stream_started_at` | REAL | NULL |
| `stream_ended_at` | REAL | NULL |
| `stream_app` | TEXT | NULL |
| `transport_connected` | INTEGER | NOT NULL DEFAULT 0 |
| `awaiting_reconnect` | INTEGER | NOT NULL DEFAULT 0 |
| `last_disconnect_at` | REAL | NULL |
| `last_reconnect_at` | REAL | NULL |
| `restart_requested` | INTEGER | NOT NULL DEFAULT 0 |
| `restart_in_progress` | INTEGER | NOT NULL DEFAULT 0 |
| `restart_count` | INTEGER | NOT NULL DEFAULT 0 |
| `last_restart_time` | REAL | NULL |
| `crash_recovery_required` | INTEGER | NULL |
| `latest_save_hash` | TEXT | NULL |
| `injected_save_hash` | TEXT | NULL |
| `archive_hash` | TEXT | NULL |
| `archive_path` | TEXT | NULL |
| `latest_manifest_verified` | INTEGER | NULL |
| `backup_manifest_verified` | INTEGER | NULL |
| `archive_verified` | INTEGER | NULL |
| `integrity_verified` | INTEGER | NULL |
| `restore_verified` | INTEGER | NULL |
| `restore_source` | TEXT | NULL |
| `live_sync_triggered` | INTEGER | NOT NULL DEFAULT 0 |
| `live_sync_count` | INTEGER | NOT NULL DEFAULT 0 |
| `live_sync_last_time` | INTEGER | NULL |
| `live_sync_preserved` | INTEGER | NOT NULL DEFAULT 0 |
| `live_sync_hash` | TEXT | NULL |
| `live_sync_fallback` | INTEGER | NOT NULL DEFAULT 0 |
| `backup_failed` | INTEGER | NOT NULL DEFAULT 0 |
| `archive_failed` | INTEGER | NOT NULL DEFAULT 0 |
| `cleanup_result` | TEXT | NULL |

Indexes: `idx_session_metadata_user_id (user_id)`,
`idx_session_metadata_game_id (game_id)`,
`idx_session_metadata_status (status)` (supports "list active
sessions" queries that replace reading `active_sessions.json` whole).

FK: `ON DELETE RESTRICT` for both `user_id` and `game_id` (one rule,
applied consistently — no per-table tradeoff analysis needed at this
scale). A session row is deleted explicitly by
`SessionRepository.cleanup(session_id)` when the equivalent
in-memory dict entry is evicted today — same lifecycle as before, just
one row instead of a JSON dict entry plus a separate metadata-file
entry.

---

## `session_history` - Migration Complete

Replaces `data/session_history.json` (previously hard-capped at 500
entries by array-slicing — the cap is no longer necessary since SQLite
handles far more rows than a JSON array comfortably; a housekeeping
job can trim it later if disk becomes a concern, not on every write).

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `session_id` | TEXT | NOT NULL |
| `user_id` | TEXT | NOT NULL, FK → `users(username)` ON DELETE RESTRICT |
| `game_id` | TEXT | NOT NULL, FK → `games(game_id)` ON DELETE RESTRICT |
| `status` | TEXT | NOT NULL |
| `started_at` | REAL | NULL |
| `ended_at` | REAL | NULL |
| `played_seconds` | REAL | NULL |
| `error` | TEXT | NULL |
| `game_ended_at` | REAL | NULL |
| `integrity_verified` | INTEGER | NULL |
| `latest_manifest_verified` | INTEGER | NULL |
| `backup_manifest_verified` | INTEGER | NULL |
| `archive_verified` | INTEGER | NULL |
| `backup_path` | TEXT | NULL |
| `archive_path` | TEXT | NULL |
| `restore_verified` | INTEGER | NULL |
| `restore_source` | TEXT | NULL |
| `restart_count` | INTEGER | NOT NULL DEFAULT 0 |
| `last_restart_time` | REAL | NULL |
| `recorded_at` | REAL | NOT NULL |

Indexes: `idx_session_history_user_id (user_id, recorded_at DESC)`,
`idx_session_history_session_id (session_id)`.

---

## `session_events` - Migration Complete

Replaces `data/session_events.json` (previously capped at 1000, same
reasoning as `session_history` above — cap removed).

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `session_id` | TEXT | NOT NULL |
| `user_id` | TEXT | NULL |
| `game_id` | TEXT | NULL |
| `status` | TEXT | NOT NULL |
| `message` | TEXT | NOT NULL DEFAULT '' |
| `time` | REAL | NOT NULL |

Indexes: `idx_session_events_session_id (session_id)`,
`idx_session_events_time (time DESC)`.

No FK on `user_id`/`game_id`: the current code already tolerates a
`None` session lookup, so these stay nullable/unconstrained to
preserve that exact behavior.

---

## `recovery_events` - Migration Complete

Replaces `data/recovery_events.json` (previously capped at 1000, cap
removed for the same reason as above).

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `service` | TEXT | NOT NULL, CHECK (`service` IN ('sunshine','tailscale')) |
| `event` | TEXT | NOT NULL |
| `details` | TEXT | NULL, JSON object as text |
| `time` | REAL | NOT NULL |

Indexes: `idx_recovery_events_service_event (service, event)`,
`idx_recovery_events_time (time DESC)`.

`get_recovery_stats()` becomes one
`SELECT service, event, COUNT(*) FROM recovery_events GROUP BY
service, event` instead of tallying up to 10,000 rows in Python — a
direct win from the migration, not an added abstraction.

---

## `session_stats` - Migration Complete 

Replaces `data/session_stats.json` (singleton object).

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, CHECK (`id` = 1) |
| `total_sessions` | INTEGER | NOT NULL DEFAULT 0 |
| `successful_sessions` | INTEGER | NOT NULL DEFAULT 0 |
| `failed_sessions` | INTEGER | NOT NULL DEFAULT 0 |
| `recovered_sessions` | INTEGER | NOT NULL DEFAULT 0 |
| `total_playtime_seconds` | REAL | NOT NULL DEFAULT 0 |

Single-row table (`CHECK (id = 1)`), seeded on schema creation.
`record_session()` is one atomic `UPDATE ... SET total_sessions =
total_sessions + 1, ...` — SQLite's own transaction guarantee makes
this safe with no additional Python-level lock.

---

## `stream_state`

Replaces `data/sunshine_stream_state.json` (singleton object).

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, CHECK (`id` = 1) |
| `state` | TEXT | NOT NULL DEFAULT 'idle' |
| `app_name` | TEXT | NULL |
| `started_at` | REAL | NULL |
| `ended_at` | REAL | NULL |
| `duration_seconds` | REAL | NULL |
| `width` | INTEGER | NULL |
| `height` | INTEGER | NULL |
| `fps` | INTEGER | NULL |
| `hdr` | INTEGER | NULL |
| `transport_connected` | INTEGER | NOT NULL DEFAULT 0 |
| `awaiting_reconnect` | INTEGER | NOT NULL DEFAULT 0 |
| `last_disconnect_at` | REAL | NULL |
| `last_reconnect_at` | REAL | NULL |

---

## `stream_history`

Replaces `data/sunshine_stream_history.json`.

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `recorded_at` | REAL | NOT NULL |
| `app_name` | TEXT | NULL |
| `started_at` | REAL | NULL |
| `ended_at` | REAL | NULL |
| `duration_seconds` | REAL | NULL |
| `width` | INTEGER | NULL |
| `height` | INTEGER | NULL |
| `fps` | INTEGER | NULL |
| `hdr` | INTEGER | NULL |
| `stream_ended_intentionally` | INTEGER | NOT NULL DEFAULT 1 |

Index: `idx_stream_history_recorded_at (recorded_at DESC)`.

---

## `schema_migrations`

| Column | Type | Constraints |
|---|---|---|
| `version` | INTEGER | PRIMARY KEY |
| `description` | TEXT | NOT NULL |
| `applied_at` | REAL | NOT NULL |

One row inserted (`version=1`) when the initial schema is created.
Kept minimal on purpose — see `DATABASE_ARCHITECTURE.md` §5 for why a
generalized migration runner is deferred until a second migration
actually exists.

---

## Entity-Relationship Summary

```
users (username) ──┬──< session_metadata (user_id)
                    └──< session_history  (user_id)
                       (session_events.user_id — unconstrained)

games (game_id) ────┬──< session_metadata (game_id)
                     └──< session_history  (game_id)

session_metadata, session_history, session_events, recovery_events
  are otherwise independent tables, joined only by session_id at
  query time — no FK between session_events/recovery_events and
  session_metadata, matching current code's tolerance for
  orphaned/unknown session_ids.
```

---

## What Changed From v1 (Critical Review)

| v1 | v2 | Why |
|---|---|---|
| `session_runtime_state` as a separate 1:1-linked table | Merged into `session_metadata` | Isolating a "hot write path" is a multi-tenant/high-concurrency concern; this is a single host with a handful of concurrent sessions at most — one table is simpler and sufficient |
| `migration_state` table tracking per-file import status | Removed — one check ("is `session_metadata` empty and do legacy files exist?"), one transaction | A one-time, one-machine, one-run import doesn't need resumable per-file state tracking; a person is present to rerun it if it fails |
| Two-rule FK policy (`RESTRICT` for audit tables, `CASCADE` for the runtime table) | One rule: `RESTRICT` everywhere | The `CASCADE` case only existed because of the now-removed `session_runtime_state` table |
