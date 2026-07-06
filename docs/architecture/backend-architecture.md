# Backend Architecture

## Overview

The backend serves as the orchestration layer for the platform.

Built using FastAPI, it exposes APIs used by the dashboard and coordinates all host-side functionality.

---

# Layer Structure

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Host Agent
```

---

# Routes Layer

Responsibilities:

* Request handling
* Endpoint exposure
* Validation entry points

Examples:

* Session APIs
* Game APIs
* Host APIs
* Recovery APIs

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
* Sunshine Service
* Tailscale Service

---

# WebSocket Layer

Responsibilities:

* Live dashboard updates
* Session broadcasts
* Recovery event broadcasts
* Monitoring updates

---

# Persistence

Current storage uses JSON files.

Examples:

* Session history
* Recovery events
* Analytics

---

# Key Responsibilities

The backend is responsible for:

* Session lifecycle management
* Save orchestration
* Monitoring
* Validation
* Recovery coordination
* Dashboard data delivery
