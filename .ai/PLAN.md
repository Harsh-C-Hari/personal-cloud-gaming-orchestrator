# PLAN.md — Living Roadmap

Status legend: NOT STARTED / IN PROGRESS / BLOCKED / DONE

---

## P0 — Audit + Design Direction
**Status:** IN PROGRESS (this session)

- Objective: Understand real current state (code + rendered), decide
  visual direction, do not touch product code.
- Tasks: repo audit, `.ai/` bootstrap, validation baseline, real browser
  render, three design directions, roadmap.
- Dependencies: none.
- Acceptance: user approves one of the three directions (or a revision).
- **Blocking open decision:** which of Direction A/B/C (see P0 audit
  output, this session) does the user want? Nothing in P1 should start
  until this is answered.

## P1 — Design Token / Visual Foundation
**Status:** NOT STARTED

- Objective: Formalize the chosen direction into `theme.js` token
  updates (extend, don't replace the working 6-theme system) + resolve
  D-003 (Tailwind keep/remove decision).
- Tasks:
  - Decide + record D-003 resolution.
  - Extend `theme.js` tokens for the approved direction (typography
    scale, any new surface levels, spacing scale if it needs
    adjustment).
  - Update `primitives.jsx` only where the new tokens require new
    variants — don't duplicate existing working primitives.
- Dependencies: P0 sign-off.
- Acceptance: tokens documented in DECISIONS.md, build/lint/test still
  green, no page visuals changed yet (foundation only).

## P2 — Global Shell + Navigation
**Status:** NOT STARTED

- Objective: Apply the new foundation to `DashboardLayout`, `Sidebar`,
  `DashboardHeader`, `MobileHeader`.
- Tasks: redesign nav presentation, header, responsive shell behavior.
- Dependencies: P1.
- Acceptance: shell renders correctly at all 5 breakpoints, keyboard
  nav + focus states verified, existing routing/auth untouched.

## P3 — Home Flagship / Hero
**Status:** NOT STARTED

- Objective: Elevate Home to flagship status per meta-prompt §33.
  Note: Login page already achieves a strong flagship/editorial feel
  (verified by render this session) — Home should feel like it belongs
  to the same product as Login, not a step down in ambition.
- Dependencies: P2.
- Acceptance: Home answers "what is PCGO / is the host ready / what can
  I do" per meta-prompt, functionality preserved (session start,
  event log, quick nav), the EventLog empty-state edge case (D-004) is
  at minimum handled gracefully in the new design even if not
  code-fixed (i.e. don't design an empty-state that assumes the crash
  is fixed unless a fix is explicitly authorized as part of this task).

## P4 — Shared Premium Component System
**Status:** NOT STARTED

- Objective: Elevate `dashboard/components/*` shared composites
  (DashboardStats, SectionCard, NavigationCard, EmptyState, LoadingState,
  ActiveAlerts, SessionSidebar) to the new visual standard once, so P5
  feature-page work reuses them rather than re-solving per page.
- Dependencies: P1, P2.

## P5 — Feature Page Transformation
**Status:** NOT STARTED

- Objective: Apply the system to each remaining page, respecting
  existing per-page personality already encoded in `feature-page.css`
  (D-005) — refine, don't flatten.
- Suggested page order (simple → complex, builds confidence early):
  Settings → Change Password → Logs → Session History → Recovery →
  Sunshine → Game Manager → User Management → Host Monitor → Analytics.
- Each page = its own bounded Worker task per RULES.md.

## P6 — Motion + Micro-interactions
**Status:** NOT STARTED

- Objective: Restrained, purposeful motion only. Must degrade
  gracefully under `prefers-reduced-motion` (already respected globally
  per `App.jsx` GLOBAL_CSS — extend, don't break, that pattern).

## P7 — Responsive + Accessibility Refinement
**Status:** NOT STARTED

- Objective: Full pass at 1440/1024/768/390/360 across every page,
  plus a real accessibility audit (not just spot checks during P2-P6).

## P8 — Full Visual QA
**Status:** NOT STARTED

- Objective: End-to-end render pass. Recommend standing up the real
  `host-agent` backend for this phase (see DECISIONS.md D-002) rather
  than the mock-route harness, to catch integration issues the mock
  can't.

## P9 — Regression + Final Freeze
**Status:** NOT STARTED

- Objective: Full lint/build/test pass, final Worker corrections closed
  out, HANDOFF.md marked complete, CHANGELOG.md finalized.
