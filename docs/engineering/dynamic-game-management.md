# Dynamic Game Management & Runtime Configuration Architecture

## Issue Information

Category:
Configuration Management & Runtime Administration

Affected Component:
Game Registry, Runtime Configuration, and Host Dashboard Management

Severity:
Medium

Status:
Resolved

---

## Overview

Originally, game configuration was managed by manually editing the `games.json` file.

Each game required manually configuring values such as:

- Game ID
- Game name
- Executable name
- Executable path
- Process name
- Save directory
- Save filtering rules

While this approach was sufficient during early development, it was not suitable for a production-style host management platform.

The goal was to transform game configuration from a development-only JSON file into a fully managed runtime subsystem accessible through the Host Dashboard.

---

## Symptoms

The original configuration approach had several limitations:

- Required direct file system access.
- Required knowledge of JSON configuration structure.
- Increased risk of manual configuration mistakes.
- Provided no validation before saving.
- Required backend restart or manual reload after changes.
- Was not suitable for future host applications or non-technical users.

---

## Initial Architecture

Game configurations were loaded during backend startup:

```
Backend Startup
       |
       v
Load games.json
       |
       v
Store configuration in memory
```

Configuration changes required manual file modifications and could become out of sync with the running application.

---

## Investigation

A runtime-managed system required several capabilities:

- Create new game configurations.
- Modify existing configurations.
- Delete unused configurations.
- Validate configuration data before saving.
- Prevent invalid operations during active sessions.
- Apply configuration changes without restarting the backend.
- Keep the dashboard synchronized with runtime state.

---

## Root Cause

The limitation was architectural rather than a software bug.

The original design treated `games.json` as a static development configuration file.

As the project evolved toward a host management platform, game configuration needed to become a managed runtime resource with validation, safety checks, and administrative controls.

---

## Solution

A complete Game Management API was implemented.

### Game Registration

```
POST /games
```

Capabilities:

- Add new games.
- Validate required fields.
- Validate save filtering configuration.
- Prevent duplicate game IDs.
- Reload runtime configuration immediately.

---

### Game Modification

```
PUT /games/{game_id}
```

Capabilities:

- Update existing configurations.
- Prevent editing games with active sessions.
- Generate configuration change logs.
- Apply updates without backend restart.

---

### Game Deletion

```
DELETE /games/{game_id}
```

Capabilities:

- Require user confirmation.
- Prevent deletion of active games.
- Record deletion events.

---

### Validation Endpoints

```
GET /games/{game_id}/validate
```

Checks:

- Executable path exists.
- Save path exists.
- Process name is configured.

Additional validation:

```
POST /games/validate
```

Used by the dashboard before creating a new game configuration.

---

## Runtime Configuration Reload

The configuration lifecycle was redesigned.

Normal updates:

```
Host Dashboard
       |
       v
Game Management API
       |
       v
Request Validation
       |
       v
Atomic games.json Update
       |
       v
Runtime Configuration Reload
```

Configuration changes become available immediately without restarting the backend.

---

## Defensive Session Reload

An additional protection layer was added before every session:

```
Start Session
      |
      v
Reload games.json
      |
      v
Load latest configuration
      |
      v
Save Injection
      |
      v
Game Launch
```

This protects against:

- Manual configuration modifications.
- Missed runtime reload events.
- Configuration synchronization failures.

---

## Configuration Reliability Improvements

### Atomic JSON Writes

The original approach overwrote `games.json` directly.

The new workflow:

```
Write games.json.tmp
          |
          v
Flush data to disk
          |
          v
Atomic replace games.json
```

This prevents partial writes and protects configuration integrity.

---

### UTF-8 JSON Storage

Configuration writing uses:

```python
ensure_ascii=False
```

Benefits:

- Human-readable Unicode text.
- Correct storage of game names containing special characters.
- Improved configuration readability.

---

## Configuration Validation

Game IDs are validated using a restricted naming format.

Examples:

Allowed:

```
gow_ragnarok
resident_evil_9
```

Rejected:

```
God Of War
gow-ragnarok
gow@123
```

Required configuration fields:

- Game name
- Executable name
- Executable path
- Process name
- Save directory

Save filters validate:

- Filter mode (`or` or `and`)
- Prefix rules
- Contains rules
- Suffix rules

---

## Configuration Audit Logging

Administrative configuration changes are tracked.

Examples:

Game addition:

```
Game configuration added:
re9 (Resident Evil Requiem)
```

Game modification:

```
Game configuration updated:
gow_ragnarok

save_filters.mode:
or -> and

save_path:
C:/OldLocation -> D:/NewLocation
```

Game deletion:

```
Game configuration deleted:
gow_ragnarok (God of War Ragnarok)
```

Nested configuration changes are recorded individually, allowing detailed configuration history.

---

## Dashboard Integration

A dedicated Game Manager was added to the Host Dashboard.

Capabilities:

- View configured games.
- Add new games.
- Edit existing configurations.
- Delete configurations.
- Validate configurations before saving.
- Display operation success and failure messages.

Additional usability improvements:

- Save button remains disabled when no changes are detected.
- Controls are disabled during active operations.
- Game list updates dynamically after configuration changes.
- Session launch selection updates automatically.

---

## Native Windows Integration

Manual path entry remains available.

Native Windows dialogs were integrated through backend APIs.

Executable selection:

```
Dashboard
      |
      v
Windows File Picker
      |
      v
Select .exe
      |
      v
Automatically populate:
- Executable path
- Executable name
- Process name
```

Save directory selection:

```
Dashboard
      |
      v
Windows Folder Picker
      |
      v
Update save path
```

This architecture allows future reuse inside a dedicated Host Application.

---

## Verification

The final system was tested for:

- Creating new games without backend restart.
- Editing existing configurations at runtime.
- Deletion protection for active sessions.
- Save filter validation.
- Runtime configuration synchronization.
- Dashboard updates without manual refresh.
- Session launch using updated configurations.
- Safe configuration file updates.

---

## Lessons Learned

- Configuration systems should be designed as managed runtime resources.
- Runtime configuration requires explicit synchronization mechanisms.
- Administrative changes should be validated before persistence.
- Critical configuration files require safe write strategies.
- Configuration changes must respect active runtime sessions.
- Native operating system integration significantly improves user experience.

---

## Impact

The original static `games.json` approach was transformed into a complete runtime game management subsystem.

The final architecture provides:

- Dynamic game registration.
- Runtime configuration updates.
- Advanced save filter configuration.
- Validation and safety protections.
- Configuration audit logging.
- Atomic file persistence.
- Native Windows integration.
- Dashboard-based administration.

This removed the final manual configuration requirement from the host management workflow and prepared the system for future dedicated Host Applications and expanded user management features.