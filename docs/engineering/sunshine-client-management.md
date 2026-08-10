# Sunshine Client Management & Stream Tracking

**Status:** Completed

---

# Issue Information

**Category:**
Streaming Infrastructure / Sunshine Integration

**Affected Components:**

- Sunshine Controller (`host_agent/sunshine_controller.py`)
- Sunshine Service (`api/services/sunshine_service.py`)
- Sunshine Stream Tracker (`host_agent/sunshine_stream_tracker.py`)
- Sunshine Transport Monitor (`host_agent/sunshine_transport_monitor.py`)
- Sunshine Stream Hook (`sunshine_stream_hook.py`)
- Sunshine Dashboard Page (`frontend/src/dashboard/pages/SunshinePage.jsx`)

**Severity:**
Medium (operational visibility, not a defect fix)

---

# Overview

The original Sunshine integration covered service lifecycle only: start, stop, restart, and a basic status check (running / reachable / client count / app count). As the platform matured, three additional needs emerged that the original controller did not address:

1. Administrators need to see and manage **which client devices are paired** with Sunshine, not just how many.
2. The dashboard needs to know **whether a stream is actually active right now**, independent of whether a session is active (a session can be running locally with no stream connected).
3. Past streaming activity needs to be **auditable** after the fact — durations, start/stop times — the same way session history is.

This document covers the resulting client pairing, stream tracking, and transport monitoring subsystems.

---

# Client Pairing

Pairing is delegated to Sunshine's own REST API rather than reimplemented. The Sunshine controller exposes:

- `GET /host/sunshine/clients` — list currently paired clients (admin only)
- `POST /host/sunshine/pair` — submit a PIN to Sunshine's `/api/pin` endpoint to pair a new client
- `POST /host/sunshine/unpair` — remove a single paired client by UUID
- `POST /host/sunshine/unpair-all` — remove every paired client

All calls to Sunshine's local API use HTTP Basic Auth with credentials from `config.json` (`sunshine.username` / `sunshine.password`), and honor the configured `verify_ssl` setting for Sunshine's self-signed certificate. If credentials are not configured, pairing/client calls return a structured `"reachable": false` response rather than raising, so the dashboard can display a clear "not configured" state instead of a generic error.

---

# Stream State Tracking

Whether a session is active and whether a stream is active are tracked separately (see [Session Persistence & Reconnection Architecture](session-persistence-and-reconnection.md) for the full lifecycle-separation rationale). `SunshineStreamTracker` owns the current stream state:

```text
data/pcgo.db
```

Stored fields include the active stream flag, the connected client, stream start time, and current transport (connected/disconnected) state. `GET /host/sunshine/stream` returns this, merged with the active session's own `stream_active` / `stream_started_at` / `stream_ended_at` / `stream_app` fields when a session is running, so the dashboard has one endpoint to read from regardless of which subsystem last updated the state.

---

# Stream History

Every completed stream is appended to a persisted history table in database.

```text
data/pcgo.db
```

`GET /host/sunshine/history` (admin only) returns the most recent entries (default limit 50), used by the Sunshine dashboard page to show past stream durations and timestamps for diagnostics and usage review.

If a stream is left in a stuck "active" state (for example after an ungraceful Sunshine restart), `POST /host/sunshine/close-stream` lets an administrator manually close it from the dashboard rather than requiring a backend restart.

---

# How Stream State Gets Updated: Two Independent Signal Sources

Two separate mechanisms feed stream/transport state into the tracker, because Sunshine surfaces this information in two different ways:

## 1. The Stream Hook (`sunshine_stream_hook.py`)

Sunshine can be configured to run an external command when it starts or stops a stream. This project registers `sunshine_stream_hook.py` for that purpose. When Sunshine invokes it, the script calls back into the backend:

```text
POST /host/sunshine/stream-started
POST /host/sunshine/stream-ended
```

## 2. The Transport Monitor (`SunshineTransportMonitor`)

Sunshine's hook mechanism reports stream start/stop, but not the underlying transport connect/disconnect events (e.g. a client's network dropping mid-stream while the "stream" is technically still active). To catch those, a background thread tails Sunshine's log file directly, watching for `CLIENT CONNECTED` / `CLIENT DISCONNECTED` lines, and reports them to:

```text
POST /host/sunshine/transport-connected
POST /host/sunshine/transport-disconnected
```

This lets the dashboard distinguish "the stream ended" from "the transport dropped but the stream may resume" — the same alive/dead distinction used by session persistence.

Both callers are external to the normal request flow (a separate OS process and a background thread, respectively) and are authenticated using the internal event token rather than a user JWT — see [Internal Event Authentication](internal-event-authentication.md) for why that split exists.

---

# Dashboard Integration

The admin dashboard's **Sunshine** page (`SunshinePage.jsx`) surfaces all of the above:

- Live stream/transport status
- Paired client list with unpair / unpair-all actions
- Stream history table
- Manual stream-close action

Standard users do not see this page; Sunshine management is an admin-only capability, consistent with the rest of the host-management surface.

---

# Verification

Verified scenarios include:

- Pairing a new client via PIN through the dashboard.
- Unpairing a single client and unpairing all clients.
- Stream start/stop reported correctly via the hook script during a real Sunshine session.
- Transport disconnect/reconnect detected via log tailing without a stream-hook event.
- Stream history persisted and readable after a backend restart.
- Manual stream close recovering a stuck "active" stream state.
- Hook and transport monitor calls rejected without a valid internal event token; accepted with one.

---

# Impact

- Gives administrators direct visibility and control over paired streaming clients instead of relying on Sunshine's own web UI.
- Separates "is a session running" from "is a stream actually connected," improving diagnostic accuracy for reliability testing.
- Provides an auditable stream history alongside the existing session history.
- Establishes a clear, authenticated boundary for the two non-user callers (hook script, transport monitor) that need to report state into the backend.
