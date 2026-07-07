# Save Management System

## Overview

The Save Management System protects user progress and enables seamless session transitions.

It handles save injection, backup creation, restoration, validation, and archival workflows.

---

# Directory Structure

```text
latest/
archives/
backups/
```

---

# Save Injection

Before launching a game:

1. Selected save is validated.
2. Save is injected into the game save directory.
3. Session begins.

---

# Save Backup

After a session ends:

1. Save files are collected.
2. Changes are detected.
3. Backup is created if required.

---

# Save Archives

Archives provide historical save snapshots.

Purpose:

* Rollback support
* Recovery support
* Save preservation

---

# Hash-Based Save Detection

## Problem

Repeated backups generated excessive duplicate copies.

## Solution

Hash-based comparison was introduced.

Workflow:

```text
Generate Hashes
       ↓
Compare Existing Hashes
       ↓
Detect Changes
       ↓
Process Modified Files Only
```

## Result

Benefits:

* Reduced storage usage
* Reduced archive spam
* Faster save processing

---

# Live Save Synchronization

## Purpose

To reduce the risk of save loss during unexpected failures, the platform includes a live save synchronization mechanism during active gaming sessions.

---

## Workflow

During an active session:

1. Save directories are monitored periodically.
2. Save hashes are generated.
3. Changes are detected.
4. Modified saves are synchronized to the user's latest save directory.

Current synchronization interval:

```text
15 seconds
```

---

## Benefits

Provides protection against:

* Backend crashes
* Host process failures
* Unexpected session termination
* Power interruptions
* Service failures

---

## Result

Even if a session cannot complete its normal backup workflow, recent player progress is preserved through periodic synchronization.

---

## Live Synchronization Refinements

During implementation of live save synchronization, several edge cases were discovered and resolved.

---

### Hash Precision Mismatch

#### Problem

The original save backup system and the live synchronization system used different hash precision formats.

The backup workflow rounded hash values before comparison while the live synchronization workflow used full precision values.

As a result, save comparisons frequently reported false changes even when no meaningful modifications had occurred.

This caused unnecessary synchronization operations every synchronization cycle.

---

#### Solution

Hash comparison logic was standardized so that both workflows used identical comparison behavior.

---

#### Result

False-positive save change detection was eliminated and synchronization occurs only when actual save changes are detected.

---

### Non-Gameplay File Changes

#### Problem

Some games update auxiliary files even when gameplay progress has not changed.

Example:

```text
God of War
├── GOWRSAVE0
├── GOWRSAVE1
├── GOWRSAVE2
└── UserPreferences
```

Files such as user preference or configuration files could change independently of gameplay progress.

This caused unnecessary synchronization events despite no save progress changes.

---

#### Solution

The change detection system was refined to monitor gameplay save files only.

Configuration and preference files are excluded from change detection decisions.

---

#### Result

Only meaningful gameplay progress changes trigger synchronization.

False synchronization events were significantly reduced.

---

### Save Package Consistency

#### Problem

If only gameplay save files were synchronized, associated configuration files might become inconsistent with the saved game state.

---

#### Solution

The system now uses gameplay save files for change detection but synchronizes the complete save package when a valid change is detected.

This includes:

* Save files
* User preference files
* Supporting save metadata

---

#### Result

Synchronization remains efficient while preserving save consistency and compatibility.

---

## Configurable Save Filtering

Save detection is performed through configurable per-game filtering rules.

Each game defines a `save_filters` configuration:

- Prefix matching
- Contains matching
- File suffix matching
- OR matching mode
- AND matching mode

This allows the save system to support games with different save naming conventions without requiring code changes.

The filtering system is used by:

- Save integrity hashing
- Live save synchronization
- Session cleanup verification
- Backup and archive workflows

---

# Validation

Implemented checks:

* Save existence
* Restore validation
* Path validation

---

# Design Goals

* Data integrity
* Storage efficiency
* Reliability
* Recoverability
