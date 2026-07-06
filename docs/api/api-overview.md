# API Overview

## Overview

The FastAPI backend exposes APIs used by the dashboard, monitoring systems, recovery systems, session management systems, and infrastructure integrations.

The API acts as the primary communication layer between the frontend and backend.

---

# Major API Categories

## Session APIs

Responsibilities:

* Start sessions
* Stop sessions
* Session status
* Session history
* Session analytics

Examples:

```text
GET /sessions
GET /sessions/analytics
POST /sessions/start
POST /sessions/stop
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
POST   /games
PUT    /games/{game_id}
DELETE /games/{game_id}
POST   /games/validate
GET /games/{game_id}/validate
```

---

## Host APIs

Responsibilities:

* Host readiness
* Host monitoring
* Startup validation

Examples:

```text
GET /host/status
GET /host/metrics
```

---

## Recovery APIs

Responsibilities:

* Recovery events
* Recovery statistics
* Watchdog visibility

Examples:

```text
GET /host/recovery-events
GET /host/recovery-stats
GET /host/watchdogs
```

---

## Infrastructure APIs

Responsibilities:

* Sunshine management
* Tailscale management
* Service visibility

Examples:

```text
GET /sunshine/status
POST /sunshine/restart
```

---

# Design Goals

* Clear separation of responsibilities
* Predictable endpoint behavior
* Real-time compatibility
* Extensibility
