# Live Sync Architecture Migration Bug Investigation

## Issue Information

Category:
Architecture Migration Regression

Affected Component:
Live Sync Lifecycle

Severity:
High

Status:
Resolved

---

## Overview

The goal of the Live Sync system was to continuously monitor game save files during an active gaming session and update the user's latest save without waiting for the session to end.

After implementing configurable `whitelist_prefixes` through `games.json`, Live Sync appeared to stop working.

Initially, the new save hashing system was suspected to be the cause.

After extensive debugging, the actual problem was discovered to be an architecture migration issue between the old CLI-based session runner and the newer FastAPI-based host service.

---

## Symptoms

During active gaming sessions, modifying save files did not trigger Live Sync updates.

Expected logs such as:

```
Live sync change detected.
Live latest sync completed.
```

never appeared.

However, the final session cleanup still correctly detected changed saves, captured them, created backups, and generated archives.

This indicated that:

- Save hashing worked.
- Save capture worked.
- Final integrity verification worked.
- Live Sync itself was not executing.

---

## Initial Hypothesis

The first suspicion was that replacing hardcoded whitelist prefixes had broken save hashing.

Previously, save hashing used:

```python
whitelist_prefixes=["GOWRSAVE"]
```

This was replaced with game-specific configuration:

```json
{
    "whitelist_prefixes": [
        "GOWRSAVE"
    ]
}
```

The whitelist was loaded dynamically through:

```python
save_manager._get_whitelist_prefixes(game_id)
```

---

## Investigation

### Hash Verification

Temporary debug logging was added inside:

```
IntegrityManager.calculate_directory_hash()
```

The system logged every file being evaluated:

```
Checking: GOWRSAVE0
Included: GOWRSAVE0

Checking: GOWRSAVE1
Included: GOWRSAVE1

...

Checking: userpreferences
Ignored: userpreferences
```

The investigation confirmed:

- Valid save files were included.
- Non-save files were correctly ignored.
- Dynamic `whitelist_prefixes` worked correctly.
- Save hashing was functioning as expected.

The hashing system was therefore ruled out as the source of the problem.

---

### Live Sync Thread Investigation

Additional temporary logs were added inside the Live Sync loop:

```
Live sync tick
Live sync checking saves
```

Expected behavior:

```
Live sync started
        |
        v
Live sync tick
        |
        v
Live sync checking saves
```

However, these logs never appeared during gameplay.

The only Live Sync-related log observed was:

```
Live sync stopped.
```

during session cleanup.

This revealed a critical inconsistency:

- Live Sync was being stopped correctly.
- Live Sync was never being started.

---

## Root Cause: Incomplete Architecture Migration

The project originally used a CLI-based session runner:

```
python main.py
```

The original session lifecycle contained:

```
Inject saves
        |
        v
Launch game
        |
        v
Set GAME_RUNNING state
        |
        v
Start Live Sync
        |
        v
Monitor gameplay
        |
        v
Cleanup
        |
        v
Stop Live Sync
```

The project later migrated to a FastAPI-based host agent:

```
uvicorn api.app:app
```

The actual execution path became:

```
FastAPI Routes
        |
        v
SessionService
        |
        v
Game Session Lifecycle
```

The old `main.py` was no longer used.

Evidence for this discovery:

- Introducing intentional errors in `main.py` did not prevent the backend from starting.
- No logs from `main.py` appeared during sessions.
- The `GAME_RUNNING` state transition was missing.
- Live Sync startup logs never appeared.

---

## Missing Migration Logic

The original CLI implementation contained:

```python
save_manager._set_state(
    session_id,
    SessionState.GAME_RUNNING,
)

save_manager.live_sync.start(
    session_id
)
```

During the migration to FastAPI, this logic was never moved into the new session execution flow.

As a result:

```
Session Start
        |
        v
Game Launch
        |
        v
No Live Sync Thread
        |
        v
Gameplay continues without synchronization
        |
        v
Cleanup stops a Live Sync instance that was never started
```

---

## Final Fix

The missing lifecycle steps were added to the FastAPI session execution flow inside:

```
SessionService._run_session()
```

After the game launch, the following actions are now performed:

```python
save_manager._set_state(
    session_id,
    SessionState.GAME_RUNNING,
)

save_manager.live_sync.start(
    session_id
)
```

The corrected architecture became:

```
Inject saves
        |
        v
Launch game
        |
        v
GAME_RUNNING state
        |
        v
Start Live Sync
        |
        v
Monitor save changes
        |
        v
Update latest saves during gameplay
        |
        v
Game exit / timeout / manual stop
        |
        v
CleanupManager
        |
        v
Stop Live Sync
        |
        v
Final save capture and backup
```

---

## Additional Live Sync Improvements

During debugging, several improvements were made to the Live Sync lifecycle.

### Session Timer Reset

Originally:

```
started_at
```

was initialized inside the constructor.

This caused the timer to represent the lifetime of the object rather than the lifetime of an individual session.

It was moved to:

```
LiveSyncManager.start()
```

ensuring every session receives a fresh runtime timer.

---

### Proper State Cleanup

`LiveSyncManager.stop()` was updated to reset all runtime state:

```
thread
session_id
started_at
last_hash
injected_save_hash
pending_hash
pending_count
```

This prevents stale state from affecting future sessions.

---

## Verification

After the fix, the system successfully demonstrated:

- Live Sync starts automatically when a session begins.
- Save files are monitored during gameplay.
- Dynamic whitelist filtering works correctly.
- Valid save modifications are detected.
- Latest saves are updated without waiting for session termination.
- Live Sync shuts down correctly during cleanup.
- Final save capture, backup creation, archive creation, and restoration continue to function normally.

---

## Lessons Learned

- Large architecture migrations can leave behind critical lifecycle logic.
- A component being stopped does not guarantee it was ever started.
- Debugging execution flow is as important as debugging algorithms.
- Configuration refactoring should be verified before assuming it introduced a failure.
- Temporary diagnostic logging can be extremely valuable for isolating complex lifecycle issues.

---

## Impact

This investigation resolved a hidden architecture regression caused by the transition from a CLI-based session controller to a FastAPI-driven host agent.

The fix restored the intended Live Sync lifecycle and ensured real-time save synchronization functions correctly during active cloud gaming sessions.