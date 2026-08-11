# Backend Architecture

## Overview

The backend serves as the orchestration layer for the platform.

Built using FastAPI, it exposes APIs used by the dashboard and coordinates all host-side functionality.

---

# Layer Structure

```text
Authentication (JWT dependency on every route)
  ↓
Routes
  ↓
Services
  ↓
Host Components
  ↓
Windows Services
```

A parallel, narrower authentication path (`api/internal_event_auth.py`) sits directly in front of the four Sunshine hook/transport endpoints only, using a shared secret instead of a user JWT. See [Internal Event Authentication](../engineering/internal-event-authentication.md).

---

# Authentication Layer

Every route (aside from `/auth/login`, `/auth/bootstrap-*`) depends on `api/auth.py: get_current_user`, which validates the bearer JWT and returns `{username, role}`. Routes that are admin-only additionally check `current_user["role"] != "admin"` and raise `403` otherwise.

Responsibilities:

* Token validation
* Role extraction and enforcement
* Password hashing (bcrypt via passlib)
* User account storage (`host_agent/user_manager.py`)

---

# Routes Layer

Responsibilities:

* Request handling
* Endpoint exposure
* Validation entry points
* Auth/role enforcement (via the authentication dependency)

Examples:

* Auth APIs (`/auth`)
* Session APIs (`/sessions`)
* Game APIs (`/games`)
* Host APIs (`/host`)
* Sunshine client/stream APIs (`/host/sunshine/*`)
* Recovery APIs (`/host/recovery-events`, `/host/recovery-stats`)
* Admin log APIs (`/admin`)

---

# Controller Layer

Controllers coordinate business operations.

Responsibilities:

* Workflow orchestration
* Response formatting
* Service coordination

---

# Service Layer

Services contain business logic.

Examples:

* Session Service
* Save Service
* Monitoring Service
* Recovery Service
* Sunshine Service (status, client pairing, stream history)
* Tailscale Service
* User Manager / JWT Manager / Auth Manager (authentication and account management)
* Internal Event Auth (shared-secret verification for the Sunshine hook/transport monitor)

---

# WebSocket Layer

Responsibilities:

* Live session status broadcasts (a single `status_update` message type, broadcast to every connected client)

Host monitoring, recovery events/statistics, and Sunshine/Tailscale status are served over REST and refreshed by the dashboard through polling rather than pushed over WebSocket. See [WebSocket Events](../api/websocket-events.md).

---

# Persistence

Historical and analytical data is stored in a SQLite database (`host-agent/data/pcgo.db`), accessed exclusively through a repository layer (`host_agent/repositories/`):

* Session history and session events
* Session metadata
* Recovery events
* Sunshine stream history and current stream state
* Session statistics
* User accounts

Two categories of data intentionally remain JSON files rather than database tables:

* Host configuration (`config.json`) and the game library (`games.json`)
* The active-session runtime snapshot (`data/active_sessions.json`), used for crash-recovery on startup

Log files remain plain rotating log files and are not stored in SQLite.

---

# Key Responsibilities

The backend is responsible for:

* Session lifecycle management
* Save orchestration
* Monitoring
* Validation
* Recovery coordination
* Dashboard data delivery
