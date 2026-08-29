# PCGO Design Implementation Plan
### Companion to `DESIGN.md`, `PAGE_SPECS.md`, `COMPONENT_SPECS.md` — "Tactical Console Brutalism"

> Status: implementation-ready orchestration plan. This document contains **zero visual-design decisions** — every token value, radius, shadow, typography rule, and per-page/per-component instruction lives in the three upstream documents and is only *referenced* here (`DESIGN.md §x`, `PAGE_SPECS.md §y`, `COMPONENT_SPECS.md §z`). This document's job is sequencing, dependency ordering, worker-task sizing, parallelization safety, and verification — the "how do many disposable Claude sessions actually build this without colliding" layer.
>
> No application code, JSX, CSS, theme file, component, configuration, or package file was modified to produce this document. No other `.ai/design/` document was modified.

---

## 0. How to read this document

- **KEEP / EVOLVE / REPLACE / ADD** below always mean exactly what `DESIGN.md` §0 defined them to mean, and are only used here when directly quoting or summarizing an upstream classification — never invented fresh.
- This document does not restate token values, component contracts, or page-by-page visual rules. Every phase and task below tells a Worker **which files to open and which upstream section to implement**, not what the resulting CSS/JSX should literally say.
- **"MAIN"** = a Main Claude session (scopes/dispatches/reviews tasks, owns acceptance, updates `.ai/`). **"WORKER"** = a disposable Claude session that receives one bounded task, implements it, and delivers a full-repo zip per this project's established `D-010` full-repo-delivery convention (see §1.4 below — this convention is inherited from the prior, now-closed P0–P9 project and is assumed to still be Main Claude's default unless a new decision overrides it).
- This is a **new implementation project**, layered on top of a prior, fully-closed redesign project (`P0`–`P9`, "Calm Editorial + Layered Depth," `D-008`). To avoid any ambiguity with that closed project's phase numbering in `.ai/PLAN.md`/`.ai/CHANGELOG.md`, every phase in this document is prefixed **`TCB-`** ("Tactical Console Brutalism") — e.g. `TCB-P1`, `TCB-P4.3`. Main Claude should open a **new** `.ai/CURRENT_TASK.md` / `.ai/PLAN.md` entry (or a clearly-separated new section) for this project rather than resuming the old one, exactly as the closed project's own `HANDOFF.md` recommends for any future frontend work.
- Every file path below was verified by direct inspection of `frontend/src/` in this pass (via `find`/`grep`/`view`), not copied uncritically from either upstream document. Two small corrections to how the upstream documents describe file scope are called out explicitly where found (§1.5).

---

## 1. Verified facts this plan is built on

### 1.1 Stack (re-confirmed, not assumed)
React 18 + Vite, plain `.jsx`, no TypeScript, no Tailwind (removed in the prior project, `D-003`). 100% hand-written CSS + inline style objects referencing `frontend/src/dashboard/theme.js`. `lucide-react` icons. No animation library. Six themes via `[data-theme]` in `frontend/src/App.jsx`'s injected `GLOBAL_CSS` string.

### 1.2 Current token values (the literal "before" state Phase `TCB-P1` changes)
Read directly from `frontend/src/dashboard/theme.js`:
```
radius: { sm: 8, md: 12, lg: 16, full: 999 }
shadow: { overlay: "0 18px 50px rgba(0,0,0,0.38)", small: "0 8px 24px rgba(0,0,0,0.45)" }
motion: { fast: "100ms ease", base: "160ms ease", cardIn: "220ms ease", pill: "180ms cubic-bezier(0.4,0,0.2,1)" }
typeScale: { hero, heading, subheading, body, bodySmall, meta }  // 6 steps, no `metric` step yet
cardStyle: { ..., borderRadius: `${radius.lg}px` }  // literal-baked at module load; zero current consumers (grepped, no import sites) — flag only, no functional risk
```
This matches `DESIGN.md` §3/§5 exactly (`radius` still 3-step + full, `shadow` still 2 blurred entries, `motion` already has the 4 base tokens `DESIGN.md` §5.6 says to KEEP, `typeScale` already has 6 of 7 needed steps — `metric` is the one gap).

### 1.3 Governance state
The prior project (`P0`–`P9`, `.ai/STATE.md`/`.ai/HANDOFF.md`) is **closed**. Its `RULES.md` non-negotiables (source-of-truth hierarchy, functionality-freeze list, full-repo delivery, bounded Worker tasks, Main-Claude-owns-acceptance, browser QA required, checkpoint discipline) are sound engineering discipline independent of which design language is being implemented, and this plan assumes Main Claude will carry them forward for this new project rather than re-deriving them. Nothing in `DESIGN.md`/`PAGE_SPECS.md`/`COMPONENT_SPECS.md` contradicts them.

### 1.4 Full-repo delivery convention (inherited, load-bearing for §3's parallelization rules)
Per the prior project's `D-010`: Workers deliver the complete `frontend/` tree (minus `node_modules`/`.git`/`dist/`) plus updated `.ai/*`, and Main Claude diffs the delivered tree directly against the **last accepted baseline** with `diff -rq`. This detail matters for this plan specifically because it is the mechanism that makes **§3.2's `feature-page.css` warning** a real risk, not a theoretical one: if two Workers are dispatched from the same baseline snapshot and both touch the same shared file, whichever delivery is accepted second will silently overwrite the first Worker's changes to that file when Main Claude adopts the second full-repo tree, unless Main Claude manually merges the two diffs first. This plan is written to avoid ever putting Main Claude in that position.

### 1.5 Corrections to upstream documents (repo wins, per `RULES.md`'s source-of-truth hierarchy)
- `PAGE_SPECS.md` §2 titles the Login section "`pages/Login.jsx` + `styles/Login.css`". Verified this pass: `Login.css` is **not imported anywhere** (`grep -rn "Login.css" frontend/src` → zero matches) — this matches the prior project's own independently-recorded finding (`P6-T14`). All of Login's styling (`inputStyle`, the form panel, feature pills, banners — everything `PAGE_SPECS.md` §2's EVOLVE list names) is inline in `Login.jsx` itself. `TCB-P5` below scopes `Login.jsx` only; `Login.css` is out of scope and should stay untouched (verifying it's still unimported is a one-line check worth keeping in that task's verification step, in case it was wired up since the last check).
- `COMPONENT_SPECS.md` §6 step 4 groups `SectionCard.jsx`, `PageHeader.jsx`, `NavigationCard.jsx`, `DashboardStats.jsx`, `ActiveAlerts.jsx`, `SessionSidebar.jsx`, `EmptyState.jsx`/`LoadingState.jsx` together as all needing step 2 (`primitives.jsx`) first. Verified this pass via direct import grep (see §2 below): only `NavigationCard.jsx` (imports `Chip`) and `dashboard/components/EmptyState.jsx` (imports the `EmptyState` primitive) actually import from `primitives.jsx`. `SectionCard.jsx`, `PageHeader.jsx`, `DashboardStats.jsx`, `ActiveAlerts.jsx`, `SessionSidebar.jsx`, `LoadingState.jsx` import only `theme.js` (and, for `SectionCard`/`PageHeader`/`SessionSidebar`, `feature-page.css`) — they do **not** depend on `primitives.jsx`. This is a real, verified refinement that unlocks more parallelism than `COMPONENT_SPECS.md` §6 modeled (see §2.2/`TCB-P2` below); it does not contradict anything `COMPONENT_SPECS.md` states about the *contracts* themselves, only about *sequencing*.

---

## 2. Dependency graph

### 2.1 High-level shape
```
TCB-P0  Baseline & safety snapshot (docs only)
   |
TCB-P1  Token foundation (theme.js + App.jsx GLOBAL_CSS)              [MUST BE SERIAL — everything below cites these tokens]
   |
   +--------------------------------------------------------------+
   |  TCB-P2  Shared component layer (5 independent tracks)        |  <- all depend ONLY on TCB-P1, safe to run in parallel
   |    2A primitives.jsx        2B StatusBadge.jsx                |     with each other
   |    2C shell frame (Sidebar/DashboardHeader/MobileHeader)      |
   |    2D dashboard/components layer (6 files, no primitives dep) |
   |    2E feedback/dialog layer (Toast/ConfirmDialog/ErrorBoundary)|
   +--------------------------------------------------------------+
   |
TCB-P3  Chip/EmptyState-primitive followups (NavigationCard.jsx,       [depends on 2A only; small, serial-or-parallel either way]
        dashboard/components/EmptyState.jsx)
   |
TCB-P4  Page implementation — 12 page-level tasks                     [depends on TCB-P1 + TCB-P2 + TCB-P3 fully landed;
        (Home, Host Monitor, Recovery, Sunshine, Game Manager,         SHOULD NOT BE PARALLEL WITH EACH OTHER — see §3.2 —
        Users, Analytics, Session History, Logs, Settings,             process in the listed order]
        Change Password, Not Found)
   |
TCB-P5  Login (reference implementation, done last on purpose)        [depends on TCB-P1 + TCB-P2 only; deliberately sequenced
                                                                         after TCB-P4 so every other page can be checked
                                                                         against an unchanging reference point]
   |
TCB-P6  Motion / state-transition verification pass                   [depends on all of the above landing]
   |
TCB-P7  Responsive verification pass                                  [depends on TCB-P6]
   |
TCB-P8  Global visual QA + Definition of Done                         [depends on TCB-P7]
```

### 2.2 Why `TCB-P2` has 5 parallel tracks, not one serial chain
Verified via direct `grep -n "^import"` against every file in the shared-component layer (see §1.5's correction):

| File | Imports `primitives.jsx`? | Imports `StatusBadge.jsx`? | Depends on |
|---|---|---|---|
| `components/ui/primitives.jsx` | — (defines it) | no | `theme.js` only |
| `components/StatusBadge.jsx` | no | — (defines it) | `theme.js` only |
| `dashboard/layout/Sidebar.jsx`, `DashboardHeader.jsx`, `MobileHeader.jsx` | no | no | `theme.js` only |
| `dashboard/components/PageHeader.jsx`, `SectionCard.jsx`, `DashboardStats.jsx`, `ActiveAlerts.jsx`, `SessionSidebar.jsx`, `LoadingState.jsx` | no | no | `theme.js` (+ `feature-page.css` for 3 of these) |
| `components/ui/Toast.jsx`, `ConfirmDialog.jsx`, `ErrorBoundary.jsx` | no | no | `theme.js` only |
| `dashboard/components/NavigationCard.jsx` | **yes** (`Chip`) | no | `theme.js` + `primitives.jsx` |
| `dashboard/components/EmptyState.jsx` (wrapper) | **yes** (`EmptyState` primitive) | no | `theme.js` + `primitives.jsx` |
| `components/SessionCard.jsx` | **yes** (`Card`, `Button`) | **yes** | `theme.js` + `primitives.jsx` + `StatusBadge.jsx` |

This means only 2 files (`NavigationCard.jsx`, `dashboard/components/EmptyState.jsx`) and one page-consumed domain component (`SessionCard.jsx`, handled inside `TCB-P4.1` Home, since it has no other consumer) genuinely need `primitives.jsx` to land first. Everything else in the shared-component layer can be dispatched **the moment `TCB-P1` is accepted**, in up to 5 simultaneous Worker sessions, because none of the 2A–2E file sets import from one another.

### 2.3 Why `TCB-P4` (pages) is a dependency-safe *set* but an execution-serial *sequence*
Verified via `grep -rln "feature-page.css"`: only 4 files import it directly (`StartSessionForm.jsx`, `PageHeader.jsx`, `SectionCard.jsx`, `SessionSidebar.jsx`) — but because Vite bundles CSS globally and `PageHeader.jsx` is rendered on every routed page, this one 3,799-line file's rules apply app-wide regardless of which specific page a user is viewing. Per-page CSS lives in this **single shared physical file**, organized as one BEM block per page (`.pcgo-session-history*`, `.pcgo-game-manager*`, `.pcgo-host-*`, etc., confirmed via direct grep of the file's selectors). No page's `.jsx` files import any other page's `.jsx` files (confirmed — pages are architecturally independent), so the 12 page tasks in `TCB-P4` are **logically parallel-safe**. But per §1.4, two Workers editing different BEM blocks of the same physical `feature-page.css` file, dispatched from the same baseline and delivered as full-repo zips, will cause the second-accepted delivery to silently clobber the first's CSS edits. **Resolution used by this plan:** `TCB-P4`'s 12 tasks are dispatched and accepted **one at a time**, in the order listed in §5's table — not truly concurrently — even though nothing about their *content* requires this. This is a scheduling constraint, not a design dependency, and is called out per-task below so a future Main Claude doesn't mistake it for one. (If genuine concurrency is ever wanted: either split each page task into a "`.jsx`-only" sub-task plus a serially-dispatched "`feature-page.css` block" sub-task, or split `feature-page.css` into one file per page first — both are code-architecture decisions outside this document's scope, matching this plan's own instruction to defer architecture changes not required by the visual language itself.)

---

## 3. Parallelization summary (per the task brief's required MUST/CAN/SHOULD-NOT framing)

**MUST BE SERIAL:**
- `TCB-P0` → `TCB-P1` → (`TCB-P2` as a group) → `TCB-P3` → (`TCB-P4` as a group) → `TCB-P5` → `TCB-P6` → `TCB-P7` → `TCB-P8`. Each named stage's *acceptance* must complete before the next stage's tasks are dispatched, because every stage cites tokens/components the previous stage introduces or corrects.

**CAN BE PARALLEL (genuinely safe — different files, no shared-file conflict):**
- `TCB-P2`'s 5 tracks (2A–2E) — dispatch simultaneously once `TCB-P1` is accepted.
- `TCB-P3`'s 2 tasks (`NavigationCard.jsx`, `EmptyState.jsx` wrapper) — dispatch simultaneously once `TCB-P2` (specifically 2A) is accepted; trivial enough that a single Worker doing both in one task is also reasonable, see §5.

**SHOULD NOT BE PARALLEL (logically independent, but a real shared-file collision risk exists):**
- `TCB-P4`'s 12 page tasks — see §2.3. Dispatch and accept one at a time in the §5 order.
- Nothing else in this plan carries this risk; it is specific to `feature-page.css`'s shared-file structure.

---

## TCB-P0 — Baseline & Safety Snapshot

### Objective
Establish a fresh, genuinely-re-run validation baseline and a small set of "current state" facts before any code changes land, so every later phase's Worker/Main-Claude verification has something concrete to diff against — matching this project's inherited discipline of never trusting a claim without re-verifying it.

### Why this phase comes here
Nothing below can be judged "unchanged" or "regressed" without a fresh baseline. The prior project's own P0-T01/P9-T01 pattern (audit-first, verify-don't-assume) is the right model to reuse rather than skip.

### Files / areas affected
None (read-only). Output is a new `.ai/` note (Main Claude's choice: a new `TCB_STATE.md`, or a clearly-marked new section appended to a fresh `.ai/CURRENT_TASK.md` for this project — see §0's numbering note).

### Components affected
None.

### Design references
None — this phase is pure verification, not design work.

### Tasks
1. Fresh `npm install` / `npm run lint` / `npm run build` / `npm run test` in `frontend/`. Record exact figures (error/warning counts, CSS/JS byte sizes, test pass count) — expect to reproduce the prior project's closing state (0 lint errors / 4 pre-existing warnings, build succeeds, 24/24 tests) since no code has changed since `P9-T01`; if it doesn't match, stop and investigate before proceeding, don't proceed on an unexplained drift.
2. Confirm `radius`/`shadow`/`motion`/`typeScale` in `theme.js` still match §1.2 above (guards against this plan being executed against a repo state that has silently drifted since this document was written).
3. Confirm `Login.css` is still unimported (§1.5's correction) — one grep, cheap insurance against re-litigating a wrong assumption later.
4. If `frontend/qa/render.mjs` (Playwright) is reachable in this session's sandbox, capture one "before" screenshot each of Login and Home at 1440px as visual anchors for later QA comparison. If not reachable (this project's own history shows `cdn.playwright.dev` is frequently blocked by sandbox network egress), note that explicitly and proceed without it — this is not a blocker, per the prior project's own repeated precedent.

### Dependencies
None — this is the first task.

### Risk
None — read-only.

### Preserve
Everything (nothing is being changed).

### Verification
Steps 1–4 above are themselves the verification.

### Completion criteria
A written baseline record exists in `.ai/` covering: exact lint/build/test figures, confirmation of §1.2's token values, confirmation of §1.5's `Login.css` finding, and (if available) two anchor screenshots. `TCB-P1` may begin.

---

## TCB-P1 — Design Token Foundation

### Objective
Land every new/changed token `DESIGN.md` §5 defines, in `theme.js` and `App.jsx`'s `GLOBAL_CSS`, as backward-compatible additions/aliases — no visual change to any *currently rendered* pixel yet, since nothing downstream consumes the new tokens until `TCB-P2`+.

### Why this phase comes here
Every component contract in `COMPONENT_SPECS.md` §3 and every page instruction in `PAGE_SPECS.md` cites these token names by name (`radius.none`, `shadow.press`, `typeScale.metric`, etc.). `COMPONENT_SPECS.md` §6 step 1 and `PAGE_SPECS.md` §15's closing note both independently confirm this must land first, before literally anything else in this plan.

### Files / areas affected
- `frontend/src/dashboard/theme.js`
- `frontend/src/App.jsx` (only the `GLOBAL_CSS` template string / per-`[data-theme]` blocks — no JSX/component logic in this file changes)

### Components affected
None directly (no `.jsx` component outside these two files is touched this phase) — but this phase is the prerequisite for every component phase after it.

### Design references
`DESIGN.md` §5 (all of it: §5.1 color/`accentLilac` reassignment, §5.2 `typeScale.metric`, §5.3 radius binary system + aliasing guidance, §5.4 border usage guidance — no new border tokens, only usage rules that apply later, §5.5 shadow family, §5.6 motion aliases, §5.7 texture permission — no code this phase, §5.8 geometric vocabulary — reference table, no code this phase).

### Tasks
1. **Radius:** add `radius.none` (`0px`), `radius.tight` (`4px`) to `theme.js`'s `radius` export. Per `DESIGN.md` §5.3's explicit migration guidance, keep `radius.sm`/`radius.md`/`radius.lg` as deprecated aliases pointing at the new values (`sm = tight`, `md = lg = none`) so every existing consumer across the app keeps working with zero code change outside this file, exactly like `D-009`'s precedent for `surface`. Leave `radius.full` unchanged.
2. **Shadow:** add `shadow.flat` (`none`), `shadow.press`, `shadow.lift`, `shadow.focusRing` per `DESIGN.md` §5.5's exact values. Leave `shadow.overlay` unchanged (narrowed *usage*, not value, per §5.5 — that's a later-phase consumer concern). `shadow.small` (pre-existing, unrelated to this migration) stays as-is.
3. **Typography:** add the `typeScale.metric` step per `DESIGN.md` §5.2's exact spec (`clamp(22px, 3vw, 34px)`, mono, tabular-nums, weight 700). The other 6 `typeScale` steps are unchanged.
4. **Motion:** add `motion.press` (alias of `motion.fast`), `motion.hover` (alias of `motion.base`), `motion.entrance` (alias of `motion.cardIn`), and `motion.transition` (`220ms cubic-bezier(0.34, 1.15, 0.64, 1)` — a **new value**, not an alias, per `DESIGN.md` §5.6). `motion.fast`/`base`/`cardIn`/`pill` stay unchanged and keep working for any consumer not yet migrated to the new alias names.
5. **`cardStyle`'s baked-in radius:** update its `borderRadius` to reference the new `radius.none` value (it currently bakes `radius.lg`). Per §1.2, this export has zero current consumers — this is a correctness fix so the export isn't quietly wrong if something starts using it later, not a visual-risk item.
6. **Color:** assign `accentLilac` its new fixed semantic job (orchestration/automation events) per `DESIGN.md` §5.1 — this is a documentation/comment change in `theme.js` (the hex value doesn't change), since no component yet uses `accentLilac` for this meaning; actual usage is a `TCB-P4`/later concern if a page genuinely has an orchestration-event surface to color (flag as likely N/A for the current 13 pages — verify during this task rather than assume, and if genuinely unused, just land the semantic comment/intent without inventing a use site).
7. **`App.jsx`:** no new CSS custom properties are required by `DESIGN.md` §5 (radius/shadow/motion/typeScale live in `theme.js` only, not mirrored as CSS custom properties the way `colors`/`surface` are — confirm this is still true by checking whether any of the 6 `[data-theme]` blocks currently declare a `--radius-*`/`--shadow-*`/`--motion-*` custom property; if none do, as expected, this task's `App.jsx` scope is a no-op and should be reported as such, not silently skipped without checking).

### Dependencies
`TCB-P0` baseline recorded.

### Risk
Low. This phase is purely additive (new exports + backward-compatible aliases) — nothing existing changes value. The one genuine risk is a typo in an aliased value silently changing an already-shipped page's radius; mitigate by having the Worker's report show old-value → new-alias-value for every aliased token explicitly, and by Main Claude confirming the build output is **byte-identical** to the `TCB-P0` baseline (nothing downstream consumes the new tokens yet, so a byte-identical build is the expected, correct outcome and any diff is a red flag).

### Preserve
Every existing token name and value not explicitly listed above as changing. Every existing consumer of `radius.sm`/`radius.md`/`radius.lg`/`motion.fast`/`motion.base`/`motion.cardIn`/`motion.pill`/`shadow.overlay`/`shadow.small` must keep resolving to the exact same literal value it does today.

### Verification
`npm run lint` (0 errors, same 4 pre-existing warnings), `npm run build` (succeeds, **byte-identical output** to the `TCB-P0` baseline — confirm via `diff -rq` on `dist/`, not just matching file sizes), `npm run test` (24/24). A `diff -rq` against the `TCB-P0` baseline should show only `theme.js` and (if step 7 finds something to change) `App.jsx` differ.

### Completion criteria
All 6 new/changed token groups exist with the exact values `DESIGN.md` §5 specifies, every deprecated-alias mapping is correct, build output is byte-identical to baseline, lint/test are unchanged. `TCB-P2`'s 5 parallel tracks may be dispatched.

---

## TCB-P2 — Shared Component Layer (5 parallel tracks)

> Dispatch note: all 5 sub-phases below (`2A`–`2E`) can be given to 5 different Worker sessions **simultaneously** once `TCB-P1` is accepted — see §2.2/§3 for the verified import-graph evidence. Each is written as an independent task with its own allowed-files list; none overlaps another's files.

### TCB-P2A — Core primitives (`Button`, `Card`, `Chip`, `Spinner`, `EmptyState` primitive)

**Objective:** Migrate the single highest-blast-radius file in the app to the new token system.

**Why this phase comes here:** Per `COMPONENT_SPECS.md` §6 step 2, this file's Button/Card radius and shadow choices are inherited by nearly every page in the product, directly or via a page-local wrapper (`SessionCard`, Login, Change Password, Settings, Users, Game Manager, Host Monitor's Revalidate/Force-Unlock). Landing it right after tokens means most pages' button/card correctness is already solved before any page-specific work starts.

**Files / areas affected:** `frontend/src/components/ui/primitives.jsx`.

**Components affected:** `Button`, `Card`, `Chip`, `Spinner`, `EmptyState` (primitive). `Squiggle` is exported but has zero call sites anywhere in the tree (verified, `COMPONENT_SPECS.md` §1/§2's own finding) — do not spend effort migrating it beyond a trivial mechanical token swap if one is obvious; do not treat its absence of use as license to delete it (that's a code-architecture decision outside this document's scope).

**Design references:** `DESIGN.md` §6.1 (Button), §6.3 (Card), §6.4's `Chip` note (radius only — the semantic-tone-enforcement question is `COMPONENT_SPECS.md` §5 item 3, an explicit **out-of-scope-this-pass** API question, not a token question), §6.10 (`EmptyState` primitive's icon-well radius). `COMPONENT_SPECS.md` §3.1–§3.5 (or whichever subsections cover these 5 components — read them directly for the full per-variant contract) for exact per-variant token assignments.

**Tasks:**
1. `Button`: `radius.sm` → `radius.none`. `primary`/`dangerFilled` variants gain `shadow.press` at rest, compressing on `:active` (pairs with the existing `onMouseDown` → `translateY(1px)`, unchanged). `secondary`/`ghost`/`danger` stay `shadow.flat`. Add `shadow.focusRing` to the focus-visible state alongside the existing outline.
2. `Card`: default `radius.none` (was whatever soft value it currently uses — confirm exact current value before editing, per `RULES.md`'s "never trust prior claims" discipline even when the prior claim is this plan's own). Featured/flagship variant (if the primitive itself exposes one — confirm against `COMPONENT_SPECS.md` §3's actual contract) gets `borderInk` + optional `shadow.overlay`.
3. `Chip`: `radius.sm` → `radius.tight` (small-chrome exception, not `radius.none`).
4. `Spinner`: token-align any hardcoded radius/color if present; this component is largely motion/geometry-only and may need no change beyond confirming it has nothing to migrate.
5. `EmptyState` (primitive): icon-well radius → `radius.tight` per `DESIGN.md` §6.10.

**Dependencies:** `TCB-P1` accepted.

**Risk:** Medium — this is the highest-blast-radius file in the plan. A mistake here silently changes every page. Mitigate with the verification step below.

**Preserve:** All variant names/APIs/props (`variant="primary"` etc.), all existing interaction logic (mouse-down press, disabled/loading states, icon+label anatomy), all accessibility attributes.

**Verification:** `npm run lint`/`build`/`test` all green. Because this file has real, wide-reaching consumers, the build output will **not** be byte-identical this time (expected) — instead, verify via: (a) a full-tree grep confirming no other file needed a companion edit (none should, since consumers just re-render with the new inherited styles), (b) if Playwright is reachable, real renders of at least 2 pages that use `Button primary` (e.g. Login's submit button, Home's launch button) and 1 page using `Card` at each of the 5 canonical breakpoints, (c) confirm `radius.sm`/`md`/`lg` old-name consumers elsewhere in the tree still resolve correctly (spot-check a couple of call sites that haven't been migrated yet — they should visually match their *new* aliased value, not break).

**Completion criteria:** All 5 primitives migrated per the contracts above, lint/build/test green, at least one real render (or, if unavailable, a careful code-level trace) confirming Button/Card render correctly.

---

### TCB-P2B — `StatusBadge`

**Objective:** Confirm/apply `DESIGN.md` §6.4's "KEEP exactly" instruction, and — per `DESIGN.md` §8's motion table — add `motion.transition` on the badge's tone-change transition (this is genuinely new behavior, not just a token rename; see `TCB-P6` for the fuller motion-verification pass this seeds).

**Why this phase comes here:** Small, isolated, zero dependents inside this plan's shared-layer scope, safe to run fully parallel to `2A`/`2C`/`2D`/`2E`.

**Files / areas affected:** `frontend/src/components/StatusBadge.jsx`.

**Components affected:** `StatusBadge`.

**Design references:** `DESIGN.md` §6.4 (KEEP), §5.8 (dot = live/running state), §8's "State transition" row (`motion.transition` for badge tone changes).

**Tasks:**
1. Confirm current radius/geometry already matches the binary system (pill = `radius.full`, dot = `radius.full`) — `DESIGN.md` explicitly says this component is already correct; the task is to *verify*, and touch only what's actually wrong, not to change things preemptively.
2. If the tone-swap (e.g. `starting` → `running`) currently has no transition or uses a plain instant swap, add `motion.transition` on the color/background change per `DESIGN.md` §8 — this is the one genuine `motion.transition` consumer named explicitly in the design doc, so it's reasonable to land it here rather than deferring to `TCB-P6`, since the file is already open for this task. If it already animates via `motion.base`/`motion.hover`, confirm whether that's actually more correct per §8's distinction (state transition vs. hover) before changing it — don't convert reflexively.

**Dependencies:** `TCB-P1` accepted.

**Risk:** Low.

**Preserve:** `STATUS_CONFIG`'s session-status vocabulary and all existing props/API — this component's consumers (`SessionCard`, and possibly others found during `TCB-P4`) must keep working unchanged.

**Verification:** lint/build/test green. If a `motion.transition` change was made, spot-check that reduced-motion still collapses it correctly (per `DESIGN.md` §8's closing line: "All motion respects the existing global `prefers-reduced-motion: reduce` block").

**Completion criteria:** Radius confirmed/corrected, tone-transition motion confirmed/added, no regression to session-status rendering.

---

### TCB-P2C — Shell frame (`Sidebar`, `DashboardHeader`, `MobileHeader`)

**Objective:** Apply `PAGE_SPECS.md` §1's shell-wide changes: nav-row radius, header-control radius, active-row accent-bar width.

**Why this phase comes here:** Depends only on `TCB-P1`'s tokens; independent of every other `TCB-P2` track (confirmed, §2.2's import table — none of these 3 files import `primitives.jsx`, `StatusBadge.jsx`, or the `dashboard/components` layer).

**Files / areas affected:** `frontend/src/dashboard/layout/Sidebar.jsx`, `DashboardHeader.jsx`, `MobileHeader.jsx`. (Not `DashboardLayout.jsx`/`MainContent.jsx` — `PAGE_SPECS.md` §1 explicitly says KEEP those entirely, layout mechanics are unaffected.)

**Components affected:** `Sidebar`, `DashboardHeader`, `MobileHeader`.

**Design references:** `PAGE_SPECS.md` §1 in full (this section is short and entirely about this file set — read it directly rather than duplicating it here).

**Tasks:**
1. `Sidebar.jsx` nav-row radius: `radius.sm` (8px) → `radius.tight` (4px) — the documented, deliberate exception, not `radius.none`.
2. `Sidebar.jsx` active-row accent bar: `2px` → `3px`, same `colors.brand`, same `left: -15px` placement.
3. `DashboardHeader.jsx`: mobile-menu button + logout button radius → `radius.tight`.
4. `MobileHeader.jsx`: drawer close button + drawer nav rows → `radius.tight`. Drawer's own `shadow.overlay` and slide-in transform/transition mechanism: KEEP unchanged (`PAGE_SPECS.md` §1 is explicit this is already a correct floating-layer use).

**Dependencies:** `TCB-P1` accepted.

**Risk:** Low — small, well-scoped, four radius/width value changes across 3 files.

**Preserve:** All layout mechanics, the 880px sidebar-collapse breakpoint (do not touch), focus-trap/`inert` handling in `MobileHeader`, header content hierarchy, `motion.pill`'s existing use on nav hover (`PAGE_SPECS.md` §1's Motion note: do not convert the drawer's own 220ms cubic-bezier to `motion.transition` — that token is for state transitions, not this drawer's entrance).

**Verification:** lint/build/test green. If Playwright is reachable, render the shell at all 5 canonical breakpoints (1440/1024/768/390/360), specifically confirming the ≤880px sidebar-collapse-to-mobile-menu behavior still triggers correctly (this is `DESIGN.md` §9's "primary structural breakpoint," explicitly protected).

**Completion criteria:** All 4 EVOLVE items from `PAGE_SPECS.md` §1 applied, 880px breakpoint behavior unchanged, no other visual change.

---

### TCB-P2D — `dashboard/components` shared layer

**Objective:** Token-migrate the shared page-chrome layer every routed page (except Login) inherits from.

**Why this phase comes here:** Per §1.5's correction, these 6 files depend only on `TCB-P1`'s tokens, not `primitives.jsx` — safe to run fully parallel with `2A`/`2B`/`2C`/`2E`.

**Files / areas affected:** `frontend/src/dashboard/components/PageHeader.jsx`, `SectionCard.jsx`, `DashboardStats.jsx`, `ActiveAlerts.jsx`, `SessionSidebar.jsx`, `LoadingState.jsx`.

**Components affected:** `PageHeader`, `SectionCard` (shared), `DashboardStats`, `ActiveAlerts`, `SessionSidebar`, `LoadingState`.

**Design references:** `DESIGN.md` §6.3 (Card family, for `SectionCard`'s radius/border treatment), §6.10 (`LoadingState`'s skeleton-pulse radius). `COMPONENT_SPECS.md` §2/§3's entries for each of these 6 components (read directly — each has its own contract; `SectionCard` shared vs. `SectionCard` local in `HostStatusPanel.jsx` are **confirmed distinct, do-not-consolidate** per `COMPONENT_SPECS.md` §2). `PAGE_SPECS.md` §3's `DashboardStats` note (promote tile values to `typeScale.metric` — this is the one genuine typography change in this group, not just radius).

**Tasks:**
1. `SectionCard.jsx` (shared): radius → `radius.none`, confirm border/background token usage is current-value-preserving aside from the radius change.
2. `PageHeader.jsx`: radius on any chip/button-adjacent chrome → `radius.tight`; structural elements → `radius.none` if applicable (read the file directly to confirm what geometry it actually owns before assuming).
3. `DashboardStats.jsx`: promote its numeric tile values to `typeScale.metric` per `PAGE_SPECS.md` §3's explicit call-out (`SessionSidebar`'s three tiles — Active/Total/WebSocket — are the concrete consumer named there).
4. `ActiveAlerts.jsx`: strip radius `radius.sm` → `radius.none` (structural alert panel, per `PAGE_SPECS.md` §3's "Current visual problems" list).
5. `SessionSidebar.jsx`: outer rail radius `radius.lg` → `radius.none` (per `PAGE_SPECS.md` §3).
6. `LoadingState.jsx`: icon-well radius → `radius.tight` per `DESIGN.md` §6.10 (mirrors the primitive `EmptyState`'s treatment — KEEP the skeleton-pulse animation mechanism itself unchanged, it already respects reduced-motion).

**Dependencies:** `TCB-P1` accepted.

**Risk:** Low–medium (`DashboardStats.jsx`'s typography change is the one task in this group that's more than a radius swap — verify it doesn't break the existing ellipsis/truncation handling at 1024px that the prior project's `P7-T03` specifically fixed; check that fix is still present in the file before changing font-size/weight around it).

**Preserve:** `PageHeader`'s back-button/title hierarchy, `ActiveAlerts`' conditional-rendering logic, `SessionSidebar`'s stat-tile data-fetching/display logic, `LoadingState`'s reduced-motion handling, `SectionCard`'s title/count/refresh-slot API.

**Verification:** lint/build/test green. Spot-check `DashboardStats.jsx` at 1024px specifically (the prior project's `P7-T03` fix site) to confirm no truncation regression from the new type size.

**Completion criteria:** All 6 files' EVOLVE items applied, `typeScale.metric` correctly consumed by `DashboardStats`, no 1024px truncation regression.

---

### TCB-P2E — Feedback / dialog layer (`Toast`, `ConfirmDialog`, `ErrorBoundary`)

**Objective:** Token-migrate the app's overlay/notification layer, and resolve — or explicitly defer with a recorded decision — the one genuine open design question this plan inherits from `COMPONENT_SPECS.md`.

**Why this phase comes here:** Depends only on `TCB-P1`; independent of `2A`–`2D`.

**Files / areas affected:** `frontend/src/components/ui/Toast.jsx`, `ConfirmDialog.jsx`, `ErrorBoundary.jsx`.

**Components affected:** `ToastProvider`/`useToast`, `ConfirmDialogProvider`/`useConfirm`, `ErrorBoundary`.

**Design references:** `DESIGN.md` §6.7 (ConfirmDialog — KEEP interaction logic, EVOLVE radius/shadow), §6.8 (Toast — KEEP as reference implementation of the accent-edge pattern, radius only changes). `COMPONENT_SPECS.md` §3.10 (`ErrorBoundary` — the one component `DESIGN.md`/`PAGE_SPECS.md` never gave a contract; `COMPONENT_SPECS.md` fills that gap, read it directly), §4.5/§5 item 1 (the open pill-button-shape question, below).

**⚠️ Open decision before starting this task's button-shape sub-item (§5 item 1 in `COMPONENT_SPECS.md`):** `ConfirmDialog` and `ErrorBoundary` each independently implement a pill-shaped (`radius.full`), raw-`<button>` two-action row — not the shared `Button` primitive. Neither `DESIGN.md` nor `PAGE_SPECS.md` picks a direction; `COMPONENT_SPECS.md` frames two readings (keep as a sanctioned `radius.full` exception, or migrate both to the shared `Button` primitive) without choosing. **This plan's default, if no product-owner decision is supplied before this task starts:** keep the pill shape as a sanctioned exception (smaller, lower-risk change; does not touch either file's interaction logic; consistent with `radius.full` already being reserved for "conceptually round objects" per `DESIGN.md` §5.3, and a pill action-row is closer to that than to a rectangular card). This is a **default, not a settled fact** — flag it in the task's report either way so Main Claude can record whichever direction was actually taken as a new `.ai/DECISIONS.md` entry, matching this project's own established discipline of writing decisions down rather than leaving them only in conversation.

**Tasks:**
1. `Toast.jsx`: radius `radius.md`(12) → `radius.none`. KEEP the `borderLeft: 3px solid tone.color` accent-edge pattern exactly (this is the reference implementation `DESIGN.md` §5.8/§6.8 cites elsewhere).
2. `ConfirmDialog.jsx`: radius `radius.lg` → `radius.none`, add `borderInk` edge, keep `shadow.overlay` (textbook floating-layer use). Danger confirmations get a `borderInk`-weight top-or-left edge in `danger` color per `DESIGN.md` §6.7. Apply the button-shape decision above.
3. `ErrorBoundary.jsx`: apply `COMPONENT_SPECS.md` §3.10's full contract (read it directly — this file has no upstream `DESIGN.md`/`PAGE_SPECS.md` entry, so `COMPONENT_SPECS.md` is the sole source for its target treatment). Apply the same button-shape decision as `ConfirmDialog.jsx` for consistency between the two.

**Dependencies:** `TCB-P1` accepted. The button-shape decision (make or default) before touching either file's action row specifically.

**Risk:** Low for radius/shadow changes. Slightly higher for the button-shape sub-item only if the default above is overridden mid-task to "migrate to shared `Button`" — that path touches more surface area (two files' interaction wiring) and should be treated as its own bounded sub-task if chosen, not folded silently into this one.

**Preserve:** `ConfirmDialog.jsx`'s focus-trap/`inert`/restore-focus-to-opener accessibility engineering — untouched, this is explicitly named as hard-won and correct in `DESIGN.md` §3. `ErrorBoundary`'s crash-catching logic. `Toast`'s queueing/dismissal behavior.

**Verification:** lint/build/test green. If Playwright is reachable, trigger one toast, one confirm dialog, and (harder to trigger safely) confirm `ErrorBoundary`'s rendered fallback matches its new contract by code inspection if a live trigger isn't practical.

**Completion criteria:** All 3 files migrated, the button-shape question resolved-or-defaulted-and-recorded, `ConfirmDialog`'s accessibility engineering verified unchanged.

---

## TCB-P3 — Chip/Primitive-Dependent Followups

### Objective
Finish the 2 shared-layer files that specifically needed `TCB-P2A`'s `Chip`/`EmptyState` primitives to land first.

### Why this phase comes here
The only genuine sequencing dependency inside the shared-component layer, per §2.2's verified import table.

### Files / areas affected
`frontend/src/dashboard/components/NavigationCard.jsx`, `frontend/src/dashboard/components/EmptyState.jsx` (the thin wrapper, not the primitive).

### Components affected
`NavigationCard`, `EmptyState` (wrapper).

### Design references
`DESIGN.md` §6.14 (command controls / `NavigationCard` — `shadow.lift` on hover, icon-well radius), §6.10 (`EmptyState` — this wrapper is confirmed "not a duplicate" by `COMPONENT_SPECS.md` §2, just a thin pass-through; verify it needs no change beyond whatever the primitive already handles).

### Tasks
1. `NavigationCard.jsx` (`.pcgo-command-card`): icon-well radius `8px` → `radius.tight`; card radius `10px` (bespoke, not even on the old scale) → `radius.none`; add `shadow.lift` on hover/focus-visible, replacing the current `translateY(-1px)`-only lift (keep the transform too — `DESIGN.md` §6.3 describes them working together, shadow makes the lift legible where the transform alone is subtle).
2. `dashboard/components/EmptyState.jsx`: confirm it inherits its geometry correctly from the now-updated primitive with no local override that needs a matching change; if a local override exists, fix it, if not, this is a no-op confirmation, report it as such.

### Dependencies
`TCB-P2A` accepted (for `Chip`/`EmptyState` primitive availability).

### Risk
Low.

### Preserve
`NavigationCard`'s click/navigation behavior, icon/label/description/badge/arrow anatomy.

### Verification
lint/build/test green. Spot-check Home's command index (the only current consumer of `NavigationCard`) renders correctly with the new shadow-lift hover.

### Completion criteria
Both files updated (or confirmed no-op where applicable), Home's command index visually correct. `TCB-P4`'s page tasks may begin, in the order given in §5.

---

## TCB-P4 — Page Implementation

> **Scheduling reminder (see §2.3/§3):** these 12 tasks are logically independent but share `feature-page.css` as one physical file. Dispatch and **accept them one at a time**, in the order below, even though nothing about their content requires serial execution. Each task's "Files / areas affected" list names both the page's own `.jsx` file(s) and the specific `feature-page.css` BEM block(s) it owns.

The shared structure every one of the 12 tasks below follows (stated once here rather than repeated 12 times):

- **Objective:** apply that page's EVOLVE list from `PAGE_SPECS.md`'s corresponding numbered section, verified/refined against `COMPONENT_SPECS.md` §3/§4 where that page has page-local components with their own contract or a flagged correction.
- **Why this phase comes here:** page-level work is the correct final layer once tokens + shared components are correct, per `DESIGN.md` §12's foundation→primitives→shared→shell→pages progression and `COMPONENT_SPECS.md` §6 step 7's confirmation that these files import nothing from one another.
- **Design references:** the named `PAGE_SPECS.md` section, plus any `COMPONENT_SPECS.md` correction/contract called out per task below.
- **Dependencies:** `TCB-P1` + all of `TCB-P2` + `TCB-P3` accepted, plus (only for `TCB-P4.1` Home) `TCB-P2B`'s `StatusBadge` motion work specifically, since `SessionCard.jsx` consumes it.
- **Risk:** page-specific, noted per task only where it deviates from "low."
- **Preserve:** per `RULES.md`'s functionality-freeze list — API calls, data fetching, routing, business logic, state management on every page, no exceptions.
- **Verification:** lint/build/test green + a `feature-page.css` scope check (confirm the diff touches only that page's named BEM block(s), not another page's) + real render at the canonical breakpoints where Playwright is reachable.
- **Completion criteria:** that page's `PAGE_SPECS.md` EVOLVE list fully applied, no other page's CSS block touched, no functional regression.

### TCB-P4.1 — Home
**Files:** `dashboard/pages/Home.jsx`, `components/SessionCard.jsx` (its only real consumer), `dashboard/components/feature-page.css` → `.pcgo-home-*`/`.pcgo-command-*` blocks.
**Page reference:** `PAGE_SPECS.md` §3.
**Task specifics:** `NavigationCard`'s radius/shadow already lands via `TCB-P3` — this task's own scope is `.pcgo-home-hero`/`ActiveAlerts`-consumer wiring (already migrated in `TCB-P2D`, confirm here) and, the one genuinely new rule on this page, promoting the **active `SessionCard`** to the featured-card treatment (`borderInk` edge) per `DESIGN.md` §7/§12 — implement this inside `SessionCard.jsx` itself (not Home-local CSS) so any future page rendering an active session inherits it automatically, per `PAGE_SPECS.md` §3's explicit instruction. `SessionSidebar`'s stat-tile `typeScale.metric` promotion already lands via `TCB-P2D` — confirm, don't redo.
**Risk:** Medium — `SessionCard.jsx`'s featured-card logic must correctly distinguish "active" from "idle" state without touching the session-lifecycle logic that determines that state.

### TCB-P4.2 — Host Monitor
**Files:** `dashboard/pages/HostMonitorPage.jsx`, `components/HostStatusPanel.jsx`, `dashboard/components/feature-page.css` → `.pcgo-host-*` block.
**Page reference:** `PAGE_SPECS.md` §4.
**Task specifics:** 5 bespoke radius values collapse onto the binary system (see `PAGE_SPECS.md` §4's exact list); readiness-summary stat and all `ProgressStat` values promote to `typeScale.metric`; Sunshine/Tailscale/Readiness card top-borders migrate to **left**-edge (unifying with the app-wide accent-edge standard). Confirm CPU/RAM/GPU-load/GPU-temp/VRAM all correctly flip `warning`/`danger` at threshold across all 5 meters (`PAGE_SPECS.md` §4 flags this as worth verifying, not assumed-correct). **Do not** consolidate the local `Badge`/`SectionCard`/`StatRow` with their shared or `SunshineStreamCard.jsx`-local near-duplicates — `COMPONENT_SPECS.md` §2/§5 explicitly defers all such consolidation.
**Risk:** Medium — this is the densest page in the plan (5 distinct radius fixes, a top-to-left edge migration, 2 metric-typography promotions, a 5-meter threshold-color verification).

### TCB-P4.3 — Recovery
**Files:** `dashboard/pages/RecoveryPage.jsx`, `components/RecoveryStats.jsx`, `components/RecoveryEvents.jsx`, `dashboard/components/feature-page.css` → Recovery's block.
**Page reference:** `PAGE_SPECS.md` §5.
**Task specifics:** read §5 directly for the exact metric-typography target `COMPONENT_SPECS.md` §4.4 corrects (flagged there as one of 4 factual corrections to a `PAGE_SPECS.md` guess — use `COMPONENT_SPECS.md`'s corrected value, not `PAGE_SPECS.md`'s original guess, per this document's own source-of-truth discipline of preferring the later, more-verified pass where the two upstream docs disagree).

### TCB-P4.4 — Sunshine
**Files:** `dashboard/pages/SunshinePage.jsx`, `components/SunshineClientManager.jsx`, `components/SunshineStreamHistory.jsx`, `components/SunshineStreamCard.jsx`, `dashboard/components/feature-page.css` → Sunshine's block.
**Page reference:** `PAGE_SPECS.md` §6.
**Task specifics:** `SunshineStreamCard.jsx`'s local `Badge`/`StatRow` are flagged `DUPLICATE / CONSOLIDATION CANDIDATE` in `COMPONENT_SPECS.md` §2 — **do not consolidate this pass**, only token-migrate them in place (radius, in particular the raw literal `"10px"` `Badge` radius `COMPONENT_SPECS.md` §3.19/§5 item 5 flags as this document's own inference, target `radius.full`, confirm before treating as settled per that flag).

### TCB-P4.5 — Game Manager
**Files:** `dashboard/pages/GameManagerPage.jsx`, `components/GameManager.jsx` (+ `GameLibrary.jsx`, `SaveBrowser.jsx` only if `PAGE_SPECS.md` §7 names them in scope — confirm before touching), `dashboard/components/feature-page.css` → Game Manager's block.
**Page reference:** `PAGE_SPECS.md` §7. Use `COMPONENT_SPECS.md` §4.4's corrected button-shape finding for this page rather than `PAGE_SPECS.md`'s original guess (same source-of-truth precedent as `TCB-P4.3`).

### TCB-P4.6 — User Management
**Files:** `dashboard/pages/UserManagementPage.jsx`, `components/UserPanel.jsx`, `dashboard/components/feature-page.css` → Users' block.
**Page reference:** `PAGE_SPECS.md` §8. `COMPONENT_SPECS.md` §4.4 notes Users' "selected-row ADD" flag from `PAGE_SPECS.md` is moot — confirm and skip that item rather than implementing a non-existent gap.

### TCB-P4.7 — Analytics
**Files:** `dashboard/pages/AnalyticsPage.jsx`, `components/SessionAnalytics.jsx`, `dashboard/components/feature-page.css` → Analytics' block.
**Page reference:** `PAGE_SPECS.md` §9. `SessionAnalytics.jsx`'s local `StatTile` is flagged `DUPLICATE / CONSOLIDATION CANDIDATE` against `RecoveryStats.jsx`'s `StatTile` — token-migrate in place only, per the same no-consolidation-this-pass rule as `TCB-P4.4`. Use `COMPONENT_SPECS.md` §4.4's located-metric-value correction over `PAGE_SPECS.md`'s original flag.

### TCB-P4.8 — Session History
**Files:** `dashboard/pages/SessionHistoryPage.jsx`, `components/SessionHistory.jsx`, `dashboard/components/feature-page.css` → Session History's block.
**Page reference:** `PAGE_SPECS.md` §10. `COMPONENT_SPECS.md` §4.2 has already resolved `PAGE_SPECS.md` §17's open uncertainty #3: this page's status rendering is a confirmed bespoke `getStatusBadge()` function, **not** the shared `StatusBadge` — `COMPONENT_SPECS.md` §5 item 2 recommends (not mandates) keeping it bespoke on density grounds, normalizing only its left-edge width to 3px for consistency with §5.8's accent-edge standard. Follow that recommendation unless a product-owner decision overrides it; if overridden to migrate to `StatusBadge`, treat that as a larger, separately-scoped task (touches this page's status-rendering logic, not just tokens) rather than folding it in silently here.

### TCB-P4.9 — Logs
**Files:** `dashboard/pages/LogsPage.jsx`, `components/LogPanel.jsx`, `dashboard/components/feature-page.css` → Logs' block.
**Page reference:** `PAGE_SPECS.md` §11. Near-no-op per `COMPONENT_SPECS.md` §6 step 7's own characterization — this page's dense mono vocabulary is explicitly KEEP, only `radius.none` migration applies. Do not promote any Logs value to `typeScale.metric` — `PAGE_SPECS.md` §16's checklist explicitly excludes Logs from that rule.

### TCB-P4.10 — Settings
**Files:** `dashboard/pages/SettingsPage.jsx`, `components/SettingsPanel.jsx`, `dashboard/components/feature-page.css` → Settings' block.
**Page reference:** `PAGE_SPECS.md` §12. Calmest surface in the app per `DESIGN.md` §12 — geometry-only changes, no decoration added.

### TCB-P4.11 — Change Password
**Files:** `dashboard/pages/ChangePasswordPage.jsx`, `dashboard/components/feature-page.css` → Change Password's block (if any — confirm, this page may be entirely inline like Login).
**Page reference:** `PAGE_SPECS.md` §13. Per `PAGE_SPECS.md` §16's checklist, this page and Login should read as visual siblings ("security form" surfaces) — cross-check against `TCB-P5`'s Login output once both are done (this page runs first per the §5 ordering; a light re-check after `TCB-P5` lands is worth a mention in `TCB-P8`'s QA pass, not a reason to delay this task).

### TCB-P4.12 — Not Found
**Files:** `dashboard/pages/NotFoundPage.jsx`.
**Page reference:** `PAGE_SPECS.md` §14. Smallest task in this plan — the page is deliberately "boring on purpose" per its own design note; only geometry token migration applies, nothing else.

---

## TCB-P5 — Login (reference implementation, done last)

### Objective
Apply the 4 small radius changes `PAGE_SPECS.md` §2 names — the smallest, lowest-risk page task in this entire plan, done last so every other page's migration had an unchanging visual reference point to be checked against throughout `TCB-P4`.

### Why this phase comes here
`COMPONENT_SPECS.md` §6 step 8's explicit sequencing recommendation. Login is already `DESIGN.md` §12/§14's standing reference implementation — nearly everything about it is KEEP, so there's no benefit to doing it early, and a real benefit (a stable comparison point) to doing it last.

### Files / areas affected
`frontend/src/pages/Login.jsx` only. **`Login.css` is out of scope** — confirmed unimported, §1.5.

### Components affected
None beyond this page's own inline styles (`inputStyle`, the form panel, feature pills, inline banners).

### Design references
`PAGE_SPECS.md` §2 in full (short section, entirely about this one page — read directly).

### Tasks
1. `inputStyle`'s `borderRadius: radius.sm` → `radius.none`.
2. Form panel `<form>`'s `borderRadius: radius.lg` → `radius.none`.
3. Feature-pill `borderRadius: radius.sm` → `radius.tight`.
4. Inline info/error banner `borderRadius: radius.sm` → `radius.tight`.
5. Confirm the submit `Button` automatically inherits `shadow.press` from `TCB-P2A`'s primitive update with no Login-specific change needed (per `PAGE_SPECS.md` §2 — this is a verification sub-step, not new work).
6. Re-confirm `Login.css` is still unimported before closing this task (§1.5's one-line insurance check).

### Dependencies
`TCB-P1` + `TCB-P2A` accepted. (Does not depend on `TCB-P4` — it could technically run earlier — but is deliberately sequenced last per the reasoning above; if a future Main Claude wants to genuinely parallelize it earlier for scheduling reasons, that's safe to do, since Login touches no shared file any `TCB-P4` task touches.)

### Risk
Very low — 4 single-value changes in one already-correct file.

### Preserve
Everything else — two-pane composition, `borderRight` divider, `typeScale.hero` usage, mono eyebrow/footer, bootstrap-mode branching, all validation/toast logic, `shadow.overlay` on the form panel, the 860px/420px breakpoints.

### Verification
lint/build/test green. Real render at 1440/1024/768/390/360 if Playwright is reachable — Login is the page most worth a real visual confirmation given its reference-implementation status.

### Completion criteria
4 radius values changed, nothing else, `Login.css` reconfirmed dead, real-render or careful code-trace confirmation the page still matches `DESIGN.md` §12's Login row description.

---

## TCB-P6 — Motion & State-Transition Verification Pass

### Objective
Confirm `DESIGN.md` §8's motion table is fully and correctly satisfied across the app, closing any gap not already handled inline during `TCB-P2B` (StatusBadge) or `TCB-P4` (page-local state transitions like Host Monitor's readiness-summary state, Sunshine/Tailscale connection status).

### Why this phase comes here
Motion is the one category `DESIGN.md` §12/§17 (open question 3) and `DESIGN.md` §8 treat as needing deliberate, late introduction rather than a per-component reflex — per `DESIGN.md` §17's instruction ("Motion should be introduced deliberately... Determine: when shared interaction motion is implemented, when page-specific motion is appropriate"), doing a dedicated pass after all components/pages exist means every genuine "state landed" moment (connecting→connected, starting→running, badge tone change) can be surveyed at once, rather than guessed at file-by-file during earlier phases.

### Files / areas affected
Whichever files `TCB-P2B`/`TCB-P4` didn't already fully resolve — determined by this phase's own audit step, not predetermined. Likely candidates based on `DESIGN.md` §8's table: `StatusBadge.jsx` (already addressed in `TCB-P2B`, re-confirm here), `HostStatusPanel.jsx`'s readiness-summary state changes, Sunshine/Tailscale connection-status displays.

### Components affected
Determined by the audit.

### Design references
`DESIGN.md` §8 in full (the motion table), §17 (motion sequencing guidance).

### Tasks
1. Audit every place in the app where a status/badge/readiness value can change while the page is open (not just on load) — session status, host readiness, Sunshine/Tailscale connection state.
2. For each, confirm it uses `motion.transition` (state landed) rather than `motion.hover`/`motion.base` (interaction) or no transition at all.
3. Confirm every animated element respects the global `prefers-reduced-motion: reduce` block — do not add any new motion that bypasses it.
4. Do not add motion anywhere `DESIGN.md` §8 doesn't call for — per principle #7 ("motion is mechanical, not floaty... nothing animates 'just because'"), this phase's job is closing real gaps, not adding decoration.

### Dependencies
`TCB-P4` and `TCB-P5` fully accepted (needs every page's final state to audit against).

### Risk
Low — this phase only adds `transition:`/`animation:` CSS properties to already-correct components, it does not change layout, color, or geometry.

### Preserve
Everything except the specific transition properties this phase adds.

### Verification
lint/build/test green. If Playwright is reachable, trigger at least one real state change (e.g. mock a session status change via the QA harness's fixture data) and visually confirm the transition reads as "mechanical," not floaty, and reduced-motion collapses it correctly.

### Completion criteria
Every state-change site named in the audit either already correctly uses `motion.transition` or has been updated to. No decorative/ambient motion was added anywhere.

---

## TCB-P7 — Responsive Verification Pass

### Objective
Confirm every page still behaves correctly at all 5 canonical breakpoints (1440/1024/768/390/360) after the full token/component/page migration, per `DESIGN.md` §9's explicit instruction to keep the existing breakpoint set unconsolidated and verify against it.

### Why this phase comes here
Per the task brief's instruction not to leave responsive work entirely to the end if it would cause rework: this plan already had each `TCB-P4` page task's own verification step include a real-render check where possible. This phase is the **dedicated final pass** `DESIGN.md` §9 still calls for — a systematic re-check across all 13 pages × 5 breakpoints in one place, catching any cross-page interaction the per-page checks might have missed (e.g. a shared-component change from `TCB-P2` rendering fine on the 2–3 pages spot-checked during that phase but subtly wrong on an 11th page never re-checked).

### Files / areas affected
None expected — this is a verification pass. Any fix found here should be scoped as a small, targeted follow-up task (same discipline the prior project's `P7-T02`/`P7-T03` used), not folded into this phase silently.

### Components affected
Whichever specific component a found regression traces to.

### Design references
`DESIGN.md` §9 (responsive table), §5.9's touch-target rule (40×40px minimum regardless of `radius.none`'s sharp corners — explicitly re-stated in `DESIGN.md` §9 as a rule specific to this design pass, worth checking freshly rather than assuming it held).

### Tasks
1. Render (or, if Playwright is unreachable, carefully trace via CSS/media-query reading) all 13 routed pages at 1440/1024/768/390/360.
2. Specifically re-check the 880px sidebar-collapse breakpoint and the ≤480px wordmark-abbreviation/stat-grid/table-to-key-value-stack breakpoints named in `DESIGN.md` §9 — these are the ones most likely to interact with the new binary radius/hard-shadow system in a way a page-local review might not have caught.
3. Confirm no `radius.none`/hard-border change created a touch-target smaller than 40×40px anywhere (`DESIGN.md` §9's new-for-this-pass rule).
4. Use `PAGE_SPECS.md` §16's cross-page consistency checklist as the review rubric — it is written exactly for this kind of final pass.

### Dependencies
`TCB-P6` accepted.

### Risk
Low (verification-only) unless it surfaces a real regression, in which case that fix inherits whatever risk level its own file carries.

### Preserve
Everything — this phase should find zero required changes in the ideal case; any change found is itself a small corrective task, not a redesign.

### Verification
The audit itself, using `PAGE_SPECS.md` §16's checklist as the pass/fail rubric.

### Completion criteria
All 13 pages confirmed correct at all 5 breakpoints, `PAGE_SPECS.md` §16's checklist items all checked, any found regression scoped as its own small follow-up task (not left open).

---

## TCB-P8 — Global Visual QA + Definition of Done

### Objective
Final, whole-product confirmation that the redesign is coherent, complete, and free of drift — the single closing gate before this project can be marked done, mirroring the discipline the prior (closed) project's own `P9` used.

### Why this phase comes here
Every other phase has been scoped narrowly on purpose (per the task brief's own instruction against giant unbounded tasks). This is the one phase whose entire job is to look at the *whole* product at once and ask whether it actually reads as one coherent design language, which no single narrower task could answer on its own.

### Files / areas affected
None expected (verification-only), same caveat as `TCB-P7` — any found issue becomes its own small follow-up task.

### Components affected
Whole product.

### Design references
`DESIGN.md` §11 (anti-patterns — explicitly banned list), §15 (Final self-review — this plan's QA pass should re-ask every one of those questions against the *implemented* product, not just the *written* design language), `PAGE_SPECS.md` §16 (cross-page consistency checklist, re-run here at the whole-product level rather than per-page).

### Tasks
1. Full fresh `npm install`/`lint`/`build`/`test` — confirm 0 errors, build succeeds, tests pass, and record final CSS/JS byte sizes as this project's new baseline (analogous to the prior project's own closing figures).
2. Walk `DESIGN.md` §11's anti-pattern list against the real, rendered app — confirm none crept in (no glassmorphism, no soft/generic shadows outside the 5 named tokens, no rounded-corner values between `4px` and `999px` anywhere, no color-only status, no ambient/idle motion, no raw hex/rgba outside the token table, etc.).
3. Walk `PAGE_SPECS.md` §16's checklist at whole-product scope: radius is always `none`/`tight`/`full` (no lingering 6–16px values anywhere), every standalone glanceable number uses `typeScale.metric` except Logs/item-counts, every accent-edge is left/2–3px/one semantic color, every status pairs color with shape+text, no raw hex/rgba survives uncorrected, `shadow.lift`/`shadow.press` appear only on genuinely interactive/featured elements, Login/Change-Password read as siblings, Home/Host-Monitor read as siblings at the top of their density registers, Session-History/Analytics read as a deliberate detail/aggregate pair.
4. If Playwright is reachable, do a final real-render pass across all 13 pages at 1440px as a single coherent "does this look like one product" gut-check (the qualitative check `DESIGN.md` §15's self-review questions are ultimately asking).
5. Confirm the `TCB-P2E` button-shape decision (open/defaulted in that phase) was actually recorded in `.ai/DECISIONS.md` or equivalent, not left implicit.
6. Confirm every deferred consolidation candidate (`Badge`/`StatusBadge`, `SectionCard` local/shared, the 2 new `Badge`/`StatRow` duplicate pairs in `SunshineStreamCard.jsx`, `StatTile` in `SessionAnalytics.jsx`, ConfirmDialog/ErrorBoundary's button shape if kept as pill) is explicitly still recorded as deferred-not-forgotten in whichever `.ai/` file tracks open items for this project — this plan deliberately did not consolidate any of them (per the task brief's own instruction to defer non-essential consolidation), and that should remain a visible, intentional decision going forward, not silently lost.
7. Update `.ai/` (`STATE.md`/`PLAN.md`/`HANDOFF.md` equivalents for this new project) to reflect closure, following the prior project's own closing-documentation pattern.

### Dependencies
`TCB-P7` accepted.

### Risk
None directly (verification-only).

### Preserve
Everything — same as `TCB-P7`.

### Verification
Steps 1–6 above, each with an honest pass/fail record — per this project's inherited discipline, a claim of "done" is only as good as what was actually re-run and re-checked, not assumed from earlier phases having been green.

### Completion criteria — project-level Definition of Done
The Tactical Console Brutalism implementation is complete when, and only when:
- Every phase `TCB-P1`–`TCB-P8` above is accepted.
- `DESIGN.md` §11's anti-pattern list is confirmed absent from the real app, not just the design document.
- `PAGE_SPECS.md` §16's checklist passes at whole-product scope.
- Responsive behavior is verified at all 5 canonical breakpoints on all 13 pages (`TCB-P7`).
- Motion is coherent and reduced-motion-safe (`TCB-P6`).
- Accessibility is preserved (nothing in this plan touches `ConfirmDialog`'s focus-trap engineering, the WCAG-AA contrast work, or any ARIA/label work the prior project already closed — this plan's job is to confirm that remains true, not redo it).
- No backend/API/routing/business-logic file was ever touched (confirm via a final full-tree diff scope check against everything outside `frontend/src/` + `.ai/`).
- All genuine open items (the button-shape decision, the deferred consolidation candidates) are explicitly recorded, not silently dropped.
- `.ai/` documentation reflects this final, implemented state.

---

## 4. Worker-task sizing summary

| Phase | Worker-sized tasks | Parallel-safe with each other? |
|---|---|---|
| `TCB-P0` | 1 (Main Claude or a single Worker) | — |
| `TCB-P1` | 1 | — (serial gate) |
| `TCB-P2` | 5 (`2A`–`2E`) | Yes, all 5 simultaneously |
| `TCB-P3` | 1–2 (small enough to combine) | Yes |
| `TCB-P4` | 12 (one per page) | No — logically yes, but see §2.3/§3; dispatch serially |
| `TCB-P5` | 1 | — |
| `TCB-P6` | 1 (audit) + N small fix tasks if gaps found | N/A until audited |
| `TCB-P7` | 1 (audit) + N small fix tasks if regressions found | N/A until audited |
| `TCB-P8` | 1 | — |

**Estimated total: ~22–24 worker-sized tasks** across 9 phases (`TCB-P0`–`TCB-P8`), with a realistic wall-clock-shortening opportunity of dispatching up to 5 Workers simultaneously during `TCB-P2` — the single largest parallelization win available in this plan, since `TCB-P1` (serial) and `TCB-P4` (serial-by-necessity due to `feature-page.css`) together account for 13 of the ~22 tasks and cannot be compressed the same way.

---

## 5. Open decisions requiring confirmation (carried forward from `COMPONENT_SPECS.md` §5, not resolved by this document)

This plan does not make new design decisions — it inherits the following from `COMPONENT_SPECS.md` §5 and states, per task, either a low-risk default to proceed with or an explicit "confirm before implementing" flag:

1. **`ConfirmDialog`/`ErrorBoundary` pill-shaped buttons** (`TCB-P2E`) — this plan defaults to keeping the sanctioned `radius.full` exception; record whichever direction is actually taken.
2. **Session History's status device** (`TCB-P4.8`) — this plan defaults to keeping the bespoke device, normalizing only edge-width; migrating to `StatusBadge` is a larger, separately-scoped task if chosen.
3. **`Chip`'s semantic-tone enforcement** — explicitly out of scope for this entire plan (an API-level change, not a token/visual change); not assigned to any phase above.
4. **`StatRow`/`Badge`/`StatTile` consolidation** (`TCB-P4.2`/`TCB-P4.4`/`TCB-P4.7`) — explicitly deferred everywhere in this plan; token-migrate in place only.
5. **`SunshineStreamCard.jsx`'s local `Badge` raw `10px` radius target** (`TCB-P4.4`) — this plan uses `COMPONENT_SPECS.md`'s inferred `radius.full` target but flags it, per that document's own caveat, as inference rather than explicit instruction.
6. **Host Monitor's Force Unlock → `useConfirm()` routing** (`TCB-P4.2`) — not independently verified by any upstream document; a one-line check worth doing during that task, not a blocker.
7. **`accentLilac`'s new semantic job, actual usage** (`TCB-P1` step 6) — likely no current page has a concrete orchestration/automation-event surface to apply it to; land the semantic intent, don't invent a use site.

None of these block starting `TCB-P0`/`TCB-P1`; each is scoped to the specific later phase where it becomes actionable.

---

## 6. Verification commands reference (from the real `frontend/package.json`, not invented)

```
cd frontend
npm install          # or npm ci against a lockfile
npm run lint          # eslint .
npm run build          # vite build
npm run test          # vitest run
npm run dev            # for manual/QA-harness use
```

Visual QA harness (if the sandbox's network egress allows reaching a Chromium binary — historically inconsistent per the prior project's own record):
```
cd frontend
npx playwright install chromium   # one-time
npm run dev                        # terminal 1
node qa/render.mjs                 # terminal 2, see qa/README.md
```

---

## 7. Final self-review (per the task brief's own required checklist)

- Every referenced file path was verified to exist in this pass via direct `find`/`grep`/`view` — confirmed.
- Phase dependencies were derived from actual `import` statements read directly from the repository (§2.2's table), not assumed from either upstream document's prose — confirmed, and one real refinement over `COMPONENT_SPECS.md` §6's own ordering was found and documented (§1.5).
- No task in this plan contradicts `DESIGN.md` — every task cites the specific section it implements rather than inventing new visual rules.
- No task in this plan contradicts `PAGE_SPECS.md` — every page task cites its corresponding numbered section; the two places this plan's file-scope framing differs from `PAGE_SPECS.md`'s literal text (`Login.css`, `TCB-P4.11`'s "confirm before assuming a CSS block exists") are flagged as verification steps, not silent contradictions.
- No task in this plan contradicts `COMPONENT_SPECS.md` — every deferred-consolidation item, every open uncertainty, and every one of the 4 named corrections to `PAGE_SPECS.md` are carried forward explicitly rather than re-decided.
- Tasks are sized for disposable Workers: the largest single-file task (`TCB-P2A` primitives.jsx) is still one file with a bounded, enumerable set of changes; the largest multi-file task (`TCB-P4.2` Host Monitor) is still one page's worth of work, matching this plan's own "coherent unit of work" standard from the task brief.
- Parallelizable work (`TCB-P2`'s 5 tracks, `TCB-P3`'s 2 tasks) is clearly distinguished from work that must be serial for either dependency reasons (`TCB-P1` → everything) or shared-file conflict reasons (`TCB-P4`'s 12 page tasks) — §3's MUST/CAN/SHOULD-NOT table states this explicitly and is the one place this plan makes a genuinely new operational finding not present in either upstream document.
- Every major phase (`TCB-P1`, each `TCB-P2` track, each `TCB-P4` page, `TCB-P5`, `TCB-P6`, `TCB-P7`, `TCB-P8`) has its own Verification and Completion Criteria subsection — confirmed, none were left generic-only.
- This plan proposes zero backend/`host-agent`/API/routing/business-logic changes anywhere — every phase's "Preserve" section restates the relevant slice of `RULES.md`'s functionality-freeze list, and `TCB-P8`'s Definition of Done includes an explicit final scope check for this.

---

## Summary

- **9 phases (`TCB-P0`–`TCB-P8`), ~22–24 worker-sized tasks.**
- **Major dependency chain:** tokens (`TCB-P1`, serial) → shared component layer (`TCB-P2`, 5-way parallel) → 2 small followups (`TCB-P3`) → 12 pages (`TCB-P4`, serial due to shared `feature-page.css`, not due to any real architectural dependency) → Login (`TCB-P5`, deliberately last) → motion (`TCB-P6`) → responsive (`TCB-P7`) → global QA + Definition of Done (`TCB-P8`).
- **Safe parallelization:** `TCB-P2`'s 5 tracks (biggest available time-saving) and `TCB-P3`'s 2 tasks. Everything else should be treated as effectively serial, including `TCB-P4`'s pages, for the shared-`feature-page.css` reason documented in §2.3 — this is this plan's single most important operational finding, since it's easy to look at `COMPONENT_SPECS.md` §6 step 7's "these can proceed in any order... since none of them import from one another" and conclude they're safe to run *concurrently*, when the real constraint is a shared physical CSS file that import-graph analysis alone doesn't surface.
- **Highest-risk phases:** `TCB-P2A` (primitives.jsx — highest blast radius in the app) and `TCB-P4.2` (Host Monitor — densest single-page task, 5 radius fixes + a top-to-left edge migration + 2 metric-typography promotions + a 5-meter threshold-color re-verification).
- **Important verification checkpoints:** byte-identical build output after `TCB-P1` (nothing should visually change yet), real-render spot-checks after `TCB-P2A`/`TCB-P2C`/`TCB-P5`, a `feature-page.css` scope check after every `TCB-P4` task, a dedicated `TCB-P6` reduced-motion re-confirmation, a dedicated `TCB-P7` full 13-page × 5-breakpoint pass, and `TCB-P8`'s whole-product anti-pattern/consistency-checklist walk.
- **Unresolved implementation decisions carried forward (not invented by this document):** the `ConfirmDialog`/`ErrorBoundary` button-shape question and the Session History status-device question (§5 above), both with a stated low-risk default so neither one blocks starting the plan.