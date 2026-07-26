# Settings Panel Architecture

## Overview

The settings system provides centralized administrative configuration management for the host platform.

The original dashboard offered only basic configuration editing capabilities and lacked:

* Validation feedback.
* Configuration synchronization.
* Service integration.
* Runtime visibility.
* Administrative usability features.

The current implementation introduces a complete administrative configuration system.

---

## Design Goals

The settings architecture was designed to provide:

* Runtime host configuration management.
* Backend validation support.
* Dynamic configuration synchronization.
* Service integration.
* Administrative visibility.
* Safe configuration updates.

---

## Architecture

```
React Settings Panel
            |
            v
Settings API
            |
            v
Configuration Service
            |
            v
Host Configuration
            |
    ------------------
    |                |
Sunshine      Tailscale
```

---

## Metadata-Driven Configuration Model

The backend exposes settings using metadata.

Example:

```json
{
    "path": {
        "value": "E:/Stream/Sunshine/Sunshine.exe",
        "editable": true,
        "requires_restart": false
    }
}
```

Each setting provides:

* Current value.
* Editability.
* Restart requirements.

This allows the frontend to dynamically render settings without hardcoded field definitions.

---

## Dynamic Rendering

The frontend automatically renders:

* Text inputs.
* Numeric fields.
* Boolean switches.
* Read-only values.

Fields marked:

```json
"editable": false
```

are displayed as read-only.

---

## Dirty State Detection

The panel maintains:

* Original values.
* Current values.

The Save button is enabled only when:

* Changes exist.
* Validation succeeds.

---

## Configuration Synchronization

After successful saves:

1. Backend reloads configuration.
2. Frontend refreshes settings.
3. Original values update.
4. Dirty state resets.

This ensures the interface reflects the active configuration.

---

## Validation Architecture

Validation occurs at two layers.

### Frontend Validation

Provides immediate feedback.

Examples:

* Empty fields.
* Missing paths.
* Invalid values.

### Backend Validation

Provides authoritative validation.

Examples:

* Missing files.
* Invalid executables.
* Dependency failures.

Validation errors are returned directly to the interface.

---

## Error Handling

The system handles:

* Validation failures.
* HTTP 400 responses.
* Backend exceptions.
* Configuration save failures.

Success messages appear only after successful updates.

---

## Service Integration

The settings system manages:

### Sunshine

* Executable path.
* Configuration state.

### Tailscale

* IPN executable path.
* Validation.
* Configured state.

---

## Administrative Features

The settings panel provides:

* Runtime configuration editing.
* Validation feedback.
* Restart indicators.
* Dynamic synchronization.
* Service configuration visibility.
* Safe configuration updates.

---

## Impact

The settings system became the administrative configuration foundation of the host platform.

The `auth` section (JWT secret, algorithm, and token expiry) is now one of the configuration sections managed through this same runtime-settings architecture — see [Authentication & Role-Based Access](../features/authentication.md).

User account management (as opposed to authentication *configuration*) was implemented as its own dedicated system — a separate User Management dashboard page and `/auth/users` API, rather than a settings-panel section — since accounts are records to manage, not configuration values to edit.

Future systems such as:

* Security configuration
* Session policies

can reuse the same architecture.
