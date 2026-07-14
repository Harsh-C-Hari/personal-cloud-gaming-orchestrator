# Session Persistence & Reconnection Architecture

**Phase:** Phase 23

**Status:** Completed

---

# Issue Information

**Category:**
Reliability Engineering / Recovery Systems / Session Management

**Affected Components:**

- Session Manager
- Session Registry
- Startup Recovery
- Cleanup Manager
- Live Sync Manager
- Sunshine Integration
- Recovery Event System

**Severity:**
Critical

---

# Overview

Phase 23 introduced persistent session infrastructure capable of surviving backend failures while preserving active gameplay sessions.

The original objective was simple reconnect support:

```text
Disconnect
    ↓
Reconnect
    ↓
Continue Playing
```

During implementation it became clear that reconnect support required solving a more fundamental problem:

```text
Backend Crash
    ↓
Backend Restart
    ↓
Game Still Running
    ↓
Restore Session State
    ↓
Continue Session
```

The final implementation evolved into a full session persistence architecture.

---

# Architectural Problem

Early versions treated the session as a single object.

```text
Session
 ├─ Game Process
 ├─ Timer
 ├─ Live Sync
 ├─ Stream State
 └─ Monitoring
```

If the backend process terminated unexpectedly:

- timers disappeared
- monitoring stopped
- live sync stopped
- ownership information was lost

The game process itself continued running but became orphaned.

---

# Architectural Redesign

Phase 23 separated multiple independent lifecycles.

```text
Game Process
    ↓
Session Lifecycle
    ↓
Stream Lifecycle
    ↓
Transport Lifecycle
```

This architecture allows failures to occur independently.

Examples:

```text
Game Alive
Session Alive
Stream Dead
Transport Dead
```

or

```text
Game Alive
Session Alive
Stream Alive
Transport Dead
```

---

# Persistent Session Registry

Active sessions are persisted to disk.

Stored information includes:

- session id
- user id
- game id
- process id
- start time
- expiration time
- warning state
- cleanup state

This registry becomes the source of truth during startup recovery.

---

# Session Resurrection

During startup the backend performs recovery validation.

Recovery sequence:

```text
Load Active Sessions
        ↓
Verify Process Exists
        ↓
Verify Session Ownership
        ↓
Restore Timers
        ↓
Restore Monitoring
        ↓
Restore Live Sync
        ↓
Resume Session
```

Sessions whose processes no longer exist are finalized automatically.

---

# Persistent Timers

Earlier implementations stored relative durations.

Example:

```text
60 minutes remaining
```

Backend restart would lose this information.

Phase 23 migrated to absolute expiration timestamps.

Example:

```text
expires_at:
2026-07-12T18:45:00
```

This allows timers to survive restart events.

---

# Shared Session Finalization

Cleanup logic previously existed in multiple locations.

Examples:

- timeout expiration
- manual stop
- crash recovery

This created inconsistent cleanup behavior.

Phase 23 introduced a shared finalization workflow.

All session termination paths now use the same cleanup pipeline.

---

# Live Sync Resurrection

Recovered sessions automatically restore:

- Live Sync
- monitoring
- ownership tracking
- warning timers

This prevents save synchronization from silently stopping after backend restart.

---

# Verification

Verified scenarios include:

- backend restart during active session
- backend crash during active session
- timer restoration
- live sync restoration
- session expiration after restart
- stale session cleanup
- orphan process cleanup

---

# Lessons Learned

Reconnect support was not primarily a networking problem.

The underlying challenge was preserving ownership and lifecycle state across backend failure.

Solving persistence first made reconnect support significantly simpler.

---

# Impact

Phase 23 introduced:

- session resurrection
- persistent timers
- startup recovery
- shared finalization
- lifecycle separation
- restart resilience

These systems provide the foundation for future reconnect support and cloud gaming functionality.