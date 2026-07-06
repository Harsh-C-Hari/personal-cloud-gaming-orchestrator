# Recovery Architecture

## Overview

The recovery subsystem improves platform reliability through monitoring, event logging, diagnostics, and automated recovery workflows.

---

# Recovery Components

## Recovery Event System

Persistent event storage.

Tracks:

* Service
* Event
* Timestamp
* Details

Stored in:

```text
data/recovery_events.json
```

---

## Recovery Statistics

Tracks:

* Sunshine restarts
* Sunshine failures
* Tailscale recoveries
* Tailscale failures

---

# Sunshine Watchdog

Responsibilities:

* Detect outages
* Log events
* Attempt recovery
* Verify recovery success

Workflow:

```text
Detect Failure
      ↓
Log Event
      ↓
Attempt Recovery
      ↓
Verify Success
      ↓
Log Result
```

---

# Tailscale Recovery System

Responsibilities:

* Diagnostics
* Health validation
* State detection
* Recovery execution
* Recovery verification

Workflow:

```text
Detect Unhealthy State
          ↓
Run Diagnostics
          ↓
Execute Recovery
          ↓
Validate State
          ↓
Log Result
```

---

# Session Recovery

The recovery subsystem also handles interrupted session workflows.

Capabilities:

- Stale session detection
- Session lock recovery
- Session history correction
- Startup cleanup

---

# Recovery Design Principles

## Persistence

Recovery history survives application restarts.

## Visibility

Recovery activity is visible through the dashboard.

## Automation

Common failure conditions are handled automatically.

## Reliability

Recovery actions are verified before being considered successful.
