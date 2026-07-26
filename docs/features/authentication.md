# Authentication & Role-Based Access

## Overview

The platform requires an authenticated account for all dashboard and API access. Authentication uses JSON Web Tokens (JWT) issued on login, and every non-bootstrap API route requires a valid bearer token.

There are two roles: **admin** and **user**. Role determines which dashboard the frontend renders and which API endpoints are permitted.

---

# First-Run Bootstrap

A fresh installation has no accounts. `GET /auth/bootstrap-required` reports whether an admin account exists yet (`admin_count() == 0`). While true, the dashboard shows a one-time account creation screen instead of the login form, backed by `POST /auth/bootstrap-admin`. Once the first admin account is created, this endpoint is disabled (`403 Bootstrap already completed.`) and all further account creation goes through the normal, authenticated `POST /auth/users` endpoint.

---

# Login

`POST /auth/login` accepts a username and password, verifies the password against the stored bcrypt hash (passlib), and returns a signed JWT along with the username and role.

Token claims:

- `sub` — username
- `role` — `admin` or `user`
- `exp` — expiration, controlled by `config.json` → `auth.access_token_expire_minutes` (default 1440 minutes / 24 hours)

Tokens are signed with HS256 using `auth.jwt_secret_key` from `config.json`. Every deployment should replace the placeholder secret shipped in the default configuration before going into real use.

The frontend stores the token, username, and role in `localStorage` and attaches `Authorization: Bearer <token>` to every subsequent API request. An invalid or expired token results in a `401`, and the frontend redirects back to the login screen.

---

# Roles

## Admin

Full access to the host-management dashboard: host status/metrics, Sunshine control and client management, Tailscale status, recovery events and statistics, dynamic game management, the full log viewer, settings, session force-unlock, host revalidation, maintenance mode, and user management.

## User

Access to a scoped dashboard: their own session start/stop, their own session analytics, their own session history, their own logs (`/auth`-authenticated but session-filtered via `/admin/my-logs`), a reduced host-readiness view (`/host/user-status`), and self-service password change. Users cannot see other users' sessions or logs, and cannot reach any admin-only endpoint (enforced server-side, not just hidden in the UI — admin routes check `current_user["role"] != "admin"` and return `403` regardless of what the frontend renders).

---

# User Management (Admin Only)

Administrators manage accounts from the **User Management** dashboard page, backed by:

- `POST /auth/users` — create a user (admin or user role)
- `GET /auth/users` — list all accounts (username, role, created_at)
- `DELETE /auth/users/{username}` — delete a specific account
- `DELETE /auth/users` — delete all accounts except the oldest admin account (bulk cleanup / recovery operation)

The last remaining admin account cannot be deleted individually; this prevents an installation from being locked out of admin access.

---

# Password Change

Any authenticated user (admin or user) can change their own password via `PUT /auth/change-password`, which requires supplying the current password before accepting a new one.

---

# Storage

Accounts are stored in `host-agent/data/users.json` as a flat list of `{username, password_hash, role, created_at}` records. This is intentionally simple for the current JSON-persistence MVP; migrating this store to a database is part of the Phase 25 persistence migration, not a change to the authentication model itself.

---

# What This Does Not Yet Cover

- No refresh-token flow; a token simply expires and requires re-login.
- No account lockout / rate limiting on failed login attempts.
- No structured security audit log of login attempts or admin actions (planned for Phase 31).
- No email/password-recovery flow (a locked-out installation currently requires direct edits to `users.json` or a reinstall of the bootstrap flow).

These are tracked as future hardening work rather than gaps in the current MVP's stated scope.
