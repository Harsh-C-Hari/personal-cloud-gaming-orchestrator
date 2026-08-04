# v0.1 Known Limitations

## Authentication

Phase 24 delivered JWT-based authentication with admin/user roles; all dashboard and API access (aside from `/auth/login` and the first-run bootstrap endpoints) now requires a valid bearer token, and admin-only routes reject non-admin accounts server-side.

Remaining known limitations of the current authentication implementation:

- No refresh-token flow; tokens simply expire (`config.json` → `auth.access_token_expire_minutes`) and require re-login.
- No login rate limiting or account lockout after repeated failed attempts.
- No structured security audit log of login attempts or admin actions (planned for Phase 31).
- Accounts are stored in a database (`host-agent/data/pcgo.db`).
- No password recovery flow for a locked-out installation.

See [Authentication & Role-Based Access](../features/authentication.md).

The `/ws` WebSocket connection is a separate exception: it does not require a JWT and broadcasts to every connected client without role-based filtering. See [WebSocket Events](../api/websocket-events.md).

---

## Configuration Access

Configuration values are exposed to the Host Dashboard to support runtime configuration management. This is now gated by the authentication layer (admin role required for the settings endpoints), but the values themselves are not masked or redacted in transit — this includes secrets such as `auth.jwt_secret_key` and `backend.internal_event_token`, which `GET /config/` currently returns as plaintext to any admin account.

Future releases may introduce secret masking.

---

## CORS

The API currently allows requests only from:

- http://localhost:5173
- http://127.0.0.1:5173

Additional origins can be configured for future deployments if the frontend is hosted elsewhere.