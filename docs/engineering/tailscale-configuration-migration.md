# Tailscale Configuration Migration

## Issue Information

Category:
Configuration Migration

Affected Component:
Tailscale Controller

Severity:
Low

Status:
Resolved

---

## Overview

The original Tailscale implementation relied on hardcoded executable paths.

This prevented support for non-standard installations and made configuration validation impossible.

The migration aligned Tailscale with the same configuration architecture used by Sunshine.

---

## Symptoms

The controller directly referenced:

C:\Program Files\Tailscale\tailscale-ipn.exe

This introduced several limitations:

* Non-standard installations failed.
* Portable installations were unsupported.
* Missing installations could not be validated.
* Dashboard configuration status could not be determined.

---

## Initial Hypothesis

The original implementation assumed Tailscale would always be installed in the default Windows location.

This assumption proved unreliable.

---

## Investigation

Other service controllers within the project already used dynamic configuration.

Sunshine provided:

* Configurable executable paths.
* Validation.
* Configured state reporting.

Tailscale lacked these capabilities.

---

## Root Cause

The Tailscale controller had been implemented before the configuration system matured.

As a result, executable paths remained hardcoded.

---

## Solution

A dedicated configuration section was introduced:

```json
"tailscale": {
    "ipn_path": {
        "value": "",
        "editable": true,
        "requires_restart": false
    }
}
```

The controller now provides:

* Dynamic executable resolution.
* Configured-state detection.
* Configuration validation.

---

## Verification

The following scenarios were tested:

* Default installation paths.
* Custom installation paths.
* Missing executable detection.
* Invalid path detection.
* Dashboard configured-state reporting.

---

## Lessons Learned

* External services should not rely on fixed installation paths.
* Service controllers benefit from consistent configuration architectures.
* Validation improves administrative visibility.

---

## Impact

Tailscale now follows the same service architecture as Sunshine.

Capabilities include:

* Dynamic configuration.
* Validation.
* Dashboard visibility.
* Configured-state reporting.
* Portable installation support.
