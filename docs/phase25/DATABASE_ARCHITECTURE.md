# Phase 25 — Database Architecture (v2, simplified)

> Revision note: v1 proposed 9 repositories (one per table), a
> generic `unit_of_work.py` abstraction, and per-repository locks
> mirroring the old JSON managers. All three were over-engineered for
> a single-host SQLite project and are simplified below. See §6 for
> the full diff against v1.

> **Implementation note:** the shipped repository layer
> (`host_agent/repositories/`) is more granular than this document's
> "one repository per real-world concern" recommendation — it has
> eight separate repository classes (`UserRepository`,
> `SessionHistoryRepository`, `SessionEventsRepository`,
> `SessionMetadataRepository`, `SessionStatsRepository`,
> `SunshineStreamHistoryRepository`, `SunshineStreamStateRepository`,
> `RecoveryRepository`), closer to the "v1" layout this document
> argues against than to the merged design proposed below. There is
> no `GameRepository` — `games.json` remained a JSON configuration
> file. Treat the `repositories/` directory itself as the source of
> truth for the current structure.

## 1. Should Repository Classes Be Introduced?

**Yes**, but fewer than v1 proposed. Justification, from the actual
codebase:

- Seven modules currently hand-roll near-identical atomic-JSON-write
  code (`temp_path` + `json.dump` + `fsync` + `.replace()`):
  `user_manager.py`, `config_manager.py`, `recovery_event_manager.py`,
  `save_manager.py`, `session_stats_manager.py`,
  `sunshine_stream_tracker.py`, and `session_service.py` (which even
  has its own private copy of `_safe_read_json`/`_safe_write_json`
  duplicating `recovery_event_manager`'s free functions of the same
  name).
- A repository layer removes this duplication with one shared
  implementation of "safely persist a structured object."
- It gives Phase 25 a clean seam: business logic (`session_service`,
  `save_manager`, watchdogs) keeps calling the same method names it
  calls today; only what's *behind* those methods changes.

**Where v1 over-split:** it created one repository per table
(`session_metadata_repository`, `session_runtime_repository`,
`session_history_repository`, `session_event_repository` as four
separate classes for what's really one lifecycle — a session; and
`stream_state_repository`/`stream_history_repository` as two classes
for what's one class today, `SunshineStreamTracker`). Splitting by
table instead of by real-world concern added repositories without
adding a corresponding seam in the business logic that calls them.

## 2. Recommended Folder Structure

```
host-agent/
  database/
    __init__.py
    connection.py       # connection factory, pragmas, thread-safety
    init_db.py           # schema creation (+ trivial migration check)
    migrate_from_json.py # one-time legacy importer
    schema.sql            # the current schema, applied on fresh DBs

  repositories/
    __init__.py
    base.py               # shared helpers (row→dataclass mapping, etc.)
    user_repository.py
    game_repository.py
    session_repository.py       # session_metadata (incl. runtime status)
    session_log_repository.py   # session_history + session_events
    recovery_repository.py
    sunshine_repository.py      # stream_state + stream_history

  host_agent/
    ... existing modules updated to depend on repositories instead of
        hand-rolled JSON I/O ...
```

Six repositories, matching six real seams in the code — not ten tables
mechanically turned into ten classes.

**Why this shape, and not something more elaborate (no `models/`
package, no ORM, no generic migration runner):**
- `host_agent/models.py` already holds the dataclasses
  (`SessionMetadata`, `GameConfig`, etc.) repositories return — they
  stay exactly where they are.
- No ORM — `sqlite3` + hand-written SQL in each repository is enough
  for six repositories over ten tables, and matches the project's
  existing minimal-dependency style.
- No generic migration-runner framework — see §5.

## 3. Connection & Threading Model

- **One process-wide `sqlite3.Connection`**, created in
  `database/connection.py` with `check_same_thread=False` (the app
  already runs cross-thread access intentionally — e.g.
  `live_sync.py`'s background thread calling into the metadata layer,
  and FastAPI's threadpool for sync route handlers).
- **WAL mode** (`PRAGMA journal_mode=WAL`) so frequent
  `session_metadata` writes don't block concurrent reads from status
  endpoints.
- **`busy_timeout=5000`** so a momentary writer-writer collision
  retries instead of raising immediately.
- **No per-repository Python locks.** v1 proposed mirroring the old
  JSON managers' `threading.Lock`s "for repositories that do
  read-modify-write." Those locks existed because JSON requires
  read-whole-file → modify → write-whole-file. SQL's `UPDATE x = x +
  1` and `INSERT ... ON CONFLICT DO UPDATE` are already atomic at the
  database level — none of the six repositories have an operation that
  actually needs an extra Python-level lock on top of that. This was a
  JSON-era workaround carried over out of habit; it's dropped in v2.
  (`session_service.py`'s own `registry_lock` around the in-memory
  `active_sessions` dict is unrelated and unaffected — it protects
  Python object access, not the database, and is unchanged.)

## 4. Multi-Table Writes

v1 introduced a generic `unit_of_work.py` context-manager abstraction
for the one place multiple tables are written together (session
completion: history + stats + event). A generalized abstraction is
overkill for one call site.

**v2:** use the connection's own built-in transaction support
directly at that call site:

```
with connection:
    session_log_repo.append_history(connection, record)
    session_repo.record_stats(connection, ...)
    session_log_repo.append_event(connection, event)
# commits on success, rolls back on exception — no wrapper needed
```

If a second genuinely multi-repository transaction shows up later,
that's the point to consider extracting a shared helper — not before.

## 5. Database Versioning / Future Schema Upgrades

v1 proposed a full migration-runner (`apply any pending
migrations/000N_*.sql in order`) up front. At this point there is
exactly **one** schema. A generalized runner is scaffolding for
migrations that don't exist yet.

**v2:**
- `database/schema.sql` is applied as-is to create a fresh database.
- `schema_migrations(version, description, applied_at)` still exists
  and gets one row (`version=1`) on creation — cheap to add now,
  and it's what a future migration would check against.
- The migration *runner* (loop over a `migrations/` directory,
  applying anything newer than the current version) is **deferred**
  until a second schema change actually needs to ship. At that point,
  writing a ~15-line runner against real requirements is
  straightforward and avoids designing it speculatively today.

## 6. One-Time JSON Import

v1 tracked import progress in a dedicated `migration_state` table,
resumable per source file. For a one-time, one-machine import with a
person present to notice and rerun a failure, this is unnecessary
bookkeeping.

**v2:** `migrate_from_json.py` checks once — if `session_metadata` is
empty and legacy JSON files are present — and if so, imports all ten
sources inside a single transaction. Either it all commits, or it all
rolls back and the (unchanged) JSON files are still there to retry
from on next startup. No new table.

## 7. Repository Interfaces

No implementations — responsibilities and public methods only.

### `UserRepository`
- `get_by_username(username) -> Optional[User]`
- `list_all() -> list[User]`
- `create(username, password_hash, role) -> None` (raises if username exists)
- `delete(username) -> None` (raises if target is last admin)
- `change_password(username, password_hash) -> None`
- `admin_count() -> int`
- `bootstrap_required() -> bool`
- `delete_all_except_oldest_admin() -> None`

### `GameRepository`
- `list_all() -> dict[str, GameConfig]`
- `get(game_id) -> GameConfig`
- `replace_all(games: dict) -> None` (mirrors `save_game_configs`'s full-replace semantics)

Revised Scope: games.json remains a host configuration file alongside config.json. Phase 25 migrates runtime and user data to SQLite while retaining host-specific configuration in JSON.

### `SessionRepository`
Owns the merged `session_metadata` table — both integrity/lifecycle
metadata and live runtime status, since they're now one row.
- `save(session_id, metadata: SessionMetadata) -> None` (upsert)
- `get(session_id) -> Optional[SessionMetadata]`
- `update_state(session_id, state) -> None`
- `update_field(session_id, field, value) -> None`
- `list_active() -> list[SessionMetadata]` (replaces reading
  `active_sessions.json` whole — `WHERE status IN (...)`)
- `list(user_id=None, game_id=None) -> list[SessionMetadata]`
- `cleanup(session_id) -> None` (deletes the row — replaces both the
  old metadata-file delete and the active-sessions dict eviction)

### `SessionLogRepository`
Owns both `session_history` and `session_events` — they're the same
kind of thing (an append-only log about a session) read by largely the
same callers (`get_session_health`), so one repository with two sets
of methods avoids a needless second class.
- `append_history(record) -> None`
- `list_history(user_id=None, limit=20) -> list[dict]`
- `list_session_ids_for_user(user_id) -> list[str]`
- `append_event(session_id, status, message="") -> None`
- `count_history() -> int`
- `count_events() -> int`

### `RecoveryRepository`
- `append(service, event, details=None) -> None`
- `list(limit=100) -> list[dict]`
- `get_stats() -> dict` (single aggregate query, replacing the current
  in-Python tally over up to 10,000 rows)

### `SunshineRepository`
Owns both `stream_state` and `stream_history` — mirrors the existing
single class `SunshineStreamTracker`, just backed by SQL instead of
two JSON files.
- `get_state() -> dict`
- `set_streaming(app_name, width, height, fps, hdr) -> None`
- `set_stopped() -> dict` (updates state and appends the resulting
  history entry in one call, same as `stream_stopped()` today)
- `set_transport_connected() -> None`
- `set_transport_disconnected() -> None`
- `list_history(limit=None) -> list[dict]`

### `ConfigurationRepository`
**Not introduced**, unchanged from v1's reasoning. `config.json` stays
as-is — it's read before the database exists and holds secrets that
benefit from staying a single inspectable/rotatable file.
`session_stats` also doesn't get its own repository (v1 had
`SessionStatsRepository`) — it's folded into `SessionRepository` since
it's a single row updated exactly where session completion is already
being written.

## 8. What Stays Exactly As-Is

- `host_agent/session_lock.py` (`SessionLockManager`) — filesystem
  lock, unchanged.
- `host_agent/save_manager.py`'s manifest read/write methods — 
  filesystem sidecars, unchanged.
- `host_agent/config_manager.py`, `config_defaults.py`,
  `jwt_manager.py`, `auth_manager.py` — unchanged.
- Watchdogs' *detection* logic (`sunshine_watchdog.py`,
  `tailscale_watchdog.py`) — only their call to
  `append_recovery_event(...)` now goes through `RecoveryRepository`.
- `session_service.py`'s in-memory `active_sessions` dict and
  `registry_lock` — still the runtime source of truth during a
  session; `SessionRepository` is the persisted mirror for crash
  recovery, same relationship as today's JSON snapshot.

## 9. Summary of Changes From v1

| v1 | v2 | Why |
|---|---|---|
| 9 repositories (one per table) | 6 repositories (grouped by real-world concern) | Matches actual call-site seams; avoids classes with no corresponding distinction in the business logic |
| `session_runtime_repository` separate from `session_metadata_repository` | Merged into one `SessionRepository` | Table merge (see `DATABASE_SCHEMA.md`) removes the reason for two repositories |
| `unit_of_work.py` generic transaction abstraction | Plain `with connection:` at the one call site that needs it | One call site doesn't justify a reusable abstraction |
| Per-repository `threading.Lock`s mirroring JSON managers | None — SQLite's own atomic statements are sufficient | The locks were a JSON-era workaround, not a SQL-era requirement |
| Full migration-runner (`migrations/000N_*.sql`, apply-in-order loop) | One `schema.sql` + `schema_migrations` table, runner deferred | No second migration exists yet to justify the runner |
| `migration_state` resumable per-file import tracking | One empty-table check, one transaction for the whole import | One-time, one-machine import doesn't need resumability infrastructure |
| Two FK delete rules (RESTRICT vs CASCADE) | One rule (RESTRICT) everywhere | The CASCADE case only existed for the now-removed runtime table |
