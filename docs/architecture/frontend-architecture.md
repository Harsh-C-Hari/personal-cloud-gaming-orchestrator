# Frontend Architecture

## Overview

The frontend provides a monitoring and management dashboard for the platform.

Built with React and Vite.

---

# Core Responsibilities

* Authenticate the user and route to the correct dashboard
* Display system health
* Display session information
* Display analytics
* Display recovery information
* Display infrastructure status

---

# Authentication & Routing

`App.jsx` checks for a stored JWT (`isLoggedIn()`) and renders `Login` when absent, or `Dashboard` when present. `Dashboard.jsx` reads the stored role and renders one of two role-specific shells:

* `AdminDashboard.jsx` — full navigation (Home, Host Monitor, Recovery, Sunshine, Game Manager, User Management, Analytics, Session History, Logs, Settings), backed by `useDashboardData` (admin-scoped API calls).
* `UserDashboard.jsx` — reduced navigation (Home, Analytics, Session History, Logs, Change Password), backed by `useUserDashboardData` (user-scoped API calls) and `adaptUserHostStatus` (normalizes the user-status payload to the same shape the shared components expect).

Both dashboards reuse the same `DashboardLayout`, page components (`Home`, `AnalyticsPage`, `SessionHistoryPage`, `LogsPage`), and `useSessionShell` hook for WebSocket-driven session state — role only changes which navigation items and admin-only pages are mounted, and which API endpoints the underlying hooks call.

---

# Dashboard Sections

## Host Section

Displays:

* Host readiness
* Startup status
* Maintenance mode
* Recovery mode

Admin dashboard reads `/host/status` and `/host/metrics`; user dashboard reads the reduced `/host/user-status` view.

---

## Sunshine Section

*Admin only* (`SunshinePage.jsx`). Displays:

* Running state
* Reachability
* Client count and paired-client management (pair, unpair, unpair-all)
* Application count
* Live stream status
* Stream history

---

## Session Section

Displays:

* Active sessions
* Session history
* Session analytics

Scoped to all sessions for admins, and to the logged-in user's own sessions for standard users.

---

## Recovery Section

*Admin only.* Displays:

* Recovery statistics
* Recovery events

---

## User Management Section

*Admin only* (`UserManagementPage.jsx`). Create, list, and delete accounts; bulk-remove all accounts except the oldest admin.

---

# Communication

## REST APIs

Used for:

* Data retrieval
* Actions
* Configuration

## WebSockets

Used for:

* Real-time updates
* Live monitoring
* Event broadcasts

---

# Design Goals

* Clear visibility
* Fast updates
* Operational monitoring
* Administrative control
