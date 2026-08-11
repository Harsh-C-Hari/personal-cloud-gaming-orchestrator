# Technology Stack

## Backend

### Python

Python serves as the primary development language for backend services and host-side orchestration.

Responsibilities:

* Business logic
* Session management
* Save management
* Monitoring
* Recovery systems
* Automation workflows

---

### FastAPI

FastAPI provides the REST API layer used by the dashboard and management systems.

Responsibilities:

* API endpoints
* Validation
* Service orchestration
* WebSocket communication

---

### Uvicorn

Uvicorn acts as the ASGI server used to host the FastAPI application.

---

## Frontend

### React

React powers the dashboard interface.

Responsibilities:

* Monitoring views
* Session management views
* Recovery dashboards
* Host status visualization

---

### Vite

Vite provides frontend tooling and development infrastructure.

---

## Gaming Infrastructure

### Sunshine

Sunshine provides game streaming capabilities from the host machine.

Responsibilities:

* Stream hosting
* Client connectivity
* Game streaming sessions

---

## Networking

### Tailscale

Tailscale provides secure remote connectivity between client devices and the gaming host.

Responsibilities:

* Remote access
* Private networking
* Connectivity management
* Recovery validation

---

## Persistence

### SQLite

Session history, session events, session metadata, recovery events, Sunshine stream history/state, and user accounts are stored in a local SQLite database (`host-agent/data/pcgo.db`), accessed through a dedicated repository layer.

### JSON-Based Storage

Host configuration and select runtime state remain JSON files by design.

Used for:

* Host configuration (`config.json`)
* Game library (`games.json`)
* Active-session runtime/crash-recovery snapshot (`data/active_sessions.json`)

---

## Communication

### WebSockets

WebSockets provide real-time session status updates between backend services and the dashboard.

Used for:

* Session status updates (a single `status_update` broadcast type)

Host monitoring, recovery events, and Sunshine/Tailscale status are refreshed by the dashboard via REST polling, not WebSocket.

---

## Custom Components

### Python Host Agent

The Host Agent acts as the orchestration layer between backend services and the Windows gaming host.

Responsibilities:

* Session execution
* Save synchronization
* Host monitoring
* Validation workflows
* Recovery execution
