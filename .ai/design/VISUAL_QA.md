# PCGO Visual & Functional QA Specification
### Companion to `DESIGN.md`, `PAGE_SPECS.md`, `COMPONENT_SPECS.md`, `DESIGN_IMPLEMENTATION_PLAN.md` — "Tactical Console Brutalism"

> Status: QA specification only. Nothing in this document changes a token value, a component contract, a page spec, or a phase of the implementation plan — it defines how a Main or Worker Claude session **verifies** that work against those four documents. No application code, JSX, CSS, theme file, component, configuration, or package file was changed to produce this document, and none of the other three `.ai/design/*.md` files were modified.

---

## 0. How to read this document

- This is **not** a fifth design document. It contains zero new colors, radii, shadows, type sizes, layouts, or component variants. Wherever a concrete value is needed (a radius, a breakpoint, a token name), it is cited from `DESIGN.md`/`PAGE_SPECS.md`/`COMPONENT_SPECS.md` by section number, never restated as if newly decided here.
- **KEEP / EVOLVE / REPLACE / ADD** below always carry the exact meaning `DESIGN.md` §0 defined. A QA item never fails a page for correctly implementing a **KEEP** item as-is, or for still doing something an upstream document explicitly deferred (e.g. the `Badge`/`StatusBadge` overlap, the `ConfirmDialog` button-shape question).
- Every file path, route name, npm script, and QA-harness detail below was verified by direct inspection of this repository in this pass — `frontend/qa/render.mjs`, `frontend/qa/fixtures/route-map.js`, `frontend/qa/README.md`, `frontend/package.json`, `frontend/eslint.config.js`, `frontend/src/dashboard/theme.js`, `frontend/src/dashboard/AdminDashboard.jsx`'s `NAV_ITEMS`, and `.ai/RULES.md`/`.ai/DECISIONS.md` — not assumed from either upstream design document's prose.
- Where this document found a discrepancy between what `.ai/RULES.md`'s "Verified environment notes" claims and what re-running the actual command in this pass produced, the **re-verified, current result is used**, and the discrepancy is noted in §7 rather than silently overwritten — consistent with `RULES.md`'s own source-of-truth hierarchy ("actual repository... actual rendered application" outrank `.ai/` prose).
- This document does not repeat any page's or component's EVOLVE list. It tells a reviewer **where to look and what "pass" means** — the value to check against always lives in `PAGE_SPECS.md §n` / `COMPONENT_SPECS.md §n`.

---

## 1. Purpose

This document answers one question: **how do we objectively verify that the implemented PCGO frontend actually matches `DESIGN.md`, `PAGE_SPECS.md`, and `COMPONENT_SPECS.md`?**

It is the fourth and final layer of the design documentation stack:

| Document | Answers |
|---|---|
| `DESIGN.md` | What is the visual language, and why? (tokens, principles, geometric vocabulary) |
| `PAGE_SPECS.md` | What changes on each page, given that language? |
| `COMPONENT_SPECS.md` | What is each shared component's exact contract? |
| `DESIGN_IMPLEMENTATION_PLAN.md` | In what order, and by whom (Main/Worker), does the work happen? |
| **`VISUAL_QA.md` (this document)** | **How do we prove any of the above was actually done correctly?** |

It is written for two audiences the implementation plan already defines: a **Worker** Claude session verifying its own bounded task before delivery, and a **Main** Claude session accepting or rejecting that delivery. It is also the rubric `TCB-P6`/`TCB-P7`/`TCB-P8` (the implementation plan's own motion/responsive/global-QA phases) should execute against, rather than each inventing its own checklist ad hoc.

---

## 2. QA hierarchy

Five levels, narrowest to broadest. A change should pass its own level before a reviewer spends time on the level above it — there is no value in checking a page's responsive behavior if its tokens are still raw hex values.

### Level 1 — Code / token QA
Verify: design tokens are used, not raw values; no duplicate token systems were introduced; shared components use the correct primitives; no accidental component duplication beyond what `COMPONENT_SPECS.md` §2/§4 already knows about and has explicitly deferred; no forbidden architectural change (new library, new build tool, TypeScript, Tailwind — all explicitly rejected, `DESIGN.md` §3).

### Level 2 — Component QA
Verify each shared/reusable component in isolation, across its documented states (§4 below).

### Level 3 — Page QA
Verify each of the 13 routed pages plus the shared shell against its `PAGE_SPECS.md` section (§5 below).

### Level 4 — Responsive QA
Verify layout, typography, navigation, tables, cards, touch targets, overflow, and truncation at the five canonical viewports (§8 below).

### Level 5 — Whole-product QA
Verify the entire application still reads as one coherent design language, not 13 pages independently migrated (§14/§15 below).

---

## 3. Visual QA checklist (reusable, apply per-component and per-page)

This is the rubric levels 2–3 above are checked against. Every row cites the design-language section that defines the correct value — this checklist does not restate the value itself.

### Typography
- [ ] Heading hierarchy uses `typeScale.heading`/`subheading` correctly per the page's own section (`DESIGN.md` §5.2; per-page confirmation in `PAGE_SPECS.md`'s "Typography treatment" subsection).
- [ ] Body text uses `Inter`/`typeScale.body`/`bodySmall` where the page spec calls for it, and stays a **documented literal** where the page spec explicitly says to leave it (Users' 11 sizes, Settings' ~13 sizes, Session History's record/status/meta sizes, Analytics' label sizes, Login/Change-Password's near-miss values — see each page's own "Typography treatment" section). **Do not flag a documented, intentional non-conversion as a bug.**
- [ ] Metadata/timestamps/technical values use `JetBrains Mono` (`DESIGN.md` §5.2).
- [ ] Any standalone "read at a glance" number uses `typeScale.metric`, **except** the two named exceptions: Logs' entry counts (`PAGE_SPECS.md` §11, deliberate) and page-context item counts (Game Manager's/Users' "N configured"/"N users" counts, `PAGE_SPECS.md` §7/§8, deliberate).
- [ ] `typeScale.metric` targets are correct per `COMPONENT_SPECS.md` §4.4's two corrections: Recovery's promotion target is the RECOVERIES/FAILURES count numbers, **not** the prose headline ("Recovery is stable"/"Recovery needs attention"); Analytics' target is `SessionAnalytics.jsx`'s local `StatTile` value (17px/700/mono → `typeScale.metric`), independently confirmed in that pass.
- [ ] Uppercase text appears **only** on `typeScale.meta`-tier labels (`DESIGN.md` §5.2, §11 anti-pattern). No uppercase headings, button labels, or body copy anywhere.
- [ ] Weight, line-height, and letter-spacing match the cited step's definition (`DESIGN.md` §5.2), not a visually-similar improvisation.
- [ ] Truncation (ellipsis/`data-label` fallback) behaves correctly at narrow widths — see Level 4.

### Geometry
- [ ] Radius is one of exactly three values everywhere: `radius.none` (0px), `radius.tight` (4px), `radius.full` (999px) — `DESIGN.md` §5.3. **No 6/7/8/9/10/12/14/16px value survives anywhere touched.**
- [ ] No radius value falls between `radius.tight` and `radius.full` on a structural surface (`DESIGN.md` §11's explicitly named anti-pattern — this is the single most common defect class this redesign is designed to eliminate).
- [ ] The one sanctioned non-binary exception is respected, not over-applied: Sidebar/MobileHeader-drawer nav-row radius stays `radius.tight` (4px), deliberately not pushed to `radius.none` (`DESIGN.md` §6.6, `PAGE_SPECS.md` §1).
- [ ] Borders use the 4-step ladder (`borderSubtle`/`border`/`borderStrong`/`borderInk`) per `DESIGN.md` §5.4 — `borderInk` reserved for genuinely load-bearing panels (Login's form panel, Home's active `SessionCard`, `ConfirmDialog`'s card), not applied uniformly.
- [ ] Spacing/alignment/component dimensions match the page's documented layout (`PAGE_SPECS.md`'s "Target layout/composition" subsection) — this redesign changes geometry values, not grid structure, so a layout change here is out of scope and should be flagged as scope creep, not passed as a visual fix.
- [ ] Touch targets stay ≥40×40px regardless of how sharp `radius.none` makes a control look (`DESIGN.md` §9's new-for-this-pass rule) — verify at 390/360 specifically, where this is most likely to regress.

### Surfaces
- [ ] The `surface.l0`–`l4` elevation ladder is used correctly per component (`DESIGN.md` §5.1): `l0` page base, `l1` recessed wells/inputs/dense rows, `l2` sidebar/card headers, `l3` standard card body, `l4` hover/active-nav.
- [ ] Two-tier elevation choices that are load-bearing to a page's meaning are preserved: Host Monitor's `l3` (dependency/status cards) vs. `l1` (System/Diagnostics "spec sheet" cards) split (`PAGE_SPECS.md` §4) is a deliberate signal, not an inconsistency to flatten.
- [ ] No OLED-specific hardcoded color leaks into a shared component (see §9 Theme QA).
- [ ] Floating layers (dialogs, toasts, dropdowns, the mobile drawer) sit visually above content via elevation + `shadow.overlay`, never via a lighter background color alone.

### Shadows
- [ ] `shadow.flat` (none) is the default resting state for panels/cards/rows — depth comes from surface contrast and borders, not shadow (`DESIGN.md` §5.5).
- [ ] `shadow.press` appears only on `primary`/`dangerFilled` buttons, at rest, compressing to `0 0 0 0` on `:active` (`DESIGN.md` §5.5/§6.1). `secondary`/`ghost`/`danger` buttons stay flat.
- [ ] `shadow.lift` appears only on genuinely interactive/featured elements — Home's command cards (`NavigationCard`), the active `SessionCard` (hover/focus only, not resting), Settings' theme swatches. It must **not** appear on dense list rows (Users, Logs, Session History, Recovery, Analytics) or on read-only panels (Host Monitor's dependency cards).
- [ ] `shadow.overlay` is reserved for things genuinely floating above page content: `ConfirmDialog`, `Toast`, the mobile drawer, `ErrorBoundary`'s full-viewport card, and (per `PAGE_SPECS.md` §2/§13) Login's and Change Password's form panels against their own page background.
- [ ] No soft/generic SaaS-style blurred shadow (e.g. `box-shadow: 0 4px 12px rgba(0,0,0,.1)`-style defaults) survives on any static panel (`DESIGN.md` §11).
- [ ] Every shadow used anywhere is one of the five named tokens (`flat`/`press`/`lift`/`overlay`/`focusRing`) — no ad hoc `box-shadow` literal.

### Color
- [ ] Every color traces to a token in `DESIGN.md` §5.1's table — no raw hex/rgba anywhere newly introduced, and the two pre-existing flagged instances (`.pcgo-host-force-unlock`'s rgba, Game Manager's add-button hover rgba) are migrated wherever the task touching that file lands, per `PAGE_SPECS.md`'s and `COMPONENT_SPECS.md`'s own notes.
- [ ] Semantic colors mean one thing everywhere: `success` = healthy/running, `warning` = attention-not-broken, `danger` = broken/destructive, `info`/`accentBlue` = network/connectivity, `accentLilac` = orchestration/automation (new assignment), `accentPink` = decorative-only, never a status.
- [ ] `colors.brand` appears at most once per screen as "the one signal" (`DESIGN.md` §4.2) — primary action, active-nav indicator, or the single most important number on the page. Flag any screen where two unrelated things are both brand-colored.
- [ ] Accent-edge color matches the semantic state it represents, and the edge itself is **left**, 2–3px (normalized to 3px), one color — no top-edge holdouts. Host Monitor's Sunshine/Tailscale/Readiness cards are the one confirmed pre-existing top-edge instance that must have migrated to left (`PAGE_SPECS.md` §4, §16).
- [ ] No new decorative color exists anywhere — a page wanting a decorative accent must derive it from an existing semantic/brand token at reduced opacity (`DESIGN.md` §5.1).

### Interaction
- [ ] Hover states match each component's documented mechanism (§4 below) — background/border shift for dense rows, `shadow.lift` for featured/interactive cards, never both on the same element type.
- [ ] Focus-visible state shows both the existing native outline **and** `shadow.focusRing` on every interactive control (buttons, inputs, cards that are genuinely clickable) — `DESIGN.md` §5.5/§10. A border-color change alone is not sufficient for focus.
- [ ] Active/pressed state on `primary`/`dangerFilled` buttons visibly compresses (`shadow.press` → `0 0 0 0` paired with the existing `translateY(1px)`).
- [ ] Disabled state stays 0.45 opacity + `not-allowed` cursor, unchanged mechanism (`COMPONENT_SPECS.md` §3.1).
- [ ] Loading state uses each component's existing icon/label-swap or skeleton-pulse pattern — no new spinner/loading affordance was invented anywhere not already in `COMPONENT_SPECS.md`.
- [ ] Selected state (where it exists — theme swatches, and if/when Users' bulk-select is ever built) uses `border-left: 3px solid brand` + `surface.l4`, per `DESIGN.md` §6.5's spec, not an invented alternative.
- [ ] Validation error state on inputs: border → `danger`, `shadow.focusRing` recolored to `dangerDim` (`DESIGN.md` §6.2).
- [ ] State transitions (a status/readiness/connection value changing while the page is open) use `motion.transition`, not `motion.hover`/`motion.base` or no transition — see Motion below and `TCB-P6`'s own audit scope.

### Motion
- [ ] `motion.press`/`motion.hover` (≤160ms) used for micro-interactions (button/toggle/tab hover, press) — mechanical, not floaty (`DESIGN.md` §8).
- [ ] `motion.transition` (220ms, controlled overshoot) used **only** for state-landed events: connecting→connected, starting→running, a status/readiness/`Badge` tone change. Never used for hover/press.
- [ ] `motion.entrance` (`cgo-fade-up`) used for page/section entrance only — already global via `.pcgo-page-enter`, no per-page reinvention.
- [ ] No motion was added anywhere `DESIGN.md` §8's table doesn't call for — flag any new ambient/idle/decorative animation as a `DESIGN.md` §11 anti-pattern violation, not a nice-to-have.
- [ ] Keyframe-based animations that are documented as non-convertible (`Spinner`'s `cgo-spin`, `SessionCard`'s `card-in`, `StatusBadge`'s `badge-pulse`, `HostStatusPanel`'s `hsp-spin`, `Toast`'s `toast-in`, `ConfirmDialog`'s `confirm-backdrop-in`) are left as literals — do not flag these as "not using a motion token," per `COMPONENT_SPECS.md` §3.4/§3.6/§3.7's explicit "leave as-is" instruction.
- [ ] The global `prefers-reduced-motion: reduce` block still collapses every animation, including any newly-added `motion.transition` overshoot, to a plain non-spring state (`DESIGN.md` §5.6/§10).

### Accessibility
- [ ] Keyboard navigation reaches every interactive element in a logical order; no element is mouse-only.
- [ ] Focus is visible on every focusable element (native outline + `shadow.focusRing`, per Interaction above).
- [ ] Touch targets ≥40×40px at 390/360 (see Geometry above).
- [ ] Every status indicator pairs color with shape (dot/badge) **and** text — never color alone (`DESIGN.md` principle #8). Session History's status rendering is the one page-level item to specifically re-verify here (icon+color+text present, per `COMPONENT_SPECS.md` §4.2's finding that this is already compliant via a different mechanism than `StatusBadge`'s dot).
- [ ] `ConfirmDialog`'s focus-trap, `inert` on background content, and restore-focus-to-opener behavior are unchanged and still function correctly — this is accessibility-critical hard-won work (`DESIGN.md` §3) that a visual-only change must never regress.
- [ ] Semantic HTML and ARIA are unchanged from baseline — this pass is visual, not markup-structural; a Worker that changes an element's semantic role/tag without an explicit instruction has exceeded scope.
- [ ] Contrast (WCAG AA — 4.5:1 body, 3:1 large text) holds for `ink`/`inkDim`/`inkFaint`/`inkGhost` across all six themes, already verified in a prior pass (`DESIGN.md` §3 KEEP) — re-check only if a token *value* actually changed, not on every visual pass.
- [ ] Reduced motion is respected (see Motion above).

---

## 4. Component QA (Level 2)

For each component: the states to check, and the token(s) that define "correct." Cross-reference `COMPONENT_SPECS.md §3.n` for the full contract — this table is the pass/fail checklist derived from it, not a restatement of it.

| Component | File | States/variants to verify | What "correct" means (cite) |
|---|---|---|---|
| **Button** | `components/ui/primitives.jsx` | 5 variants (`primary`/`secondary`/`ghost`/`danger`/`dangerFilled`) × {default, hover, focus-visible, active/pressed, disabled, loading (caller-driven label swap)} | `radius.none`; `primary`/`dangerFilled` get `shadow.press` (compresses on `:active`), others `shadow.flat`; focus-visible adds `shadow.focusRing` (`COMPONENT_SPECS.md` §3.1) |
| **Card** | `components/ui/primitives.jsx` | `hoverable` true/false × {default, hover} | `radius.none`; base primitive stays `shadow.flat` — `shadow.lift` is opt-in per consumer, never baked into the base (`COMPONENT_SPECS.md` §3.2) |
| **Chip** | `components/ui/primitives.jsx` | 10 tones (`neutral`/`lilac`/`pink`/`blue`/`green`/`yellow`/`success`/`warning`/`danger`/`info`) | `radius.tight`; uppercase/10px/700/mono unchanged (`COMPONENT_SPECS.md` §3.3). Semantic-tone enforcement (lilac=orchestration, pink=decorative-only) is a known open API gap — do not fail an instance for a tone choice the component's own API doesn't yet steer (§5 item 3 below) |
| **Spinner** | `components/ui/primitives.jsx` | single | `50%`/circle geometry (already correct, not a `radius` token); keyframe animation is non-convertible, leave literal (`COMPONENT_SPECS.md` §3.4) |
| **EmptyState** (primitive + `dashboard/components/EmptyState.jsx` wrapper) | both files | with/without subtext, with/without action button | icon well `radius.tight`; action button inherits `Button`'s own states (`COMPONENT_SPECS.md` §3.5) |
| **LoadingState** | `dashboard/components/LoadingState.jsx` | single (pulsing-dot) | respects `prefers-reduced-motion`; no radius change of its own beyond icon-well parity with `EmptyState` where applicable |
| **StatusBadge** | `components/StatusBadge.jsx` | 9 session-lifecycle statuses (`starting`/`running`/`restarting`/`restarted`/`stopping`/`cleaning`/`completed`/`failed`/`stopped`) + `FALLBACK`, each with correct `pulse` true/false | `radius.full` (KEEP — sanctioned round-object exception, do not flag); dot+pill+mono label together; **ADD** `motion.transition` on status change (not yet implemented as of `COMPONENT_SPECS.md` §3.7 — verify this landed) |
| **SectionCard** (shared) | `dashboard/components/SectionCard.jsx` | with/without count badge, with/without refresh button, `bare` mode | `radius.none`; count badge & refresh button `radius.tight` (`COMPONENT_SPECS.md` §3.9) |
| **SectionCard** (local, `HostStatusPanel.jsx`) | `components/HostStatusPanel.jsx` | System/Session&Recovery/Sunshine/Tailscale/Diagnostics variants | `radius.none`; System/Diagnostics stay `surface.l1` (deliberate recess), others `surface.l3` — **do not consolidate with the shared component this pass** (`COMPONENT_SPECS.md` §3.9, §2) |
| **PageHeader** | `dashboard/components/PageHeader.jsx` | with/without back button, with/without subtitle, with/without actions slot | back button `radius.tight`; `<h1>` stays `typeScale.heading` (already exact); subtitle stays literal (documented non-conversion) (`COMPONENT_SPECS.md` §3.15) |
| **Toast** | `components/ui/Toast.jsx` | 4 tones (`success`/`error`/`warning`/`info`) | `radius.none`; `borderLeft: 3px solid tone.color` unchanged (reference implementation, `COMPONENT_SPECS.md` §3.14); `shadow.overlay` |
| **ConfirmDialog** | `components/ui/ConfirmDialog.jsx` | default confirm, danger confirm, backdrop fade-in | `radius.none`; **ADD** `borderInk` edge; danger confirmations **ADD** a `borderInk`-weight top-or-left `danger`-colored edge (verify this landed, not yet implemented per `COMPONENT_SPECS.md` §3.13); focus-trap/`inert`/restore-focus **unchanged** (functional, verify separately — see §10); action-button shape (`radius.full` pill vs. shared `Button`) is an **explicitly unresolved open item** (§5 item 1 below) — do not fail either direction unless a decision was recorded in `.ai/DECISIONS.md` and not followed |
| **EmptyState / EventLog / ErrorBoundary** | `components/ui/ErrorBoundary.jsx` | the crash-recovery card itself (trigger via a forced render error in a QA-only harness, never in production code) | outer card `radius.none` + `shadow.overlay` (KEEP); icon well/error box/`<pre>` `radius.tight`; action-button shape carries the same open question as `ConfirmDialog` (`COMPONENT_SPECS.md` §3.10, §4.5) |
| **NavigationCard** | `dashboard/components/NavigationCard.jsx` | with/without badge, {default, hover, focus-visible} | `radius.none`; icon well `radius.tight`; **ADD** `shadow.lift` on hover/focus-visible replacing translate-only lift (`COMPONENT_SPECS.md` §3.12) |
| **SessionCard** | `components/SessionCard.jsx` | idle/non-active vs. **active** state, with/without restart/stop buttons | non-active: `border` default; **active: `borderInk` edge** (EVOLVE from flat `accentGreen`), optional `shadow.lift` on hover/focus only, not resting (`COMPONENT_SPECS.md` §3.6) — this is the single highest-priority visual check on the Home page |
| **DashboardStats** | `dashboard/components/DashboardStats.jsx` | Active/Total/WebSocket tiles | outer `radius.none`, icon badge `radius.tight`, value promoted to `typeScale.metric` (`COMPONENT_SPECS.md` §3.17) |
| **ActiveAlerts** | `dashboard/components/ActiveAlerts.jsx` | present (danger strip) / absent | `radius.none`; clean 3px `danger` left edge on `surface.l1` (no tinted-background wash) — verify the **rendered CSS class**, not the component's inline `style` prop, since the CSS override wins (`COMPONENT_SPECS.md` §3.16's explicit caveat) |
| **SessionSidebar** | `dashboard/components/SessionSidebar.jsx` | normal | outer rail `radius.none`; icon badge `radius.tight`; event-feed inset panel `radius.none` (`COMPONENT_SPECS.md` §3.18) |
| **ProgressStat** (5 meter instances) | `components/HostStatusPanel.jsx` | CPU / RAM / GPU Load / GPU Temp / VRAM, each at healthy/warning/danger/no-value | value → `typeScale.metric`; threshold logic (`≥90 danger`, `≥70 warning`, else `success`, `!hasValue inkFaint`) structurally shared across all five — verify all five actually render the promoted typography, not just one (`COMPONENT_SPECS.md` §3.11) |
| **Badge** (local #1, `HostStatusPanel.jsx`) | same file | `ok`/`warning`/`bad`/`info`/`neutral` tones | `radius.full` (already correct) — **do not** consolidate with `StatusBadge` or with `SunshineStreamCard.jsx`'s local `Badge` this pass (`COMPONENT_SPECS.md` §3.8, §4.1) |
| **Badge** (local #2, `SunshineStreamCard.jsx`) | same file | same tone vocabulary minus `info` | target `radius.full`, correcting the current raw, non-tokenized `10px` literal — flagged as this document's own inference, confirm before treating as final (`COMPONENT_SPECS.md` §3.19, §5 item 5) |
| **StatRow** (local, 2 files: `HostStatusPanel.jsx`, `SunshineStreamCard.jsx`) | both | label/value pairs | no radius of its own (flex row); token-migrate values only — **do not consolidate** the two implementations this pass (`COMPONENT_SPECS.md` §4.1) |
| **StatTile** (local, 2 files: `RecoveryStats.jsx`, `SessionAnalytics.jsx`) | both | icon-badge + big-mono-value + label | `SessionAnalytics.jsx`'s instance promotes to `typeScale.metric` (17px → clamp); **do not consolidate** the two implementations this pass (`COMPONENT_SPECS.md` §3.17/§4.1, §4.4 item 4) |
| **Sidebar / MobileHeader / DashboardHeader** (shell) | `dashboard/layout/*.jsx` | nav row default/active/hover, mobile-menu button, logout button, drawer close button | nav row `radius.tight` (**not** `radius.none` — sanctioned exception); active-row accent bar widened 2px→3px; header/drawer controls `radius.tight` (`PAGE_SPECS.md` §1) |

**Squiggle** (`primitives.jsx`) — exported, zero call sites found anywhere in `frontend/src` as of the last verified pass. Not a QA target: there is nothing rendered to check. Do not assume it needs a token migration before confirming it is actually used somewhere.

---

## 5. Genuinely open items — do not silently resolve these during QA

A QA pass must **not** fail a delivery for landing on either side of these, and must **not** silently pick one itself. Each needs an explicit `.ai/DECISIONS.md` entry recording which way it went (see `DESIGN_IMPLEMENTATION_PLAN.md` §5, `COMPONENT_SPECS.md` §5):

1. **`ConfirmDialog`/`ErrorBoundary` pill-shaped (`radius.full`) action buttons** — sanctioned exception vs. migrate to shared `Button` (`radius.none`). Check: is a decision recorded? If yes, does the implementation match it? If no, flag for a decision, don't guess.
2. **Session History's status device** — bespoke icon+text vs. migrate to `StatusBadge`. Default lean (not mandate) is to keep bespoke, normalizing only the left-edge width to 3px.
3. **`Chip`'s semantic-tone enforcement** — out of scope for this entire QA pass; the token *values* (`accentLilac`, `accentPink`) existing correctly in `theme.js` is sufficient, the component API not yet steering callers toward them is a known, accepted gap.
4. **`StatRow`/`Badge`/`StatTile` consolidation candidates** — explicitly deferred everywhere; QA should confirm each pair was **token-migrated in place**, not that it was consolidated (consolidating during a "just fix the radius" task would itself be an unrequested scope change to flag).
5. **`SunshineStreamCard.jsx`'s local `Badge` raw `10px` radius → `radius.full`** — this document's own inference, not an explicit instruction; confirm before treating as settled.
6. **Host Monitor's Force Unlock → does it route through `useConfirm()`?** — not independently verified by any upstream document; a one-line check, not a blocker.

---

## 6. Page QA (Level 3)

For every routed page: route, the highest-priority visual checks, key component checks, responsive checks, interaction/state checks, known intentional exceptions, and pass criteria. Full detail always lives in `PAGE_SPECS.md §n` — this table is the checklist derived from it, not a restatement.

### Shared shell (not routed — every page lives inside it)
**Reference:** `PAGE_SPECS.md` §1.
- **Priority checks:** Sidebar/drawer nav-row radius = `radius.tight` (4px, not 0 — sanctioned exception); active-row accent bar = 3px (was 2px); header/drawer icon buttons = `radius.tight`.
- **Component checks:** `Sidebar`, `MobileHeader`, `DashboardHeader`.
- **Responsive:** 880px sidebar→mobile-menu collapse still fires correctly; this is the primary structural breakpoint, not cosmetic — treat any regression here as HIGH severity minimum (§11).
- **Interaction:** drawer focus-trap/`inert`/restore-focus and slide-in transition unchanged.
- **Known exceptions:** nav-row `radius.tight` is deliberate, not a migration miss. Header bottom border / sidebar right border stay default `border` weight, not `borderInk` — chrome is not a "load-bearing panel."
- **Pass criteria:** every EVOLVE item in `PAGE_SPECS.md` §1 applied; layout mechanics, breakpoint behavior, and header content hierarchy otherwise byte-for-byte unchanged.

### 1. Login — `pages/Login.jsx`
**Reference:** `PAGE_SPECS.md` §2. **Route:** pre-auth entry (no sidebar route).
- **Priority checks:** this is the smallest-diff page in the entire plan — form `<form>` radius `radius.lg`→`radius.none`; `inputStyle` radius `radius.sm`→`radius.none`; feature-pill and inline banner radius `radius.sm`→`radius.tight`. **Everything else (composition, `typeScale.hero`, mono eyebrow/footer, two-pane grid, vertical-divider device) must be byte-for-byte unchanged** — this page is the standing reference, not a migration target for anything beyond radius.
- **Component checks:** `Button` (primary, inherits `shadow.press` automatically — verify no Login-specific override was added).
- **Responsive:** 860px single-column collapse, 420px type-size reduction — both must be unchanged, verbatim.
- **Interaction:** focus/blur input handlers (brand border + `bgCardHover` swap) plus the new `shadow.focusRing` addition.
- **Known exceptions:** the 3%-opacity dot-grid texture permission (`DESIGN.md` §5.7) is available but **not required** — do not fail this page for not adding decoration it was never asked to add.
- **Pass criteria:** the four named radius changes applied, nothing else touched. Any other visual diff on this page in a delivery is a scope-creep flag, not a design-language pass.

### 2. Home — `dashboard/pages/Home.jsx` + `components/SessionCard.jsx`
**Reference:** `PAGE_SPECS.md` §3. **Route:** `home`.
- **Priority checks:** the **active `SessionCard` featured-card promotion** (`borderInk` edge, replacing flat `accentGreen`) is the one net-new visual rule on this page and the single highest-priority item to verify — it must be implemented inside `SessionCard.jsx` itself, not as Home-local CSS (`PAGE_SPECS.md` §3's explicit instruction), so any future consumer inherits it. Command-card (`NavigationCard`) radius 10px→`radius.none`, icon well 8px→`radius.tight`, hover treatment translate-only→`shadow.lift`. `SessionSidebar` rail 16px→`radius.none`. `ActiveAlerts` strip clean 3px left-edge (verify rendered CSS, not inline style).
- **Component checks:** `SessionCard` (active vs. idle), `NavigationCard`, `ActiveAlerts`, `SessionSidebar`/`DashboardStats`, `EmptyState`, `LoadingState`.
- **Responsive:** 1180px hero narrows + index 4→3-up; 900px hero stacks single-column, rail moves below; 520px index→1-up. Confirm all three, unchanged values.
- **Interaction:** command-card hover/focus-visible now shows `shadow.lift` + `borderStrong` instead of translate-only.
- **Known exceptions:** `<h1>` deliberately stays `typeScale.heading`, **not** `hero` — do not "upgrade" it; Home is a frequently-revisited console, not a one-time gate (contrast with Login).
- **Pass criteria:** all items in `PAGE_SPECS.md` §3's EVOLVE list applied; active-session promotion visibly outranks the rest of the page while a session is running.

### 3. Host Monitor — `dashboard/pages/HostMonitorPage.jsx` + `components/HostStatusPanel.jsx`
**Reference:** `PAGE_SPECS.md` §4. **Route:** `monitor`.
- **Priority checks:** the densest single-page task in the whole plan. Five distinct radius fixes (readiness summary 14px, section cards 12px, readiness-state pill 8px, revalidate button 7px, force-unlock box 10px/button 8px) all → `radius.none`/`radius.tight` split; readiness-summary stat (22px) and **all five** `ProgressStat` values → `typeScale.metric`; Sunshine/Tailscale/Readiness card accent borders migrate **top → left edge**, 3px, same colors.
- **Component checks:** local `SectionCard`, local `Badge`, local `StatRow`, `ProgressStat` (5 instances — verify CPU/RAM/GPU-Load/GPU-Temp/VRAM **all** correctly flip `warning`/`danger` at threshold, not just one spot-checked).
- **Responsive:** 2-column grid → 1-column at ≤780px, unchanged.
- **Interaction:** Revalidate (secondary, stays flat) vs. Force Unlock (danger, may optionally gain `shadow.press` as `dangerFilled` — implementer's call, not a defect either way). Readiness-tone and dependency-`Badge` tone changes should use `motion.transition`.
- **Known exceptions:** System/Diagnostics cards stay `surface.l1` (recessed spec-sheet), not `surface.l3` — this is a deliberate two-tier signal, not an inconsistency.
- **Pass criteria:** all 5 radius fixes, both metric-typography promotions, and the top→left edge migration confirmed; local `Badge`/`SectionCard` **not** consolidated with their shared/`SunshineStreamCard.jsx` counterparts.

### 4. Recovery — `dashboard/pages/RecoveryPage.jsx` + `components/RecoveryStats.jsx`/`RecoveryEvents.jsx`
**Reference:** `PAGE_SPECS.md` §5, corrected by `COMPONENT_SPECS.md` §4.4 item 2. **Route:** `recovery`.
- **Priority checks:** use the **corrected** metric target — the RECOVERIES/FAILURES count numbers (16px/700/mono selector), **not** the prose headline `PAGE_SPECS.md` §5 originally guessed. Failure-vs-success event entries should pair color with icon+text (verify this isn't color-only text, per principle #8).
- **Component checks:** `RecoveryStats`, `RecoveryEvents`, shared-class-inherited radius (no page-specific override expected).
- **Responsive:** two-column → one-column at the canonical 700–780px range — verify the actual `@media` value, not assumed.
- **Known exceptions:** none beyond the corrected metric target above.
- **Pass criteria:** the RECOVERIES/FAILURES numbers (not the sentence) show `typeScale.metric`; failed-recovery styling stays at its most visible `danger` weight (`DESIGN.md` §12's Errors/Recovery row) — do not soften it to match Home/Settings' calmer register.

### 5. Sunshine — `dashboard/pages/SunshinePage.jsx` + `SunshineClientManager.jsx`/`SunshineStreamHistory.jsx`/`SunshineStreamCard.jsx`
**Reference:** `PAGE_SPECS.md` §6. **Route:** `streams`.
- **Priority checks:** this page is mostly a token-migration no-op (no bespoke radius overrides beyond shared classes) — the one real item is `SunshineStreamCard.jsx`'s local `Badge` raw `10px` radius → `radius.full` (§5 item 5 above, confirm before treating as final).
- **Component checks:** local `Badge`/`StatRow` in `SunshineStreamCard.jsx` — token-migrate only, do not consolidate with `HostStatusPanel.jsx`'s equivalents.
- **Responsive:** two-column → one-column at the canonical 700–780px range, verify actual value.
- **Known exceptions:** the connection-line vocabulary between host↔client is a named, optional ADD gap (`PAGE_SPECS.md` §6) — its **absence is not a QA failure**, only its presence needs checking against §5.8's shape vocabulary (dot=live, line=connection) if it was added.
- **Pass criteria:** `success`/`danger` accent-edge states correct; no new visual metaphor invented beyond §5.8's existing vocabulary if the connection-line ADD was attempted.

### 6. Game Manager — `dashboard/pages/GameManagerPage.jsx` + `components/GameManager.jsx`
**Reference:** `PAGE_SPECS.md` §7, corrected by `COMPONENT_SPECS.md` §4.4 item 1. **Route:** `game-manager`.
- **Priority checks:** use the **corrected** button shape — `iconAddButton`/`iconGhostButton` are 30×30px **square** (not circular, as `PAGE_SPECS.md` originally guessed) → `radius.tight`, not `radius.full`. Raw rgba hover color (`rgba(110,231,176,0.22)`) migrates to a proper `*Dim`-family token.
- **Component checks:** list/form toggle mechanism (must stay in-panel, not become a route change).
- **Responsive:** form fields collapse to single-column at the app-wide 480–560px rule.
- **Known exceptions:** the "N configured launch targets" count stays a compact label, **not** `typeScale.metric` (context count, same reasoning as Users' count).
- **Pass criteria:** icon buttons correctly `radius.tight` (not `radius.full`); rgba hover color is a token, not a literal; list↔form toggle still an in-panel state change.

### 7. User Management — `dashboard/pages/UserManagementPage.jsx` + `components/UserPanel.jsx`
**Reference:** `PAGE_SPECS.md` §8, corrected by `COMPONENT_SPECS.md` §4.4 item 3. **Route:** `users`.
- **Priority checks:** toolbar 14px→`radius.none`, heading-mark 9px→`radius.tight`, refresh/delete/stale-note buttons 8px→`radius.tight`. **The "selected row" ADD item is moot** — direct inspection confirmed no checkbox multi-select exists (bulk cleanup is a single criteria-based button) — do not implement a selected-row treatment for a UI that doesn't exist.
- **Component checks:** `data-label` responsive-row pattern (KEEP verbatim — already a correct, tuned solution).
- **Responsive:** `data-label` pseudo-element fallback at narrow widths, unchanged.
- **Known exceptions:** the file's 11 distinct literal font sizes are intentional density, not a gap — do not force any onto `typeScale`.
- **Pass criteria:** all 3 named radius fixes applied; no selected-row feature added; `.pcgo-users__error` migrates radius only, dashed-border-plus-icon device unchanged.

### 8. Analytics — `dashboard/pages/AnalyticsPage.jsx` + `components/SessionAnalytics.jsx`
**Reference:** `PAGE_SPECS.md` §9, located by `COMPONENT_SPECS.md` §4.4 item 4. **Route:** `analytics`.
- **Priority checks:** the aggregate-metric target is `SessionAnalytics.jsx`'s local `StatTile` (17px/700/mono) → `typeScale.metric` — a larger jump than most other metric promotions in the app; flag as worth a visual sanity-check, not a defect if it looks larger than other pages' metrics.
- **Component checks:** local `StatTile` (do not consolidate with Recovery's `StatTile` this pass).
- **Responsive:** metrics grid 2-up ≤700px, 1-up ≤480px, per shared `.pcgo-stat-grid` rules.
- **Known exceptions:** **no charts should exist** — this is the strongest test of the "no invented charts" rule (`PAGE_SPECS.md` §9's own framing); a bar/line chart appearing here is itself a `DESIGN.md` §7/§12 violation, not a feature.
- **Pass criteria:** `StatTile` value promoted to `typeScale.metric`; breakdown-list per-row metrics stay at their smaller, supporting size; zero chart components present.

### 9. Session History — `dashboard/pages/SessionHistoryPage.jsx` + `components/SessionHistory.jsx`
**Reference:** `PAGE_SPECS.md` §10, resolved by `COMPONENT_SPECS.md` §4.2. **Route:** `history`.
- **Priority checks:** status rendering is **confirmed bespoke** (`getStatusBadge()`, not `StatusBadge`) — this is already principle-#8 compliant (color+icon+text together), just a different device from `StatusBadge`. Default expectation: keep bespoke, normalize the left-edge width from 2px to the app-wide 3px standard. Only expect a full `StatusBadge` migration if a decision explicitly overrode the default (see §5 item 2).
- **Component checks:** record/detail-expand structure (KEEP), `.is-error` event tagging (KEEP).
- **Responsive:** confirm record rows collapse to a stacked/labeled layout at narrow widths (not independently verified upstream — flag if missing, this is a real open verification item).
- **Known exceptions:** all documented literal type sizes (13px record title, 9px status, 8px meta) are intentional density — do not force onto `typeScale`.
- **Pass criteria:** left-edge width normalized to 3px; status device decision matches whatever was actually recorded (bespoke-normalized or migrated, either is a pass if it matches the decision on file).

### 10. Logs — `dashboard/pages/LogsPage.jsx` + `components/LogPanel.jsx`
**Reference:** `PAGE_SPECS.md` §11. **Route:** `logs`.
- **Priority checks:** near-no-op by design — `radius.none` throughout (already close to 0 pre-migration). **Do not** promote any Logs value to `typeScale.metric`, even the entry-count stat — this is an explicit, named exception to the metric-promotion rule applied everywhere else.
- **Component checks:** none beyond the page's own dense mono vocabulary (KEEP entirely).
- **Responsive:** no page-specific breakpoint concerns identified; confirm no horizontal-scroll trap was introduced.
- **Known exceptions:** this is **the litmus-test page for the entire anti-pattern list** (`PAGE_SPECS.md` §11's own framing) — if a reviewer is unsure whether a decorative treatment belongs anywhere in PCGO, "would this belong on Logs" is the fastest gut-check. Nothing here should ever gain a hard shadow, a lift effect, or texture.
- **Pass criteria:** dense mono vocabulary and every literal type size completely unchanged; only `radius.none` confirmed; zero decoration added anywhere.

### 11. Settings — `dashboard/pages/SettingsPage.jsx` + `components/SettingsPanel.jsx`
**Reference:** `PAGE_SPECS.md` §12. **Route:** `settings`.
- **Priority checks:** overview-banner left edge 2px→3px (normalize); all `SectionCard`/`Card` instances → `radius.none` via shared-primitive migration; theme-swatch cards inherit `Card`'s migration automatically (rectangle container + `radius.full` circular swatch inside is the correct, already-endorsed pattern — do not add a special-case override).
- **Component checks:** `SettingsPanel` (Save action, only enabled when draft is dirty — verify this still works, it's a UX decision independent of the visual pass), `LinkRow`, `ThemeSwatchCard`/`CustomThemeSwatchCard`.
- **Responsive:** theme-swatch grid and settings rows collapse to single-column at 700px / 480–560px, per app-wide rules.
- **Known exceptions:** the ~13 distinct literal type sizes are intentionally left un-migrated (KEEP, per the file's own documented audit) — Settings' calm-but-detailed register is correct as-is. **Resist any "make it prettier" addition** — `PAGE_SPECS.md` §12 explicitly names this page as the one most likely to tempt unjustified decoration.
- **Pass criteria:** overview banner at 3px; all section cards at `radius.none`; no decorative addition beyond what the EVOLVE list names; Save button behavior (dirty-state gating) unchanged.

### 12. Change Password — `dashboard/pages/ChangePasswordPage.jsx`
**Reference:** `PAGE_SPECS.md` §13. **Route:** reached via Settings → "Change password" link, not a sidebar item.
- **Priority checks:** card → `radius.none`; icon mark (`ShieldCheck` badge) and required-badge → `radius.tight`; inputs → `radius.none`, matching Login's own input treatment exactly (this page is Login's explicit "security form" sibling).
- **Component checks:** local `PasswordField` (KEEP anatomy/validation logic).
- **Responsive:** confirm card max-width/padding collapse at 420/380px (already named as tuned in `DESIGN.md` §9).
- **Known exceptions:** treat this page as Login's sibling, not Settings' child, for any visual judgment call not explicitly covered — its narrow, single-card, calm register should stay closer to Login than to Settings even though it's reached via Settings' navigation. `PAGE_SPECS.md` §16's checklist specifically calls out cross-checking this page against Login once both are done.
- **Pass criteria:** card/icon-mark/input radii applied; visual register still reads as a Login sibling, not a denser configuration-workspace tone.

### 13. Not Found — `dashboard/pages/NotFoundPage.jsx`
**Reference:** `PAGE_SPECS.md` §14. **Route:** wildcard/unmatched.
- **Priority checks:** smallest task in the plan — geometry token migration only.
- **Component checks:** single "Go To Home" `secondary`-variant button — **do not** upgrade to `primary`/`shadow.press`, this page correctly has no "main task" to overstate.
- **Responsive:** centered card padding collapses reasonably at narrow widths (no bespoke breakpoint expected).
- **Known exceptions:** this page is deliberately "boring on purpose" — a QA reviewer adding visual interest here would itself be the defect (`PAGE_SPECS.md` §14's own framing).
- **Pass criteria:** geometry tokens applied; page remains quiet; no new visual element added.

---

## 7. Screenshot / render QA — the real tooling in this repository

**Verified fact, not assumed:** `frontend/qa/` is a real, already-built Playwright render harness (`render.mjs`, `fixtures/route-map.js`, `fixtures/mock-data.js`, `README.md`). It drives the actual app — real components, real CSS, real routing, real theme — against a live `vite dev` server, intercepting only the backend network calls with representative fixture data. This is the tool to use for visual QA; do not invent a different one.

**Verified fact:** `playwright` is intentionally **not** a committed `devDependency` (per `.ai/DECISIONS.md` D-006, confirmed absent from `package.json` in this pass) — it must be installed ephemerally per the commands below.

### How to start the frontend
```bash
cd frontend
npm install
npm run dev            # serves on http://127.0.0.1:5173
```

### How to render pages for visual QA
```bash
cd frontend
npx playwright install chromium   # one-time, downloads a browser binary
node qa/render.mjs                # requires `npm run dev` already running in another terminal
```
Output: `frontend/qa/output/<page>__<state>__<viewport>.png` plus `frontend/qa/output/manifest.json` (every capture attempted, with success/failure recorded).

**Environment caveat, stated honestly:** `DESIGN_IMPLEMENTATION_PLAN.md` §6 itself notes this harness's Chromium-binary download is "historically inconsistent" depending on the sandbox's network egress. In this pass, `npm view playwright version` successfully reached the npm registry, but the actual browser-binary download was not attempted (out of scope for writing this document) and its own package manifest is not in this project's committed dependency list — **treat "can I actually run `qa/render.mjs` in my current environment" as something to verify fresh each session, not something to assume from either this document or the implementation plan.** If the Chromium binary is unreachable, use the fallback in the next subsection.

### Fallback if Playwright/Chromium is unreachable
1. Run `npm run build` and manually inspect the compiled CSS (`dist/assets/*.css`) with a text search for the specific token/radius values being verified (e.g. `grep` for a bare `12px`/`16px` radius that should now be `0`/`4px`/`999px` — a mechanical but real check).
2. Run the app via `npm run dev` and inspect it in any locally-available browser, manually resizing to the five canonical viewports (§8) — slower than the automated harness but produces the same ground truth.
3. Read the relevant `.jsx`/`.css` source directly and trace the actual computed values, cross-referencing the specific `PAGE_SPECS.md`/`COMPONENT_SPECS.md` section — acceptable for a token-value check (radius, color, font stack), not a substitute for a real render when checking layout/composition/responsive reflow.

**Never** treat `assets/screenshots/` in this repository as current evidence of anything — it is explicitly documented as stale (`.ai/DECISIONS.md` D-001, `.ai/RULES.md`), predating the current theme/sidebar implementation entirely.

### Which pages the harness actually captures
Verified directly from `qa/render.mjs`'s `FULL_PLAN` array — 12 of the 13 routed pages, at the states and viewports below. **Login and Not Found are not captured** (Login is pre-auth and out of the harness's authenticated-session flow by design; Not Found has no meaningful data-driven state to mock).

| Page | States captured | Viewports captured |
|---|---|---|
| Home | normal, attention, active, empty, loading, error | normal: all 5 (1440/1024/768/390/360); others: 1440 (+390 for attention) |
| Host Monitor | normal, attention, active, error | normal: 1440/1024/768/390; others: 1440 (+390 for attention) |
| Recovery | normal, empty, long, attention | 1440 (+390 for normal) |
| Sunshine | normal, active, empty | 1440 (+390 for normal) |
| Game Manager | normal, empty, long | 1440 (+390 for normal) |
| User Management | normal, long | 1440 (+390 for normal) |
| Analytics | normal, empty, loading | normal: 1440/1024/768/390; others: 1440 |
| Session History | normal, empty, long | 1440 (+390 for normal) |
| Logs | normal, empty, long | 1440 (+390 for normal) |
| Settings | normal | 1440/390 |
| Change Password | normal | 1440/390 (reached via a scripted click through Settings, not a direct URL) |

**When screenshots should be compared:** after any `TCB-P4` page task lands (that page's own captures), after any `TCB-P2` shared-component task lands (re-capture Home + Host Monitor as the two most layout-complex pages, per the harness's own stated rationale in `qa/README.md`), and in full during `TCB-P8`'s global QA pass.

**What constitutes a visual regression:** any unintended difference from the prior accepted capture in radius, shadow, color, spacing, or layout on a page/state/viewport combination **not named in the task's own EVOLYE list** — an intended, spec'd change is not a regression; an unrelated shift on the same or a different page is. Compare the new `qa/output/manifest.json` capture set against the prior accepted one — since there is no committed "golden" screenshot baseline in this repository (by design, per D-001's stated failure mode with static screenshots), "prior accepted" means the most recent Main-Claude-accepted delivery's own capture set, not a permanently committed image.

---

## 8. Canonical viewports

Verified against `DESIGN.md` §9, `.ai/RULES.md`'s "Responsive design is mandatory at 1440 / 1024 / 768 / 390 / 360," and `qa/render.mjs`'s own `VIEWPORTS` object (`{1440×900, 1024×900, 768×1000, 390×844, 360×780}`) — all three sources agree on the same five values.

| Viewport | What it's intended to catch |
|---|---|
| **1440px** | Full desktop layout — sidebar visible (252px), widest grid configurations (Home's 4-up command index, Host Monitor's 2-column grid at full width). The primary "does this look like the finished product" viewport. |
| **1024px** | The 1040–1180px optional-header-element drop and 3-up grid narrowing; also near the 880px sidebar-collapse threshold — catches layout that assumes desktop width but hasn't accounted for the narrower end of it. |
| **768px** | Just above/at the 700–780px two-column→one-column stack threshold for detail pages (Recovery, Sunshine, User Management) and the 880px sidebar-collapse boundary — the tablet range where most structural breakpoints in this app actually live. |
| **390px** | Standard mobile width — sidebar is collapsed, stat grids drop to 2–3 columns, toolbars/forms go single-column/full-width. The most-tested non-desktop viewport in the harness's own plan. |
| **360px** | The narrowest supported width — wordmark abbreviation ("CGO"), 1–2 column stat grids, `data-label` key/value row fallback, final type-size reductions. Catches truncation/overflow issues 390px is just wide enough to hide. |

**Do not consolidate this set for tidiness** — `DESIGN.md` §9 explicitly protects it as already well-tuned via multiple prior audit passes.

---

## 9. Theme QA

**Verified fact:** six built-in themes exist via a single `[data-theme="…"]` attribute swapping ~15 CSS custom properties, defined once in `App.jsx`'s injected `GLOBAL_CSS` string: default (amber), `verdant`, `ember`, `classic`, `mono`, `oled`. A seventh, "custom," theme is derived at runtime from a user-picked color (`dashboard/theme-derive.js`).

**OLED is the primary visual target for the Tactical Console Brutalism redesign** (`DESIGN.md` §2, §15) — most QA rendering (§7's harness plan) should default to the `oled` theme unless a check is specifically about cross-theme consistency.

Theme QA checklist:
- [ ] The `oled` theme renders every migrated token correctly — this is the theme every `DESIGN.md` rule was written against; treat any `oled`-specific regression as at least HIGH severity (§11).
- [ ] The other five themes (amber default, `verdant`, `ember`, `classic`, `mono`) are **not accidentally broken** by a token-value change — spot-check at least the highest-traffic pages (Home, Login, Host Monitor) in 2–3 non-OLED themes per QA pass, not an exhaustive 6-theme × 13-page sweep every time.
- [ ] Semantic tokens (`success`/`warning`/`danger`/`info`/`accentLilac`/`accentPink`, `surface.l0`–`l4`) remain valid — i.e., still resolve to a real, contrast-correct color — in every theme, not just `oled`.
- [ ] Theme switching does not introduce a layout shift or a flash of unstyled/broken content — this is a runtime-behavior check (switch a theme via Settings, watch for jank), not a static-render check.
- [ ] No OLED-specific hardcoded color leaks into a shared component (`components/ui/primitives.jsx`, `StatusBadge.jsx`, `Toast.jsx`, `ConfirmDialog.jsx`) — every color in a shared file must resolve via the CSS-variable/`theme.js` pipeline, never a literal that only looks correct against OLED black.
- [ ] `dashboard/theme-derive.js` (the "custom" theme) is updated in lockstep with any new CSS variable this redesign introduces — `DESIGN.md` §14 names this as a known limitation to actively guard against, not a hypothetical.
- [ ] The `mono`/`classic` themes specifically are worth an extra look for `shadow.press`/`shadow.lift`'s offset color — `DESIGN.md` §16 open question 2 flags that a neutral ink offset (vs. a per-theme-tinted one) was recommended but never visually proofed against these two themes specifically.

**Do not redesign the other five themes** — this entire project's token changes apply uniformly across all `[data-theme]` blocks by construction (the CSS-variable architecture is unchanged); if a non-OLED theme looks meaningfully worse after a change, that is a regression to fix, not an invitation to re-tune that theme's own palette.

---

## 10. Functional regression QA

This is a **visual** redesign — per `.ai/RULES.md`'s non-negotiable functionality freeze, none of the following should change, and any visual-task delivery that touches them has exceeded scope regardless of how good the visual result looks:

- [ ] **Authentication** — login flow, token storage/retrieval (`access_token`/`username`/`role` in `localStorage`, per `src/api/client.js`), bootstrap-mode (first-run admin registration) branching logic.
- [ ] **Routing** — `useRoute()` hook behavior, the 10-item `NAV_ITEMS` route set (`home`/`monitor`/`recovery`/`streams`/`game-manager`/`users`/`analytics`/`history`/`logs`/`settings`), Change Password's reach-via-Settings-link pattern, Not Found's wildcard match.
- [ ] **Session creation & control** — `StartSessionForm`'s launch flow, restart/stop actions on `SessionCard`, session-lifecycle status transitions (`ACTIVE_STATUSES` set: `starting`/`running`/`stopping`/`cleaning`).
- [ ] **Host operations** — Revalidate Host, Force Unlock (and its confirmation flow, if routed through `useConfirm()` — verify per §5 item 6), host status/metrics polling.
- [ ] **Recovery** — recovery-channel status computation, event filtering/expand-for-detail toggles (Tailscale recovery/failure details).
- [ ] **Sunshine controls** — start/restart Sunshine, client pairing/unpairing, stream history recording.
- [ ] **Game management** — add/edit/delete game entries, save-path/filter validation, list↔form toggle state (must stay a local view change, not become a route change).
- [ ] **User management** — create-user flow, per-row delete, bulk "Remove excess accounts" (single criteria-based action, **not** a checkbox multi-select — confirm this hasn't been silently added or assumed, per §6's Users section).
- [ ] **Settings** — the local-draft-plus-explicit-Save model (Save enabled only when the draft is dirty), theme selection/persistence, About info display.
- [ ] **Logs** — filter controls, severity classification, live-append behavior if present.
- [ ] **Dialogs** — `ConfirmDialog`'s focus-trap/`inert`/restore-focus-to-opener (20-attempt fallback search), `Escape`-to-close, `Tab`-cycling.
- [ ] **Toasts** — `useToast()` call sites and the notification stack's queuing/dismissal behavior.
- [ ] **Loading/error states** — every page's existing skeleton-pulse and error-banner **logic** (which condition triggers which state) is unchanged; only the visual treatment of that state may change.

**Known pre-existing bug, explicitly not in scope to fix here:** `EventLog.jsx` line 74 reads `latest.session_id` unguarded inside a `useEffect` dependency array (`latest = events[0]`) — on a genuinely fresh browser with no cached `pcgo_ws_events`, this throws and trips the global `ErrorBoundary`, replacing the entire Home page on first load (`.ai/DECISIONS.md` D-004). QA should **not** treat this as a redesign defect, and should **not** expect a Worker to have silently patched it as part of a visual task — flag it separately if encountered, per D-004's own instruction. (The `qa/render.mjs` harness itself works around this with a `localStorage` seed, not a code patch — see `frontend/qa/render.mjs`'s own comment, verified in this pass.)

---

## 11. QA severity

Applied consistently across Levels 1–5. A finding gets exactly one severity; when in doubt, round up rather than down.

### BLOCKER
Critical functionality is broken (anything in §10's list no longer works), **or** a `DESIGN.md` §11 anti-pattern has shipped into the real, rendered application (glassmorphism/backdrop-blur, RGB/neon "gamer" styling, rainbow multi-hue in one view, a soft generic-SaaS shadow, a raw hex/rgba color, a rounded-corner value strictly between 4px and 999px on a structural surface). Also BLOCKER: `ConfirmDialog`'s focus-trap/restore-focus logic regressed, or a backend/API/routing/business-logic file was modified.

### HIGH
A major design-language violation that doesn't rise to a shipped anti-pattern but is still a clear miss: a structural panel left on an old 8/12/16px radius; `shadow.lift`/`shadow.press` applied to a dense list row or a non-primary action; a status shown via color alone with no shape/text; a broken responsive layout at any of the five canonical viewports (especially the 880px sidebar-collapse or the ≤480px wordmark/stat-grid/data-label thresholds); a touch target under 40×40px; a significant accessibility regression (missing focus-visible ring, keyboard trap).

### MEDIUM
A visible inconsistency that should be fixed before the task is considered complete, but doesn't break usage or violate a named anti-pattern outright: an accent-edge on the wrong side or at the wrong width (e.g. still 2px instead of 3px, or still a top edge instead of left); a metric-typography promotion applied inconsistently across otherwise-identical instances (e.g. 4 of 5 `ProgressStat` meters promoted, one missed); a `motion.transition` state change that still uses `motion.hover` or no transition; a surface-elevation choice that doesn't match its documented tier.

### LOW
Minor polish that does not materially affect the system: a slightly-off spacing value with no functional or hierarchy impact, a documented-as-intentional literal type size that's a pixel or two off from where a prior audit pass left it, a cosmetic nit on a page explicitly named as low-priority (Not Found, Logs beyond its `radius.none` requirement).

**Do not invent a severity for a genuinely open item** (§5) — those are neither passes nor failures until a decision is recorded; flag them as "unresolved, needs a decision," not as a bug of any severity.

---

## 12. Worker QA — what every Worker must verify before delivering

Per `DESIGN_IMPLEMENTATION_PLAN.md`'s Worker/Main model and `.ai/RULES.md`'s non-negotiables, every Worker task must self-verify before delivery:

1. **Scope compliance** — only the files named in the task's "Files / areas affected" list were touched. Run `git diff --stat` (or an equivalent full-tree diff against the accepted baseline, since this project uses full-repo delivery, not git-tracked incremental commits — see §13) and confirm no file outside that list changed.
2. **Build** — `cd frontend && npm run build` succeeds with 0 errors.
3. **Lint** — `cd frontend && npm run lint` produces no **new** errors relative to the accepted baseline (as of this pass: 0 errors, 4 pre-existing `react-refresh/only-export-components` warnings in `ConfirmDialog.jsx`, `Toast.jsx`, `ThemeContext.jsx` ×2 — these four warnings are a known, accepted baseline state, not something a Worker introduced or must fix).
4. **Tests** — `cd frontend && npm run test` — all existing tests still pass (as of this pass: 24 tests across 5 files). A Worker task should not need to add or change tests unless its own task explicitly says so; a visual-only change breaking an existing test is itself a functional-regression signal (§10), not a test to "fix" by loosening an assertion.
5. **Affected component/page rendered** — via `qa/render.mjs` where reachable (§7), or the documented fallback if not.
6. **Responsive behavior relevant to the task** — at minimum the two viewports most likely to be affected by the specific change (usually 1440 + 390); the full five-viewport sweep is `TCB-P7`'s job, not every individual task's.
7. **No unrelated visual changes** — a diff review of the actual rendered output, not just the code diff, since CSS cascades can produce visual changes in files that weren't directly edited.
8. **No functionality changes** — walk the relevant subset of §10's checklist for whatever this task touched.
9. **No new duplicate components** — check `COMPONENT_SPECS.md` §2/§4.1's known duplicate-adjacent components list before adding anything that might overlap; if a genuinely new pattern was needed, it should be named and flagged in the delivery report, not silently added.
10. **Correct token usage** — the specific radius/shadow/motion/color/typeScale values match what the cited `PAGE_SPECS.md`/`COMPONENT_SPECS.md` section calls for, not an approximation.

**A Worker's delivery report should state:**
- Files changed (matching the task's own scope list).
- Functionality preserved (explicit confirmation against §10's relevant items, not just "nothing broke").
- Checks actually run (lint/build/test output, not just "ran clean").
- Visual checks performed (which viewports, which states, via which method — harness or fallback).
- Known issues or open questions (including any of §5's genuinely-open items this task's scope touched).
- Anything requiring Main review (a judgment call the task's own spec left to the implementer, e.g. Game Manager's Add-button `shadow.press` question, `PAGE_SPECS.md` §7).

**A Worker cannot declare its own task, or the project, complete** (`.ai/RULES.md`) — self-verification above is a precondition for delivery, not a substitute for Main's acceptance review (§13).

---

## 13. Main Claude acceptance QA — stricter than Worker self-checking

Before accepting any Worker delivery, Main Claude verifies, per `.ai/RULES.md`'s full-repo-delivery convention (`DESIGN_IMPLEMENTATION_PLAN.md` §1.4):

1. **`diff -rq`** the delivered full-repo tree directly against the **last accepted baseline** — this project's convention is full-repo delivery specifically so this diff needs no reconstruction step. Confirm `.ai/*` is actually present in the delivered tree (verify with `unzip -l` before accepting, per `.ai/RULES.md`'s own note that this has caught a real packaging gap before).
2. **Scope compliance** — the diff touches only the files the task's spec named. For `TCB-P4` page tasks specifically, confirm the diff's `feature-page.css` changes are scoped to **that page's own BEM block** and no other page's block was touched (`DESIGN_IMPLEMENTATION_PLAN.md` §2.3's specific, real collision risk for this shared file).
3. **No accidental changes** — anything in the diff not traceable to the task's own spec is a flag, even if it looks like an improvement; unrequested changes should be called out to the person, not silently accepted.
4. **Design-document compliance** — the delivered change actually matches the cited `PAGE_SPECS.md`/`COMPONENT_SPECS.md` section's EVOLVE list, not merely "something in the right direction."
5. **Functional regression** — re-run §10's checklist for whatever this delivery touched; do not trust the Worker's self-report as sufficient on its own for anything touching auth/routing/session/host logic.
6. **Visual regression** — re-render via `qa/render.mjs` (or the fallback) and compare against the prior accepted capture set, not just trust the Worker's own screenshots.
7. **Appropriate token usage** — spot-check at least one non-obvious value (not just the headline radius change) against the cited section.
8. **Component reuse** — confirm no new duplicate component was introduced beyond what `COMPONENT_SPECS.md` already tracks as a known, deferred overlap.
9. **Responsive behavior** — at minimum the viewports the Worker's own report claims to have checked; expand to the full five if the task touched layout/grid structure rather than pure token values.
10. **Documentation updates** — if the delivery resolved one of §5's open items with an actual decision, confirm that decision was written to `.ai/DECISIONS.md`, not left only in the delivery's own prose (`.ai/RULES.md`'s "important decisions must be written to `.ai/DECISIONS.md`" non-negotiable).

**Full-repo delivery risk to actively guard against:** because Workers deliver the complete `frontend/` tree rather than a changed-files-only patch, accepting a second Worker's delivery from the same baseline **silently overwrites** a first Worker's already-accepted changes to any shared file both happened to touch, unless Main manually merges the two diffs first (`DESIGN_IMPLEMENTATION_PLAN.md` §1.4). This is precisely why `TCB-P4`'s 12 page tasks are dispatched and **accepted one at a time**, not concurrently, even though they are logically independent (§2.3 of the implementation plan) — Main acceptance QA should treat "was this delivery based on the actual current accepted baseline, not a stale earlier one" as a check in its own right before running any of the checks above.

---

## 14. Visual regression workflow

```
BASELINE (last Main-accepted full-repo tree + its qa/output capture set,
          NOT the stale assets/screenshots/ directory — D-001)
   │
   ▼
IMPLEMENT (Worker executes one bounded task per DESIGN_IMPLEMENTATION_PLAN.md)
   │
   ▼
AUTOMATED CHECKS (npm run lint / build / test — §7's verification commands)
   │
   ▼
RENDER AFFECTED SURFACE (qa/render.mjs, or the documented fallback — §7)
   │
   ▼
COMPARE AGAINST EXPECTED DESIGN (the cited PAGE_SPECS.md/COMPONENT_SPECS.md
                                  section — not a vague "does it look nicer")
   │
   ▼
INSPECT DIFF (both the code diff AND the rendered-output diff — a CSS
              cascade can change pixels in files that weren't edited)
   │
   ▼
FIX (if a discrepancy is found — back to IMPLEMENT)
   │
   ▼
MAIN ACCEPTANCE (§13 — diff -rq against baseline, scope/regression/token
                 checks, full-repo-delivery collision check)
   │
   ▼
UPDATE BASELINE (the newly-accepted full-repo tree + its own qa/output
                 capture set become the new "last accepted baseline" for
                 the next task)
```

**Distinguishing the four kinds of check used throughout this workflow:**
- **Automated checks** — `npm run lint`/`build`/`test`. Objective, fast, catch functional and syntactic regressions. Do not catch visual correctness.
- **Screenshot comparison** — `qa/render.mjs`'s captures against the prior accepted capture set. Catches layout/color/spacing regressions across a fixed set of (page, state, viewport) combinations. Does not catch anything outside that fixed plan (§7's table) — a page/state/viewport not in `FULL_PLAN` needs manual review instead.
- **Manual visual review** — a human or Claude session actually looking at a live `npm run dev` render, needed for anything the harness's fixed plan doesn't cover (Login, Not Found, any state/viewport combination not in `FULL_PLAN`) and for qualitative "does this still feel like PCGO" judgment calls (§15).
- **Code inspection** — reading the actual `.jsx`/`.css` diff against the cited design-document section. The only method that can confirm *why* something renders a certain way, not just *that* it does — necessary whenever a screenshot looks correct but the underlying implementation might have arrived at that result the wrong way (e.g. a hardcoded pixel value that happens to currently equal `radius.tight`'s 4px, which would silently drift from the token if the token's value ever changed).

---

## 15. Anti-drift check

Run this — as a set of questions, not a mechanical checklist — at the end of any page or component task, and in full during `TCB-P8`'s global QA pass. These are `DESIGN.md`'s own principles, restated as review questions, not generic design advice:

- Does this still look like PCGO — a physical control panel for one gaming host — or does it read as a generic admin template with PCGO's copy pasted in? (`DESIGN.md` §1)
- Does it still read as a cloud-gaming orchestrator, not a "gamer" product (no RGB/neon) and not a SaaS marketing site with a dashboard bolted on? (`DESIGN.md` §2.2)
- Are components visually related to each other, or does this page look like it was designed independently of the others? (`DESIGN.md` §4.9 — "one coherent system, many page personalities.")
- Are surfaces becoming too soft — is a rounded-corner value creeping back in anywhere between `radius.tight` and `radius.full`? (`DESIGN.md` §11)
- Are shadows becoming decorative — has a `shadow.lift`/`shadow.press` shown up on something that isn't a genuinely interactive/featured element, or has a blurred halo shadow reappeared on a static panel? (`DESIGN.md` §5.5)
- Is typography losing its hierarchy — has a heading crept toward body weight, or has uppercase spread beyond `typeScale.meta`-tier labels? (`DESIGN.md` §5.2, §11)
- Is a page becoming over-designed relative to its own density dial — has Settings gained decoration it doesn't need, or has Logs gained anything beyond `radius.none`? (`DESIGN.md` §12/§14)
- Is the OLED hierarchy still strong — does the black canvas still read as the brand, or has a page started leaning on lighter backgrounds/gradients for visual interest? (`DESIGN.md` principle #2)
- Is operational information still readable — would a CPU/GPU/RAM number on Host Monitor still be the most legible thing on that section of the screen? (`DESIGN.md` principle #5)
- Are decorative elements being added without a stated purpose — can every visual flourish on this screen be justified by "this makes a control clearer," or does at least one exist only because "it looks nice"? (`PAGE_SPECS.md` §12's explicit Settings warning, generalizable to any page)
- Are page-specific one-off patterns proliferating — did this task invent a new shape/device instead of reaching for `DESIGN.md` §5.8's existing vocabulary (dot=live, ring=idle, rectangle=module, left-edge=alert, line=connection, arrow=navigation, mono-bold-number=metric, filled-pill=primary-action)?

If the honest answer to any of these is "yes, drift has occurred," that finding gets a severity per §11 (usually MEDIUM or HIGH depending on how far it's spread) and a scoped follow-up task — it does not get silently waved through because the individual task that introduced it otherwise passed its own narrower checklist.

---

## 16. Final product checklist — run before declaring the redesign complete

This mirrors, and should be run alongside, `DESIGN_IMPLEMENTATION_PLAN.md` `TCB-P8`'s own Definition of Done — this document supplies the QA rubric that phase executes against, not a competing checklist.

**Design tokens**
- [ ] `radius`: only `none`(0)/`tight`(4)/`full`(999) exist anywhere in the touched codebase — no lingering 6/7/8/9/10/12/14/16px value.
- [ ] `shadow`: only the five named tokens (`flat`/`press`/`lift`/`overlay`/`focusRing`) are used anywhere; no ad hoc `box-shadow` literal survives.
- [ ] `motion`: `press`/`hover`/`transition`/`entrance` used per §4's Motion checklist; no undocumented new animation exists.
- [ ] `typeScale.metric` is applied everywhere §3's Typography checklist requires it, and nowhere it explicitly excludes (Logs, item-context counts).
- [ ] No raw hex/rgba color survives anywhere it was flagged for migration (`.pcgo-host-force-unlock`, Game Manager's add-button hover, `SunshineStreamCard.jsx`'s `Badge` radius if resolved to `radius.full`).

**Components**
- [ ] Every component in §4's table passes its own state-by-state check.
- [ ] Every §5 open item is either explicitly decided (recorded in `.ai/DECISIONS.md`) or explicitly still deferred and recorded as such — none silently forgotten.

**Pages**
- [ ] Every page in §6 passes its own priority checks and pass criteria.
- [ ] `PAGE_SPECS.md` §16's cross-page consistency checklist passes at whole-product scope (radius/metric/accent-edge/status/raw-color/shadow-scope/sibling-pairing items).

**Shell**
- [ ] Sidebar/MobileHeader/DashboardHeader radius and accent-bar-width changes applied; 880px collapse behavior unchanged.

**Responsive**
- [ ] All 13 pages verified at all 5 canonical viewports (`TCB-P7`'s own scope) — no page skipped.
- [ ] No touch target under 40×40px anywhere `radius.none`'s sharp corners might tempt one.

**Accessibility**
- [ ] `ConfirmDialog`'s focus-trap/`inert`/restore-focus logic unchanged and still functioning.
- [ ] WCAG-AA contrast holds across all six themes for any token whose *value* actually changed (not a blanket re-audit of everything).
- [ ] Every status pairs color with shape/text everywhere in the product, no exceptions.

**Motion**
- [ ] `TCB-P6`'s own audit (every state-change site using `motion.transition` where appropriate) is complete and its findings closed.
- [ ] `prefers-reduced-motion: reduce` still correctly collapses every animation, including newly-added ones.

**Functionality**
- [ ] §10's full checklist passes with zero regressions.
- [ ] No file outside `frontend/src/` (or the plan's other named-in-scope locations) plus `.ai/` was ever touched — confirm via a final full-tree diff scope check.

**Theme behavior**
- [ ] §9's Theme QA checklist passes — `oled` correct, other five not broken, `theme-derive.js` in lockstep.

**Visual consistency**
- [ ] §15's anti-drift questions all come back "no drift" at whole-product scope.

**Anti-patterns**
- [ ] `DESIGN.md` §11's full anti-pattern list is confirmed absent from the real, rendered app — not just absent from the written design language.

**Regression**
- [ ] Screenshot comparison (§7/§14) shows no unintended difference from the prior accepted baseline anywhere in the harness's coverage (§7's table).

**Documentation**
- [ ] `.ai/DECISIONS.md`/`STATE.md`/`PLAN.md`/`HANDOFF.md` (or this project's equivalents, per `DESIGN_IMPLEMENTATION_PLAN.md` §0's instruction to keep `TCB-` work in a clearly-separated section) reflect the final, implemented state — not left describing an earlier, partially-migrated one.

---

## 17. Uncertainties and limitations this document flags honestly

Per the same discipline the four upstream documents used — flagging a gap rather than inventing a fix for it:

1. **Playwright/Chromium reachability is environment-dependent and was not re-verified end-to-end in this pass** (only `npm view playwright version` against the npm registry, not an actual `npx playwright install chromium` browser-binary download). Any session relying on §7's primary render method should re-verify this fresh, and fall back to §7's documented alternative if it fails, rather than assuming either outcome.
2. **`qa/render.mjs`'s `FULL_PLAN` does not cover Login or Not Found.** Visual QA for these two pages must use the manual-review or code-inspection methods from §14, not the automated harness — this is a real, structural gap in the existing tooling's coverage, not an oversight in this document.
3. **No committed "golden" screenshot baseline exists in this repository** (by design — `.ai/DECISIONS.md` D-001 explicitly rejects static screenshots as a source of truth because they go stale silently). This means "visual regression" in this document is always relative to the *most recently accepted* capture set, not a permanent reference image. A team that wants a permanent visual baseline would need to make that an explicit, separate decision (committing `qa/output/` selectively, or a real screenshot-diffing tool) — this document does not propose that, consistent with its own instruction not to introduce new tooling.
4. **Session History's status-device question (§5 item 2) and the `ConfirmDialog`/`ErrorBoundary` button-shape question (§5 item 1) remain open** as of this pass. Whichever way each is eventually decided, this document's own checklists (§4, §6.9) are written to pass either outcome, provided the choice is actually recorded in `.ai/DECISIONS.md` — QA should verify the recording exists, not the specific direction chosen.
5. **`.ai/RULES.md`'s own "Verified environment notes" section is itself now stale in one respect** (it claims 13 lint errors from `qa/render.mjs`'s Node globals; re-running `npm run lint` in this pass found 0 errors, because `eslint.config.js` already contains a scoped override for `qa/**/*.mjs` that resolves exactly that class of error). This document uses the freshly re-verified result. A future QA pass should continue to re-run these commands rather than trusting either this document's or `RULES.md`'s recorded numbers indefinitely — tooling state drifts, and `RULES.md`'s own source-of-truth hierarchy says the actual repository always wins.
6. **Recovery's and Sunshine's exact tablet-breakpoint `@media` values were not independently re-confirmed against the canonical 700–780px range in this pass** (`PAGE_SPECS.md` §17 item 6 flags the same gap) — listed in §6's per-page responsive checks as items to verify, not assumed correct.
7. **This document does not attempt to verify Session History's narrow-viewport row-collapse behavior**, since `PAGE_SPECS.md` §10 itself flags this as not independently line-verified — carried forward as an open verification item in §6 rather than silently assumed to work like Users' `data-label` pattern.

---

## Summary

- **Five-level QA hierarchy** (token → component → page → responsive → whole-product), each with its own section (§2, elaborated in §4/§6/§8/§14–§16).
- **Real tooling used, nothing invented:** `frontend/qa/render.mjs` (Playwright harness, verified present and inspected in full), `npm run lint`/`build`/`test` (all three re-run in this pass, not assumed from stale `.ai/RULES.md` numbers), the five canonical viewports (verified consistent across `DESIGN.md`, `.ai/RULES.md`, and the harness's own `VIEWPORTS` object).
- **Pages covered:** all 13 routed pages plus the shared shell (§6), cross-referenced to their `PAGE_SPECS.md` section and any `COMPONENT_SPECS.md` correction.
- **Components covered:** `Button`, `Card`, `Chip`, `Spinner`, `EmptyState`, `LoadingState`, `StatusBadge`, `SectionCard` (shared + local), `PageHeader`, `Toast`, `ConfirmDialog`, `ErrorBoundary`, `NavigationCard`, `SessionCard`, `DashboardStats`, `ActiveAlerts`, `SessionSidebar`, `ProgressStat`, the two local `Badge`/`StatRow`/`StatTile` duplicate pairs, and the shell's `Sidebar`/`MobileHeader`/`DashboardHeader` (§4).
- **QA tooling discovered:** a working, previously-built Playwright render harness with real fixture/mock-routing infrastructure — not something this document had to invent.
- **Automated checks available:** `npm run lint`/`build`/`test`, all three currently green (0 lint errors, build succeeds, 24/24 tests pass, re-verified fresh in this pass).
- **Manual checks required:** Login and Not Found (outside the harness's plan), any theme other than `oled` beyond a spot-check, qualitative anti-drift judgment calls (§15), and Main acceptance's full-repo-delivery collision check (§13).
- **Major acceptance gates:** Worker self-verification (§12) → Main acceptance (§13) → `TCB-P6` motion audit → `TCB-P7` responsive audit → `TCB-P8` global QA, with this document's §16 checklist as the shared rubric all of the last three execute against.
- **Unresolved QA limitations, stated honestly:** Playwright/Chromium reachability is environment-dependent and unverified end-to-end; no permanent screenshot baseline exists by design; two genuine open design-register decisions (§5 items 1–2) remain unresolved and this document's checklists are written to pass either outcome once actually recorded.

---

STATUS: COMPLETE