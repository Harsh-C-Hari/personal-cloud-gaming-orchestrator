# API Overview

## Overview

The FastAPI backend exposes APIs used by the dashboard, monitoring systems, recovery systems, session management systems, and infrastructure integrations.

The API acts as the primary communication layer between the frontend and backend.

Every route except `/auth/login` and the first-run bootstrap endpoints requires a valid JWT bearer token (`Authorization: Bearer <token>`). Admin-only routes additionally reject any authenticated account whose role is not `admin` (`403`). See [Authentication & Role-Based Access](../features/authentication.md).

---

# Major API Categories

## Auth APIs

Responsibilities:

* First-run admin bootstrap
* Login and token issuance
* User account management (admin only)
* Password change

Examples:

```text
GET  /auth/bootstrap-required
POST /auth/bootstrap-admin
POST /auth/login
GET  /auth/me
POST /auth/users            (admin)
GET  /auth/users            (admin)
DELETE /auth/users/{username} (admin)
DELETE /auth/users           (admin, bulk cleanup)
PUT  /auth/change-password
```

---

## Session APIs

Responsibilities:

* Start sessions
* Stop sessions
* Session status
* Session history
* Session analytics

Standard users may only stop/view sessions they own; admins may act on any session.

Examples:

```text
GET  /sessions/active
GET  /sessions/analytics       (admin: all sessions)
GET  /sessions/my-analytics    (user: own sessions only)
GET  /sessions/history
GET  /sessions/my-history      (user: own sessions only)
POST /sessions/start
POST /sessions/{session_id}/stop
POST /sessions/{session_id}/restart
POST /sessions/unlock
```

---

## Game APIs

Responsibilities:

* Game retrieval
* Game validation
* Configuration access
* Request structure.
* Validation rules.
* Error responses.
* Active session restrictions.

Examples:

```text
POST   /games/
PUT    /games/{game_id}
DELETE /games/{game_id}
POST   /games/validate
GET /games/{game_id}/validate
GET /games/list_games
```

---

## Host APIs

Responsibilities:

* Host readiness
* Host monitoring
* Startup validation

`/host/status` and `/host/metrics` are admin only; standard users receive an equivalent reduced view via `/host/user-status`.

Examples:

```text
GET /host/status        (admin)
GET /host/user-status   (user)
GET /host/metrics       (admin)
GET /host/watchdogs     (admin)
```

---

## Recovery APIs

*Admin only.* Responsibilities:

* Recovery events
* Recovery statistics
* Watchdog visibility

Examples:

```text
GET /host/recovery-events
GET /host/recovery-stats
```

---

## Infrastructure APIs

*Admin only.* Responsibilities:

* Sunshine service management
* Sunshine client pairing and stream tracking
* Tailscale management
* Service visibility

Examples:

```text
GET  /host/status  # Sunshine and Tailscale information is included there
GET  /host/tailscale/status
POST /host/sunshine/restart
POST /host/sunshine/start
POST /host/sunshine/stop
GET  /host/sunshine/clients
POST /host/sunshine/pair
POST /host/sunshine/unpair
POST /host/sunshine/unpair-all
GET  /host/sunshine/stream
GET  /host/sunshine/history
POST /host/sunshine/close-stream
```

Four additional endpoints — `/host/sunshine/stream-started`, `/host/sunshine/stream-ended`, `/host/sunshine/transport-connected`, `/host/sunshine/transport-disconnected` — exist for internal use only. They are not reachable with a user JWT; they require the internal event token described in [Internal Event Authentication](../engineering/internal-event-authentication.md).

---

## Admin Log APIs

Responsibilities:

* Host log viewing (admin: full log; user: own-session log only)
* Log export

Examples:

```text
GET /admin/logs             (admin)
GET /admin/log-sessions     (admin)
GET /admin/logs/download    (admin)
GET /admin/my-logs          (user)
GET /admin/my-log-sessions  (user)
GET /admin/my-logs/download (user)
```

---

## Configuration APIs

*Admin only.* Responsibilities:

* Reading the current runtime configuration
* Updating individual configuration sections with validation
* Reloading configuration from disk

Examples:

```text
GET  /config/            (admin)
POST /config/reload      (admin)
PUT  /config/{section}   (admin)
```

See [Administrative Settings Panel Architecture](../architecture/settings-panel-architecture.md).

---

## Save APIs

Responsibilities:

* Listing a user's saves for a game
* Deleting a specific save
* Force-unlocking a stuck save operation

Examples:

```text
GET    /saves/{game_id}
DELETE /saves/{game_id}/{save_type}/{save_name}
POST   /saves/{game_id}/force-unlock
```

---

## System APIs

*Admin only.* Native Windows file/folder picker dialogs used by the Game Manager UI when configuring executable and save paths.

Examples:

```text
GET /system/select-file
GET /system/select-folder
```

---

## Health API

*Admin only.* A single endpoint returning the Save Manager's internal health check (used for diagnostics rather than the general host-readiness data exposed under `/host`).

Examples:

```text
GET /health/
```

---

# Design Goals

* Clear separation of responsibilities
* Predictable endpoint behavior
* Real-time compatibility
* Extensibility
