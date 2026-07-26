# Internal Event Authentication

**Status:** Completed

---

# Issue Information

**Category:**
Security Engineering / Authentication

**Affected Components:**

- Sunshine Stream Hook (`sunshine_stream_hook.py`)
- Sunshine Transport Monitor (`host_agent/sunshine_transport_monitor.py`)
- Host API (`api/routes/host.py`)
- Startup Initializer (`host_agent/startup_initializer.py`)

**Severity:**
High (unauthenticated write path into session/stream state)

---

# Overview

Once user authentication (JWT bearer tokens) was introduced, every dashboard and session API required a logged-in user. Four endpoints, however, cannot be called by a user at all:

```text
POST /host/sunshine/stream-started
POST /host/sunshine/stream-ended
POST /host/sunshine/transport-connected
POST /host/sunshine/transport-disconnected
```

These endpoints exist purely so that two non-interactive callers can report what Sunshine is actually doing right now:

- **`sunshine_stream_hook.py`** — an external script that Sunshine itself invokes on stream start/stop.
- **`SunshineTransportMonitor`** — an in-process background thread that tails Sunshine's log file for `CLIENT CONNECTED` / `CLIENT DISCONNECTED` lines.

Neither caller is a logged-in user or a request originating from the frontend, so neither carries — or should carry — a user JWT. Leaving these endpoints open to any bearer token (or unauthenticated entirely) would let a user spoof stream/transport state.

---

# The Problem With a Code-Level Check

For most internal-only logic, "only module X may call this" can be enforced in Python by checking the call stack or restricting an import. That model breaks down here:

- `sunshine_stream_hook.py` runs as a **separate OS process**, invoked directly by Sunshine.
- By the time its HTTP request reaches the FastAPI server, there is no Python call stack left to inspect.

The only enforcement point that still exists across that process boundary is the network request itself. That means the credential has to travel with the request, the same way a webhook signing secret does.

---

# Design

A single shared secret — `backend.internal_event_token` — is:

- Generated once, using `secrets.token_urlsafe(32)`, at first startup (`host_agent/startup_initializer.py: _ensure_internal_event_token`).
- Persisted in `config.json`, alongside `backend.internal_api_url`.
- Read by `sunshine_stream_hook.py` and `SunshineTransportMonitor` and sent on every event call as the `X-Internal-Event-Token` header.
- Verified server-side by `api/internal_event_auth.py: require_internal_event_token`, a FastAPI dependency attached only to the four event routes via `dependencies=[...]`.
- Compared using `hmac.compare_digest`, so a timing attack cannot be used to recover it byte-by-byte.
- Never issued to the frontend, never accepted on any admin or user route, and never duplicated elsewhere in the backend — any other module that needs stream state reads it from `sunshine_stream_tracker`'s read-only getters instead of re-implementing this check.

```text
Sunshine (external process)
        │
        ▼
sunshine_stream_hook.py  ──┐
                             │  X-Internal-Event-Token: <shared secret>
SunshineTransportMonitor ───┤
   (log-tailing thread)     │
                             ▼
                 require_internal_event_token()
                             │
                             ▼
              /host/sunshine/stream-started, etc.
```

---

# Backward Compatibility

Existing installations from before this token existed would have a `config.json` without `backend.internal_event_token`. `_ensure_internal_event_token` treats a missing/blank token as a one-time backfill: it generates and persists a token on the next startup, logging a warning that any already-running hook script or transport monitor needs to be restarted to pick up the new value. In normal operation (fresh install, or an install that already has the token) this is a no-op.

---

# Why Not Just Reuse the User JWT System

- The hook script and transport monitor are not users; they have no username, no role, and no session to authenticate as.
- Giving them a JWT would mean minting and rotating a "service account" token indistinguishable from a real user's credentials, widening the blast radius if it ever leaked into a log or crash dump.
- A single-purpose, single-scope secret keeps the trust boundary narrow: this token can do exactly four things, and nothing else in the system will accept it.

---

# Verification

Verified scenarios include:

- Stream-hook events accepted with a valid token.
- Stream-hook / transport-monitor events rejected (`403`) with a missing or incorrect token.
- Fresh install: token generated automatically on first startup, hook/monitor pick it up from `config.json` without manual configuration.
- Upgrade from a pre-token `config.json`: token backfilled on next startup, warning logged.
- User JWTs rejected on the four event endpoints (they are not accepted as a substitute for the internal token).

---

# Impact

- Closed an unauthenticated write path into session/stream state that existed briefly during the authentication rollout.
- Established a reusable pattern (shared secret + `hmac.compare_digest` + a single dependency function) for any future process-boundary caller that isn't a logged-in user.
- Kept the check centralized in one file (`api/internal_event_auth.py`) rather than duplicated across routes.
