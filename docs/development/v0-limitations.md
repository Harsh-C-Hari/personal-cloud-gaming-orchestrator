# v0.1 Known Limitations

## Authentication

Administrative APIs currently assume a trusted local or Tailscale environment.

Authentication and authorization are planned for Phase 24.

---

## Configuration Access

Configuration values are exposed to the Host Dashboard to support runtime configuration management.

Future releases may introduce secret masking and role-based access.

---

## CORS

The API currently allows unrestricted origins to simplify local dashboard development.

This configuration will be revisited during the security phase.