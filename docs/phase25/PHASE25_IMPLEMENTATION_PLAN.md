# Phase 25 — Implementation Plan: JSON → SQLite Persistence Migration (v2, simplified)

Status: **Implemented.** Users, session stats, recovery events, session history, session events, session metadata, and Sunshine stream history/state are now SQLite-backed (see `host_agent/database/schema.sql` and `host_agent/repositories/`). This document is kept as the original design record; where the final implementation diverged from this plan, see the notes below and in `DATABASE_SCHEMA.md`. Notably: the actual schema has no `games` table, no foreign-key constraints, and no `schema_migrations` table, and there is no automated JSON-to-SQLite data-import routine in the codebase — `data/active_sessions.json` also remained a separate JSON file rather than merging into `session_metadata` as originally planned here.
Scope: `host-agent/` (the only tier with persistence; `frontend/` has none).

> Revision note: this version reflects the critical review — fewer
> repositories, one merged session table, no generic transaction or
> migration-runner abstractions, no per-repository locks, one
> simplified import step. See `DATABASE_SCHEMA.md` §"What Changed" and
> `DATABASE_ARCHITECTURE.md` §9 for the full diffs.

`config.json` and `games.json` remain JSON-based host configuration files and are intentionally excluded from the SQLite migration.

`users.json` Migration Complete.
`session_stats.json` - Migration Complete
`recovery_events.json` - Migration Complete
`session_history.json` - Migration Complete
`session_events.json` - Migration Complete
`sunshine_stream_history.json` - Migration Complete
`sunshine_stream_state.json` - Migration Complete 
---

## 1. Current Persistence Audit

Audit performed by inspecting every module that opens a file for
read/write of persistent state (grep for `json.load`/`json.dump`/`open(`
across `host-agent/`).

| Current File | Purpose | Read By | Written By | Should Migrate? | Reason |
|---|---|---|---|---|---|
| `data/users.json` | User accounts (username, password_hash, role, created_at) | `user_manager.py`, `api/routes/auth.py` | `user_manager.py` | **Yes → SQLite** | Structured, relational, queried by key, integrity-critical (last-admin rule) |
| `metadata/session_metadata.json` | Per-session integrity/lifecycle metadata | `metadata_manager.py`, `live_sync.py`, `session_service.py` | `metadata_manager.py` | **Yes → SQLite** | High field count, updated field-by-field, read on every session state transition |
| `data/active_sessions.json` | Snapshot of in-memory `active_sessions` dict, used for crash recovery on restart | `session_service.py` (health check, recovery) | `session_service._persist_active_sessions` | **Yes → SQLite** — merged into the same table as session metadata (see §2) | Same entity (a session) as `session_metadata`; no need for a second table at this project's scale |
| `data/session_history.json` | Completed-session history (capped at last 500) | `session_service.get_session_history`, `get_user_session_ids`, `get_session_health` | `session_service._append_session_history` | **Yes → SQLite** | Append-only log, queried/filtered by `user_id`; artificial 500-cap was a JSON-file limitation |
| `data/session_events.json` | Fine-grained session status event log (capped at 1000) | `session_service.get_session_health` | `session_service._append_session_event` | **Yes → SQLite** | Same shape as history: append-only, filterable log |
| `data/recovery_events.json` | Watchdog recovery events (Sunshine/Tailscale), capped at 1000 | `recovery_event_manager.get_recovery_events/get_recovery_stats` | `recovery_event_manager.append_recovery_event` | **Yes → SQLite** | Append-only log; stats currently recomputed by scanning the whole file every call |
| `data/session_stats.json` | Aggregate lifetime counters (singleton) | dashboards / stats endpoints | `session_stats_manager.record_session` | **Yes → SQLite** | Singleton counter row, updated transactionally alongside `session_history` inserts |
| `data/sunshine_stream_state.json` | Current live stream state (singleton, runtime) | `sunshine_stream_tracker.get_state`, `session_service` | `sunshine_stream_tracker.write` | **Yes → SQLite** | Singleton row, benefits from transactional updates over rewrite-whole-file |
| `data/sunshine_stream_history.json` | Historical record of past streams | `sunshine_stream_tracker.read_history` | `sunshine_stream_tracker.append_history` | **Yes → SQLite** | Append-only log |
| `games.json` | Game catalog (id, exe paths, save filters) | `save_manager._load_game_configs`, `api/routes/games.py` | `save_manager.save_game_configs` | **Yes → SQLite** | Small, structured, relational; rarely written, frequently read |
| `config.json` | App bootstrap config: secrets, paths, feature flags | almost every module, at **import time** | `config_manager.save`, `startup_initializer._ensure_internal_event_token` | **No — stays JSON** | Read before any DB connection can exist; holds secrets that should stay a single, inspectable/rotatable file |
| `metadata/session.lock` | Single-writer OS-level session lock | `session_lock.py` | `session_lock.py` | **No — stays filesystem** | Its value *is* being a bare file: existence + atomic replace is the recovery signal checked before the DB is guaranteed healthy at startup |
| `*/manifest.json` sidecars next to backups/archives | Per-artifact hash manifest for integrity verification | `save_manager._verify_manifest` etc. | `save_manager._write_backup_manifest` etc. | **No — stays filesystem** | Must travel with the artifact it describes |
| `host_saves/`, `backups/`, `archives/` | Save game data | `save_manager` | `save_manager` | **No — stays filesystem/archive** | Binary/opaque blobs; wrong shape for a relational DB |
| `logs/` | Application logs | `logging_config.py` | `logging_config.py` | **No — stays filesystem** | Unstructured text, rotated, not queried relationally |

---

## 2. Persistence Classification Summary

| Destination | Files |
|---|---|
| **SQLite** | `users.json`, `session_metadata.json` **+** `active_sessions.json` (merged into one table), `session_history.json`, `session_events.json`, `recovery_events.json`, `session_stats.json`, `sunshine_stream_state.json`, `sunshine_stream_history.json`, `games.json` |
| **JSON (unchanged)** | `config.json` |
| **File system (unchanged)** | `metadata/session.lock`, `*/manifest.json` sidecars, `logs/` |
| **Archive/blob storage (unchanged)** | `host_saves/`, `backups/`, `archives/` |
| **Runtime only (no persistence change)** | `active_sessions` in-process dict, `registry_lock`, watchdog in-memory counters stay as in-memory Python objects; only their *periodic snapshot* moves to SQLite |

`active_sessions.json` and `session_metadata.json` describe the same
entity — a session — so they collapse into one SQLite table
(`session_metadata`) instead of two. This wasn't obvious from the file
list alone; it only became clear once every field in both files was
laid out side by side (see `DATABASE_SCHEMA.md`).

---

## 3. See Also

- `DATABASE_SCHEMA.md` — full table definitions
- `DATABASE_ARCHITECTURE.md` — repository layer, folder structure, connection model
- `MIGRATION_STRATEGY.md` — startup flow, import, rollback, versioning
- `JSON_MIGRATION_CHECKLIST.md` — per-file migration checklist

---

## 4. Architecture Review Findings

No data-access layer exists today — seven modules hand-roll nearly
identical atomic-JSON-write code. That repetition is the strongest
signal for a **repository layer** — but sized to match the number of
real distinctions in the code, not one class per JSON file. Six
repositories (`UserRepository`, `GameRepository`, `SessionRepository`,
`SessionLogRepository`, `RecoveryRepository`, `SunshineRepository`)
cover all ten data sources. See `DATABASE_ARCHITECTURE.md` for why this
count, and for what was cut versus an earlier, over-split draft.

---

## 5. Dependency Analysis — Files That Must Change

| File | Why it changes | What changes | Difficulty | Risk |
|---|---|---|---|---|
| `host_agent/user_manager.py` | Currently owns JSON read/write | Becomes a thin wrapper over `UserRepository`; public method signatures stay identical so callers don't change | Low | Low |
| `host_agent/metadata_manager.py` | Owns `session_metadata.json` | Replaced by `SessionRepository`; `SessionMetadata` dataclass stays the DTO returned to callers | Medium | Medium — `live_sync.py` and `save_manager.py` call it inside hot save-integrity paths |
| `host_agent/session_stats_manager.py` | Owns `session_stats.json` | Folded into `SessionRepository.record_stats`, an atomic `UPDATE` alongside history writes | Low | Low |
| `host_agent/sunshine_stream_tracker.py` | Owns two JSON files (state + history) | Backed by one `SunshineRepository` instead — same class shape as today, different storage underneath | Medium | Low-Medium |
| `host_agent/recovery_event_manager.py` | Owns `recovery_events.json`, has its own copy of `_safe_read_json`/`_safe_write_json` | Replaced by `RecoveryRepository`; `get_recovery_stats` becomes a single aggregate SQL query | Low | Low |
| `api/services/session_service.py` | Owns `active_sessions.json`, `session_history.json`, `session_events.json`, plus its own copy of `_safe_read_json`/`_safe_write_json` | Largest change: `_persist_active_sessions` becomes `SessionRepository.save`/`update_field` on the merged table; history/event appends move to `SessionLogRepository` | High | **High** — largest, most call-frequency-sensitive file in the system; in-memory `active_sessions` dict + `registry_lock` stay the source of truth, SQLite is purely the crash-recovery mirror |
| `host_agent/save_manager.py` | Instantiates `MetadataManager`; reads/writes `games.json` | `MetadataManager(...)` construction swapped for injected `SessionRepository`; game config load/save swapped for `GameRepository` | Medium | Medium — largest file in the codebase, but only the config-loading and metadata-manager-construction seams change |
| `host_agent/startup_initializer.py` | Currently seeds all default JSON files + `config.json` | Seeds `config.json` (unchanged) + calls `database/init_db.py` to create the schema, then runs the one-time JSON import if needed | Medium | Medium — single startup choke point |
| `api/dependencies.py` | Wires up singletons for FastAPI dependency injection | Adds repository singletons; passes them into services instead of services constructing managers directly | Low | Low |
| `api/routes/auth.py`, `api/routes/admin.py` | Call `user_manager` | Unchanged if `user_manager`'s public interface is preserved | None–Low | Low |
| `api/routes/host.py` | Calls stream tracker / recovery manager for status endpoints | Unchanged if public interfaces preserved | None–Low | Low |
| `host_agent/watchdogs/sunshine_watchdog.py`, `tailscale_watchdog.py` | Call `recovery_event_manager.append_recovery_event` | Unchanged if public interface preserved | None | Low |
| `host_agent/live_sync.py` | Calls the metadata layer in a background thread loop (every ~15s while streaming) | Unchanged if public interface preserved; relies on the shared connection's `check_same_thread=False` setting | None–Low | Medium — background thread + concurrent writes from the main session thread |
| `requirements.txt` | New dependency | None needed — `sqlite3` is in the Python standard library | — | — |

**Files that must NOT change:** anything in `frontend/`, `game_launcher.py`,
`sunshine_controller.py`, `tailscale_controller.py`, `integrity.py`,
`stability_monitor.py`, `host_monitor.py`, `path_validator.py`,
`cleanup.py`, `lifecycle_manager.py`, `config_manager.py`,
`config_defaults.py`, `jwt_manager.py`, `auth_manager.py`,
`internal_event_auth.py`, `session_lock.py`.

---

## 6. Implementation Order (Milestones)

| Stage | Scope | Complexity |
|---|---|---|
| **Stage 1 — Database layer + repositories** | `database/connection.py`, `database/init_db.py`, `database/schema.sql`, all six repositories. Built together rather than staged separately — for one developer on one host, validating repositories "in parallel, read-only" before cutover adds a stage without an observable benefit. | Medium |
| **Stage 2 — One-time JSON import** | `database/migrate_from_json.py`: runs once at startup if `session_metadata` is empty and legacy JSON files exist; imports everything inside one transaction | Medium |
| **Stage 3 — Cut over writes, one manager at a time** | Order: `users` → `games` → `recovery_events` → `sunshine_(state|history)` → `session_metadata`/`session_stats` → `session_history`/`session_events` → `active_sessions` merge (riskiest, last) | High |
| **Stage 4 — Cleanup** | Delete now-dead `json.load`/`json.dump` code; remove migrated entries from `startup_initializer.FILES`; remove legacy JSON files after a backup | Low |

Four stages instead of five — the earlier "repositories in parallel
before cutover" stage was a rollout-safety step suited to a team
validating against live traffic from other services; it doesn't add
protection here, since nothing else depends on the old path staying
correct while one developer tests the new one.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| **Transaction safety** across multi-step operations (e.g. append to `session_history` + update stats + append event) | Wrap in the connection's own `with connection:` block — no custom transaction abstraction needed for the one call site that does this |
| **Partial import** (interrupted mid-way) | Import runs inside a single transaction for the whole batch; on failure it rolls back entirely and retries next startup — no partial-completion tracking needed for a one-time, one-machine import |
| **SQLite locking** (`database is locked` under concurrent writers) | WAL mode; short write transactions; the hot path (`active_sessions` state) writes are already serialized behind `registry_lock`, so no new contention is introduced |
| **Foreign key issues** (session referencing a deleted user/game) | `PRAGMA foreign_keys=ON`; `ON DELETE RESTRICT` uniformly |
| **Startup ordering** (`config.json` must exist before the DB path is known) | Startup sequence: `config.json` bootstrap (unchanged) → DB init → JSON import (if needed) → rest of `startup_initializer` unchanged |
| **Backwards compatibility** (old build run after DB exists) | Out of scope for a personal single-host project; restoring the pre-migration JSON backup is the documented downgrade path |
| **Thread safety** (`live_sync.py` background thread + main session thread) | Single shared connection with `check_same_thread=False`; SQLite's own statement-level atomicity covers the actual read-then-write sequences involved — no extra Python lock layer |
| **Data loss during cutover** | Stage 3 writes go to SQLite; nothing is deleted until Stage 4 explicitly removes it, after a backup |
