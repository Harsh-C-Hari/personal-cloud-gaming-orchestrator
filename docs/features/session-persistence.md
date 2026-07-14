# Session Persistence

The session persistence system ensures active gameplay sessions survive backend restarts and unexpected failures.

---

## Features

### Persistent Session Registry

Active sessions are stored on disk and restored during startup.

Stored information includes:

- session id
- game id
- user id
- process id
- expiration time

---

### Session Resurrection

Backend startup automatically restores recoverable sessions.

Recovery includes:

- session monitoring
- timers
- live sync
- ownership state

---

### Persistent Timers

Expiration uses absolute timestamps rather than relative durations.

This allows expiration logic to survive backend restart.

---

### Startup Recovery

The startup validator checks:

- active session state
- process existence
- session ownership

Invalid sessions are finalized automatically.

---

### Shared Finalization

All session termination paths use a common cleanup workflow.

This guarantees consistent cleanup behavior.

---

## Recovery Workflow

```text
Backend Starts
      ↓
Load Session Registry
      ↓
Verify Process Exists
      ↓
Restore Session Components
      ↓
Resume Monitoring
```

---

## Benefits

- backend restart resilience
- reduced orphan sessions
- improved reliability
- deterministic cleanup