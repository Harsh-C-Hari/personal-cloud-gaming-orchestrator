# Phase 25 — JSON Migration Checklist (v2, simplified)

> Revision note: checklist items referencing the removed
> `session_runtime_repository`, `unit_of_work`, and `migration_state`
> have been folded into the merged `SessionRepository` / plain
> transaction / single-check import described in the updated
> architecture and strategy docs.

One section per legacy JSON file. Sections may be worked in the Stage
3 order from `PHASE25_IMPLEMENTATION_PLAN.md` §6.

---

## `data/users.json` → `users` table - Migration Complete.

- [ ] Create `UserRepository`.
- [ ] Import existing `users.json` rows (preserve `created_at` exactly
      — used by `delete_all_except_last_admin`'s tie-break).
- [ ] Point `user_manager.py` at `UserRepository`.
- [ ] Verify: `bootstrap_required()`, `admin_count()`, last-admin
      delete protection all behave identically against imported data.
- [ ] Confirm `api/routes/auth.py` and `api/routes/admin.py` need no
      changes.

## `games.json` / `DEFAULT_GAMES` → `games` table

- [ ] Create `GameRepository`.
- [ ] Import existing `games.json` if present; otherwise seed from
      `host_agent/games_defaults.DEFAULT_GAMES`.
- [ ] Update `save_manager.__init__`/`_load_game_configs` to read from
      `GameRepository`.
- [ ] Update `save_manager.save_game_configs` to call
      `GameRepository.replace_all`.
- [ ] Verify `api/routes/games.py` and
      `session_service.start_session`'s `game_id not in
      save_manager.game_configs` check work unchanged.

### Revised Scope: games.json remains a host configuration file alongside config.json. Phase 25 migrates runtime and user data to SQLite while retaining host-specific configuration in JSON.

## `data/recovery_events.json` → `recovery_events` table  - Migration Complete

- [ ] Create `RecoveryRepository`.
- [ ] Import all existing events — default to importing every row
      present in the file (the old 1000-cap was array-slicing on
      write, not a hard requirement to preserve going forward).
- [ ] Replace `append_recovery_event`/`get_recovery_events` bodies
      with repository calls.
- [ ] Replace `get_recovery_stats`'s Python tally loop with the
      aggregate SQL query — verify output dict shape is byte-for-byte
      identical, since this is a genuine logic change, not just storage.
- [ ] Verify `sunshine_watchdog.py`/`tailscale_watchdog.py` call sites
      are unchanged.

## `data/sunshine_stream_state.json` + `data/sunshine_stream_history.json` → `SunshineRepository` (`stream_state` + `stream_history` tables)

- [ ] Create `SunshineRepository` (one class, both tables — mirrors
      today's single `SunshineStreamTracker`).
- [ ] Import current state (single row) and full history.
- [ ] Update `sunshine_stream_tracker.py` to delegate to
      `SunshineRepository`, preserving exact method names
      (`get_state`, `stream_started`, `stream_stopped`,
      `transport_connected`, `transport_disconnected`) and return
      shapes — the frontend consumes `get_state()`'s dict directly.
- [ ] Verify `sunshine_stream_hook.py` (separate OS process) and
      `sunshine_transport_monitor.py` still work — they call into
      `sunshine_stream_tracker`, not the JSON files directly.

## `metadata/session_metadata.json` + `data/active_sessions.json` → `session_metadata` table (merged, via `SessionRepository`)

- [ ] Create `SessionRepository` covering both metadata fields and
      runtime/status fields in one table (see `DATABASE_SCHEMA.md`).
- [ ] Import: for each session in `session_metadata.json`, create the
      row; for each entry in `active_sessions.json`, merge its runtime
      fields into the same row by `session_id` (they describe the same
      sessions, so this should naturally line up — log any
      `session_id` present in one file but not the other for manual
      review, but don't build tooling around it, since this is a
      one-time check on one host's data).
- [ ] Update `save_manager.py`'s `MetadataManager(metadata_path=...)`
      construction to instead receive an injected `SessionRepository`.
- [ ] Update all call sites of `save_manager.metadata_manager.*`
      (`live_sync.py`, `session_service.py`, `save_manager.py` itself)
      — confirm method names match so these call sites need zero
      changes.
- [ ] Update `session_service._persist_active_sessions` to
      `SessionRepository.save`/`update_field` calls on the same table
      used for metadata — no second table, no second repository.
- [ ] Update `session_service.get_session_health`,
      `force_unlock_session`, and the startup crash-recovery routine
      (~line 1720) to read from `SessionRepository.list_active()`
      instead of `active_sessions.json`.
- [ ] Verify `live_sync.py`'s background-thread read of the metadata
      layer works correctly under the shared-connection,
      `check_same_thread=False` model.

## `data/session_stats.json` → merged into `SessionRepository`

- [ ] Add `record_stats(status, played_seconds, recovered=False)` to
      `SessionRepository` (an atomic `UPDATE` — no separate
      `SessionStatsRepository` class).
- [ ] Import existing counters (single row) into `session_stats`.
- [ ] Update `session_stats_manager.record_session` call sites to use
      `SessionRepository.record_stats`.
- [ ] Verify counters after import exactly match pre-migration JSON
      values (spot check `total_sessions`).

## `data/session_history.json` + `data/session_events.json` → `SessionLogRepository` (`session_history` + `session_events` tables)

- [ ] Create `SessionLogRepository` (one class covering both logs).
- [ ] Import both files.
- [ ] Update `api/services/session_service.py`:
  - [ ] `_append_session_history` → `SessionLogRepository.append_history`.
  - [ ] `_append_session_event` → `SessionLogRepository.append_event`.
  - [ ] `get_session_history` → `SessionLogRepository.list_history`.
  - [ ] `get_user_session_ids` → `SessionLogRepository.list_session_ids_for_user`.
  - [ ] `get_session_health` → combines `SessionRepository.list_active()`
        counts with `SessionLogRepository` counts.
  - [ ] The session-completion path (history append + stats update +
        event append) wraps all three calls in one `with connection:`
        block for atomicity — no custom transaction helper needed.
- [ ] **This entire session cluster (`SessionRepository` +
      `SessionLogRepository`) is the highest-risk part of the
      migration** — test the full session lifecycle (start → stream →
      stop → history/stats updated) end-to-end, and test the
      crash-recovery path explicitly (kill the process mid-session,
      restart, confirm recovery logic still fires) before considering
      this section complete.

## Final Cleanup (Stage 4 — only after all above are stable)

- [ ] Take the pre-Stage-4 backup described in `MIGRATION_STRATEGY.md` §5.
- [ ] Remove now-dead `json.load`/`json.dump` code from every manager
      touched above.
- [ ] Remove the migrated entries from `startup_initializer.FILES`
      (keep `config.json` handling as-is).
- [ ] Delete the legacy `data/*.json` and
      `metadata/session_metadata.json` files (or leave them, renamed
      `.migrated`, for one release cycle if extra caution is preferred).
- [ ] Update `docs/` engineering documentation to reflect SQLite as the
      persistence layer.
