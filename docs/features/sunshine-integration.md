# Sunshine Integration

## Overview

Sunshine provides the game streaming infrastructure used by the platform.

The platform integrates with Sunshine for service control, monitoring, validation, and recovery.

---

# Controller Features

Implemented:

* Start Sunshine
* Stop Sunshine
* Restart Sunshine
* Status Detection

---

# Status Information

Collected information:

* Running state
* Reachability
* Connected clients
* Available applications

---

# Dashboard Integration

Displayed information:

* Service status
* Reachability
* Client count
* Application count

---

# Startup Validation

Sunshine is included in host startup validation.

Checks:

* Service availability
* Running state
* Host readiness impact

---

# Sunshine Watchdog

Implemented recovery capabilities.

Responsibilities:

* Detect outages
* Log events
* Attempt restart
* Verify recovery

---

# Recovery Events

Examples:

* detected_offline
* restart_attempt
* restart_success
* restart_failed

---

# Design Goals

* Service availability
* Automatic recovery
* Operational visibility
* Reliability
