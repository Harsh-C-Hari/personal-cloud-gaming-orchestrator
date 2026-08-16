# CURRENT_TASK.md

## TASK ID
P0-T01

## TASK NAME
Premium Frontend Audit + Design Direction

## PHASE
P0

## OBJECTIVE
Establish verified ground truth about the current PCGO frontend (code +
rendered), correct the stale-screenshot misconception, and produce three
genuinely different premium visual directions plus one recommendation,
so the user can approve a direction before any implementation begins.

## SCOPE
Documentation and analysis only. `.ai/` creation/updates. Real browser
rendering for evidence-gathering (sandbox-local, not committed to repo).

## FILES / AREAS
Inspected: `frontend/` in full (src, config, package.json), `docs/`,
`assets/screenshots/`, `README.md`.

## DO NOT TOUCH
No files under `frontend/src/`, `frontend/public/`, or any product
config were modified this session. Only `.ai/*` was created.

## DESIGN REQUIREMENTS
Three genuinely different directions per meta-prompt §38 format, one
recommendation grounded in the *actual* verified current state (not the
stale screenshots).

## FUNCTIONALITY REQUIREMENTS
N/A this task (audit only) — but functionality boundary documented in
RULES.md/ARCHITECTURE.md for all future tasks.

## ACCESSIBILITY REQUIREMENTS
N/A this task — baseline accessibility notes captured in P0 audit output
for future phases to act on.

## RESPONSIVE REQUIREMENTS
N/A this task — mobile viewport (390) render attempted; full 5-breakpoint
sweep deferred to P7 per PLAN.md, though P2+ should spot-check as they go.

## VALIDATION REQUIREMENTS
- `npm install`, `npm run lint`, `npm run build`, `npm run test` — all
  run and passing (see STATE.md).
- At least one real Playwright render against the live dev server — done
  (Login page; Home page render exposed a real bug, see DECISIONS.md
  D-004).

## STATUS
IN PROGRESS — audit content and `.ai/` files being finalized in this
session. Remaining before this task can move to DONE:
1. Finish HANDOFF.md and CHANGELOG.md.
2. Deliver the full P0 audit document (meta-prompt §44 format) to the
   user in-chat.
3. Get user approval on a design direction — **this is a hard gate**,
   per meta-prompt §37 ("stop at the design decision gate"). P1 must not
   start until this happens.
