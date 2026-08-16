# STATE.md — Current Project State

## Where are we?

Phase **P0 — Audit + Design Direction**, task **P0-T01**, in progress.
This is the first Main Claude session on this project. `.ai/` did not
exist before this session; it was created now.

## What has been completed?

- Full repository inspection: `frontend/` architecture, `docs/`
  architecture notes, theme system, layout system, per-page CSS
  ("feature-page.css", ~1,200 lines), primitives, routing.
- Validation baseline established: lint clean, build clean, tests
  21/21 passing (see RULES.md for detail).
- Real browser rendering performed (Playwright + Chromium, present in
  this sandbox) against the live Vite dev server:
  - Login page (unauthenticated) — rendered successfully, real evidence.
  - Home page (authenticated, no backend) — hit a genuine pre-existing
    bug in `EventLog.jsx` (see RULES.md), confirmed via source reading,
    not just observed.
- Determined that `assets/screenshots/` is **stale** and does not
  represent the current codebase (see DECISIONS.md D-001).
- `.ai/` scaffold created: this file plus RULES.md, PLAN.md,
  ARCHITECTURE.md, DECISIONS.md, CURRENT_TASK.md, HANDOFF.md,
  CHANGELOG.md.

## What is currently active?

P0-T01 audit. Design directions (three proposals + recommendation) are
being produced in this same session as the audit output. No visual
redesign implementation has started.

## What is next?

1. Get sign-off from the user on the recommended design direction (or a
   revision of it).
2. P1 — design token / visual foundation Worker task, scoped exactly per
   PLAN.md.
3. Before any further visual QA, whoever continues this project (human
   or Main Claude) should get a real backend running (or extend the
   mock-API Playwright harness in `.ai/DECISIONS.md` D-002) so pages can
   be rendered with populated data, not just the login screen and error
   states.

## What is broken?

- `EventLog.jsx` — `latest.session_id` unguarded in a `useEffect`
  dependency array crashes the whole Home page via `ErrorBoundary` when
  the event feed is empty on first load. Verified by direct execution.
  This is a **functionality bug**, out of scope for visual-only P1+
  tasks unless explicitly assigned. Flagged to the user.
- Test coverage is thin — most `dashboard/` components and pages have no
  tests. Not a P0 blocker, but increases risk that visual refactors in
  later phases could silently change behavior. Consider recommending
  smoke tests for key pages before heavy P5 (feature page) work.

## What must not change?

Per RULES.md — backend, API contracts, auth/session/save/host-monitoring/
Sunshine/Tailscale logic, routing behavior, WebSocket/polling behavior.
See ARCHITECTURE.md "Current Architecture" for the full inventory of
logic-bearing files that visual Workers must not modify.

## Validation snapshot (this session)

| Check | Result |
|---|---|
| `npm install` | clean, 320 packages |
| `npm run lint` | 0 errors, 4 pre-existing warnings |
| `npm run build` | success, 5.5s |
| `npm run test` | 21/21 passing |
| Login page render | real screenshot captured, confirms current amber/editorial visual language |
| Home page render (no backend) | reproducible crash confirmed (see "What is broken?") |
