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
