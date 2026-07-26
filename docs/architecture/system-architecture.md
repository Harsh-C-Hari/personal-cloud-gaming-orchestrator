# System Architecture

## Overview

Personal Cloud Gaming Orchestrator v0.1 is designed as a single-host cloud gaming orchestration platform.

The architecture separates user interaction, backend orchestration, host management, monitoring, and recovery systems into distinct layers.

---

# High-Level Architecture

```text
React Dashboard (Login / Bootstrap → Admin or User shell)
        ↓
FastAPI Backend  (JWT authentication on every route)
        ↓
Controllers / Services
        ↓
Python Host Agent
        ↓
Sunshine
Tailscale
        ↓
Windows Gaming Host
```

A separate, narrower authentication path (a shared internal event token, not a user JWT) authorizes two non-interactive callers — the Sunshine stream hook script and the transport-monitoring background thread — to report stream state directly into the backend. See [Internal Event Authentication](../engineering/internal-event-authentication.md).

---

# Architectural Layers

## Authentication Layer

Every dashboard and API request, except the bootstrap/login endpoints themselves, requires a valid JWT bearer token.

Responsibilities:

* First-run admin bootstrap
* Login and JWT issuance
* Role enforcement (admin / user) on every route
* User account management (admin only)
* Self-service password change

Technology:

* python-jose (JWT)
* passlib + bcrypt (password hashing)

See [Authentication & Role-Based Access](../features/authentication.md).

---

## Frontend Layer

The frontend provides the user-facing dashboard. It renders one of two role-aware experiences after login: the full Admin Dashboard, or a scoped User Dashboard limited to the logged-in account's own sessions, analytics, history, and logs.

Responsibilities:

* Host monitoring (full for admins, reduced for users)
* Session monitoring
* Recovery monitoring (admin only)
* Sunshine client management (admin only)
* User management (admin only)
* Analytics visualization
* Real-time status updates

Technology:

* React
* Vite

---

## Backend Layer

The backend acts as the central orchestration layer.

Responsibilities:

* API endpoints
* Authentication and authorization
* Validation
* Session orchestration
* Save orchestration
* Sunshine client/stream orchestration
* Monitoring coordination
* Recovery coordination
* WebSocket communication

Technology:

* FastAPI
* Uvicorn

---

## Host Agent Layer

The Host Agent provides direct interaction with the Windows host.

Responsibilities:

* Session execution
* Save injection
* Save backup
* Monitoring
* Validation
* Recovery actions

Technology:

* Python

---

## Infrastructure Layer

External services used by the platform.

### Sunshine

Responsibilities:

* Game streaming
* Client connectivity

### Tailscale

Responsibilities:

* Secure remote networking
* Connectivity management

---

## Persistence Layer

Current persistence is file-based.

Stored Data:

* Session history
* Recovery events
* Analytics
* Configuration

Technology:

* JSON storage

---

# Design Principles

## Reliability

Recovery systems and watchdogs help maintain service availability.

## Modularity

Major systems are separated into dedicated components.

## Observability

System state is visible through monitoring and analytics systems.

## Extensibility

Future features can be added without major architectural redesign.
