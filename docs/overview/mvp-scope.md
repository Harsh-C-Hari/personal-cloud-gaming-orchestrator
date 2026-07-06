# MVP Scope Definition

## Purpose

This document defines what is included and excluded from the Personal Cloud Gaming Orchestrator v0.1 MVP.

The goal is to prevent scope creep and maintain focus on delivering a stable single-host cloud gaming platform.

---

# Included In MVP

## Game Management

Included:

* Game configuration storage
* Game validation
* Executable validation
* Save path validation

---

## Session System

Included:

* Session creation
* Session termination
* Session tracking
* Session timers
* Session cleanup
* Session analytics
* Session history
* Session event logging

---

## Save Management

Included:

* Save injection
* Save backup
* Save archiving
* Save restore
* Save validation
* Hash-based save detection
* Live save synchronization

---

## Monitoring

Included:

* CPU monitoring
* RAM monitoring
* Disk monitoring
* Host health evaluation

---

## Recovery Systems

Included:

* Sunshine watchdog
* Tailscale watchdog
* Stale session recovery
* Recovery event logging
* Recovery statistics
* Persistent recovery history

---

## Dashboard

Included:

* Host monitoring
* Session monitoring
* Recovery monitoring
* Sunshine monitoring
* Analytics visualization

---

## Networking

Included:

* Tailscale diagnostics
* Tailscale health validation
* Tailscale recovery workflows

---

# Excluded From MVP

The following features are intentionally excluded.

## Multi-Host Infrastructure

Excluded:

* Multiple gaming hosts
* Host selection logic
* Distributed orchestration

---

## User Management

Excluded:

* Multiple users
* Authentication systems
* User roles
* Permissions

---

## Commercial Features

Excluded:

* Marketplace
* Public host sharing
* Billing
* Payments
* Subscription systems

---

## Cloud Infrastructure

Excluded:

* Regional deployment
* Host clustering
* Cross-host migration

---

# MVP Completion

The v0.1 MVP focuses on delivering a reliable single-host cloud gaming orchestration platform.

Core systems included in the MVP:

- Session Management
- Save Management
- Live Save Synchronization
- Dynamic Game Management
- Sunshine Integration
- State-Aware Tailscale Recovery
- Host Monitoring
- Recovery Infrastructure
- Administrative Dashboard
- Configuration Management
- Reliability Engineering
- Release Hardening

Features intentionally excluded from the MVP include:

- Multi-user support
- Authentication & Authorization
- User Application
- Embedded Tailscale
- Moonlight Automation
- Production Host Dashboard
- Deployment Packaging

---

# MVP Success Criteria

The MVP will be considered complete when:

* Core session workflows are stable
* Save synchronization is reliable
* Recovery systems operate correctly
* Dashboard synchronization is stable
* Documentation is complete
* Testing is complete
* Deployment preparation is complete

The MVP remains focused on a reliable single-host cloud gaming platform.

## Planned MVP Expansion

The following phases are planned after the current core platform stabilization work:

- Phase 23: Session Persistence & Reconnection
- Phase 24: Authentication & Authorization
- Phase 25: Database Migration
- Phase 26: User App Foundation
- Phase 27: Embedded Tailscale
- Phase 28: Moonlight Automation
- Phase 29: User Dashboard
- Phase 30: Production Host Dashboard
- Phase 31: Security & Audit Logging
- Phase 32: Deployment & Packaging