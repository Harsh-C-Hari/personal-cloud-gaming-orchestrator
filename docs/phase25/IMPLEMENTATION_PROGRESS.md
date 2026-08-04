# Phase 25 Progress

This document tracks *implementation* progress. For design, see
`PHASE25_IMPLEMENTATION_PLAN.md`, `DATABASE_ARCHITECTURE.md`,
`DATABASE_SCHEMA.md`, `MIGRATION_STRATEGY.md`,
`JSON_MIGRATION_CHECKLIST.md`, and `DATABASE_CODING_GUIDELINES.md`.
Nothing here should repeat what those documents already establish —
this is the running record of what's actually been done, decided, and
hit along the way.

- **Current Status:** Not started
- **Overall Progress:** 0 / 4 stages complete
- **Last Updated:** YYYY-MM-DD
- **Current Focus:** _(e.g. "Stage 1 — database connection module")_

---

# Progress Dashboard

Stages match `PHASE25_IMPLEMENTATION_PLAN.md` §6.

**Stage 1 — Database Foundation**
- [ ] Database connection
- [ ] Schema
- [ ] Initialization
- [ ] Repository base

**Stage 2 — JSON Import**
- [ ] Import framework
- [ ] Startup integration
- [ ] Validation

**Stage 3 — Repository Migration**
- [ ] Users
- [ ] Games
- [ ] Recovery
- [ ] Sunshine
- [ ] Session Metadata
- [ ] Session Statistics
- [ ] Session History
- [ ] Session Events
- [ ] Active Sessions

**Stage 4 — Cleanup**
- [ ] Remove JSON persistence
- [ ] Remove legacy helpers
- [ ] Documentation update
- [ ] Final testing

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

- [ ] All ten legacy JSON sources migrated per `JSON_MIGRATION_CHECKLIST.md`
- [ ] `config.json`, `session.lock`, manifests, save archives, and logs left unchanged, as designed
- [ ] All six repositories implemented and in use (`UserRepository`, `GameRepository`, `SessionRepository`, `SessionLogRepository`, `RecoveryRepository`, `SunshineRepository`)
- [ ] Stage 4 cleanup complete: dead JSON code removed, `startup_initializer.FILES` updated, legacy files removed post-backup
- [ ] Every item in the Validation Checklist above is checked
- [ ] `docs/` engineering documentation updated to describe SQLite as the persistence layer
- [ ] Full session lifecycle and crash-recovery paths tested end-to-end (see Testing Progress)

---

# Notes

_(free-form — implementation notes that don't fit elsewhere)_
