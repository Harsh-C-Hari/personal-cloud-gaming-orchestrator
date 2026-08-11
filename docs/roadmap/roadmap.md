# Development Roadmap

## Overview

This roadmap outlines the planned development phases following completion of the current MVP foundation.

The goal is to evolve the platform from a host-focused management system into a complete personal cloud gaming ecosystem.

---

# Current Status

Current Progress:

```text
The v0.1 Host Foundation Release is complete.

Phase 23 Session Persistence & Reconnection has been completed.

Phase 24 Authentication & Authorization has been completed.

Phase 25 Database Migration has been completed.
```

Completed:

* Session System
* Save Management
* Session Analytics
* Session Event Logging
* Live Save Synchronization
* Stale Session Recovery
* Sunshine Integration
* Sunshine Watchdog
* Sunshine Client Pairing & Stream Tracking
* Tailscale Diagnostics
* Tailscale Recovery
* Host Monitoring
* Startup Validation
* Lifecycle Manager
* Dashboard (Admin and User)
* Recovery Infrastructure
* Authentication & Role-Based Authorization
* Internal Event Authentication
* SQLite Database Migration

---

# v0.1 Host Foundation Release

The initial public release concludes the implementation of the single-host orchestration platform.

Completed milestones include:

- Session orchestration
- Save synchronization
- Dynamic game management
- Host monitoring
- Sunshine integration
- State-aware Tailscale recovery
- Dashboard implementation
- Administrative configuration
- Reliability engineering
- Release stabilization

Subsequent phases focus on extending the platform beyond a host-only administrative system toward a complete cloud gaming experience.

---

# Phase 23 — Completed

## Session Persistence & Reconnection

See [Session Persistence & Reconnection Architecture](../engineering/session-persistence-and-reconnection.md) for the full engineering write-up.

Completed capabilities:

* Backend restart resilience
* Session resurrection
* Live Sync restoration
* Persistent session timers
* Stream lifecycle tracking
* Transport monitoring
* Disconnect detection
* Reconnect detection
* Session and stream ownership separation

Architectural achievement:

```text
Game Process
    ↓
Session Lifecycle
    ↓
Stream Lifecycle
    ↓
Transport Lifecycle
```

---

# Phase 24 — Completed

## Authentication & Authorization

See [Authentication & Role-Based Access](../features/authentication.md) and [Internal Event Authentication](../engineering/internal-event-authentication.md) for the full engineering write-up.

Delivered capabilities:

* JWT-based user authentication with first-run admin bootstrap
* bcrypt password hashing
* Two roles (admin, user) enforced on every API route
* Admin-only user management (create, list, delete, bulk cleanup)
* Self-service password change
* Role-aware dashboard routing (Admin Dashboard vs. User Dashboard)
* Session ownership validation (users see only their own sessions, analytics, history, and logs)
* A separate shared-secret channel (internal event token) for the two non-user callers — the Sunshine stream hook and transport monitor — that must report state without holding a user credential

Not yet delivered (carried forward to later phases):

* Refresh tokens
* Login rate limiting / account lockout
* Structured security audit logging (Phase 31)

Benefits realized:

* Security: no endpoint is reachable without authentication
* Multi-user readiness: distinct admin and user experiences on a shared host

---

# Phase 25 — Completed

## Database Migration

Session history, session events, session metadata, recovery events, Sunshine stream history/state, and user accounts were migrated from JSON files to a SQLite database (`host-agent/data/pcgo.db`), accessed through a dedicated repository layer (`host_agent/repositories/`).

Host configuration (`config.json`), the game library (`games.json`), and the active-session runtime/crash-recovery snapshot (`data/active_sessions.json`) were intentionally kept as JSON files rather than migrated. Log files remain plain rotating log files.

Delivered:

* SQLite-backed repositories for the data listed above
* Structured storage layer with indexes supporting existing query patterns
* Aggregate SQL queries for recovery statistics (replacing in-Python tallying)

See `docs/phase25/` for the full engineering design and schema documentation.

---

# Phase 26

## User App Foundation

A scoped, role-aware **User Dashboard** already ships as part of the Phase 24 authentication work (Home, Analytics, Session History, Logs, Change Password, restricted to the logged-in user's own data). Phase 26 goes further: a dedicated, purpose-built application rather than a role-restricted view of the same web dashboard.

Goals:

* Dedicated user application (distinct from the admin dashboard codebase)
* User-focused workflows
* Remote access experience

Expected Benefits:

* Improved usability
* Better user experience

---

# Phase 27

## Embedded Tailscale

Goals:

* Integrated connectivity setup
* Simplified onboarding
* Reduced manual networking steps

Expected Benefits:

* Easier deployment
* Better user experience

---

# Phase 28

## Moonlight Automation

Goals:

* Stream launch automation
* Client workflow automation
* Reduced manual interaction

Expected Benefits:

* Faster session startup
* Improved usability

---

# Phase 29

## Production User Experience

The initial User Dashboard (session visibility, analytics, history, logs) was delivered as part of Phase 24. Phase 29 focuses on maturing it into a production-grade player experience.

Goals:

* Save visibility for end users
* Connection management (client/stream status from the user's perspective)
* Refined, production-quality UI for the existing User Dashboard

Expected Benefits:

* Better remote experience

---

# Phase 30

## Production Host Dashboard

Goals:

* Production-ready monitoring
* Improved observability
* Operational tooling

Expected Benefits:

* Better reliability management

---

# Phase 31

## Security & Audit Logging

Goals:

* Security event tracking
* Audit trails
* Administrative visibility

Expected Benefits:

* Accountability
* Security

---

# Phase 32

## Deployment & Packaging

Goals:

* Simplified installation
* Distribution packaging
* Deployment automation

Expected Benefits:

* Easier adoption
* Production readiness
