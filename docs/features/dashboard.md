# Dashboard System

## Overview

The dashboard provides centralized visibility into platform operations.

Built with React, it serves as the primary monitoring and management interface.

---

# Authentication & Role-Aware Routing

The dashboard opens on a login screen (or a one-time admin bootstrap screen on a fresh install with no accounts yet). After login, the frontend reads the account's role from its JWT and renders one of two independent dashboards:

* **Admin Dashboard** — full navigation: Home, Host Monitor, Recovery, Sunshine, Game Manager, User Management, Analytics, Session History, Logs, Settings.
* **User Dashboard** — reduced navigation: Home, Analytics, Session History, Logs, Change Password. All data is automatically scoped server-side to the logged-in user's own sessions.

Both dashboards share the same layout shell, WebSocket connection, and most page components (Home, Analytics, Session History, Logs); only the navigation items, the data source (admin vs. user API endpoints), and the presence of admin-only pages (Recovery, Sunshine, Game Manager, User Management, Settings) differ. See [Authentication & Role-Based Access](authentication.md) for the authentication model itself.

---

# Major Sections

## Host Section

Displays:

* Host readiness
* Startup status
* Maintenance mode
* Recovery mode

Admins see the full status/metrics view (`/host/status`, `/host/metrics`); users see a reduced readiness view (`/host/user-status`).

---

## Sunshine Section

*Admin only.* Displays:

* Running state
* Reachability
* Connected clients (with pairing/unpairing controls)
* Application count
* Live stream status
* Stream history

See [Sunshine Integration](sunshine-integration.md).

---

## Session Section

Displays:

* Active sessions
* Session history
* Session analytics

Scoped to all sessions for admins, and to the logged-in user's own sessions for standard users.

---

## Recovery Section

*Admin only.* Displays:

* Recovery statistics
* Recovery events

---

## User Management Section

*Admin only.* Create, list, and delete accounts; bulk-remove all accounts except the oldest admin. See [Authentication & Role-Based Access](authentication.md).

---

# Monitoring Features

Provides visibility into:

* CPU usage
* Memory usage
* Disk usage
* Host health

---

# Recovery Visualization

Displays:

* Recovery history
* Recovery event details
* Recovery attempt information

---

# Real-Time Updates

Uses:

* REST APIs
* WebSockets

for live platform updates.

---

# Dashboard Synchronization Resolution

## Problem

Several dashboard sections occasionally displayed stale information despite backend services returning correct and updated data.

Affected areas included:

* Session analytics
* Session history
* Host metrics
* Recovery events
* Recovery statistics
* Host status

Symptoms included delayed updates and mismatches between backend state and dashboard state.

---

## Root Cause Investigation

Initial investigation focused on:

* WebSocket synchronization
* Backend update paths
* Frontend state management

Further debugging revealed that browser-side caching was serving outdated API responses for frequently requested monitoring endpoints.

Although backend data was updating correctly, cached responses prevented the dashboard from displaying the latest state.

---

## Solution

### Backend Changes

Frequently updated API endpoints were modified to disable response caching.

Example:

```python
return JSONResponse(
    content=get_recovery_stats(),
    headers={
        "Cache-Control":
            "no-store, no-cache, must-revalidate"
    },
)
```

---

### Frontend Changes

The API fetch wrapper was updated to disable browser caching.

Example:

```javascript
const res = await fetch(
  BASE_URL + path,
  {
    ...init,
    cache: "no-store",
  }
);
```

---

## Result

Benefits:

* Real-time dashboard accuracy
* Correct session analytics updates
* Correct recovery statistics updates
* Correct host monitoring updates
* Improved synchronization reliability

The issue was resolved without requiring architectural changes to the monitoring or WebSocket systems.

---

# Design Goals

* Operational visibility
* Real-time awareness
* Administrative control
* Monitoring efficiency
