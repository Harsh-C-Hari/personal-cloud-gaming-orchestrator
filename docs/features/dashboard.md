# Dashboard System

## Overview

The dashboard provides centralized visibility into platform operations.

Built with React, it serves as the primary monitoring and management interface.

---

# Major Sections

## Host Section

Displays:

* Host readiness
* Startup status
* Maintenance mode
* Recovery mode

---

## Sunshine Section

Displays:

* Running state
* Reachability
* Connected clients
* Application count

---

## Session Section

Displays:

* Active sessions
* Session history
* Session analytics

---

## Recovery Section

Displays:

* Recovery statistics
* Recovery events

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
