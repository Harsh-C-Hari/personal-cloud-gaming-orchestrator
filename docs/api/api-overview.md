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
GET /sessions/active
GET /sessions/analytics
POST /sessions/start
POST /sessions/{session_id}/stop
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

Examples:

```text
GET /host/status
GET /host/metrics
GET /host/watchdogs
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
```

---

## Infrastructure APIs

Responsibilities:

* Sunshine management
* Tailscale management
* Service visibility

Examples:

```text
GET /host/status #Sunshine and Tailscale Information is Included There
POST /host/sunshine/restart
POST /host/sunshine/start
POST /host/sunshine/stop
```

---

# Design Goals

* Clear separation of responsibilities
* Predictable endpoint behavior
* Real-time compatibility
* Extensibility
