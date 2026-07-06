# Tailscale State-Aware Recovery Investigation

## Issue Information

Category:
Infrastructure Recovery Design

Affected Component:
Tailscale Watchdog

Severity:
High

Status:
Resolved

---

## Overview

The goal of the Tailscale watchdog was to automatically recover connectivity failures without requiring manual intervention.

Initial assumptions treated Tailscale like a normal Windows service that could be restarted using a single recovery action.

During testing, this assumption proved incorrect.

---

## Initial Hypothesis

The initial recovery design assumed Tailscale could be treated as a traditional Windows service with a simple restart strategy.

---

## Symptoms

The Tailscale service could appear to be running while the overall Tailscale connection was unhealthy.

Simple restart-based recovery was unreliable because different failure conditions required different actions.

---

## Investigation

Approximately one week was spent investigating Tailscale's internal behavior and failure states.

Testing revealed that Tailscale consists of multiple components:

- Tailscale service
- Tailscale IPN backend process

A healthy Tailscale connection requires both components to operate correctly.

The investigation identified multiple states requiring different handling.

Examples:

### Service stopped

Recovery action:

```
tailscale up
```

---

### Service unavailable / unknown state

Recovery action:

```
Start-Process Tailscale
```

---

### NoState condition

Recovery action:

```
Start tailscale-ipn.exe
```

---

Authentication-related states such as login failures are currently considered non-recoverable automatically because they require user intervention.

---

## Root Cause

The original recovery concept assumed a single restart strategy.

The real behavior was state-dependent:

Different Tailscale failures require different recovery workflows.

---

## Solution

The final watchdog became a diagnostic-driven recovery system:

```
Detect Failure
        |
        v
Diagnose State
        |
        v
Classify Failure
        |
        v
Select Recovery Strategy
        |
        v
Execute Recovery
        |
        v
Verify Health
        |
        v
Log Recovery Event
```

---

## Verification

The final system was tested against known recoverable states.

Verified capabilities:

- Detect unhealthy Tailscale conditions
- Identify failure categories
- Execute targeted recovery actions
- Verify post-recovery health
- Record recovery history and statistics

---

## Lessons Learned

- External services may have internal states not visible through standard service checks.
- Recovery systems should be diagnostic-driven rather than relying on simple restarts.
- Understanding the lifecycle of third-party services is critical for reliable automation.

---

## Impact

This transformed the Tailscale watchdog from a basic availability checker into a state-aware recovery system and became one of the most complex reliability components of the project.