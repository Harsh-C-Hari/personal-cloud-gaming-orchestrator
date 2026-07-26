# Personal Cloud Gaming Orchestrator v0.1

## Overview

Personal Cloud Gaming Orchestrator is a single-host remote gaming platform designed to transform a personal gaming PC into a remotely accessible cloud gaming server.

The project provides a management and orchestration layer around game launching, save synchronization, session management, host monitoring, recovery systems, and remote connectivity.

Unlike commercial cloud gaming platforms, this project focuses on personal ownership and control. The gaming host remains under the user's control while providing remote access capabilities through a custom management platform.

The platform is built using FastAPI, React, Sunshine, Tailscale, and a custom Python Host Agent.

---

## Project Goals

The primary goal of the project is to provide a reliable personal cloud gaming experience with:

* Remote gaming infrastructure orchestration
* Save synchronization
* Session lifecycle management
* Session timers
* Automatic cleanup
* Host health monitoring
* Service recovery systems
* Real-time dashboard monitoring
* Cloud-ready architecture

---

## Core Principles

### Reliability

The platform includes monitoring, validation, watchdogs, and recovery systems designed to keep services operational with minimal manual intervention.

### Automation

Session cleanup, save synchronization, validation checks, monitoring, and recovery actions are automated whenever possible.

### Observability

The dashboard provides visibility into host status, service health, active sessions, analytics, and recovery activity.

### Extensibility

The architecture is modular and designed to support future expansion without requiring major redesigns.

---

## Game Management

Responsible for:

- Game registration and configuration.
- Runtime configuration updates.
- Save filter configuration.
- Executable and save path validation.
- Configuration safety and audit logging.

Implemented:

- Dynamic game addition.
- Game configuration editing.
- Game deletion protection.
- Runtime configuration reload.
- Configuration validation APIs.
- Save filter support.
- Atomic configuration persistence.
- Dashboard game management interface.

---

## Settings Management

Implemented:

- Runtime configuration editing.
- Dynamic settings rendering.
- Validation support.
- Configuration synchronization.
- Service configuration integration.
- Restart requirement indicators.

---

## Session Persistence Architecture

One of the major architectural achievements of v0.1 is the separation of:

- Game lifecycle
- Session lifecycle
- Stream lifecycle
- Transport lifecycle

This enables the platform to recover from backend crashes while preserving active gameplay sessions and forms the basis for future reconnect functionality.

---

## Release Stabilization

Following completion of the core MVP systems, the project underwent a dedicated release stabilization phase.

This phase focused on:

- Reliability engineering
- Data integrity
- Crash recovery
- Configuration management
- Save verification
- Repository hardening
- Documentation
- Public release preparation

The resulting implementation forms the **v0.1 Host Foundation Release**, establishing the architectural foundation for future phases including Database Migration, a dedicated User Application, and Production Deployment.

Session Persistence & Reconnection (Phase 23) and Authentication & Authorization (Phase 24) — originally listed below as future phases — have since been completed and are documented in [Session Persistence & Reconnection Architecture](../engineering/session-persistence-and-reconnection.md) and [Authentication & Role-Based Access](../features/authentication.md).

---

## Platform Support

Current host support:

- Windows 10
- Windows 11

Future platform support has not been determined.

---

## Current Status

Current MVP Completion Estimate:

Approximately 80–85%

Completed Major Systems:

* Session System
* Save Management
* Session Analytics
* Session Event Logging
* Sunshine Integration
* Sunshine Watchdog
* Tailscale Diagnostics
* Tailscale Recovery
* Recovery Event Persistence
* Host Monitoring
* Startup Validation
* Lifecycle Manager
* Dashboard Implementation
* WebSocket Infrastructure
* Hash-Based Save Detection
* Live Save Synchronization
* Stale Session Recovery
* Session Persistence & Reconnection
* Authentication & Role-Based Access Control (JWT, admin/user roles, bootstrap flow)
* Role-Aware Dashboard (Admin Dashboard and User Dashboard)
* Sunshine Client Pairing & Stream History Tracking
* Internal Event Authentication (shared-secret channel for the Sunshine hook/transport monitor)

Current focus is finalizing MVP stability, documentation, testing, and deployment preparation.

---

## Scope

This project currently targets a single-host architecture.

Features such as multi-host orchestration, public sharing, billing systems, payment processing, and marketplace functionality are intentionally excluded from the MVP.

## Development Roadmap

Completed since the original MVP scope was defined:

- Phase 23: Session Persistence & Reconnection — **Completed**
- Phase 24: Authentication & Authorization — **Completed**

Planned development phases:

- Phase 25: Database Migration
- Phase 26: User Application Foundation (a dedicated app beyond the current shared, role-aware web dashboard)
- Phase 27: Embedded Tailscale
- Phase 28: Moonlight Automation
- Phase 29: Production User Experience (expanding the User Dashboard introduced in Phase 24)
- Phase 30: Production Host Dashboard
- Phase 31: Security & Audit Logging
- Phase 32: Deployment & Packaging

These phases represent planned development and are not part of the current implementation. See [docs/roadmap/roadmap.md](../roadmap/roadmap.md) for details.