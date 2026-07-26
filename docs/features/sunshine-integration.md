# Sunshine Integration

## Overview

Sunshine provides the game streaming infrastructure used by the platform.

The platform integrates with Sunshine for service control, monitoring, validation, and recovery.

---

# Controller Features

Implemented:

* Start Sunshine
* Stop Sunshine
* Restart Sunshine
* Status Detection
* Client pairing (PIN-based, via Sunshine's own `/api/pin` endpoint)
* Client unpairing (single client or all clients)
* Live stream status tracking, independent of session state
* Persisted stream history with duration and timestamps
* Manual stream close (recovery action for a stuck "active" stream)

All access to Sunshine management endpoints requires an authenticated **admin** account; this is not available to standard users.

For the internal design of client pairing and stream tracking, see [Sunshine Client Management & Stream Tracking](../engineering/sunshine-client-management.md).

---

# Status Information

Collected information:

* Running state
* Reachability
* Connected clients
* Available applications
* Active stream state (separate from session/service state)
* Transport connection state (connected/disconnected)

---

# Dashboard Integration

The admin dashboard's **Sunshine** page displays:

* Service status
* Reachability
* Client count and paired-client list (with unpair actions)
* Application count
* Live stream status and connected client
* Stream history table
* Manual stream-close control

---

# Client Pairing

New clients are paired by submitting the PIN Sunshine displays during its own pairing flow. The backend forwards the PIN to Sunshine's local API using Basic Auth credentials configured in `config.json` (`sunshine.username` / `sunshine.password`). Paired clients can be individually unpaired, or all clients can be unpaired at once (e.g. after re-provisioning the host).

---

# Stream Tracking

Stream activity is tracked independently of session activity — a session can be running locally with no stream connected, and a stream can (briefly) outlive a session ending. Two independent signal sources feed this state:

* **Sunshine's stream hook script**, invoked directly by Sunshine on stream start/stop.
* **A log-tailing transport monitor**, watching Sunshine's own log file for client connect/disconnect events that the hook does not cover.

Both callers authenticate using a separate internal event token rather than a user credential — see [Internal Event Authentication](../engineering/internal-event-authentication.md).

Every completed stream is recorded to a persisted stream history file, viewable from the dashboard for diagnostics and usage review.

---

# Startup Validation

Sunshine is included in host startup validation.

Checks:

* Service availability
* Running state
* Host readiness impact

---

# Sunshine Watchdog

Implemented recovery capabilities.

Responsibilities:

* Detect outages
* Log events
* Attempt restart
* Verify recovery

---

# Recovery Events

Examples:

* detected_offline
* restart_attempt
* restart_success
* restart_failed

---

# Design Goals

* Service availability
* Automatic recovery
* Operational visibility
* Reliability
