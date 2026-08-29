# PLAN.md — Living Roadmap

Status legend: NOT STARTED / IN PROGRESS / BLOCKED / DONE

---

## P0 — Audit + Design Direction
**Status:** DONE

- Direction approved this session as D-008 ("Calm Editorial + Layered
  Depth"), supplied directly by the product owner. Gate cleared.

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
**Status:** DONE

- **P1-T01 (untracked, reconstructed this session):** committed
  `frontend/qa/` Playwright QA harness. DONE, but introduced a lint
  regression (13 `no-undef` errors, see RULES.md) that was never caught
  because `.ai/` was never updated to prompt a re-validation.
- **P1-T02: DONE, ACCEPTED by Main Claude** (independently re-verified —
  fresh install, lint/build/test all green, diff confirms exact 3-file
  scope). Baseline
  stabilization — fixed the confirmed `EventLog.jsx` empty-state crash
  (D-004) and the `frontend/qa/` lint regression. Non-visual, bounded,
  low-risk. See CURRENT_TASK.md and CHANGELOG.md for the full report.
- **P1-T03: DONE, ACCEPTED by Main Claude** (independently re-verified —
  fresh install confirms 260 vs. 320 packages post-Tailwind-removal,
  lint/build/test all green, diff confirms exact file scope,
  programmatically confirmed all 6 theme blocks got matching surface
  aliases). Formalized D-008 into
  `theme.js`: added `typeScale` (hero/heading/subheading/body/
  bodySmall/meta, derived from the existing de facto font-size usage,
  no new font families) and `surface` (L0–L4), aliasing the 5 legacy
  background tokens (`bg`/`bgInset`/`bgElevated`/`bgCard`/
  `bgCardHover`) which were verified to already be a monotonic
  lightness ladder across all 6 themes — zero value changes, zero
  visual regression. Resolved D-003: Tailwind fully removed (configs +
  `tailwindcss`/`postcss`/`autoprefixer` deps, fresh zero-usage grep
  confirmed first). Deleted the dead `components/feature-page.css`
  copy (D-005 correction), confirmed zero imports first. lint/build/
  test all green. See CHANGELOG.md "[P1] P1-T03 complete" for the full
  report.
- Dependencies: P0 sign-off (done, D-008).
- Acceptance: tokens documented in DECISIONS.md, build/lint/test green,
  no page visuals changed yet (foundation only).

## P2 — Global Shell + Navigation
**Status:** DONE. P2-T01 ACCEPTED with independent, from-scratch build
verification (see CHANGELOG.md's "[P2] P2-T01 — ACCEPTED" entries).

- Objective: Apply the new foundation to `DashboardLayout`, `Sidebar`,
  `DashboardHeader`, `MobileHeader`.
- Tasks: redesign nav presentation, header, responsive shell behavior.
- Dependencies: P1.
- Acceptance: shell renders correctly at all 5 breakpoints, keyboard
  nav + focus states verified, existing routing/auth untouched.

## P3 — Home Flagship / Hero
**Status:** DONE. P3-T01 ACCEPTED with independent, from-scratch build
verification (see CHANGELOG.md's "[P3] P3-T01 — ACCEPTED" entries).

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
**Status:** DONE. All three sub-tasks (P4-T01, P4-T02, P4-T03)
ACCEPTED with independent, from-scratch build verification.

- Objective: Elevate the shared composite components Home (and other
  pages) render, so P5 feature-page work reuses an already-elevated
  system rather than re-solving per page.
- Dependencies: P1, P2, P3 (all DONE).
- **Split into 3 bounded sub-tasks** (revised in an earlier
  continuation session — the full set spans two directories, ~1,780
  lines, and very different component sizes; one task would not have
  been "bounded, specific, and measurable" per RULES.md):
  - **P4-T01 — ACCEPTED, DONE.** The 7 `dashboard/components/*`
    composites — `SectionCard`, `NavigationCard`, `EmptyState`,
    `LoadingState`, `ActiveAlerts`, `SessionSidebar`, `DashboardStats`
    — plus the 5 corresponding `feature-page.css` selector groups.
    Delivered as recovered files after a Worker session hit its
    token/usage limit before packaging; verified from scratch rather
    than trusted on the incomplete self-report. A later formal
    delivery ZIP reproduced byte-identical code but was missing its
    `.ai/` folder — the process reminder that shaped P4-T02/T03's
    delivery instructions.
  - **P4-T02 — ACCEPTED, DONE.** `src/components/SessionCard.jsx`
    (386 lines). Cleanest delivery of the three — every specific claim
    in its report (token values, Button primitive default weight, an
    unreachable-render-branch discovery, a corrected consumer list)
    independently fact-checked and confirmed accurate.
  - **P4-T03 — ACCEPTED, DONE.** `src/components/StartSessionForm.jsx`
    (988 lines). Also delivered as a recovered file after a
    token/usage-limit session end (same failure mode as P4-T01,
    different task) — validation was already complete before the
    session ended, and every claim was re-verified independently
    rather than trusted. Surfaced a significant discovery: a real
    `feature-page.css` `.pcgo-launch-console*` selector block
    (contradicting the task's initial "no CSS for this component"
    assumption) with several `!important` rules silently overriding
    this component's inline values — some genuinely dead (corrected in
    place), one a pre-existing inline/CSS mismatch correctly left alone
    since fixing it would require touching the out-of-scope CSS file.
- **P5 carry-forward note:** `!important`-driven CSS overriding
  component-level inline styles showed up twice across P4
  (`SessionSidebar.jsx`/P4-T01, `StartSessionForm.jsx`/P4-T03) — worth
  a dedicated CSS-audit pass before or during P5 to reconcile which
  inline values are actually live versus decorative, rather than
  continuing to discover them one component at a time.
- **P4 is fully DONE.** Next: scope and dispatch P5.

## P5 — Feature Page Transformation
**Status:** DONE. All 11 tasks (P5-T01 — P5-T11) ACCEPTED — P5-T01 (Settings), P5-T02 (Change Password),
P5-T03 (Logs), P5-T04 (Session History), P5-T05 (Recovery), P5-T06
(Sunshine, part 1 of 2 — `SunshineClientManager.jsx`), P5-T07
(Sunshine, part 2 of 2 — `SunshineStreamHistory.jsx`), P5-T08 (Game
Manager), P5-T09 (User Management), and P5-T10 (Host Monitor) all
ACCEPTED/DONE. **Sunshine, Game Manager, User Management, and Host
Monitor are now fully DONE.** P5-T10's review found no inaccurate
claims, but did independently reconfirm a Worker-flagged discrepancy
in its own dispatch: the "6 aria-*/role= attributes" estimate in the
P5-T10 dispatch undercounted — the real figure is 9 attribute
instances across 6 elements in `HostStatusPanel.jsx` (no regression,
just a dispatch miscount). **P5-T11 (Analytics —
`SessionAnalytics.jsx` + the `.pcgo-analytics*` CSS block) delivered,
awaiting Main Claude acceptance. This is the FINAL P5 page — its
acceptance closes Phase P5 entirely.**

- Objective: Apply the system to each remaining page, respecting
  existing per-page personality already encoded in `feature-page.css`
  (D-005) — refine, don't flatten.
- Suggested page order (simple → complex, builds confidence early):
  ~~Settings~~ → ~~Change Password~~ → ~~Logs~~ → ~~Session History~~ →
  ~~Recovery~~ → ~~Sunshine (split into 2)~~ → ~~Game Manager~~ →
  ~~User Management~~ → ~~Host Monitor~~ → **Analytics (current, FINAL
  P5 page)**.
- Each page = its own bounded Worker task per RULES.md.
- **Findings worth carrying into every remaining page task:**
  - Some pages have zero inline styles; others (Logs, Session History,
    and now Recovery) have real inline styles plus their own CSS
    block. Check each page's actual file before writing its task.
  - Recovery is the first P5 page backed by **two** real components
    (`RecoveryStats.jsx` 418 lines, `RecoveryEvents.jsx` 339 lines —
    757 combined, comparable in aggregate to Session History alone) —
    kept as one bounded task since they're sibling components on one
    page with a shared visual language (per `GameManager.jsx`'s own
    comment referencing both together), not split the way P4 split
    unrelated large files.
  - The "comment mentions a component but doesn't import it" pattern
    keeps recurring (`SunshineStreamHistory.jsx`, `GameManager.jsx`,
    `LoadingState.jsx` all *mention* Recovery components in comments
    without importing them) — only `RecoveryPage.jsx` (which itself
    is a thin prop-forwarding layer, state owned by `AdminDashboard.jsx`)
    actually renders them. Grep fresh each time rather than trusting
    an inherited consumer list.
  - **P5-T05 finding, carry into Sunshine (P5-T06):** Recovery's
    `.pcgo-recovery-*` CSS block had **zero** `var(--color-bg-*)`
    literal references to begin with — the first P5 page CSS block
    with nothing to alias to `surface.l*`. Also, none of either
    component's inline typography groups cleanly matched a `typeScale`
    step (a bespoke 8.5px-19px scale throughout) — every one was left
    as a documented literal. Don't assume Sunshine's CSS/typography
    will need the same swap pattern Settings/Logs/Session History did;
    grep fresh.
- **Delivery format (D-010):** full-repo delivery, working well across
  every task since P5-T02.
- **P5-T05 acceptance finding (non-blocking):** the Worker report's
  claim that `RecoveryStats.jsx`/`RecoveryEvents.jsx`'s shared `box`
  style object is "byte-identical" between the two files was false —
  two lines have inconsistent indentation (0/4 spaces instead of 2),
  almost certainly a slip while editing the adjacent `background:`
  line. Zero functional/visual effect; doesn't trip lint. Folded into
  P5-T06 as a one-line bundled correction. **Takeaway for every
  remaining P5 task:** re-verify "byte-identical" / "shared object"
  claims with an actual diff, not by trusting the Worker's self-report
  — whitespace slips like this won't show up in lint or build output.
- **Sunshine is split into two bounded tasks**, unlike Recovery's
  two-sibling-one-task approach: `SunshinePage.jsx` actually renders
  only `SunshineClientManager.jsx` (925 lines) and
  `SunshineStreamHistory.jsx` (401 lines) — 1,326 combined, ~57% larger
  than Recovery's 846, and `SunshineClientManager.jsx` alone is the
  largest single file any P5 task has covered so far (bigger than
  Session History's 609). Unlike Recovery, fresh inspection found no
  shared/identical style objects between the two Sunshine components
  (no repeated `title`/`headerIcon`/`box` pattern) — they don't carry
  Recovery's specific cross-component-consistency risk, so splitting
  is lower-risk here than it would have been for Recovery.
  - **P5-T06 — ACCEPTED, DONE.** `SunshineClientManager.jsx` +
    `SunshinePage.jsx` wrapper inspection (confirmed pure wrapper, no
    change needed) + the bundled Recovery `box` fix. 10
    `colors.bg*` → `surface.l*` swaps; zero `typeScale` matches found
    (18 groups audited, same outcome as Recovery); `saveButton`'s
    `color: colors.bg` correctly left as a foreground-color exception,
    independently re-verified against D-009's actual text during
    review.
  - **P5-T07 — ACCEPTED, DONE.** `SunshineStreamHistory.jsx` (401
    lines). 8 `colors.bg*` → `surface.l*` swaps; zero `typeScale`
    matches found (same outcome as Recovery/T05 and Client Manager/
    T06); `.pcgo-sunshine-stream-history*` CSS confirmed to have
    nothing to swap; shared-visual-language claim verified with mixed
    results (`panelDescription`/the section `<h2>` byte-identical to
    RecoveryStats.jsx's; header-icon border and outer-container
    padding genuinely differ); flagged that this task's own dispatch
    prompt wrongly described SessionAnalytics.jsx as "already
    elevated" (it isn't — 5 real `colors.bg*` refs remain, no
    `surface` import). Main Claude's review independently re-ran
    lint/build/test and spot-checked every claim above directly
    against the code — all held up, no inaccuracies found. **Sunshine
    (P5-T06 + P5-T07) is fully DONE.**
- **P5-T08 — ACCEPTED, DONE.** `GameManager.jsx` (1,044 lines, single
  component). 7 background `colors.bg*` swaps to `surface.l*`
  (corrected from the dispatch's inaccurate "6 static + 2 handler"
  breakdown — actually 5 static + 2 handler-embedded, 8 total
  including `saveButton`'s foreground exception). First P5 file with
  genuine `typeScale` matches (`FieldLabel`/`SectionHeading`/
  `inputStyle`), verified directly against `StartSessionForm.jsx`'s
  own precedent — a real departure from Recovery/Sunshine's "zero
  matches" outcome. Flagged (not fixed) a cross-file inconsistency:
  `SunshineClientManager.jsx` has identical literal values left
  unconverted. Main Claude's review independently re-ran lint/build/
  test and spot-checked every claim — all held up, no inaccuracies
  found. **Game Manager is fully DONE.**
- **P5-T09 — ACCEPTED, DONE.** `UserPanel.jsx`/`UserManagementPage.jsx`
  confirmed byte-identical to baseline (neither was in the
  allowed-files list). CSS-only pass: 11 `var(--color-bg-*)` swaps in
  `.pcgo-users*` (2 `-card`→l3, 5 `-inset`→l1, 2 `-elevated`→l2, 2
  `-card-hover`→l4) + 25 font-property declarations documented against
  `typeScale` (none matched cleanly — closest misses: the 12px form-
  input text differed only on line-height, the 17px `h2` differed on
  three defining properties). First P5 CSS-only task where the build
  output was genuinely non-byte-identical to baseline (58 bytes
  smaller) — correctly flagged by the Worker and independently
  confirmed by Main Claude as a pure string-length artifact of
  `var(--surface-l*)` being shorter than `var(--color-bg-*)`, not a
  value/selector change. Main Claude's review independently re-ran
  lint/build/test and spot-checked every claim — all held up, no
  inaccuracies found. **User Management is fully DONE.**
- **P5-T10 — ACCEPTED, DONE.** `HostStatusPanel.jsx` (740 lines) +
  `SunshineStreamCard.jsx` (273 lines) kept as one bounded task per
  Recovery's two-sibling precedent. **First P5 task where a
  `*Page.jsx` file was genuinely in scope**: `HostMonitorPage.jsx`
  (102 lines) owns real inline `colors.*`/`fonts.*` styles — audited,
  zero `colors.bg*` found, both `fontSize` groups left as documented
  literals (no clean `typeScale` match). 5/5 `colors.bg*`->`surface.l*`
  swaps in `HostStatusPanel.jsx`, one genuine `typeScale.meta`
  conversion (`sectionHeading`, independently re-verified against
  `theme.js`). 4/4 `var(--color-bg-*)`->`var(--surface-l*)` CSS swaps,
  `!important` preserved exactly. `SunshineStreamCard.jsx` confirmed
  zero swaps needed. Main Claude's review independently re-ran
  lint/build/test, confirmed all swap/mapping claims, and caught a
  dispatch-count discrepancy: the "6 aria-*/role= attributes" figure
  in this task's own dispatch was wrong — the real count is 9
  attribute instances across 6 elements (no regression, content
  byte-identical to baseline). CSS build delta exactly -14 bytes
  (closed-form token-length math), JS delta exactly -118 bytes
  (Worker honestly flagged this one as not closed-form-provable). No
  other inaccuracies found. **Host Monitor is fully DONE.**
- **Consumer-relationship finding (verified fresh, matches the
  recurring pattern flagged for Recovery):** `SunshineStreamCard.jsx`
  (273 lines) is **not** rendered by `SunshinePage.jsx` at all, despite
  its name — its only real consumer was `HostStatusPanel.jsx` (Host
  Monitor, above), confirmed and resolved by P5-T10.
- **P5-T11 — Analytics (FINAL P5 PAGE) — delivered, awaiting Main
  Claude acceptance.** `AnalyticsPage.jsx` (11 lines) confirmed a pure
  wrapper, out of scope, untouched. `SessionAnalytics.jsx` (451 lines,
  single component, no sibling consumer): 5/5 `colors.bg*`→`surface.l*`
  swaps (`bgCard`→l3, `bgElevated`→l2×2, `bgInset`→l1×2), `surface`
  added to the theme import. **Worker corrected the dispatch's
  typography count:** the real figure is 10 `fontSize`/`fontWeight`/
  `fontFamily` groups, not 9 — the dispatch had folded `StatTile`'s
  icon-tile and value styles into one group; they're two separate
  style objects. One genuine `typeScale` match found — `listHeading`
  (9.5px/700/mono/0.13em/uppercase) is an exact value match to Host
  Monitor's `sectionHeading`/Game Manager's `FieldLabel` precedent,
  converted to `...typeScale.meta`. All other 9 groups left as
  documented literals. `.pcgo-analytics*` CSS block confirmed at lines
  581-826 pre-comment, grew to 581-877 post-comment (expected growth,
  not a discrepancy): 2/2 `var(--color-bg-inset)`→`var(--surface-l1)`
  swaps, 9 font declarations audited with zero clean typeScale matches
  (closest candidate diverges by 1.5px/0.02em, a materially bigger gap
  than the JS-side `listHeading` match). 9 `aria-*`/`role=` attribute
  instances across 8 elements confirmed present and unchanged.
  Full-repo scope corroborated via file mtimes (no baseline zip was
  available this review session — see CHANGELOG.md's "P5-T11 — Main
  Claude review" entry). **ACCEPTED — Main Claude independently re-ran
  lint/build/test fresh this session (network egress was open,
  unlike the Worker's own session) and confirmed all claims. See
  CHANGELOG.md's "[P5] P5-T11 — Main Claude review: ACCEPTED" entry
  for the full record.**

**Phase P5 (Feature Page Transformation) is now fully DONE.** All 11
tasks accepted. P6 (Motion + Micro-interactions) is next.

## P6 — Motion + Micro-interactions
**Status:** DONE. All 15 tasks (P6-T01 — P6-T15) ACCEPTED.

- Objective: Restrained, purposeful motion only. Must degrade
  gracefully under `prefers-reduced-motion` (already respected globally
  per `App.jsx` GLOBAL_CSS — extend, don't break, that pattern).

- **P6-T01 (Page-transition entrance motion) — ACCEPTED, DONE this
  session.** Mechanism: the per-route wrapper `<div>` in both
  `AdminDashboard.jsx`/`UserDashboard.jsx` now gets `className={key
  === activeKey ? "pcgo-page-enter" : undefined}` alongside its
  existing `display` toggle — a genuine add/remove DOM mutation on
  every real navigation (including return-navigation), replaying the
  existing `cgo-fade-up` animation without remounting `{element}`, and
  a no-op on unrelated re-renders since `activeKey` (derived from
  `route`, which only changes on real navigation) doesn't change. No
  new keyframes/classes/tokens introduced — `App.jsx` untouched.
  `NotFoundPage` got the same class via a thin wrapper (it already
  fully remounts on each hit). Main Claude independently re-ran
  lint/build/test fresh, confirmed via literal `diff -rq` against the
  dispatch baseline that exactly `AdminDashboard.jsx`/
  `UserDashboard.jsx`/`.ai/CHANGELOG.md`/`.ai/CURRENT_TASK.md` changed,
  and independently reasoned through the mechanism's correctness at
  the code level (`route`-change semantics, React key stability,
  `className={undefined}` behavior) since browser QA could not be
  reproduced this review session (Playwright blocked here too — same
  recurring, session-dependent limitation as P5). No inaccurate claims
  found. See CHANGELOG.md's "[P6] P6-T01 — Main Claude review:
  ACCEPTED" entry for the full record.

- **P6-T02 (Shared primitives transition-token audit) — ACCEPTED,
  DONE this session (continuation Main Claude session).**
  `components/ui/primitives.jsx`'s `Button`/`Card` `transition:`
  values converted from hardcoded `160ms ease`/`100ms ease` literals to
  `motion.base`/`motion.fast` template-literal references — 3 lines
  changed, confirmed to interpolate to byte-identical strings. This
  continuation session independently re-verified every claim from
  scratch (not trusting the Worker's report or prior session's framing
  alone): direct file reads, a fresh Node-REPL interpolation check,
  a full fresh `npm install`/`lint`/`build`/`test` run in a clean
  container (all figures byte-identical to the Worker's claims),
  mtime-based scope-isolation corroboration (no baseline zip available
  this session), and an independent, also-blocked attempt at browser
  QA (`403 cdn.playwright.dev`, confirming the limitation is
  environmental, not a Worker excuse). No inaccurate claims found. See
  CHANGELOG.md's "[P6] P6-T02 — Main Claude review: ACCEPTED" entry
  for the full record.

- **P6-T03 (Shared shell-component transition-token audit, batch 2) —
  ACCEPTED, DONE this session (continuation Main Claude session).**
  `dashboard/components/PageHeader.jsx`/`SectionCard.jsx` and
  `dashboard/layout/DashboardHeader.jsx`'s `transition:` strings
  converted to `motion.base` (3 clean exact matches, template-literal
  interpolation, same property order). `dashboard/layout/MobileHeader.jsx`'s
  drawer `transition:` split as scoped: only the `box-shadow` portion
  converted to `motion.cardIn` (its first real usage anywhere in the
  app), the `transform` portion correctly left as the exact original
  literal with the non-match documented inline (`motion.cardIn` shares
  the 220ms duration but plain `ease`; `motion.pill` shares the
  cubic-bezier curve but is 180ms — no step matches both). `motion`
  added to each file's existing `theme.js` import line via each file's
  own correct `"../theme.js"` relative path (not copy-pasted from
  `primitives.jsx`'s different path). This session independently
  re-verified every claim from scratch: direct reads of all 4 files, a
  fresh Node-REPL byte-identical-interpolation check for all 4
  conversions, a `motion\.` grep across all of `frontend/src` (exactly
  6 files match — the 2 already-accepted from P6-T02 plus these 4, no
  scope creep), a fresh ARIA/`tabIndex` attribute-count re-confirmation
  in all 4 files (matching the Worker's self-corrected counts, not the
  dispatch's originally-inaccurate ones), and a full fresh `npm
  install`/`lint`/`build`/`test` run in a clean container (all figures
  byte-identical to the Worker's claims: 260 packages, 0 lint
  errors/4 warnings, 61.16KB CSS/436.82KB JS/113.22KB gzip, 24/24
  tests). No pre-task baseline zip was available this session, so
  scope isolation relied on the `motion\.` grep (a precise positive
  signal) plus direct diffing against the dispatch's own quoted
  pre-conversion literals, rather than a literal `diff -rq`. Browser QA
  was not attempted this review session (flagged as an open gap, not
  silently assumed fine). No inaccurate claims found. See
  CHANGELOG.md's "[P6] P6-T03 — Main Claude review: ACCEPTED" entry for
  the full record.

- **P6-T04 (dashboard/components + components/ui shared-component
  transition-token audit, batch 3) — ACCEPTED, DONE this session.**
  Outcome: **0 conversions, 5 documented non-matches** — exactly the
  outcome the dispatch flagged as expected and legitimate.
  `DashboardStats.jsx`'s `150ms` and `ErrorBoundary.jsx`'s `200ms`
  don't exactly match any `motion` step; `LoadingState.jsx`/
  `ConfirmDialog.jsx` (×2)/`Toast.jsx`'s values are all keyframe-based
  `animation:` declarations, same non-convertible category as
  `primitives.jsx`'s `Spinner`. Worker correctly caught and rejected a
  duration-only near-match: `ConfirmDialog.jsx`'s `confirm-card-in
  0.18s` and `Toast.jsx`'s `toast-in 0.18s` share `motion.pill`'s
  180ms duration but not its cubic-bezier easing, so neither
  qualifies. This session independently re-verified with a **literal
  `diff -rq`** against the exact zip dispatched for this task (kept
  from the dispatching session — the first P6 review with a true
  baseline available). Confirmed exactly the 5 scoped files differ,
  and a comment-stripped diff of all 5 shows **zero non-comment
  differences**, directly confirming the Worker's "comments only, no
  behavior change" claim rather than inferring it. Also independently
  re-read all 5 files, re-confirmed `theme.js`'s `motion` values, ran
  `motion\.` grep (still exactly the same 6 real-usage files, plus 2
  comment-only mentions correctly identified as prose not code),
  confirmed no `motion` import was added anywhere (consistent with
  zero conversions), confirmed ARIA/`role` attributes on
  `ConfirmDialog.jsx`/`Toast.jsx` unchanged, and ran a full fresh
  `npm install`/`lint`/`build`/`test` (260 packages, 0 errors/4
  warnings, 61.16KB CSS/436.82KB JS/113.22KB gzip — byte-identical,
  expected since no non-comment code changed, 24/24 tests). Browser QA
  still not attempted (third consecutive P6 cycle without it) —
  flagged again as a standing risk, not treated as blocking given the
  unusually strong diff-based evidence this cycle. No inaccurate
  claims found. See CHANGELOG.md's "[P6] P6-T04 — Main Claude review:
  ACCEPTED" entry for the full record.

- **P6-T05 (feature-component transition/animation audit, batch 4) —
  ACCEPTED, DONE this session.**
  `components/StatusBadge.jsx`/`components/EventLog.jsx`/
  `components/LiveCountdown.jsx` all audited against `motion`'s
  re-confirmed values. Every value the dispatch anticipated held up
  under independent audit: `StatusBadge.jsx`'s `badge-pulse 1.6s` and
  `EventLog.jsx`'s `log-blink 2s`/`card-in 180ms ease` are
  keyframe-based, non-convertible per the established `Spinner`
  precedent (`card-in 180ms`'s plain `ease` confirmed to *not* match
  `motion.pill`'s cubic-bezier, the same near-miss pattern P6-T04
  caught, explicitly addressed in the code comment). `EventLog.jsx`'s
  `transition: "background 150ms ease"` and `LiveCountdown.jsx`'s
  `transition: "color 0.4s ease"` (400ms) confirmed to not exactly
  match any `motion` step. No additional `transition:`/`animation:`
  values found beyond the 4 the dispatch named. **Outcome: 0
  conversions, 4 documented non-matches** — this session independently
  confirmed via a literal `diff -rq` against the exact dispatched
  baseline (kept from the dispatching session): exactly the 3 scoped
  files differ, and a comment-stripped diff shows **zero non-comment
  differences**. Re-read all 4 documented values directly, re-checked
  the duration-only-coincidence trap independently, confirmed no
  import lines changed and no real `motion` usage was added (one
  `motion.pill` grep hit is prose in a comment), confirmed ARIA
  attributes on `EventLog.jsx` unchanged. Fresh `npm install`/`lint`/
  `build`/`test`: 260 packages, 0 errors/4 warnings, 61.16KB CSS/
  436.82KB JS/113.22KB gzip (byte-identical, expected), 24/24 tests.
  Browser QA not attempted this review session either — fifth
  consecutive P6 cycle without one; the Worker's own attempt this
  cycle (confirming no Chromium binary reachable) is useful
  corroborating evidence this is a genuine environment constraint.
  No inaccurate claims found. See CHANGELOG.md's "[P6] P6-T05 — Main
  Claude review: ACCEPTED" entry for the full record.

- **P6-T06 (feature-component transition/animation audit, batch 5) —
  ACCEPTED, DONE this session.**
  `components/SessionCard.jsx`/`components/GameLibrary.jsx` audited.
  Outcome: **0 conversions, 3 documented non-matches.**
  `SessionCard.jsx`'s `border-color 150ms ease` transition and
  `card-in 180ms ease` animation (the same non-convertible
  keyframe/near-miss-trap pattern as `EventLog.jsx`'s identical
  animation string — correctly given its own comment rather than
  skipped as "already documented elsewhere") don't qualify;
  `GameLibrary.jsx`'s `"border-color 150ms ease, background 150ms
  ease"` transition doesn't exactly match any `motion` step either.
  This session independently re-verified with a literal `diff -rq`
  against the exact dispatched baseline: exactly the 2 scoped files
  differ, comment-stripped diff shows zero non-comment differences.
  Re-confirmed neither file has any ARIA/`role` attributes to begin
  with (matching the Worker's claim), confirmed no import changes,
  confirmed `motion.pill` mention is comment-only prose. Fresh `npm
  install`/`lint`/`build`/`test`: 260 packages, 0 errors/4 warnings,
  61.16KB CSS/436.82KB JS/113.22KB gzip, 24/24 tests (including
  `SessionCard.test.jsx`'s 4 tests specifically re-checked). Browser QA
  not attempted this review session — sixth consecutive P6 cycle
  without one; the Worker's own repeated `403 Host not in allowlist`
  result further corroborates this is a stable environment constraint.
  No inaccurate claims found. See CHANGELOG.md's "[P6] P6-T06 — Main
  Claude review: ACCEPTED" entry for the full record.

- **P6-T07 (feature-component + auth-page transition/animation audit,
  batch 6) — ACCEPTED, DONE this session.** `Login.jsx`'s
  `"border-color 160ms ease, background 160ms ease"` transition
  **converted** — the first genuine `motion` conversion since
  P6-T03's `PageHeader.jsx`, breaking a three-task streak of pure
  documentation. `SaveBrowser.jsx`'s two `150ms` transitions and
  `RecoveryEvents.jsx`'s `badge-pulse 1.6s` (keyframe, duplicate of
  `StatusBadge.jsx`'s string, still given its own comment per
  convention) and `150ms` transition all correctly left as documented
  non-matches. This session independently re-verified with a literal
  `diff -rq` against the exact dispatched baseline (`Login.jsx`'s diff
  is exactly the import line + one `transition:` value; the other two
  files' diffs are comment-only), re-ran the byte-identical
  interpolation check fresh, confirmed `package.json`/
  `package-lock.json` byte-identical (no leaked `playwright`
  dependency from the Worker's local QA troubleshooting), confirmed
  ARIA attributes untouched in all 3 files, and ran a full fresh
  `npm install`/`lint`/`build`/`test` (260 packages, 0 errors/4
  warnings, CSS unchanged 61.16KB, **JS unchanged at 436.82KB** per a
  from-scratch clean rebuild, 24/24 tests). **Found and corrected one
  inaccuracy in the Worker's delivered `CHANGELOG.md`:** a stale claim
  that the JS bundle "grew from 436.82KB to 436.92KB," left over from
  mid-task troubleshooting the Worker's own transcript shows they
  later resolved (a temporary local `playwright` install had
  transiently perturbed Vite's dependency-scan cache) — the final
  delivered code was correct throughout, only that one documentation
  sentence hadn't been updated to match. Fixed in place; did not
  affect the accept decision. Also, for the first time in this
  project, the Worker produced real rendered browser-QA screenshots by
  diagnosing that a backgrounded dev server doesn't survive between
  separate sandbox tool invocations and running the server + QA script
  in one combined shell call — a specific, falsifiable technical
  explanation, treated as a genuine improvement rather than taken
  purely at face value. See CHANGELOG.md's "[P6] P6-T07 — Main Claude
  review: ACCEPTED (with one correction to the Worker's report)" entry
  for the full record.

- **P6-T08 (feature-component transition/animation audit, batch 7) —
  ACCEPTED, DONE this session.**
  `components/SessionAnalytics.jsx`/`components/SunshineStreamHistory.jsx`
  audited. Outcome: **0 conversions, 4 documented non-matches** —
  exactly as expected, back to the P6-T04–T06 pattern after P6-T07's
  one exception. `sa-spin 0.8s`/`ssh-pulse 1.6s` keyframes and both
  `150ms` hover transitions confirmed non-convertible/non-matching.
  Documenting `SessionAnalytics.jsx`'s spinner required reformatting a
  single-line inline JSX style object onto multiple lines — this
  session independently verified via whitespace/comment/trailing-comma
  normalization that the reformatting is purely cosmetic (one residual
  difference: a single space inside `style={ loading` vs.
  `style={loading`), not a behavioral change. Literal `diff -rq`
  against the exact dispatched baseline confirmed exactly the 2 scoped
  files changed and `package.json`/`package-lock.json` byte-identical
  (no leaked `playwright` trace). Fresh `npm install`/`lint`/`build`/
  `test`: 260 packages, 0 errors/4 warnings, 1858 modules, CSS
  unchanged 61.16KB, **JS unchanged 436.82KB / gzip 113.21KB — every
  figure in the Worker's report checked out exactly** (a useful
  confirmation after P6-T07's stale-claim correction). Browser QA not
  achieved this cycle either — notably, this session's sandbox had no
  pre-installed Chromium (unlike P6-T07's), useful evidence that
  browser-QA availability here is session-specific, not a fixed
  toolchain state. No inaccurate claims found. See CHANGELOG.md's
  "[P6] P6-T08 — Main Claude review: ACCEPTED" entry for the full
  record.

- **P6-T09 (feature-component transition/animation audit, batch 8) —
  DISPATCHED this session.** Re-swept `frontend/src` (still 30 files
  with `transition:`/`animation:`) and picked the next tier:
  `components/RecoveryStats.jsx` (466 lines, 3 occurrences) and
  `components/LogPanel.jsx` (425 lines, 5 occurrences — including a
  keyframe-`animation:` inside a raw inline `<style>` CSS-string block,
  a new pattern not yet seen in this audit, plus a duplicated
  `lp-spin 0.8s` keyframe on two separate icons, plus a `transition:
  "all 0.2s ease"` using the `all` shorthand property). Fresh
  inspection found all 8 values across both files are expected to
  remain non-matches: `RecoveryStats.jsx`'s `transform 0.2s` (200ms,
  same non-match precedent as `ErrorBoundary.jsx`), `badge-pulse 1.6s`
  (duplicate pulse pattern), and `150ms` hover transition;
  `LogPanel.jsx`'s `scrollBounce 2s` (raw-CSS keyframe), two
  `lp-spin 0.8s` spinner instances, `150ms` pill-button transition, and
  `all 0.2s ease` scroll-button transition. Full prompt in
  `CURRENT_TASK.md`.

- **P6-T10 (feature-component transition/animation audit, batch 9) —
  ACCEPTED, DONE.** `components/HostStatusPanel.jsx`/
  `components/SessionHistory.jsx` audited. Outcome: **0 conversions,
  12 documented non-matches** — `hsp-spin`/`sh-spin` keyframes and all
  150ms-family transitions confirmed non-matching against `motion`'s 4
  real steps. The Worker's own session had network access and ran a
  clean baseline-before/byte-identical-build-after cycle; the review
  session (no network access that cycle) relied on a literal `diff -rq`
  against the dispatched baseline plus an independent re-trace of
  `sh-spin`'s declaration/application sites. One documentation-only
  correction made (a stale `HANDOFF.md` top-of-file status line). See
  CHANGELOG.md's "[P6] P6-T10 — Main Claude review: ACCEPTED" entry.

- **P6-T11 (feature-component transition/animation audit, batch 10) —
  ACCEPTED, DONE.** `components/GameManager.jsx` audited alone (largest
  remaining unaudited file, scoped single-file to keep batch size
  consistent). Outcome: **0 conversions, 13 documented non-matches** —
  the dispatch listed 12 but the Worker's fresh grep found a 13th
  (`backButton`'s `transition: "color 150ms ease"`), independently
  re-confirmed by this review session's own grep. All 4 `gm-spin 0.8s`
  spinner instances and all 9 `transition:` declarations (150ms/`ease`
  throughout) confirmed non-matching. **First review session since
  P6-T08 with working network access** — ran a fully independent `npm
  ci`/lint/build/test against the delivered tree from scratch, every
  figure matching the Worker's report exactly (0 errors/4 warnings,
  61.16 kB CSS / 436.82 kB JS, 24/24 tests). See CHANGELOG.md's "[P6]
  P6-T11 — Main Claude review: ACCEPTED" entry.

- **P6-T12 (feature-component transition/animation audit, batch 11) —
  ACCEPTED, DONE.** `components/StartSessionForm.jsx` (1123 lines)
  audited alone. Outcome: **0 conversions, 6 documented non-matches**
  — 5 separate 150ms-family `transition:` declarations (`inputStyle`'s
  `border-color`, the browse-library-toggle's `background`/`color`,
  the chevron's `transform`, the skip-timer track's
  `background`/`border-color`, the skip-timer knob's
  `left`/`background`) plus one `animation: "card-in 180ms ease
  forwards"` keyframe reference on the launched-confirmation div,
  confirmed non-matching on both disqualifying grounds (named-keyframe
  `animation:` vs. `motion`'s `transition:`-only exports; `ease` vs.
  `pill`'s `cubic-bezier(0.4,0,0.2,1)`). This continuation session
  independently reran `npm ci`/lint/build/test from scratch (0
  errors/4 warnings, 61.16 kB CSS / 436.82 kB JS, 24/24 tests — exact
  match to the Worker's report) plus a direct source-level recount and
  attribute count. See CHANGELOG.md's "[P6] P6-T12 — Main Claude
  review: ACCEPTED" entry.

- **P6-T13 (feature-component transition/animation audit, batch 12) —
  ACCEPTED, DONE.** `components/SunshineClientManager.jsx` (976 lines)
  audited alone. Outcome: **0 conversions, 11 documented non-matches**
  — 6 `transition:` declarations (`iconGhostButton`, a danger-outline
  button, `cardDeleteButton`, `deleteAllButton`, `inputStyle`,
  `saveButton`, all 150ms/`ease`) plus 4 `scm-spin 0.8s linear
  infinite` and 1 `scm-pulse 1.6s ease-in-out infinite` keyframe
  `animation:` references, confirmed non-matching on the same "no
  valid conversion target" grounds established for every prior
  spinner/pulse pattern. This continuation session independently
  reran `npm ci`/lint/build/test from scratch (exact match to the
  Worker's report) plus a direct source-level recount of all 11
  values, a direct diff against the P6-T12 baseline confirming only
  comment additions, a full-repo diff confirming zero out-of-scope
  changes, and an attribute count. See CHANGELOG.md's "[P6] P6-T13 —
  Main Claude review: ACCEPTED" entry.

- **D-011 recorded** ahead of the next task: `motion` has no CSS
  custom-property backing, so CSS-file `transition:`/`animation:`
  values are documented-only this phase, even for literal-value
  matches (like several of `feature-page.css`'s `160ms ease`
  occurrences) — converting would require new `--motion-*` custom
  properties, out of this phase's scope. See DECISIONS.md's "D-011"
  entry.

- **P6-T14 (CSS-file transition/animation audit, `Login.css`) —
  ACCEPTED, DONE.** Small pilot task (2 values, both `0.15s ease`)
  validating the CSS-audit methodology per D-011. Outcome: **0
  conversions, 2 documented non-matches** — both `transition: 0.15s
  ease` occurrences (`.form`, `.button1/.button2/.button3`) confirmed
  as genuine non-matches (no `motion` step is 150ms), documented with
  a CSS-comment adapted from the `SunshineClientManager.jsx`/
  `StartSessionForm.jsx` JS precedent. `Login.css` confirmed unimported
  anywhere in the codebase (grep + `Login.jsx` import-list read) — zero
  visual risk, exactly as expected. This continuation session
  independently reran `npm ci`/lint/build/test from scratch (exact
  match to the Worker's report, including the identical CSS content
  hash) plus scope isolation via `find -newer` (no baseline zip
  available). See CHANGELOG.md's "[P6] P6-T14 — Main Claude review:
  ACCEPTED" entry.

- **`feature-page.css` recounted fresh** ahead of scoping the next
  task — the prior "~30 values" estimate undercounted. Actual: 14
  `transition:` lines / **39 individual property-duration values**,
  every one a genuine literal match to `motion.base` (35× `160ms
  ease`) or `motion.fast` (4× `100ms ease`) — the D-011 edge case, not
  an ordinary non-match, across the entire file. Plus 8 `animation:`
  lines (named-keyframe pulse/spin, ordinary non-matches) and 6
  unrelated `animation: none;` reduced-motion resets (out of scope).
  Confirmed live/rendered via `PageHeader.jsx`'s real `import
  "./feature-page.css"` — materially higher stakes than `Login.css`'s
  dead-CSS pilot. See CHANGELOG.md's "Fresh inspection ahead of the
  next task" entry.

- **P6-T15 (CSS-file transition/animation audit, `feature-page.css`)
  — ACCEPTED, DONE.** The larger follow-on to P6-T14, completing P6's
  motion-audit coverage across both `.jsx` inline styles and plain
  CSS. Outcome: **0 conversions, 22 documented declaration lines** —
  all 39 `transition:` property/duration values (14 lines) documented
  with D-011's specific "matches `motion.X` in value, but no CSS-side
  token exists" wording (including correct dual-naming on 4 lines
  mixing `160ms`/`100ms` groups); all 8 `animation:` named-keyframe
  lines documented as ordinary non-matches; the 6 `animation: none;`
  reduced-motion resets confirmed byte-identical/untouched. This
  continuation session independently reran `npm ci`/lint/build/test
  from scratch (exact match), diffed a freshly-built baseline `dist/`
  against the delivered build byte-for-byte (zero differences), and
  diffed the delivered file against the dispatched baseline (exactly
  22 pure-insertion hunks, zero change/delete hunks — directly proves
  no selector/property/value was modified). The Worker's browser-QA
  attempt (Chromium unusually reachable) was honestly reported as
  inconclusive rather than a false pass — accepted given the strength
  of the non-browser evidence for a comment-only change. See
  CHANGELOG.md's "[P6] P6-T15 — Main Claude review: ACCEPTED" entry.

**P6 (Motion + Micro-interactions) is now fully DONE** — every feature
component's `.jsx` inline styles and both CSS files with `transition:`/
`animation:` values are audited against `motion`. D-011's deferred
`--motion-*` custom-property question was explicitly considered and
deferred (not actioned) — it's a materially different, root-theme-CSS-
affecting change that deserves its own scoping discussion, not an
automatic P6 follow-on. See CHANGELOG.md's "P6 phase closed — moving
to P7" note.

## P7 — Responsive + Accessibility Refinement
**Status:** DONE. All 9 tasks (P7-T01 — P7-T09) ACCEPTED; CC-8 closed
without a dedicated task per D-013 (see below).

- Objective: Full pass at 1440/1024/768/390/360 across every page,
  plus a real accessibility audit (not just spot checks during P2-P6).

- **P7-T01 (full breakpoint + accessibility audit, documentation-only)
  — ACCEPTED, DONE.** Following the same pattern P0-T01 used to open
  the whole project: a findings-only audit across all 13 pages × the 5
  canonical breakpoints plus a real accessibility pass — zero code
  changes, producing `.ai/P7_AUDIT_FINDINGS.md` (10 cross-cutting
  findings + full per-page tables for all 13 pages: 3 blocker, 2 high,
  3 medium, 2 low, plus 2 confirmed-clean reference implementations).
  This succeeded on the 5th attempt at this task — the original
  dispatch and three narrower re-scopings (P7-T01a, P7-T01a-i,
  P7-T01a-i-finish) each failed to produce a real delivery before a
  session finally ran the original, unsplit scope to completion. Main
  Claude independently reran lint/build/test, confirmed the delivered
  `frontend/` is byte-identical to the dispatched baseline, and
  spot-checked 5 specific findings directly against source — all
  confirmed accurate. **This retires the entire split lineage.** See
  CHANGELOG.md's "[P7] P7-T01 — Main Claude review: ACCEPTED" entry.

- **P7-T02 (fix CC-1: header wordmark clipping at 390px) — ACCEPTED,
  DONE.** The first bounded fix task. Breakpoint shifted from
  `max-width: 360px` to `480px` (paired `min-width` too), chosen after
  real-rendering both candidate fixes and picking the cleaner result.
  Main Claude independently confirmed scope isolation, reran lint/
  build/test, and did a byte-for-byte build-output comparison. See
  CHANGELOG.md's "[P7] P7-T02 — Main Claude review: ACCEPTED" entry.

- **P7-T03 (fix CC-2: inconsistent stat-tile truncation at 1024px) —
  ACCEPTED, DONE.** `DashboardStats.jsx`'s label-text block now
  matches its value-text sibling's `textOverflow: ellipsis` treatment.
  Main Claude independently confirmed scope, reran lint/build/test,
  and content-diffed the build output. See CHANGELOG.md's "[P7] P7-T03
  — Main Claude review: ACCEPTED" entry.

- **P7-T04 (fix CC-9: unlabeled form inputs) — ACCEPTED, DONE.** Added
  `aria-label` to 11 fields across `GameManager.jsx`/
  `StartSessionForm.jsx`, mirroring `Login.jsx`'s pattern. Main Claude
  independently confirmed scope, the "Game" field's pre-existing-label
  claim, and content-diffed the build output. See CHANGELOG.md's "[P7]
  P7-T04 — Main Claude review: ACCEPTED" entry.

- **P7-T05 (fix CC-3/CC-4: theme contrast failures) — ACCEPTED,
  DONE.** New per-theme `--color-ink-ghost`/`--color-ink-faint` hex
  values (HSL-lightness increase, same hue/saturation family) clear
  WCAG AA 4.5:1 against each theme's hardest surface (`surface-l3`)
  across all 6 themes, with a deliberate safety margin. Main Claude
  independently reran lint/build/test and **independently recomputed
  all 7 reported contrast ratios from scratch** (not just the 2
  HANDOFF asked for) — every value confirmed to genuinely clear 4.5:1.
  See CHANGELOG.md's "[P7] P7-T05 — Main Claude review: ACCEPTED"
  entry.

- **P7-T06 (fix CC-9 remainder: unlabeled inputs in
  `SunshineClientManager.jsx`/`SaveBrowser.jsx`) — ACCEPTED, DONE.**
  `aria-label` added to 3 controls (PIN input; Save Source select; a
  dynamic Archive/Backup select). The Worker's own session had no
  network access and honestly flagged lint/build/test as unrun; this
  review session had network access and closed that gap with a full
  independent rerun (0 errors/4 warnings, CSS byte-identical, JS
  +0.11 kB, 24/24 tests) plus content-diff confirmation of the exact 3
  additive lines. **CC-9 is now fully closed.** See CHANGELOG.md's
  "[P7] P7-T06 — Main Claude review: ACCEPTED" entry.

- **P7-T07 (fix CC-5: inline `outline:"none"` overriding the global
  focus-visible rule) — ACCEPTED, DONE.** All 6 flagged sites fixed
  with a clean single-line removal each (content-diff confirmed no
  other property touched). This session attempted a real Chromium
  install to verify visually and hit the same `403
  cdn.playwright.dev` allowlist error the Worker reported — confirming
  it's a genuine environment limitation, not a skipped step. Fresh
  lint/build/test all green, byte-identical CSS, sensible JS delta.
  **CC-5 is now closed.** See CHANGELOG.md's "[P7] P7-T07 — Main
  Claude review: ACCEPTED" entry.

- **P7-T08 (fix CC-6: stale QA fixtures) — ACCEPTED, DONE.**
  `qa/fixtures/mock-data.js`'s `config()`/`sessionHistory()`/`logs()`/
  `streamHistory()` all rewritten to match their real components'
  data-access patterns. The Worker found and fixed 3 further
  mismatches beyond the original 4 while re-deriving exact field lists
  from source (`played_seconds` not `duration_seconds`, Unix-seconds
  not ISO timestamps, missing detail fields in `sessionHistory()`;
  `logs()` returning objects where the component reads pre-formatted
  strings via `.includes("[ERROR]")`/`.includes("[WARNING]")`).
  This review session independently re-derived every field list from
  source itself (not just trusting the Worker's cross-reference) and
  confirmed every claim held up, confirmed `frontend/src/` was
  correctly untouched, and independently hit the same
  `cdn.playwright.dev` allowlist error attempting a live render.
  **CC-6 is now closed.** See CHANGELOG.md's "[P7] P7-T08 — Main
  Claude review: ACCEPTED" entry.

- **P7-T09 (fix CC-10: delete-button touch target) — ACCEPTED, DONE.**
  `cardDeleteButton` raised from `24×24px` to `44×44px` exactly as
  scoped, matching `StartSessionForm.jsx`'s precedent, no deviation
  needed. Verified: `iconAddButton`/`iconGhostButton`/`pickerButton`
  and the `Trash2` icon's own size untouched; the unrelated
  `deleteFormButton` (a separate, labeled button) correctly left
  alone; lint/build/test green; Chromium unreachable a fourth time
  this project (`cdn.playwright.dev` blocked), so visual confirmation
  used layout reasoning — independently re-checked and confirmed
  sound (220px grid columns, 18px padding, 44px button + 8px gap
  leaves ~130px+ for the title before wrap). One process note: this
  delivery didn't include its own CHANGELOG.md entry (every prior task
  had one) — added it during review, flagged so it doesn't become a
  pattern. **CC-10 is now closed.** See CHANGELOG.md's "[P7] P7-T09 —
  Worker delivery + Main Claude review: ACCEPTED" entry.

- **CC-8 — closed without a dedicated task, per D-013.** The finding's
  own text already says "this is solid — not a finding"; the one gap
  (page content not `inert`-gated while the drawer is open) already
  has working exits (Escape, backdrop-click). Fixing it means touching
  the app's main layout shell for a marginal, edge-case improvement —
  disproportionate blast-radius for the benefit versus P7's other 5
  fixes. See DECISIONS.md's D-013 for full reasoning and the
  well-understood fix path if this is revisited later.

**P7 is now fully DONE.** All findings from `P7_AUDIT_FINDINGS.md`
either fixed (CC-3/4/5/6/9/10) or explicitly closed with recorded
reasoning (CC-8).

## P7.5 — Typography, Spacing & Depth Refinement (Vercel-Inspired Principles)
**Status:** DONE — **P7.5-T01 DONE** and **P7.5-T02 DONE** (no
code change in either), **P7.5-T03 DONE** (small, bounded code change),
**P7.5-T04 DONE** (one small, bounded code change — see below).
**P7.5 is now fully complete, all 4 items closed.**

- **P7.5-T01 (audit `typeScale`'s tracking curve) — DONE this
  session, no change to `theme.js`.** Finding: the raw em ratio
  (hero 0.055em→heading 0.03em) looks like a steeper taper than
  Vercel's (0.05em→0.04em), but that's fully explained by PCGO
  covering a much bigger size jump per step (82px→28px, ~1.55
  octaves) than Vercel's equivalent step (48px→32px, ~0.59 octaves) —
  PCGO has one fewer intermediate role in this range, not a looser
  curve. Normalizing both to em-of-tracking-lost-per-octave-of-size
  shows PCGO's curve tracks Vercel's within ~6% at every comparable
  step: hero→heading 0.0161 em/oct (PCGO) vs. display-xl→heading-lg
  0.0171 em/oct (Vercel); heading→subheading 0.0278 em/oct (PCGO) vs.
  heading-lg→heading-md 0.0295 em/oct (Vercel). `subheading`→`body`
  (0.0301 em/oct, tapering the last step to exactly 0) has no direct
  Vercel analogue in this family but matches Vercel's own separate
  principle that running body copy stays at neutral (0) tracking
  regardless of size. Chromium/Playwright unreachable this session
  (`cdn.playwright.dev` blocked, `x-deny-reason: host_not_allowed`,
  as anticipated in `CURRENT_TASK.md`) — confirmed via em-to-px
  reasoning at each role's real rendered size instead, including
  `hero`'s full `clamp(42px, 6vw, 82px)` range (tracking stays a
  constant 5.5% of rendered size end to end, since it's em-based).
  Conclusion: the existing curve is deliberate and consistent;
  **no `letterSpacing` value changed.** Full reasoning in
  `CURRENT_TASK.md`'s delivery notes and this session's report.

- Objective: apply specific Vercel/Geist design principles the product
  owner chose to adopt — **within PCGO's existing dark theme system,
  no color/canvas change** — per D-012. This is a refinement pass, not
  a redesign: no `--color-*`/`--surface-*` values change, no new font
  families, no light-mode variant.
- Scope, per D-012's 4 adopted principles:
  1. **DONE as P7.5-T01** (see above) — no change to `typeScale`.
     Audit `typeScale`'s `heading`/`subheading` tracking against
     Vercel's size-scaled negative-tracking relationship (tighter at
     larger sizes) — `hero` already uses `-0.055em`; determine whether
     `heading`/`subheading` should follow a similarly deliberate,
     scaled relationship rather than their current values, and adjust
     if it's a genuine improvement (not adjustment for its own sake).
     **Considered and rejected: a strict golden-ratio (1.618) modular
     scale across all ~8 named roles** — that ratio produces jumps too
     large for a dense ops dashboard with this many named sizes
     (label/caption/body/subheading/heading/hero, etc.); it's also not
     what Vercel itself does (their scale is hand-tuned per step, not
     a fixed rational ratio, tightening tracking as size grows rather
     than scaling size by a constant multiplier). Instead: audit
     whether any individual step's jump feels uncomfortable and fix it
     locally, rather than forcing the whole scale onto one ratio.
  2. **DONE as P7.5-T02 this session, no change to `theme.js` or any
     `src/` file.** **Correction to the line struck out below**: PCGO
     *does* already have a formal `spacing` export in `theme.js`
     (`xs:4, sm:8, md:12, base:16, lg:20, xl:24, xxl:32, xxxl:40,
     huge:48, massive:64` — closely matching Vercel's own 4px-base
     ladder). The real finding is a **usage gap**, and it's more severe
     than this section previously stated: independently re-grepped
     this session (`import { ... spacing ... } from ".../theme.js"`,
     then confirmed with an exact `spacing\.(xs|sm|md|base|lg|xl|xxl|
     xxxl|huge|massive)` usage search) — `spacing.*` is actually
     imported and used in **exactly 1 file** (`dashboard/layout/
     MainContent.jsx`), not 3 as an earlier pass in this section
     claimed. That one usage (`spacing.xl`/`spacing.xxl`/
     `spacing.massive` in a `padding` shorthand) is itself internally
     consistent — no off-grid literal mixed in.
     - A from-scratch script tally of every hardcoded `px` value inside
       `padding*`/`margin*`/`gap`/`rowGap`/`columnGap` across `src/`
       (excluding `*.test.*`) found **36 files** using hardcoded
       values (vs. the 1 file above using tokens), with these as the
       most frequent: 91×10px, 84×8px, 68×12px, 54×6px, 35×7px,
       31×9px, 28×14px, 25×20px, 24×16px, 21×4px, 18×3px, 16×5px,
       15×11px, 15×1px, 15×2px, 14×18px, plus a long tail down to
       single occurrences (26px, 28px, 30px, 34px, 38px, 39px, 44px,
       50px, 56px, 72px, etc). Exact counts differ slightly from the
       earlier tally recorded in `CURRENT_TASK.md` (methodology
       difference — this pass counts every number inside multi-value
       shorthand like `"10px 12px"` as two hits), but the shape and
       conclusion are the same: on-grid values (8/12/16/20/24/32/40)
       are common only because they're common round numbers, and a
       comparable volume of off-grid values (10, 6, 7, 9, 14, 3, 5,
       11, 18, etc.) appears just as often, spread across the app.
     - Checked specifically for the one pattern that would justify a
       narrow fix — a component that otherwise consistently uses
       `spacing.*` tokens but has one clear near-miss literal (e.g.
       7px next to a component full of 8px-token usage, suggesting a
       typo). **No such case exists**, because only one file uses
       `spacing.*` at all, and that file has no stray literals to be
       a near-miss. Spot-checked the most common off-grid values
       (`"10px 12px"` padding shorthand, `44px`/`56px`/`38px`/`36px`/
       `72px` singletons in `Login.jsx`, `NotFoundPage.jsx`,
       `UserPanel.jsx`, `primitives.jsx`) — all are contextual,
       often responsive/media-query-specific choices (e.g. `Login.jsx`
       breakpoint padding), not isolated oversights near a grid step.
     - **Conclusion: zero confident candidates for a narrow fix under
       step 3's bar — zero code changes made**, matching P7.5-T01's
       outcome. The off-grid volume is real and the usage gap is real
       (and worse than the earlier "3 files" estimate — it's 1), but
       retrofitting 35+ already-accepted files onto a strict grid
       remains disproportionate risk for uncertain visual benefit, and
       is explicitly out of this task's scope per D-012/RULES.md's
       "no giant unjustified rewrites" principle. If `spacing.*`
       adoption is ever prioritized, it should be a deliberate,
       separately-scoped task (new components using it going forward,
       or a bounded per-component retrofit reviewed file-by-file) —
       not a byproduct of this audit.
     - Chromium/Playwright not needed this session — no code change
       was made, so there was nothing to visually confirm (task step 7
       only applies "if you do make any code change under step 3").
     - Baseline `lint`/`build`/`test` re-verified this session:
       lint 0 errors / 4 pre-existing warnings, build succeeds
       (~61KB CSS / ~439KB JS, ~113.5KB gzip), test 24/24 passing
       across 5 files (both consistent with the healthy baseline
       RULES.md already documents; the previously-noted `qa/render.mjs`
       lint regression was not present this run).
     ~~Audit existing spacing values used across the app against
     Vercel's 4px-base scale (4/8/12/16/24/32/40/64/96/128) as a
     reference ladder — PCGO doesn't currently have a formal spacing
     token system; determine whether inconsistencies exist worth
     fixing, and whether introducing a lightweight `spacing` export to
     `theme.js` (mirroring `typeScale`/`surface`'s existing pattern) is
     warranted, or whether it's scope beyond what's needed.~~
  3. **DONE as P7.5-T03 this session — one small, bounded code
     change**, unlike P7.5-T01/T02's "no change" outcomes. Re-confirmed
     all 8 `boxShadow` sites directly in the source (line numbers had
     not shifted from the dispatch note). Findings:
     - `components/ui/Toast.jsx`, `ErrorBoundary.jsx`,
       `ConfirmDialog.jsx` (dialogs/toasts), `dashboard/layout/
       MobileHeader.jsx`'s mobile nav drawer, and `pages/Login.jsx`'s
       login card — all five already correctly import and use the
       `shadow.overlay` **token** (`shadow.overlay`, not a duplicated
       literal). No change needed or made to any of these five files.
     - `components/HostStatusPanel.jsx` — no active `boxShadow`; the
       existing comment confirms a glow shadow was already removed in
       an earlier `DESIGN_SYSTEM.md` pass. Real prior project history
       of moving toward less shadow, not more — consistent with this
       task's direction, not evidence of anything to fix here.
     - **`components/LogPanel.jsx`'s `dropdownMenu`** hardcoded the
       literal `"0 18px 50px rgba(0,0,0,0.38)"` — byte-identical to
       `shadow.overlay`'s value — instead of importing the token.
       **Fixed:** added `shadow` to the file's existing `theme.js`
       import and replaced the literal with `shadow.overlay`. Pure
       token-usage consistency; the rendered value is unchanged, so
       this produces byte-identical CSS output (confirmed below).
     - **`components/LogPanel.jsx`'s `scrollButton`** (a small, 38px
       circular scroll-to-bottom FAB) used a third, different one-off
       literal — `"0 8px 24px rgba(0,0,0,0.45)"` — not in `theme.js`'s
       `shadow` export at all. Judged this a deliberate, meaningful
       difference rather than an oversight to fold away: a tighter
       blur/spread reads better on a small circular element than the
       large-panel `overlay` shadow would (the `overlay` value is
       tuned for a 420px-wide login card / large dropdown, not a
       38px button). **Fixed by naming it, not by silently keeping an
       unexplained magic literal**: added a new `shadow.small` export
       to `theme.js` (`"0 8px 24px rgba(0,0,0,0.45)"`, with an inline
       comment explaining the small-floating-element rationale) and
       pointed `scrollButton` at it. No third option (leaving the
       literal untouched) was chosen, since RULES.md's token-discipline
       expectation applies to *any* one-off value, not just duplicates
       of an existing token.
     - Net result: zero shadows added to or removed from any element
       that didn't already have one; only the *source* of two existing
       values changed (one to an existing token, one to a newly-named
       token for a genuinely distinct case). `dashboard/theme.js`'s
       `shadow` export now has two members (`overlay`, `small`)
       instead of one; no other export in that file touched.
     - Validation: baseline `lint`/`build`/`test` re-verified before
       editing (0 errors / 4 pre-existing warnings; build ~61KB CSS /
       ~439KB JS, ~113.5KB gzip; 24/24 tests across 5 files) and
       re-run after — identical results. Content-diffed the built CSS
       byte-for-byte before vs. after (`diff` on `dist/assets/*.css`):
       **identical**, confirming the `dropdownMenu` fix is exactly the
       zero-visual-change token swap it was expected to be (the
       `scrollButton` value's text was also unchanged, only its
       source moved into `theme.js`, so the CSS output was identical
       there too).
  4. **DONE as P7.5-T04 this session — the last P7.5 item, one small,
     bounded code change.** Directly confirmed the scale before
     starting: all 4 roles are heavily used (`ink` 91×/34 files,
     `inkDim` 63×/24 files, `inkFaint` 106×/32 files, `inkGhost` 9×/6
     files — 269 usages total), and no documented "when to use which"
     spec exists anywhere in `.ai/`. **Inferred semantic pattern**
     (derived from real usage, not a pre-existing spec): `ink` =
     primary content (titles, headings, primary values, focused/
     active/hover-brightened state); `inkDim` = secondary — most
     commonly the default (non-hover) state of interactive controls
     that brighten to `ink` on hover, plus secondary status/log text;
     `inkFaint` = tertiary — meta/label/caption text, sub-titles, IDs,
     hex strings, and (in the shared `dashboard/components/` shell)
     the default state of a specific sub-category of interactive
     control: minimal, borderless, icon+text navigational/utility
     links; `inkGhost` = most de-emphasized — input placeholders,
     decorative separators, unknown/fallback status dots, micro
     app-chrome subtitle text. **Sample checked (14 files across 3
     categories):** `dashboard/components/` — `PageHeader.jsx`,
     `SectionCard.jsx`, `DashboardStats.jsx`, `ActiveAlerts.jsx`,
     `NavigationCard.jsx`, `SessionSidebar.jsx`, `EmptyState.jsx`,
     `LoadingState.jsx`; `components/` (feature) — `SessionCard.jsx`,
     `GameManager.jsx`, `SessionHistory.jsx`, `StatusBadge.jsx`,
     `EventLog.jsx`, `RecoveryStats.jsx`, `LogPanel.jsx`,
     `SunshineStreamCard.jsx`, `HostStatusPanel.jsx`, `SaveBrowser.jsx`,
     `RecoveryEvents.jsx`, `SessionAnalytics.jsx`, `StartSessionForm.jsx`;
     `dashboard/pages/` — `GameManagerPage.jsx`, `SettingsPage.jsx`;
     `dashboard/layout/` — `DashboardHeader.jsx`. **Finding:** across
     9 sampled hover-to-`ink` interactive-control sites, 7 (in
     `components/`, plus `DashboardHeader.jsx`) default to `inkDim`,
     while exactly 2 — both in `dashboard/components/`
     (`PageHeader.jsx`'s shared `onBack` control, `SectionCard.jsx`'s
     refresh button) — default to `inkFaint` for the same interaction
     pattern. Within that split, one pair is genuinely the *same* UI
     role with no apparent reason for the difference:
     `GameManager.jsx`'s inline "Back to games" link (borderless,
     `ChevronLeft` icon + uppercase mono text, brightens to `ink` on
     hover) is functionally identical to `PageHeader.jsx`'s shared
     `onBack` control (used by 11 pages) — same borderless/icon+text/
     hover-to-`ink` shape — yet used `inkDim` where `PageHeader.jsx`
     uses `inkFaint`. The other `inkDim`-default sites checked
     (`LogPanel.jsx`'s filter pills, `RecoveryStats.jsx`'s detail
     toggle, etc.) are a visually distinct category — bordered/filled
     pill-style buttons, not borderless links — so leaving those as
     `inkDim` is not itself inconsistent. **Fix (1 file):**
     `GameManager.jsx`'s `backButton` default color and its
     `onMouseLeave` value both changed `colors.inkDim` →
     `colors.inkFaint`, aligning it to `PageHeader.jsx`'s established
     convention for this specific borderless-back-link role — not a
     general `inkDim`→`inkFaint` sweep (this file's other `inkDim`
     usages, e.g. `iconGhostButton`, are untouched). WCAG-AA safety
     reconfirmed rather than assumed — and, on Main Claude review,
     the original delivery's supporting citation was found inaccurate
     ("`inkFaint` documented at 4.56–4.59:1 in `App.jsx`" actually
     described `inkGhost`) and corrected: contrast independently
     computed from the raw hex values gives `inkFaint` vs. `surface-l3`
     across all 6 themes as amber 4.51:1, verdant 4.86:1, ember 4.63:1,
     classic 4.96:1, mono 4.59:1, oled 4.76:1 — every theme genuinely
     clears 4.5:1, so this swap introduces no contrast risk (see
     CHANGELOG.md's correction entry). No other
     genuine inconsistency met the bar in the sampled files — the
     ladder is otherwise used consistently enough, matching P7.5-T02's
     "audit turns up one contained item, not a systemic problem"
     outcome. `diff -rq` against the dispatched baseline confirms
     `GameManager.jsx` is the only `frontend/` file changed. lint 0
     errors/4 pre-existing warnings, build green (61.16 kB CSS
     byte-identical / 438.63 kB JS, +8 bytes from the 1-character-
     longer token name), test 24/24 — all independently reran
     pre- and post-edit.
- Dependencies: P7 (must be fully closed first — see D-012's phasing
  reasoning). Reference material: `.ai/VERCEL_DESIGN_REFERENCE.md`
  (primary), `.ai/NOTION_DESIGN_REFERENCE.md`/`.ai/APPLE_DESIGN_REFERENCE.md`
  (reviewed, not adopted — kept for context only).
- Acceptance: each of the 4 areas above audited with real findings
  (not assumed), any changes bounded to specific, justified
  improvements — not a wholesale visual overhaul — dark theme system
  fully intact, lint/build/test green, no regression to any
  already-accepted P1–P7 work.
- **Not yet scoped into individual Worker tasks** — will be broken
  into bounded tasks (following the same "audit first, dispatch fixes
  as separate bounded tasks" pattern P7 itself used) once P7 closes.

## P8 — Full Visual QA (adapted to API-Contract QA — see below)
**Status:** DONE — **P8-T01 ACCEPTED**, P8 fully complete. Two
backend-side findings flagged for `host-agent` maintainers (not
frontend fix tasks). Next: **P9**.

- Objective: End-to-end verification pass. Recommend standing up the
  real `host-agent` backend for this phase (see DECISIONS.md D-002)
  rather than the mock-route harness, to catch integration issues the
  mock can't.
- **Adaptation, decided this session:** true screenshot/render QA
  isn't possible in this sandbox — `cdn.playwright.dev` is outside the
  network allowlist, confirmed repeatedly across P7/P7.5, unrelated to
  which backend is used. Product owner chose (explicit decision, not
  an improvised fallback): proceed with **API-contract QA** instead —
  systematically verify every frontend component's real field reads
  against the real backend's real response shapes via direct HTTP
  requests, rather than visual screenshots.
- **P8-T01 dispatched this session.** Main Claude got the real backend
  running first (see below) and did an initial spot-check pass before
  dispatching the full systematic task.
  - **Found and locally patched one real backend bug** (not delivered
    as a fix — out of this project's `frontend/`+`.ai/`-only Worker
    scope, flagged for the `host-agent` maintainers instead):
    `host_agent/host_monitor.py` calls `sys.getwindowsversion()`
    unconditionally, crashing FastAPI's startup lifespan on any
    non-Windows host. Everything else nearby already correctly guards
    platform-specific calls the same way (`api/routes/system.py`'s DPI
    call), so this reads as a genuine oversight, not intentional
    design.
  - Confirmed frontend/backend are pre-wired for each other:
    `client.js`'s `BASE_URL` (`127.0.0.1:8100`) matches
    `app.py`'s CORS `ALLOWED_ORIGINS` (`localhost:5173`/
    `127.0.0.1:5173`, Vite's default port). Auth bootstrap/login work
    end-to-end.
  - Spot-checked `sessions/history`/`admin/logs`/`host/sunshine/history`/
    `sessions/active` — **all match exactly what P7-T08 already fixed
    in the mock fixtures**, a strong signal that P7-T08's reverse-
    engineering from component source was accurate. Spot-checked
    `host/status`/`host/metrics` field names against
    `HostStatusPanel.jsx` — all present.
  - One real finding: `/config/` has 11 sections, `SettingsPanel.jsx`
    reads 7. `network`'s fields are correctly `editable: false`
    (fine to omit). `cloud_sync` has 2 `editable: true` fields with no
    UI — **product owner confirmed this is a known future-phase gap**
    (this repo has `docs/roadmap`/`docs/phase25` folders), not a bug —
    explicitly not scoped into P8-T01.
  - Dispatched P8-T01 to continue this same kind of check
    systematically across every remaining major page, not just the
    sample Main Claude already spot-checked.

**P8-T01 delivered.** Full systematic field-by-field pass across every
major page (Home, Games, Sessions active/history/analytics/health,
Settings, Change Password, Logs, Users, Recovery, Sunshine
clients/stream/history, Saves, WebSocket contract, user-dashboard
adapter) — see `.ai/CURRENT_TASK.md`'s delivery section for the full
per-page breakdown. No `frontend/src/` changes made (findings
reported per the task's step 3, not fixed). Highlights:

- **Almost everything is clean.** Every field name, response wrapper
  key, and nested shape checked (games, session history/events/
  analytics including the computed `average_played_seconds`, config
  sections, users, recovery stats/events, all three Sunshine
  endpoints, saves, all 5 WebSocket broadcast types) matches exactly
  between the real backend and what each component reads. This is
  strong confirmation that P7-T08's mock-fixture reverse-engineering
  (and P5/P6's component work built on top of it) was accurate.
- **Two genuine mismatches found, both reported (not fixed):**
  1. `SessionCard.jsx` reads `session.restart_in_progress`,
     `session.restart_cooldown_remaining`, and `session.skip_timer` —
     none of which the backend ever sends on `/sessions/active` or
     `/sessions/:id`. Most visible effect: a session started with
     `skip_timer: true` still shows a "REMAINING" countdown instead of
     "NO TIMER". Candidate fix noted (echo the fields back
     server-side, or remove the dead frontend reads) but not applied —
     needs a product decision on which side should change, so left for
     a separate bounded fix task.
  2. `host/tailscale/status`'s `configured`/`ipn_recovery_enabled`
     fields are only present in `TailscaleController.detailed_status()`'s
     success branch — any host where the `tailscale` CLI call doesn't
     cleanly succeed (not installed, not authenticated, this sandbox's
     case) gets neither field, and `HostStatusPanel.jsx`'s "Configured"/
     "Recovery" badges silently read as "No"/"Disabled" as a result.
     This is a `host-agent`-side inconsistency (do-not-touch for this
     project's Worker scope) — flagged for whoever maintains
     `host-agent`, same as the earlier `host_monitor.py` platform-guard
     bug.
- Live-tested several state-changing flows end-to-end against the real
  backend: user CRUD, `config/session` update + reload + persistence
  round-trip, change-password + re-login, and a real `sessions/start`
  attempt (correctly blocked on "GPU is not available" — expected,
  not a bug, this sandbox has no GPU).
- Confirmed not-a-bug on closer inspection: the user-dashboard's
  `adaptUserHostStatus.js` doesn't flatten `health.disk_free_gb` the
  way admin's `/host/status` has it top-level, but `HostStatusPanel`
  (the only consumer of that field) is never rendered for user-role
  accounts, so this has no visible effect — checked, not assumed.
- P8 is now effectively complete for the API-contract-QA scope this
  phase was adapted to. The two findings above are small enough that
  they could either be folded into a short P8-T02 fix task or rolled
  into P9's regression pass — Main Claude's call on sequencing.

**Main Claude review: ACCEPTED, with two corrections and P8 marked
fully DONE.** Independently re-verified rather than trusting the
report:

- Confirmed both findings directly in source (`session_service.py`,
  `tailscale_controller.py`) and, for Finding 1, **proved via a live
  Pydantic test using the real `SessionStatusResponse` model** that
  `restart_in_progress`/`restart_count`/`last_restart_time`/
  `restart_cooldown_remaining` are computed server-side on every call
  and silently stripped at serialization because the response model
  doesn't declare them — sharper and more actionable than "candidate
  fix, uncertain if data exists." Also found `remaining_minutes`
  (which does pass through) is already `None` specifically when
  `skip_timer` is true — a usable proxy signal today, no backend
  change required, though not a precise drop-in equivalent.
- **Corrected Finding 2's exception-branch claim**: it does NOT omit
  both fields — `configured` (a cheap filesystem check) is genuinely
  present there, only `ipn_recovery_enabled` is missing. Confirmed
  live against this sandbox's actual backend (no `tailscale` binary,
  genuinely hits the exception branch): `GET /host/tailscale/status`
  returned a real `configured:false`, no `ipn_recovery_enabled` key.
  So the "Configured" badge is only broken in the non-zero-exit
  branch; "Recovery" is broken in both. The user-visible symptom and
  out-of-scope conclusion both still hold.
- Delivery format note: this delivery included only the 2 changed
  `.ai/` files rather than the full `.ai/` folder, unlike every prior
  task's convention (D-010, and P7.5-T01/T02's own "no code change"
  deliveries, which still shipped the complete `.ai/`). Not a
  blocking issue — merged into the maintained tree directly — but
  flagged so it doesn't become the norm.
- **Sequencing decision:** neither finding gets a dedicated frontend
  fix task. Both are genuinely backend-side (`host-agent/`), which is
  out of this project's Worker-orchestration scope (frontend+`.ai/`
  only, per RULES.md and D-014's precedent with the `host_monitor.py`
  bug). `SessionCard.jsx`'s three reads aren't a frontend bug in
  isolation — they're forward-looking reads for data a correctly-
  fixed backend should supply; removing them now would be a
  regression if/when `host-agent` adds the fields. Both findings are
  recorded here and in `.ai/CURRENT_TASK.md` for whoever maintains
  `host-agent` to act on, same treatment as the platform-guard bug.
- **P8 is now fully DONE.** Per this project's plan, **P9 (Regression
  + Final Freeze)** is next.

## P9 — Regression + Final Freeze
**Status:** DONE. P9-T01 (final full-repo validation + documentation
finalization) complete — fresh `lint`/`build`/`test` all green
(0 lint errors/4 pre-existing warnings, build succeeds, 24/24 tests
passing), `cdn.playwright.dev` unreachable this session (same
recurring, documented sandbox limitation), `CHANGELOG.md` read in full
and confirmed coherent/accurate, `HANDOFF.md`/`STATE.md`/`PLAN.md`
finalized for project closure. See CHANGELOG.md's "[P9] P9-T01"
closing entry.

- Objective: Full lint/build/test pass, final Worker corrections closed
  out, HANDOFF.md marked complete, CHANGELOG.md finalized.

**PROJECT CLOSED.** All 9 phases (P0–P9), including the P7.5
sub-phase, are DONE. See CHANGELOG.md's final entry and HANDOFF.md for
the closing summary.
