# Host Agent Architecture

## Overview

The Host Agent acts as the execution and automation layer of the platform.

It bridges backend services with the Windows gaming host.

---

# Core Responsibilities

## Session Management

Responsibilities:

* Session execution
* Session cleanup
* Session monitoring

---

## Save Management

Responsibilities:

* Save injection
* Save backup
* Save archive creation
* Save restoration

---

## Monitoring

Responsibilities:

* CPU monitoring
* RAM monitoring
* Disk monitoring
* Health evaluation

---

## Validation

Responsibilities:

* Startup validation
* Service validation
* Host readiness evaluation

---

## Account & Credential Management

The user account store, password hashing, and JWT issuance logic (`user_manager.py`, `auth_manager.py`, `jwt_manager.py`) live in the Host Agent alongside the other host-side managers, even though they're exercised through the API layer's authentication dependency rather than through session/save/monitoring workflows.

Responsibilities:

* User account storage and lookup
* Password hashing and verification (bcrypt via passlib)
* JWT issuance and validation
* First-run admin bootstrap

See [Authentication & Role-Based Access](../features/authentication.md).

---

# Startup Recovery Workflow

Backend Startup
        ↓
Recover Stale Sessions
        ↓
Release Stale Locks
        ↓
Correct Session History
        ↓
Startup Validation
        ↓
Host Ready

---

## Recovery

Responsibilities:

* Recovery execution
* Recovery logging
* Watchdog coordination

Additional recovery capabilities:

* Stale session detection
* Session lock recovery
* Session history correction
* Startup recovery workflows


---

# Host State Management

Supported states:

* starting
* ready
* busy
* maintenance
* recovery
* degraded

---

# Design Goals

* Reliability
* Automation
* Recoverability
* Low operational overhead
