# System Architecture

## Overview

Personal Cloud Gaming Orchestrator v0.1 is designed as a single-host cloud gaming platform.

The architecture separates user interaction, backend orchestration, host management, monitoring, and recovery systems into distinct layers.

---

# High-Level Architecture

```text
React Dashboard
        ↓
FastAPI Backend
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

# Architectural Layers

## Frontend Layer

The frontend provides the user-facing dashboard.

Responsibilities:

* Host monitoring
* Session monitoring
* Recovery monitoring
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
* Validation
* Session orchestration
* Save orchestration
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
