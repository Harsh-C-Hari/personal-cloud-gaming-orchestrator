# PCGO Multi-Host Architecture & Future Workflow Decisions

**Project:** Personal Cloud Gaming Orchestrator (PCGO)  
**Status:** Future architecture / design decisions  
**Scope:** Multi-host phases only  
**Current implementation:** Single-host MVP; this document defines the target architecture for future multi-host work.

---

## 1. Purpose

This document records the architectural decisions made for the future multi-host evolution of PCGO.

The goal is to allow one PCGO user to access multiple independently managed gaming hosts while preserving:

- host-level ownership and administration,
- host-specific users and credentials,
- privacy between hosts,
- centralized user convenience,
- host-local game and save files,
- cloud-based coordination and metadata,
- reliable operation when hosts are offline.

This is a **future architecture reference**, not an instruction to implement these features immediately.

Features intentionally handled before multi-host work, such as the current Save Library implementation, are excluded except where their future multi-host behavior must be preserved.

---

# 2. Core Architectural Principle

> **The cloud/control plane stores identity, metadata, history, and commands. Hosts store games and actual save files.**

Large save files should not be continuously uploaded to cloud storage merely to support multi-host management.

For example, if a host has approximately 512 MB of save data, PCGO should normally keep those files on the host.

```text
                    PCGO CLOUD / CONTROL PLANE
                  ┌─────────────────────────────┐
                  │ Central identity            │
                  │ Host registry               │
                  │ Host relationships          │
                  │ Save metadata               │
                  │ Save aliases                │
                  │ Sessions                    │
                  │ Analytics                   │
                  │ Commands                    │
                  │ Host state                  │
                  └──────────────┬──────────────┘
                                 │
                     authenticated connection
                                 │
              ┌──────────────────┼──────────────────┐
              ↓                  ↓                  ↓
           HOST A             HOST B             HOST C
        actual files       actual files       actual files
```

The cloud knows **about** a save; the host owns the actual save.

---

# 3. Multi-Host Model

A central PCGO account may have multiple configured hosts:

```text
Central PCGO Account
│
├── Host A
│   └── Host-specific account/credentials
│
├── Host B
│   └── Host-specific account/credentials
│
└── Host C
    └── Host-specific account/credentials
```

Each host remains an independent security and data domain.

A user may have different credentials on different hosts.

Username uniqueness is scoped to the individual host, not necessarily globally across PCGO.

---

# 4. Three Identity Boundaries

## 4.1 Central PCGO Identity

The central PCGO account represents the user across the PCGO ecosystem.

It is used for:

- central login,
- configured-host discovery,
- cross-device convenience,
- remembering host relationships,
- accessing protected references to host-specific credentials.

The central account **does not replace host authentication**.

## 4.2 Host Identity

Every registered host receives a unique Host ID, for example:

```text
PCGO-7F42-X91K
```

The Host ID identifies a specific host.

It is an identifier/pairing reference, **not a permanent password or authentication secret**.

The Host Agent establishes its own authenticated relationship with the central cloud.

## 4.3 Host User Identity

Every host maintains its own users:

```text
Host A
├── Host Admin
├── harsh
└── friend

Host B
├── Host Admin
└── harsh
```

Host user identities control access to that particular host.

Host-specific data such as sessions, saves, analytics, logs, and permissions must remain scoped to the host and authenticated host user.

---

# 5. Host Registration Workflow

Future host setup:

```text
Host installs PCGO Host App
        ↓
Host registers through PCGO website
        ↓
PCGO creates/registers the host
        ↓
Host receives a unique Host ID
        ↓
Host Agent establishes authenticated connection
        ↓
Cloud knows the host and its state
```

The Host ID is a bootstrap/pairing reference. It must not become the host's permanent authentication secret.

---

# 6. User Configuring a Host

A user can configure a host using its Host ID:

```text
User App
    ↓
Enter Host ID
    ↓
Cloud validates Host ID
    ↓
Host exists?
    ↓
Host accepts pairing/access?
    ↓
Establish host relationship
```

The host then appears in the user's central PCGO account:

```text
My Hosts

OMEN 16
● Online

Desktop
○ Offline

Bedroom PC
● Online
```

The user can switch between configured hosts.

---

# 7. Host-Specific Authentication

The existing security principle remains:

> **The host administrator is the authority that creates users.**

Current model:

```text
Host Admin
    ↓
Create User
    ↓
Username + Password
    ↓
Give credentials to user
    ↓
User logs in
```

The multi-host architecture preserves this.

A normal user cannot independently create an active host account.

---

# 8. Future Registration Request Workflow

To improve usability without allowing unrestricted self-registration, users may submit a registration request.

The user provides:

- selected Host ID / host,
- requested username,
- password,
- password confirmation.

The request is sent to the host administrator.

The important rule is:

> **The user submits a registration request; the host administrator still decides whether the actual account is created.**

---

# 9. Username Availability Check

The registration form may provide:

```text
Username
[ harsh123                 ] [ Check ]
```

The check is scoped to the selected host.

Results:

```text
✓ Username available
```

or:

```text
✕ Username already exists
```

The frontend check is only a UX convenience. The backend must check again during request submission/account creation because another account could have appeared after the initial check.

The final operation must enforce uniqueness atomically.

---

# 10. Registration Request Security

The requested password must never be stored as plaintext.

The request may store a secure password hash or equivalent protected credential representation.

The administrator can see:

```text
Username: harsh123
Requested: 5 minutes ago
```

but not:

```text
Password: abc123
```

The administrator does not need to know the password to approve the account.

---

# 11. Admin Registration Request UI

The host administrator can eventually have a registration-request panel:

```text
Registration Requests

┌─────────────────────────────────┐
│ harsh123                        │
│ Requested 2 minutes ago         │
│                                 │
│ [ Accept ]       [ Reject ]     │
└─────────────────────────────────┘
```

On acceptance:

```text
Registration Request
        ↓
Validate request
        ↓
Validate username availability
        ↓
Create host user
        ↓
Mark request accepted
```

The administrator does not manually retype the requested credentials.

---

# 12. Registration Request States

Use explicit states:

```text
pending
accepted
rejected
cancelled
expired
```

Meaning:

- **pending:** waiting for administrator action.
- **accepted:** host account was created and access was granted.
- **rejected:** administrator explicitly rejected it.
- **cancelled:** user withdrew it before approval.
- **expired:** it remained pending beyond its allowed lifetime.

A rejected/cancelled request does not silently become active again. A new request can be created when appropriate.

---

# 13. Registration Notifications

The user should receive notification when a request is:

- accepted,
- rejected,
- cancelled,
- expired.

For acceptance:

```text
Registration approved ✓

You now have access to OMEN 16.
```

The user should not need to manually repeat the same registration credentials simply because the administrator approved the request.

---

# 14. Central PCGO Login as a Credential Keyring

The central PCGO account provides convenience across multiple hosts.

It does **not** replace host-specific authentication.

Conceptually:

```text
Central PCGO Account
│
├── OMEN 16
│   └── protected host credential reference
│
├── Desktop
│   └── protected host credential reference
│
└── Bedroom PC
    └── protected host credential reference
```

The user can log into the central PCGO account from another device and access configured host relationships without repeatedly entering every host credential.

The central account is a **keyring/credential relationship layer**, not a universal replacement for host accounts.

---

# 15. Credential Security

Actual host passwords must not be stored as ordinary plaintext database values.

The eventual system should use protected/encrypted credential storage:

```text
Central Account
      ↓
Protected Credential Vault
      ├── Host A credential
      ├── Host B credential
      └── Host C credential
```

The exact cryptographic implementation is a future implementation decision, but the requirement is fixed:

> **Central convenience must not require plaintext storage of host passwords.**

---

# 16. Host-Scoped User Data

Once multiple hosts exist, host-specific data must be scoped to the host:

```text
Central User
│
├── Host A
│   ├── Games
│   ├── Sessions
│   ├── Saves
│   ├── Analytics
│   └── Logs
│
└── Host B
    ├── Games
    ├── Sessions
    ├── Saves
    ├── Analytics
    └── Logs
```

A user's Host A data must never accidentally appear under Host B.

Database entities belonging to a host should carry an appropriate `host_id`; user-scoped data should retain the relevant `user_id`.

---

# 17. Save Architecture in Multi-Host

Actual save files remain on the host:

```text
Host A
saves/
└── user123/
    └── rdr2/
        ├── latest/
        ├── backups/
        │   ├── v_20261006_120000_123456
        │   └── v_20261006_150000_654321
        └── archives/
            └── session_xxx_20261006_...
```

The cloud stores save metadata rather than the save files.

Conceptually:

```text
save_entries
-------------------------
id
host_id
user_id
game_id
save_type
save_name
display_name
created_at
last_seen_at
size_bytes
status
```

`save_type` distinguishes:

```text
backup
archive
```

---

# 18. `latest` Is Not a Database Save Entry

The current/latest save is host-side state and is not treated as an ordinary user-renamable save metadata row.

The metadata model therefore does not require a `latest` row.

This preserves:

```text
latest = current working save state
```

versus:

```text
backup/archive = identifiable save object
```

---

# 19. Save Names vs Display Aliases

The physical filesystem name remains separate from the user-facing alias.

Example:

```text
Actual save name:
v_20261006_153000_123456

Display alias:
Before Final Boss
```

Changing the alias must not rename the physical save.

The alias is metadata only.

---

# 20. Save Metadata Synchronization

The cloud database is not a perfect live mirror of the host filesystem.

The host filesystem remains authoritative for actual physical save existence.

Use two mechanisms.

### Event-driven updates

The Host Agent/SaveManager reports meaningful changes such as:

```text
save_created
save_deleted
save_changed
session_save_created
```

The cloud updates metadata accordingly.

### Periodic reconciliation

The host periodically compares its actual save directories with cloud metadata.

Appropriate reconciliation points include:

```text
host startup
session completion
periodic reconciliation
manual refresh/reconciliation
```

The host should not scan the entire save tree every few seconds merely to keep the database current.

---

# 21. Host Can Change Saves Independently

The architecture must handle changes outside PCGO:

- manual deletion,
- game-created saves,
- external software changes,
- filesystem changes,
- other PCGO processes.

Therefore:

> **Cloud save metadata is coordination/indexing metadata, not the ultimate authority over physical save existence.**

The Host Agent must reconcile differences.

---

# 22. Save Deletion Is a Command

Deleting a save affects a physical host file.

Therefore:

```text
User requests deletion
        ↓
Cloud creates deletion command/request
        ↓
Host executes deletion
        ↓
Host confirms result
        ↓
Cloud updates metadata
```

The cloud must not claim physical deletion before host confirmation.

---

# 23. Offline Host Save Deletion

If the host is offline:

```text
User
 ↓
Delete save
 ↓
Host offline
```

the deletion becomes a pending command/request.

Conceptually:

```text
host_commands

id
host_id
user_id
command_type
payload
status
created_at
executed_at
expires_at
error
```

Example:

```json
{
  "command_type": "delete_save",
  "payload": {
    "game_id": "rdr2",
    "save_type": "backup",
    "save_name": "v_20261006_153000_123456"
  }
}
```

The physical file remains untouched until the host executes the command.

---

# 24. Save Deletion Cancellation Window

Normal deletion should have a cancellation window.

```text
User clicks Delete
        ↓
Delete request created
        ↓
Cancellation period
        ↓
Request becomes executable
        ↓
Host executes
```

During the cancellation period:

```text
Cancel deletion
```

is available.

The exact duration is a future configuration decision.

---

# 25. Immediate Deletion

When the host is online, the user may optionally request immediate deletion.

```text
Host online
    ↓
Delete Immediately
    ↓
Immediate execution
```

Normal Delete should use the safer cancellation-window behavior.

An explicit **Delete Immediately** action may bypass that window where appropriate.

---

# 26. Offline Deletion Lifecycle

Example:

```text
Host offline
      ↓
Delete requested
      ↓
pending
      ↓
cancellation window
      ↓
scheduled
      ↓
Host comes online
      ↓
sent
      ↓
executing
      ↓
completed
```

Other outcomes:

```text
executing → failed

pending/scheduled → cancelled

pending/scheduled → expired
```

---

# 27. General Host Command System

The multi-host architecture should eventually use a generalized command system instead of isolated remote-action mechanisms.

Conceptually:

```text
host_commands
-------------------------
id
host_id
user_id
command_type
payload
status
created_at
sent_at
executed_at
expires_at
error
```

Potential commands:

```text
delete_save
restore_save
refresh_save_metadata
start_game
stop_game
restart_game
restart_host_agent
sync_host
```

The command set can grow later.

The key rule is:

> **The cloud expresses intent; the host performs operations on the physical machine.**

---

# 28. Host Connection Model

The Host Agent should establish an outbound authenticated connection to the PCGO control plane:

```text
Host Agent
     │
     │ authenticated outbound connection
     ↓
PCGO Control Plane
```

This avoids requiring the cloud to directly expose host-local services to the public internet.

The exact transport can be selected during the relevant implementation phase.

---

# 29. Host State

The cloud should know host availability/state, such as:

```text
online
offline
connecting
degraded
```

This state is useful for:

- displaying availability,
- deciding whether commands can execute immediately,
- handling pending commands,
- informing users,
- reconnect/recovery workflows.

---

# 30. Data Ownership Rules

### Cloud owns

- central PCGO accounts,
- host registry,
- host relationships,
- host metadata,
- host-scoped metadata/indexes,
- command state,
- centralized notifications,
- appropriate session/analytics records required by the future architecture.

### Host owns

- game installations,
- actual save files,
- host-local runtime state,
- physical execution of commands.

### Host authentication owns

- host users,
- host-specific credentials,
- host permissions,
- host administrator authority.

---

# 31. Target User Experience

Eventually:

```text
Login to central PCGO account
        ↓
See configured hosts
        ↓
Select a host
        ↓
Use that host's account/session
        ↓
See that host's games
        ↓
Start a game
        ↓
Manage that host's saves
        ↓
View that host's sessions/analytics
```

Switching hosts changes the active host context rather than mixing hosts into one dataset.

---

# 32. Explicit Non-Goals

The future architecture must **not** become:

### Cloud save storage by default

Do not upload hundreds of megabytes of host saves merely for multi-host management.

### A global replacement login

The central PCGO account must not eliminate the host's own authentication/authorization boundary.

### Unrestricted self-registration

A registration request does not automatically create an active host account.

### A database filesystem mirror

Cloud metadata is not the absolute source of truth for physical save existence.

### Immediate cloud-side deletion

The cloud does not mark a physical save deleted before host execution and confirmation.

---

# 33. Relationship to Current PCGO

Current architecture:

```text
React Dashboard
      ↓
FastAPI Backend
      ↓
Controllers / Services
      ↓
Python Host Agent
      ↓
Sunshine / Playnite / Windows host
```

The multi-host architecture should evolve this system rather than unnecessarily replacing it.

The future control plane becomes the coordination layer between multiple Host Agents.

Existing authentication, repositories, SaveManager behavior, session management, recovery, and WebSocket/event infrastructure should be extended where appropriate.

---

# 34. Implementation Boundary

This document is a **future architecture reference**.

It does not require immediate implementation of:

- multi-host support,
- central credential vault,
- registration requests,
- host command queue,
- cloud save metadata synchronization,
- multi-host database migration,
- User App host switching.

Those belong to future multi-host phases.

The current single-host system should be completed and stabilized first.

---

# 35. Final Architectural Summary

```text
                         CENTRAL PCGO
                              │
                  ┌───────────┴───────────┐
                  │                       │
          Central PCGO Identity      Host Registry
                  │                       │
                  └───────────┬───────────┘
                              │
                 configured host relationships
                              │
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
           HOST A          HOST B          HOST C
              │               │               │
          Host Admin      Host Admin      Host Admin
              │               │               │
          Host Users      Host Users      Host Users
              │               │               │
        Games / Saves    Games / Saves    Games / Saves
              │               │               │
        Actual files     Actual files     Actual files
```

The central account provides convenience across hosts.

Each host remains independently authenticated and administered.

The cloud coordinates.

The host executes.

The host owns the actual files.

Save metadata can live in the cloud without moving the save files themselves.

Remote destructive actions become commands with explicit state, cancellation, expiry, and host confirmation.

This separation is the foundation for PCGO's future multi-host architecture.
