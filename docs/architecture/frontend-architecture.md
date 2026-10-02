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

---

# Design System & Aesthetics

The frontend utilizes a custom design language referred to as **Tactical Console Brutalism**, optimized for high-density, professional monitoring environments.

## Visual Foundations

* **OLED Black Surfaces:** The application relies on a dark-first hierarchy. Standard UI elements eschew traditional greys in favor of true blacks or near-blacks (L0-L4 surfaces) to minimize eye strain and enhance contrast for active elements.
* **Liquid Glass Refraction:** Key UI components, particularly page headers (e.g., `.pcgo-feature-header`), use a combination of low-opacity backgrounds (e.g., `rgba(0, 0, 0, 0.15)`) and `backdrop-filter: blur(3px)` to create a subtle frosted glass effect. This ensures content readability without completely obscuring the structural background.

## Stacking Context & Background Architecture

The dashboard background features a pure CSS radial-gradient "dot matrix" pattern. To ensure browser compatibility with `backdrop-filter` effects (which can fail when backgrounds are applied directly to the `<body>` or `<html>` root), the architectural stacking context is strictly managed:

1. **Root Background:** The `body` element maintains a solid base color (`var(--color-bg)`).
2. **Dot Matrix Layer:** A dedicated, fixed `div` (`.pcgo-dot-matrix`) is injected immediately inside the app root. It renders the dot pattern and uses `pointer-events: none` to remain inert.
3. **Application Shell:** The main UI wrapper (`.pcgo-shell-root`) is rendered *after* the dot matrix in the DOM and uses `position: relative`. Because it lacks an opaque background of its own, it naturally overlays the dot matrix, allowing its children (like the Liquid Glass headers) to successfully sample and blur the dots behind them.
