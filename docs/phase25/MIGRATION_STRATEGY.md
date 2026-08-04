# Phase 25 — Migration Strategy (v2, simplified)

> Revision note: removed the `migration_state` per-file resumable
> import table and the generalized migration-runner in favor of a
> single-check, single-transaction import and a one-file schema. See
> `DATABASE_ARCHITECTURE.md` §9 for the full rationale.

## 1. Startup Sequence (new)

Current `startup_initializer.initialize_startup()` does, in order:
1. Create `logs/`, `metadata/`, `data/` directories.
2. Write default content for each file in `FILES` if it doesn't exist.
3. Write default `config.json` if it doesn't exist.
4. Backfill `backend.internal_event_token` if missing.

New sequence:

1. Create `logs/`, `metadata/`, `data/` directories (unchanged).
2. Write default `config.json` if it doesn't exist; backfill
   `internal_event_token` (unchanged — `config.json` stays JSON and
   must exist before anything else).
3. **New:** `database.init_db.ensure_database(db_path)` — if
   `data/pcgo.db` doesn't exist, create it and apply `schema.sql`,
   then insert `schema_migrations(version=1)`. If it already exists,
   do nothing further (see §6 for what happens once a second schema
   version exists).
4. **New:** `database.migrate_from_json.run_if_needed(db_path)` — one
   check: if the `session_metadata` table is empty and any legacy JSON
   file exists on disk, import all ten sources inside a single
   transaction. If `session_metadata` already has rows, skip entirely
   — the import has already happened.
5. `games.json` special case: if it doesn't exist (fresh install),
   seed the `games` table directly from `DEFAULT_GAMES` instead of
   importing.

config.json and games.json remain JSON-based host configuration files and are intentionally excluded from the SQLite migration.

This preserves the current property that **first run just works** —
no manual step for either a fresh install or an upgrade.

## 2. Existing Installations (Upgrade Path)

- All legacy JSON files already exist with real data.
- On first boot of the Phase 25 build, steps 3–4 run once, importing
  everything in one transaction.
- Legacy JSON files are **not deleted** by the importer — left in
  place as a manual rollback source (§4).
- `config.json` is untouched.

## 3. Fresh Installations

- No `data/*.json` files exist yet.
- `database.init_db` creates the schema from `schema.sql`.
- `games` table seeds from `DEFAULT_GAMES`.
- `users` table starts empty — `bootstrap_required()` is now a
  `COUNT(*)` query instead of a list comprehension, same behavior.

## 4. Rollback Strategy

Because Stage 3 of the implementation plan cuts writes over one
manager at a time, and legacy JSON files are never deleted until
Stage 4:

- **Rollback during Stages 1–3:** redeploy the previous build. It
  reads only JSON files, which were never modified by the SQLite path
  until each manager's individual cutover. No data lost; nothing to
  restore.
- **Rollback after Stage 4** (legacy JSON deleted): restore
  `data/*.json` and `metadata/session_metadata.json` from the backup
  taken immediately before Stage 4 (§5). Manual, documented — not
  automated, which is appropriate for a personal single-host project.

## 5. Backup Before Destructive Steps

Before Stage 4 deletes any legacy JSON file, a one-off script copies
`data/` and `metadata/` to `data/_pre_sqlite_backup_<timestamp>/`. This
reuses the existing `shutil.copy2` pattern already present in
`session_service._safe_read_json`'s corrupt-JSON handling — no new
mechanism.

## 6. Database Versioning / Future Schema Upgrades

- `schema_migrations(version, description, applied_at)` exists from
  day one with one row (`version=1`).
- **No migration runner is built yet.** There is exactly one schema
  version today; a generalized "scan `migrations/`, apply anything
  newer than current" loop has nothing to run and no real requirements
  to design against. When a second schema change is actually needed,
  add `database/migrations/0002_<description>.sql` and a short runner
  written against that concrete change — a 15-line function, not
  speculative infrastructure.
- No external migration framework (Alembic, etc.) — unnecessary for a
  single SQLite file on one host.

## 7. Failure Recovery

- **Import fails:** the whole import is one transaction; on any
  exception it rolls back completely, `session_metadata` stays empty,
  and the (untouched) JSON files are retried on next startup. Since
  this is a one-time, one-machine action with a person present, a
  full-batch retry is simpler and sufficient — no per-file progress
  tracking is needed.
- **Database file corruption:** `sqlite3` raises `DatabaseError`/
  `sqlite3.OperationalError` on open; `init_db` should catch this, log
  clearly, and refuse to start rather than silently recreating an
  empty DB over live data — matching the project's existing philosophy
  of loud failure over silent data loss (`_safe_write_json`'s
  retry-then-log-error pattern).
- **`active_sessions` recovery after crash:** currently handled by
  `session_service`'s startup routine that reads `active_sessions.json`
  and reconciles it against real OS processes (around line 1720 of
  `session_service.py`). Unchanged logic — only the read source moves
  from JSON to `SessionRepository.list_active()`.
