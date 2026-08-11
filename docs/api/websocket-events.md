# WebSocket Events

## Overview

WebSockets provide real-time communication between backend services and the dashboard.

The goal is to reduce polling requirements while keeping monitoring information current.

---

# Authentication Scope

The `/ws` connection requires a valid JWT: the client passes it as a `token` query parameter, and the backend validates it with the same JWT logic used for REST (`jwt_manager.verify_token`) before accepting the connection — an invalid or missing token gets the connection closed immediately (`WS_1008_POLICY_VIOLATION`). What is **not** implemented is per-connection filtering by role or by user: once connected, every client receives every broadcast message identically, regardless of whether that client is an admin or a standard user, or which session it belongs to. Since the only broadcast today is a session `status_update` (see below), this means a standard user's browser also receives status updates for other users' sessions over the socket, even though the REST session endpoints correctly scope a standard user to their own sessions. Per-connection role/session filtering is not yet implemented and is a candidate for future hardening work.

---

# Currently Implemented Usage

The single `/ws` endpoint broadcasts one message shape to every connected client, used to optimistically update session status in the dashboard without waiting for the next poll:

```json
{ "type": "status_update", "session_id": "<id>", "status": "<status>" }
```

This is the only message type currently broadcast; there is no dashboard-wide status channel, no monitoring-update channel, and no recovery-update channel over WebSocket today. Host monitoring, recovery events/statistics, and Sunshine/Tailscale status are all served over REST and refreshed by the dashboard through polling, not pushed over `/ws`.

---

# Session Related Events

`status` is one of the session lifecycle values used elsewhere in the session system:

* starting
* running
* stopping
* cleaning
* completed
* failed

There are no separate `session_started`/`warning_sent`/`timer_expired` WebSocket event types — session start, warnings, and timer expiry are reflected through the REST session endpoints and session events log (`GET /sessions/events`), not through a dedicated WebSocket message.

---

# Recovery Related Updates

Not currently implemented over WebSocket. Recovery events and statistics are exposed via `GET /host/recovery-events` and `GET /host/recovery-stats` and consumed by the dashboard through REST polling.

---

# Future Expansion

As the platform evolves, additional event categories may be introduced for:

* Host monitoring and recovery updates pushed over WebSocket (rather than polled)
* User application updates
* Authentication events
* Audit logging

These are not currently implemented.
