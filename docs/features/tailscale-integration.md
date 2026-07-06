# Tailscale Integration

## Overview

Tailscale provides secure networking between remote clients and the gaming host.

The platform includes diagnostics, monitoring, validation, and recovery functionality.

---

# Core Responsibilities

* Connectivity management
* Network validation
* Health monitoring
* Diagnostic analysis
* Recovery workflows

---

# Startup Validation

Tailscale participates in host readiness validation.

Checks include:

* Service availability
* Connectivity status
* Health evaluation

---

# Diagnostics System

Implemented diagnostics for identifying unhealthy states and determining recovery actions.

Examples of evaluated conditions:

* Service state
* Connectivity state
* Authentication state
* Overall health status

---

# State-Based Recovery Architecture

Tailscale recovery is not handled through a single restart operation.

The diagnostic system identifies the current Tailscale health state and selects the appropriate recovery workflow.

Examples of recovery paths:

* Service stopped → Execute Tailscale connection recovery
* Unknown service availability → Start the required Tailscale service processes
* NoState condition → Restart the Tailscale IPN backend

Some authentication-related states require manual user intervention and are intentionally not automatically recovered.

This state-based approach prevents incorrect recovery actions and improves overall reliability.

---

# Recovery System

Implemented recovery workflows for unhealthy states.

Workflow:

```text
Detect Issue
      ↓
Run Diagnostics
      ↓
Execute Recovery
      ↓
Validate Recovery
      ↓
Log Event
```

---

# Recovery Logging

Recovery actions are recorded through the recovery event system.

Examples:

* recovery_started
* recovery_success
* recovery_failed

---

# Dashboard Integration

Displayed information:

* Health status
* Recovery statistics
* Recovery events

---

# Design Goals

* Connectivity reliability
* Automated recovery
* Visibility
* Operational stability
