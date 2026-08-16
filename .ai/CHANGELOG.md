# CHANGELOG.md

Meaningful milestones only — not a commit log.

---

## [P0] Project bootstrap + audit — Main Claude #1

- `.ai/` created from scratch (no prior state existed).
- Full frontend architecture inspected and documented (ARCHITECTURE.md).
- Validation baseline established: lint clean, build clean, 21/21 tests
  passing.
- **Major correction to assumed ground truth:** the reference screenshots
  in `assets/screenshots/` were determined to be stale, predating the
  most recent frontend refactor (confirmed by the user). The actual
  current codebase (theme system, Sidebar, feature-page.css) is
  materially more refined than the screenshots suggest. Recorded as
  DECISIONS.md D-001.
- Real Playwright render performed against the live Vite dev server
  (Login page rendered successfully; confirms the amber/editorial visual
  language actually in production). This is the first real rendered
  evidence for this project.
- Found and documented a reproducible functional bug: `EventLog.jsx`
  crashes on genuinely-first-load (empty event feed) due to an unguarded
  `latest.session_id` in a `useEffect` dependency array. Flagged as
  out-of-scope for visual work (DECISIONS.md D-004), not fixed.
- Found that Tailwind is installed and configured but has zero actual
  usage in the codebase (BEM classes + inline styles are the real
  system). Flagged for a P1 decision (DECISIONS.md D-003).
- Found that per-page visual "personality" (meta-prompt §34 concept) is
  already substantially implemented in `feature-page.css` — this is a
  foundation to refine, not a greenfield task (DECISIONS.md D-005).
- Three design directions proposed; recommendation pending user approval
  (see P0 audit output delivered in-chat this session).
