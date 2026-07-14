# Session System

## Overview

The Session System is responsible for managing the complete lifecycle of gaming sessions.

It acts as the central coordination layer between the dashboard, backend services, save management systems, and the host environment.

---

# Responsibilities

The Session System manages:

* Session creation
* Session execution
* Session monitoring
* Session timers
* Session cleanup
* Session analytics
* Session history
* Session event logging

---

# Session Lifecycle

```text
Session Created
       ↓
Save Injected
       ↓
Game Launched
       ↓
Session Running
       ↓
Timer Monitoring
       ↓
Session Completed
       ↓
Save Backup
       ↓
Cleanup
```

---

# Session States

Supported states:

* starting
* running
* stopping
* cleaning
* completed
* failed

`completed` and `failed` are terminal session outcomes, while `starting`, `running`, `stopping`, and `cleaning` represent runtime session states.
---

# Session Registry

The session registry tracks active sessions.

Responsibilities:

* Active session storage
* Session lookup
* State tracking
* Cleanup coordination

---

# Session Timers

Implemented features:

* Session duration limits
* Warning notifications
* Automatic expiration

Timer events:

* warning_sent
* timer_expired

---

# Session Event Logging

The system records important lifecycle events.

Examples:

* session_started
* session_completed
* session_failed
* warning_sent
* timer_expired

---

# Session Locking

To prevent multiple active sessions from conflicting with each other, the platform implements session locking.

Responsibilities:

- Prevent concurrent session execution
- Protect save integrity
- Prevent duplicate launches

Recovery support includes:

- Stale lock detection
- Forced lock release
- Startup lock recovery

---

# Session Analytics

Tracked metrics include:

* Total sessions
* Successful sessions
* Failed sessions
* Runtime statistics

API:

```text
GET /sessions/analytics
```

---

# Stale Session Recovery

## Purpose

The platform includes startup recovery logic for sessions interrupted by backend failures.

A stale session may occur when:

* Backend crashes
* Unexpected process termination
* System shutdowns
* Application failures

---

## Startup Recovery Workflow

During startup:

1. Session registry is inspected.
2. Stale sessions are identified.
3. Session locks are forcefully released.
4. Incomplete sessions are marked as failed.
5. Recovery events are recorded.
6. Session history is updated.

---

## Recovery Actions

Implemented actions:

* Session lock cleanup
* Registry cleanup
* Session state correction
* History correction
* Event logging

---

## Benefits

Prevents:

* Permanent session locks
* Orphaned sessions
* Invalid active session states
* Startup deadlocks

The system can safely recover from interrupted session workflows without requiring manual intervention.

---

# Session History Recovery

If a backend crash occurs before a session is finalized:

- Session history is inspected
- Incomplete sessions are identified
- Session status is corrected
- Recovery events are recorded

This ensures historical records remain accurate after unexpected failures.

---

# Design Goals

* Reliability
* Automation
* Traceability
* Recoverability

---

## Session Resurrection

The session system supports recovery after backend restart by inspecting persisted session state and verifying process ownership.

---

## Persistent Timers

Session expiration uses absolute timestamps rather than relative durations.

---

## Shared Finalization

Session cleanup is centralized through a shared finalization path used by:

- Normal completion
- Timeout expiration
- Manual stop
- Session resurrection