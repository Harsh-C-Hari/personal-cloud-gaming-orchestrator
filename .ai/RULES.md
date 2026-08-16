# RULES.md — Permanent Project Rules

These rules govern every Main Claude and Worker Claude on the PCGO Premium
Frontend Transformation. They do not expire between sessions.

## Source of truth hierarchy

1. **Actual repository** (`frontend/src/...`) — technical source of truth.
2. **`.ai/`** — persistent project/design/orchestration state.
3. **Actual rendered application** — visual/behavioral source of truth.
4. **Existing project documentation** (`docs/`, `README.md`) — supporting context.
5. **Conversation history** — temporary only, never authoritative.

If these disagree, inspect the repository and rendered app directly.
Never guess. Update `.ai/` to match reality, not the other way around.

## Non-negotiables

- Inspect actual code before editing or making claims about it.
- Never hallucinate APIs, components, data, or capabilities. If something
  cannot be verified by reading the repo or running it, say so explicitly.
- **Screenshots in `assets/screenshots/` are STALE.** Verified during P0-T01:
  they show a solid-white-pill nav and generic monochrome styling that does
  not match the current `Sidebar.jsx` (dim brand-tinted active state) or
  `App.jsx` `GLOBAL_CSS` (warm amber default theme, 6 built-in themes). Do
  not use those screenshots as evidence of the current visual baseline.
  Treat them only as a record of what an earlier iteration looked like.
- Functionality is frozen: backend contracts, API behavior, auth/authz,
  routes, WebSocket behavior, polling, business logic, session/save/host
  monitoring/Sunshine/Tailscale logic, and data contracts must not change
  as part of visual redesign work.
- Visual design is not frozen: layout, spacing, typography, color, surfaces,
  navigation presentation, component visuals, and responsive composition
  may be substantially redesigned.
- Accessibility is mandatory: semantic HTML, keyboard nav, visible focus,
  labels, contrast, dialog semantics, reduced motion, touch targets.
- Responsive design is mandatory at 1440 / 1024 / 768 / 390 / 360.
- No unnecessary dependencies. No giant unjustified rewrites.
- Browser QA is required for visual work — screenshots/renders as evidence,
  not just Worker claims. Prefer mocking the backend API via route
  interception (see `.ai/DECISIONS.md`) over trusting static screenshots.
- Worker tasks must be bounded, specific, and measurable — never "make it
  more premium."
- Main Claude owns acceptance. A Worker cannot declare its own task, or the
  project, complete.
- Changed-files-only delivery: Workers return only changed/created frontend
  files and updated `.ai/` files. Never full repo copies, `node_modules`,
  `.git`, `dist/`, or unrelated files.
- Checkpoint before context/usage exhaustion — don't wait until forced.
- Important decisions must be written to `.ai/DECISIONS.md`, not left only
  in conversation.

## Verified environment notes (P0-T01)

- Node.js — installs cleanly with `npm install` (no `--legacy-peer-deps`
  needed as of this audit).
- `npm run lint` → 0 errors, 4 pre-existing `react-refresh/only-export-components`
  warnings (ConfirmDialog.jsx, Toast.jsx, ThemeContext.jsx ×2). Not
  regressions to fix as part of visual work unless a task specifically
  touches those files.
- `npm run build` → succeeds. Output: ~62KB CSS / ~436KB JS (~113KB gzip).
- `npm run test` → 21/21 passing across 4 test files. Coverage is thin
  (client.js, Login, StartSessionForm, SessionCard only) — most components
  and all `dashboard/` pages are untested. Do not assume untested code is
  correct; verify by reading and, where practical, rendering it.
- A real backend (`host-agent`, FastAPI on `127.0.0.1:8100`) is required
  for the app to render populated states. Without it, `vite dev` serves
  the shell but data-dependent pages will hit fetch failures.
- **Reproducible bug found during audit** (see DECISIONS.md and STATE.md
  "Known Problems"): `EventLog.jsx` line 74 reads `latest.session_id`
  directly inside a `useEffect` dependency array, where `latest =
  events[0]`. When the event feed is empty (e.g. genuinely first-ever
  load, no cached `pcgo_ws_events` in localStorage), `latest` is
  `undefined` and this throws, tripping the global `ErrorBoundary` and
  replacing the entire Home page with the error-state card. This is a
  **pre-existing functional bug, not a visual redesign concern** — flag it
  to the user/product owner for a dedicated fix; do not silently patch it
  inside a visual-only Worker task (scope creep). If a Worker task happens
  to touch this exact file for visual reasons, the one-line optional-chain
  fix (`latest?.session_id`) may be included with an explicit note in the
  Worker report, but should not be assumed authorized by default.
