# Save Filter System Migration & Game Compatibility Improvement

## Issue Information

Category:
Architecture Generalization & Data Configuration

Affected Component:
Save Detection, Save Integrity, and Live Save Synchronization

Severity:
Medium

Status:
Resolved

---

## Overview

The original save detection system relied on simple prefix-based filtering using `whitelist_prefixes`.

This worked for games with predictable save names such as:

```
GOWRSAVE0
GOWRSAVE1
GOWRSAVE2
```

with configuration:

```json
"whitelist_prefixes": [
    "GOWRSAVE"
]
```

This successfully ignored unrelated files such as:

```
userpreferences
settings.ini
cache files
```

However, as support for additional games was added, the prefix-only architecture became insufficient.

---

## Symptoms

New games introduced more complex save naming schemes that could not be reliably described using only filename prefixes.

Example:

```
data001Slot.bin
data002Slot.bin
data003Slot.bin
```

A prefix rule such as:

```
data
```

would also match unrelated files:

```
data000.bin       ❌ Not a game save
data001Slot.bin   ✓ Valid save
```

This created a limitation where new game support required either:

- Weak detection rules with possible false positives
- Game-specific logic inside the codebase

Both approaches conflicted with the goal of creating a game-agnostic save management system.

---

## Initial Hypothesis

The initial configuration model assumed that most games would follow a simple save naming convention where a unique filename prefix was enough to identify valid save files.

This assumption was valid for early supported games but failed as more diverse save structures were introduced.

---

## Investigation

Analysis of different game save structures showed that save files could require multiple identification strategies.

Examples:

- Some games use a unique prefix.
- Some require checking for specific text inside filenames.
- Some rely on specific file extensions.
- Some require multiple conditions to be true simultaneously.

The existing `whitelist_prefixes` model could not express these combinations.

---

## Root Cause

The issue was not a bug in the implementation.

The limitation was architectural.

The original save detection model was too narrowly designed around the naming conventions of the first supported games.

The system needed a configurable rule engine rather than a single prefix list.

---

## Solution

The save filtering system was redesigned using a dedicated `SaveFilters` model:

```python
@dataclass
class SaveFilters:
    mode: str
    prefix: list[str]
    contains: list[str]
    suffix: list[str]
```

Each game can now define its own filtering strategy through `games.json`.

Example:

```json
"save_filters": {
    "mode": "or",
    "prefix": ["GOWRSAVE"],
    "contains": [],
    "suffix": []
}
```

### OR Mode

A file is included when any configured rule matches.

Example:

```
GOWRSAVE51      ✓ Prefix match
userpreferences ✗ No match
```

### AND Mode

A file is included only when all configured rule categories match.

Example:

```json
"save_filters": {
    "mode": "and",
    "prefix": ["data"],
    "contains": ["Slot"],
    "suffix": [".bin"]
}
```

Results:

```
data001Slot.bin  ✓ Prefix + Contains + Suffix
data001.bin      ✗ Missing "Slot"
configSlot.bin   ✗ Missing "data" prefix
```

Empty filter categories are ignored in AND mode, allowing only the necessary rules to be configured.

---

## Verification

The migration was tested across different save structures.

### Game A

Configuration:

```
OR + Prefix(RequiredPrefix)
```

Result:

- Gameplay saves detected.
- User preference files ignored.

---

### Game B

Configuration:

```
AND + Prefix(RequiredPrefix) + Contains(RequiredContains) + Suffix(.RequiredSuffix)
```

Result:

- Valid save slots detected.
- Unrelated files ignored.

---

### Games Without Filters

Configuration:

```
Empty filters
```

Result:

- All files included for compatibility with unknown save structures.

---

The migration was also verified across:

- Save integrity hashing.
- Live Save Sync runtime detection.
- Session cleanup save validation.
- Backup and archive workflows.

---

## Lessons Learned

- Save file structures vary significantly between games.
- Configuration systems should be designed around extensibility.
- Avoid assuming early supported cases represent all future cases.
- Game-specific behavior should be represented as data, not code.

---

## Impact

The migration transformed save detection from a prefix-based whitelist into a configurable game-specific filtering engine.

The final architecture supports:

- Prefix-based matching.
- Contains-based matching.
- Suffix/extension matching.
- AND and OR filtering strategies.
- Future game additions without modifying the save engine.

This removed the remaining hardcoded assumptions about save file naming and prepared the system for future game management through dashboard APIs and host-side configuration.