# Phase 25 Progress

This document tracks *implementation* progress. For design, see
`PHASE25_IMPLEMENTATION_PLAN.md`, `DATABASE_ARCHITECTURE.md`,
`DATABASE_SCHEMA.md`, `MIGRATION_STRATEGY.md`,
`JSON_MIGRATION_CHECKLIST.md`, and `DATABASE_CODING_GUIDELINES.md`.
Nothing here should repeat what those documents already establish —
this is the running record of what's actually been done, decided, and
hit along the way.

- **Current Status:** Implemented. This tracker was never filled in during implementation — the fields below are still template placeholders. What follows is a summary reconstructed directly from the current repository state, not a substitute for a properly maintained log.
- **Overall Progress:** Stages 1 and 3 complete for the tables listed in the Progress Dashboard below. Stage 2 (JSON Import) was **not** implemented — no import/migration script exists in the codebase, so pre-existing legacy JSON data (from an installation that predates this migration) would not be automatically carried into SQLite. Stage 4 cleanup for the migrated data is complete in the code that matters: `startup_initializer.FILES` only bootstraps `data/active_sessions.json` and `games.json` (the two files that remain JSON by design), and the managers for migrated data (`metadata_manager.py`, `session_stats_manager.py`, `sunshine_stream_tracker.py`, `user_manager.py`, `recovery_event_manager.py`) call their repositories exclusively, with no leftover JSON read/write paths.
- **Last Updated:** Not tracked in the repository; do not infer a date.
- **Current Focus:** Not tracked in the repository.

---

# Progress Dashboard

Stages match `PHASE25_IMPLEMENTATION_PLAN.md` §6.

**Stage 1 — Database Foundation**
- [x] Database connection (`host_agent/database/connection.py`)
- [x] Schema (`host_agent/database/schema.sql`)
- [x] Initialization (`host_agent/database/init_db.py`)
- [x] Repository base (`host_agent/repositories/`)

**Stage 2 — JSON Import**
- [ ] Import framework — not implemented; no `migrate_from_json` module exists
- [ ] Startup integration — not implemented
- [ ] Validation — not applicable, since there is no import step

**Stage 3 — Repository Migration**
- [x] Users (`UserRepository`)
- [ ] Games — not migrated; `games.json` intentionally remains a JSON configuration file (revised scope, see `JSON_MIGRATION_CHECKLIST.md`)
- [x] Recovery (`RecoveryRepository`)
- [x] Sunshine (`SunshineStreamHistoryRepository`, `SunshineStreamStateRepository`)
- [x] Session Metadata (`SessionMetadataRepository`)
- [x] Session Statistics (`SessionStatsRepository`)
- [x] Session History (`SessionHistoryRepository`)
- [x] Session Events (`SessionEventsRepository`)
- [ ] Active Sessions — not migrated; `data/active_sessions.json` intentionally remains a separate JSON runtime/crash-recovery file

**Stage 4 — Cleanup**
- [x] Remove JSON persistence for migrated data — the managers backing migrated data (`metadata_manager.py`, `session_stats_manager.py`, `sunshine_stream_tracker.py`, `user_manager.py`, `recovery_event_manager.py`, and the session-history/event paths in `session_service.py`) read/write their repositories only
- [x] Remove legacy helpers — `startup_initializer.FILES` only bootstraps `data/active_sessions.json` and `games.json`
- [ ] Documentation update — this audit is the first pass at reconciling `docs/` with the shipped implementation; see the divergence notes added to `DATABASE_SCHEMA.md`, `DATABASE_ARCHITECTURE.md`, `MIGRATION_STRATEGY.md`, and `PHASE25_IMPLEMENTATION_PLAN.md`
- [ ] Final testing — no automated backend tests exist in the repository (no `pytest`/test files under `host-agent/`), so this cannot be marked complete from repository evidence

---

# Current Task

- **Current objective:** _(placeholder)_
- **Files currently being modified:** _(placeholder)_
- **Dependencies:** _(placeholder — e.g. "requires Stage 1 connection module complete")_
- **Blocking issues:** _(placeholder — link to a row in Issues Encountered if applicable)_
- **Estimated next milestone:** _(placeholder)_

---

# Next Session

Before stopping work:

- [ ] Update Progress Dashboard
- [ ] Update Current Task
- [ ] Record new Architectural Decisions (if any)
- [ ] Record Issues Encountered (if any)
- [ ] Update Testing Progress
- [ ] Update Last Updated date
- [ ] Commit changes

---

# Milestone Log

Chronological. One row per completed milestone — not every commit.

| Date | Milestone | Summary | Status |
|---|---|---|---|
| | | | |

---

# Architectural Decisions

Records places where the actual implementation diverged from
`DATABASE_ARCHITECTURE.md` / `DATABASE_SCHEMA.md`, and why. Only log a
decision here if it changes or refines something those documents
already describe — don't restate design that didn't change.

| Decision | Reason | Impact | Reference Document |
|---|---|---|---|
| | | | |

---

# Issues Encountered

Significant engineering problems only — not routine bugs. If it didn't
cost meaningful time or change an assumption, it doesn't belong here.

| Issue | Root Cause | Resolution | Status |
|---|---|---|---|
| | | | |

---

# Validation Checklist

Cross-cutting correctness checks, independent of which stage is in
progress. Check off once verified against the running implementation,
not once code is merely written.

**Database**
- [ ] Schema matches `DATABASE_SCHEMA.md` exactly
- [ ] Foreign keys enforced (`PRAGMA foreign_keys=ON`)
- [ ] WAL mode active
- [ ] `busy_timeout` set

**Repositories**
- [ ] All SQL confined to `repositories/`
- [ ] All queries parameterized (no string-built SQL)
- [ ] No repository opens its own connection
- [ ] No business logic present in a repository

**Migration**
- [ ] Import is idempotent (safe to run with a non-empty `session_metadata` table — i.e. a no-op)
- [ ] Import runs inside a single transaction
- [ ] Fresh install path (no legacy JSON) verified separately from upgrade path

**Startup**
- [ ] `config.json` bootstrap unaffected
- [ ] DB init runs before import
- [ ] Startup succeeds with no legacy JSON present
- [ ] Startup succeeds with full legacy JSON present

**Session lifecycle**
- [ ] Start → stream → stop → history/stats recorded correctly
- [ ] Active-session state readable mid-session
- [ ] Session cleanup removes/updates the row as expected

**Recovery**
- [ ] Crash mid-session, restart, recovery routine fires correctly
- [ ] `session_metadata`/active-session data agrees after recovery

**Dashboard**
- [ ] Frontend-facing endpoints return unchanged shapes post-migration
- [ ] No frontend changes required

---

# Testing Progress

> No automated backend test suite exists in this repository (no `pytest` dependency in `host-agent/requirements.txt`, no test files under `host-agent/`). The rows below are left as the original template — repository evidence cannot confirm what, if anything, was manually tested.

| Feature | Status | Last Tested | Notes |
|---|---|---|---|
| Database initialization | Not started | | |
| Repository CRUD | Not started | | |
| Migration | Not started | | |
| Session lifecycle | Not started | | |
| Crash recovery | Not started | | |
| Live Sync | Not started | | |
| Sunshine | Not started | | |
| Recovery events | Not started | | |

---

# Phase Completion Criteria

Directly from `PHASE25_IMPLEMENTATION_PLAN.md` and
`JSON_MIGRATION_CHECKLIST.md` — nothing new introduced here.

- [ ] All ten legacy JSON sources migrated per `JSON_MIGRATION_CHECKLIST.md` — eight of the ten were migrated to SQLite; `games.json` (revised scope) and `data/active_sessions.json` were intentionally kept as JSON
- [x] `config.json`, `session.lock`, manifests, save archives, and logs left unchanged, as designed
- [ ] All six repositories implemented and in use (`UserRepository`, `GameRepository`, `SessionRepository`, `SessionLogRepository`, `RecoveryRepository`, `SunshineRepository`) — the shipped repository layer has eight classes instead of six, and there is no `GameRepository` or merged `SessionRepository`/`SessionLogRepository`; see `DATABASE_ARCHITECTURE.md`'s implementation note
- [x] Stage 4 cleanup complete for migrated data: no dead JSON read/write code found in the managers backing migrated data, and `startup_initializer.FILES` only bootstraps the two files that remain JSON by design
- [ ] Every item in the Validation Checklist above is checked — not verifiable from the repository alone (would require runtime testing)
- [x] `docs/` engineering documentation updated to describe SQLite as the persistence layer (this audit)
- [ ] Full session lifecycle and crash-recovery paths tested end-to-end (see Testing Progress) — no automated test evidence exists in the repository

---

# Notes

_(free-form — implementation notes that don't fit elsewhere)_
