# Personal Cloud Gaming Orchestrator v0.1

## Project Case Study

### Overview

Personal Cloud Gaming Orchestrator is a single-host cloud gaming orchestration platform designed to transform a personal gaming PC into a remotely accessible gaming server.

The project combines remote game access, save synchronization, session management, monitoring, diagnostics, and recovery systems into a unified platform.

Built using:

* Python
* FastAPI
* React
* Sunshine
* Tailscale
* WebSockets
* JWT authentication (python-jose) with bcrypt password hashing (passlib)

---

# Problem

Modern cloud gaming solutions are often expensive, closed-source, or designed for commercial providers.

The goal of this project was to create a personal cloud gaming platform that allows a user to remotely access and manage their own gaming PC while maintaining ownership and control of the infrastructure.

Key challenges included:

* Remote session management
* Save synchronization
* Host monitoring
* Service recovery
* Reliability during failures

---

# Solution

The platform introduces a management and orchestration layer that coordinates:

* Session execution
* Save management
* Host monitoring
* Sunshine integration
* Tailscale connectivity
* Recovery systems
* Dashboard visibility

The system is designed around automation and reliability.

---

# Architecture

```text
React Dashboard (role-aware: Admin / User, gated by login)
        ↓
FastAPI Backend (JWT authentication on every route)
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

---

# Major Features

### Session System

* Session lifecycle management
* Session analytics
* Session event logging
* Session timers
* Cleanup workflows

### Save Management

* Save injection
* Save backup
* Save restoration
* Save archives
* Live save synchronization
* Hash-based change detection

### Monitoring

* CPU monitoring
* RAM monitoring
* Disk monitoring
* Host readiness validation

### Recovery

* Sunshine watchdog
* Tailscale recovery
* Recovery statistics
* Recovery event persistence
* Stale session recovery

### Authentication & Access Control

* JWT-based login with first-run admin bootstrap
* Admin and user roles enforced on every API route
* Role-aware dashboards (full admin dashboard vs. scoped user dashboard)
* Admin user management, self-service password change
* A separate shared-secret channel authorizing Sunshine's own hook script and log-tailing transport monitor, without exposing that path to logged-in users

---

# Technical Challenges Solved

### Save Backup Explosion

Implemented hash-based save detection to eliminate redundant backups.

### Live Save Synchronization False Positives

Refined synchronization logic to distinguish gameplay progress from configuration changes.

### Stale Session Recovery

Implemented startup recovery logic capable of restoring consistency after backend crashes.

### Dashboard Synchronization

Resolved browser caching issues affecting real-time dashboard accuracy.

### Authenticating a Non-User Caller

Two components — Sunshine's own stream hook script and a background thread tailing Sunshine's log — needed to report stream state into the backend without being logged-in users. Solved with a single-purpose shared secret (an "internal event token"), distinct from user JWTs, verified with a constant-time comparison and scoped to exactly four endpoints.

---

# Engineering Concepts Demonstrated

* Systems Design
* Reliability Engineering
* Monitoring & Observability
* Recovery Automation
* Backend Development
* Frontend Development
* API Design
* State Management
* Debugging & Root Cause Analysis

---

# Current Status

The v0.1 Host Foundation Release is complete.

Session Persistence & Reconnection (Phase 23) and Authentication & Authorization (Phase 24) have both been completed since the initial release.

Current focus:

* Phase 25 (Database Migration) and beyond
