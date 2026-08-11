# Phase 25 — JSON → SQLite Migration

**Status: Implemented and completed.** Session history, session events, session metadata, recovery events, Sunshine stream history/state, and user accounts are now SQLite-backed in the current codebase (`host_agent/database/schema.sql`, `host_agent/repositories/`). `config.json`, `games.json`, and `data/active_sessions.json` were intentionally kept as JSON. The documents below are the **original design record** for that work, not a live description of the shipped implementation — each has an "Implementation note" where the final result diverged from the plan. Treat `host_agent/database/schema.sql` and `host_agent/repositories/` as the source of truth for the current schema and repository layer.

Engineering documentation for Phase 25: migrating the host-agent's
persistence layer from JSON files to SQLite. This folder is a design
blueprint plus a living progress tracker — read in the order below.

## Reading Order

1. **[`PHASE25_IMPLEMENTATION_PLAN.md`](./PHASE25_IMPLEMENTATION_PLAN.md)**
   Start here. The persistence audit (what's migrating and why),
   the file-by-file change list, the four-stage implementation
   order, and the risk assessment. The overview that ties everything
   else together.

2. **[`DATABASE_ARCHITECTURE.md`](./DATABASE_ARCHITECTURE.md)**
   The repository layer: folder structure, the six repository
   interfaces, connection/threading model, and the reasoning behind
   what was deliberately kept simple (no ORM, no generic transaction
   wrapper, no migration-runner framework).

3. **[`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)**
   The full SQLite schema — every table, column, constraint, index,
   and foreign key, with the reasoning behind each.

4. **[`MIGRATION_STRATEGY.md`](./MIGRATION_STRATEGY.md)**
   How the migration actually runs: startup sequence, fresh vs.
   existing installs, the one-time JSON import, rollback, backups,
   and how future schema versions will be handled.

5. **[`JSON_MIGRATION_CHECKLIST.md`](./JSON_MIGRATION_CHECKLIST.md)**
   A per-file checklist for migrating each of the ten legacy JSON
   sources — the concrete task list to work through during Stage 3.

6. **[`DATABASE_CODING_GUIDELINES.md`](./DATABASE_CODING_GUIDELINES.md)**
   The short list of rules everyone follows while writing this code
   (routers never touch SQLite, all SQL lives in repositories,
   parameterized queries only, etc.). Keep this open while coding.

7. **[`IMPLEMENTATION_PROGRESS.md`](./IMPLEMENTATION_PROGRESS.md)**
   The living tracker. Not a design document — this is where actual
   progress, architectural decisions made during implementation, and
   issues encountered get recorded as work happens. Check this last
   to see where things currently stand, and update it as you go.

## Quick Orientation

- **Planning or reviewing the design?** Read 1–5 in order.
- **About to write code?** Skim 6, then work from the checklist in 5.
- **Picking this back up after time away?** Go straight to 7.
