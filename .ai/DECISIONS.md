# DECISIONS.md — Durable Decisions Log

Each entry: DECISION / REASON / ALTERNATIVES / STATUS / PHASE.
Never silently reverse an APPROVED decision — supersede it explicitly.

---

## D-001: Treat `assets/screenshots/` as stale, not representative

**DECISION:** The screenshots in `assets/screenshots/admin_dashboard/`
and `assets/screenshots/user_dashboard/` are NOT used as evidence of the
current visual baseline. They will remain in the repo as historical
record only.

**REASON:** Direct code inspection (theme.js, App.jsx GLOBAL_CSS,
Sidebar.jsx, feature-page.css) and a real Playwright render of the live
Vite dev server both show a materially different, more refined visual
language (warm amber editorial theme, dim-brand-tinted nav active state,
per-page CSS vocabulary) than what the screenshots depict (near-
monochrome, solid-white pill nav, generic dashboard feel). The user
confirmed directly in this session: the screenshots predate "the last,
second-to-last frontend refactor."

**ALTERNATIVES:** Trust screenshots as baseline and design against them
— rejected, would mean redesigning against a target that no longer
exists and wasting Worker effort re-solving already-solved problems.

**STATUS:** APPROVED
**PHASE:** P0

---

## D-002: Mock-backend Playwright harness for browser QA

**DECISION:** For rendering pages beyond Login (which needs no backend
data), intercept `http://127.0.0.1:8100/**` requests in Playwright and
fulfill with representative mock JSON per endpoint, rather than standing
up the real FastAPI `host-agent`.

**REASON:** No real backend is running in the Main Claude sandbox
environment. A working mock-route script (`render2.js`, not committed to
the repo — sandbox scratch file) was built during P0-T01 covering host
status/metrics, games, sessions (active/history/events/analytics),
recovery, users, config, tailscale, logs, sunshine. This is faster and
more controllable than a full backend for visual QA purposes, though it
cannot substitute for real integration testing.

**ALTERNATIVES:**
- Run the real `host-agent` FastAPI backend — more accurate but heavier
  to set up per-session; worth doing for P8 (Full Visual QA) but
  overkill for P0-P1.
- Rely only on static code reading without any render — rejected, the
  meta-prompt explicitly requires rendered evidence for visual review,
  and this session's real render caught a genuine bug that pure code
  reading might have missed noticing as high-priority.

**STATUS:** APPROVED (for P0-P7 visual QA); revisit for P8 (recommend
real backend for final regression pass).
**PHASE:** P0

**Note for future Workers/Main Claude sessions:** the mock script is not
saved in the repo (it was sandbox scratch). Whoever does P1+ visual work
should write and commit a small, reusable mock-API fixture (e.g.
`frontend/scripts/mock-api-fixtures.json` + a short Playwright helper)
under `frontend/` so this doesn't have to be reinvented each session.
This itself should be a small, explicit task, not silently added inside
an unrelated visual task.

---

## D-003: Tailwind is dead weight — resolve before P2

**DECISION:** Flag (do not yet fix) that `tailwind.config.js` and
`postcss.config.js` are present and Tailwind is a `package.json`
dependency, but a repo-wide grep found **zero** Tailwind utility-class
usage anywhere in `src/`. All component styling uses BEM-style custom
class names (e.g. `pcgo-host-status-panel__header`) driven by hand-written
CSS files, plus inline style objects referencing `theme.js` tokens.

**REASON:** Verified via `grep -o 'className="[^"]*"'` sampling across
multiple files — no `flex`, `p-4`, `text-sm`-style utility classes found,
only project-prefixed BEM classes. This is either legacy scaffolding
from an earlier Vite template, or an abandoned plan to adopt Tailwind
that never happened.

**ALTERNATIVES:**
1. Remove Tailwind entirely (uninstall, delete configs) — reduces
   confusion and bundle/build tooling surface, keeps the existing BEM +
   inline-style approach as the one true system.
2. Actually adopt Tailwind going forward for new premium components —
   would mean a real migration decision, larger scope, and touches the
   "no unnecessary dependencies" and "no giant unjustified rewrites"
   rules; not recommended unless there's a strong reason.

**STATUS:** PROPOSED — needs an explicit P1 decision before design-token
work begins, so Workers aren't confused about which styling approach to
use for new premium components.
**PHASE:** P1 (decision), P0 (flagged)

---

## D-004: `EventLog.jsx` crash is a functionality bug, not a design task

**DECISION:** The reproducible crash (`latest.session_id` unguarded in a
`useEffect` dependency array at `EventLog.jsx:74`, throwing when the
event feed is empty) is logged as a known bug in STATE.md and RULES.md,
but is explicitly OUT OF SCOPE for P1+ visual redesign Workers unless a
task is created specifically to fix it.

**REASON:** Per the meta-prompt's "no scope creep" rule — visual Workers
must not silently fix unrelated functional bugs. This bug also predates
this project's redesign effort entirely (it's a genuine first-load edge
case, unrelated to visual work), so fixing it is a product decision for
the user, not an automatic inclusion.

**ALTERNATIVES:** Fix it immediately as part of P0 — rejected, P0-T01 is
explicitly documentation-only ("ONLY `.ai/` documentation may be changed").
Silently fix it inside a later Worker task that happens to touch that
file — rejected as scope creep unless explicitly noted in that Worker's
report per RULES.md guidance.

**STATUS:** APPROVED (flagged, not fixed)
**PHASE:** P0

---

## D-005: Existing per-page CSS vocabulary is a foundation, not a blank slate

**DECISION:** `feature-page.css` (~1,200 lines) already implements
distinct visual treatment per page (Home = flagship/hero, Host Monitor =
operational/diagnostic, etc.), matching the spirit of the meta-prompt's
"page personality" concept. P1+ work should audit and refine this
existing system rather than assume it needs to be built from scratch.

**REASON:** Verified by reading the file directly — this is real,
already-implemented work, not aspirational documentation.

**ALTERNATIVES:** Rebuild page-specific styling from zero — rejected,
would throw away working, reasonably sophisticated code for no reason,
violating the "audit critically, don't automatically discard" principle.

**STATUS:** APPROVED
**PHASE:** P0
