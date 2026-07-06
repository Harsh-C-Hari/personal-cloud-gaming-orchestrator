# Frontend Architecture

## Overview

The frontend provides a monitoring and management dashboard for the platform.

Built with React and Vite.

---

# Core Responsibilities

* Display system health
* Display session information
* Display analytics
* Display recovery information
* Display infrastructure status

---

# Dashboard Sections

## Host Section

Displays:

* Host readiness
* Startup status
* Maintenance mode
* Recovery mode

---

## Sunshine Section

Displays:

* Running state
* Reachability
* Client count
* Application count

---

## Session Section

Displays:

* Active sessions
* Session history
* Session analytics

---

## Recovery Section

Displays:

* Recovery statistics
* Recovery events

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
