# PCGO Page Specifications
### Companion to `.ai/design/DESIGN.md` ("Tactical Console Brutalism")

> Status: implementation-ready page specs. `DESIGN.md` is the design language (tokens, principles, component language, geometric vocabulary) and is not repeated here except by short reference (e.g. "§5.3", "§6.3"). This document is the page-by-page translation: given that language, exactly what changes on each existing page, file by file.

---

## 0. How to read this document

- Every page section names **real files** from `frontend/src/`, verified by direct inspection of this repository (not assumed from folder names).
- **KEEP / EVOLVE / REPLACE / ADD** carry the exact meanings defined in `DESIGN.md` §0: KEEP = correct, don't touch for visual reasons; EVOLVE = mechanism right, values change; REPLACE = current approach fights the direction; ADD = genuine gap.
- Every "Target …" subsection assumes `DESIGN.md`'s token values (§5) are already migrated into `theme.js`/`App.jsx`'s `GLOBAL_CSS` — that migration (`radius.none/tight/full`, `shadow.press/lift/focusRing`, `typeScale.metric`, `motion.press/hover/transition/entrance`) is a **prerequisite**, done once, not repeated per page. Each page section below only calls out *usage*, not token definition.
- Radius values referenced below use `DESIGN.md`'s new names: `radius.none` (0px, was `radius.md`/12 or `radius.lg`/16 on most cards), `radius.tight` (4px, was `radius.sm`/8 on chips/small chrome), `radius.full` (999px, unchanged, circular objects only).
- "Current" descriptions below reflect the code as it exists today, including current pixel/rem values pulled directly from `feature-page.css` and each component's inline styles — these are the literal before-state, not a summary.
- Pages are ordered by navigation position (Home first, matching `NAV_ITEMS` in `AdminDashboard.jsx`), with Login and the shared shell frame bracketing the list since they are cross-cutting.

---

## 1. Shared shell (cross-cutting — not a routed page, but every page lives inside it)

**Files:** `dashboard/layout/DashboardLayout.jsx`, `DashboardHeader.jsx`, `Sidebar.jsx`, `MobileHeader.jsx`, `MainContent.jsx`, `dashboard-shell.css`.

### Current structure
`DashboardLayout` composes `DashboardHeader` (top bar, 64px, `nav.headerHeight`) + `Sidebar` (252px, `nav.sidebarWidth`, desktop only) + `MobileHeader` (slide-in drawer, ≤880px) + `MainContent` (scrollable region, `max-width: 1180px`, centered). This is the frame every one of the 13 routed pages renders inside.

### Current visual problems
- `Sidebar`'s nav-row radius is `radius.sm` (8px) — a soft rounded-rectangle nav button, the exact "generic rounded SaaS" look the anti-patterns list (§11) names.
- `DashboardHeader`'s mobile-menu button and logout button both use `radius.sm` (8px).
- `MobileHeader`'s drawer close button and nav rows also use `radius.sm`.
- No hard-shadow/press treatment exists anywhere in the shell — it is flat, which is *correct* per §12 (chrome should stay calm so pages can carry the visual weight), but the active-nav-row accent bar (currently `width: 2px`) is thinner than §5.8's "2–3px" accent-edge standard.

### Target treatment
- **Sidebar nav row radius:** `radius.tight` (4px) — this is `DESIGN.md`'s explicitly documented, deliberate exception (§6.6): a full `radius.none` reads harsh for a tall list of frequently-clicked targets. Do not push further to 0.
- **Active-row accent bar:** widen from `2px` to `3px` to match §5.8's accent-edge standard exactly; keep `colors.brand`, keep its absolute-positioned placement at `left: -15px`.
- **Header controls** (mobile-menu button, logout button, mobile-drawer close button): `radius.tight` (4px), not `radius.none` — these are small icon-adjacent chrome, matching §5.3's "small chrome" exception, not structural panels.
- **Header/Sidebar backgrounds:** KEEP `surface.l2` on both — unchanged.
- **Header bottom border / Sidebar right border:** KEEP `colors.border` (default weight) — the shell frame is chrome, not a "load-bearing panel," so it does not need to reach for `borderInk` (§5.4's guidance: reach for `borderInk` on the content's most important panel, not on every structural line).
- **MobileHeader drawer:** KEEP `shadow.overlay` (this is a textbook genuinely-floating layer per §5.5) and its slide-in transform/transition mechanism unchanged. Drawer nav rows: `radius.tight` (4px), matching Sidebar's row treatment for consistency between the two navigation surfaces.
- **MainContent:** KEEP entirely unchanged — max-width, padding, and scroll mechanics are layout, not visual language, and are already correct.

### KEEP / EVOLVE / REPLACE / ADD
- KEEP: layout mechanics, breakpoint behavior (880px sidebar collapse — DESIGN.md §9 explicitly protects this), focus-trap/`inert` handling in `MobileHeader`, header content hierarchy (brand mark → title → connection status → sync time → user identity → logout).
- EVOLVE: all `radius.sm` (8px) instances in this file set → `radius.tight` (4px); active-row accent bar 2px → 3px.
- REPLACE: nothing.
- ADD: nothing — the shell already has everything DESIGN.md calls for.

### Motion
KEEP existing: nav hover uses `motion.pill` (background/color/border-color transitions), drawer slide uses its own documented 220ms cubic-bezier (already correct per the file's own P6-T03 audit comment — do not convert to `motion.transition`, that token is reserved for *state* transitions, not this drawer's *entrance*).

### Responsive
KEEP the existing breakpoint table verbatim (`DESIGN.md` §9 already encodes this shell's tuning as canon — 1180/1040/880/700-780/480-560/480/420-380). No page-spec change needed here; this section exists so implementers know the shell itself needs only the radius/accent-bar changes above, nothing structural.

---

## 2. Login — `pages/Login.jsx` + `styles/Login.css`

> **This is the standing reference implementation.** Per the task brief and `DESIGN.md` §12/§14, Login is the page other pages should be checked against, not the other way around. Changes here are the smallest of any page in this document, by design.

### Page purpose
Entry gate: sign in, or (first run only) bootstrap the first admin account. The one place in the product that is allowed to feel like a "moment" rather than a tool.

### Current structure
Two-pane `<main>` grid (`minmax(0,1.2fr) minmax(360px,0.8fr)`): left pane is the marketing-adjacent hero (brand mark, eyebrow, `<h1>` headline, supporting copy, three feature pills, footer wordmark); right pane is a bordered, `shadow.overlay`-lifted form card on `colors.bgElevated`. Collapses to a single column ≤860px.

### Current visual problems
- Form card radius is `radius.lg` (16px) and input radius is `radius.sm` (8px) — both need to migrate to the binary system.
- Feature-pill chips use `radius.sm` (8px) — these are small chrome/chips, the sanctioned `radius.tight` exception, not `radius.none`.
- No other structural problems — composition, type scale (`hero`), copy hierarchy, and the vertical divider between panes are already textbook Tactical Console Brutalism (visible border-as-connector, one accent color, mono eyebrow labels, editorial hero type at the low-density end of §12's dial).

### Target visual hierarchy
Unchanged: brand mark → eyebrow → `hero`-scale two-line headline (brand color on second line) → supporting paragraph → capability pills → footer. Form card: eyebrow → `<h2>` → supporting copy → username/password fields → error slot → submit button.

### Target layout/composition
**KEEP exactly.** No grid, breakpoint, spacing, or copy change.

### Target density
Low (per §12's Marketing/Login row) — the most spacious surface in the product. Unchanged.

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** two-pane composition, `borderRight` divider vocabulary (§5.8's "line = connection/boundary" device — this is its canonical example), `typeScale.hero` usage, mono eyebrow/footer treatment, `BrandMark` component, bootstrap-mode branching logic, all interaction/validation/toast logic, `shadow.overlay` on the form panel (genuinely elevated relative to the hero pane — correct per §5.5).
- **EVOLVE (the only real changes on this page):**
  - `inputStyle`'s `borderRadius: radius.sm` → `radius.none` (§6.2: form inputs are structural, not small chrome).
  - Form panel `<form>` `borderRadius: radius.lg` → `radius.none` (§6.3: default card radius).
  - Feature-pill `borderRadius: radius.sm` → `radius.tight` (§5.3's sanctioned small-chrome exception — these are `<span>` chips, not structural panels).
  - Info/error inline banners inside the form (`borderRadius: radius.sm`) → `radius.tight` (same chip-scale reasoning).
- **REPLACE:** nothing.
- **ADD:** nothing.

### Components to reuse/refactor/create
Reuse `Button` (primary variant — after the shell-wide Button radius/press-shadow update in `primitives.jsx`, Login's submit button inherits `shadow.press` automatically, no Login-specific change needed). No new components.

### Typography treatment
KEEP verbatim: `hero` on `<h1>`, mono meta-style eyebrow/footer, `Inter` body copy, `Space Grotesk 600` for the form's `<h2>`.

### Surface/panel treatment
Left pane: `colors.bg` (page base, `surface.l0`). Right pane: `colors.bgElevated` (`surface.l2`) behind a `colors.bgCard` (`surface.l3`) form panel — KEEP this two-step elevation, it's exactly what makes the form panel read as "the one thing you interact with."

### Borders, radius and shadows
See EVOLVE list above. Shadow: KEEP `shadow.overlay` on the form panel only — nothing else on this page gets a shadow.

### Accent/semantic color usage
KEEP: `colors.brand` on the headline's second line, the live-signal dot dashes in `BrandMark`, and each feature pill's small brand dot. `colors.accentBlue`/`accentBlueDim` for the bootstrap-mode info banner (network/info semantic — correct per §5.1). `colors.danger`/`dangerDim` for the auth-error banner. No new colors needed.

### Data and metric presentation
N/A — no metrics on this page.

### Primary/secondary actions
Primary: `Button variant="primary"` submit (Sign in / Register Admin) — full-width, 46px min-height. No secondary action exists today and none should be added (a "forgot password" or "learn more" link would dilute the single-CTA focus this page correctly has).

### Hover/focus/active states
KEEP existing focus/blur handlers that swap `colors.brand`/`colors.bgCardHover` on inputs — this is functionally `shadow.focusRing`'s job already half-implemented ad hoc. Once `shadow.focusRing` exists as a token (`DESIGN.md` §5.5), add it to these two inputs' focus state as a genuine ring in addition to the border-color swap, for consistency with every other input in the app (§6.2).

### Motion requirements
KEEP: `motion.base` (160ms ease) on input border/background transitions — already correct, already token-derived per the file's own P6-T07 comment.

### Loading states
KEEP: button label swaps to "Signing in…" / "Creating account…" during `submitting`. No skeleton needed — this is a single-action form, not a data page.

### Empty states
N/A.

### Error states
KEEP: inline `role="alert"` danger banner above the submit button, `TriangleAlert` icon + plain-language message. Radius → `radius.tight` per above; everything else unchanged.

### Responsive behavior
KEEP the existing `<style>` block's breakpoints (860px single-column collapse, 420px type-size reduction) verbatim — already tuned, out of scope for this pass.

### Page-specific design rules
- Login is the **one page** where the 3%-opacity dot-grid texture permission from §5.7 could someday be exercised (currently not implemented — do not add it speculatively in this pass; note it as available, not required).
- Any future "marketing/landing" surface (§12, still hypothetical) should extend *this* page's pattern, not invent a new one.

---

## 3. Home — `dashboard/pages/Home.jsx` + relevant `feature-page.css` block (`.pcgo-home-*`, `.pcgo-command-*`)

### Page purpose
Primary landing surface after login: launch a session or monitor the currently active one, see live operational pulse, and jump to any other part of the control plane via a command index.

### Current structure
`ActiveAlerts` (conditional danger strip) → `.pcgo-home-hero` two-column grid (`1.5fr` primary / `0.8fr` rail): primary column holds an eyebrow + `typeScale.heading` `<h1>` + either `StartSessionForm` (idle) or a stack of `SessionCard`s (active); rail holds `SessionSidebar` (live stat tiles + `EventLog` feed). Below the hero: `.pcgo-command-section` — a 4-up (desktop) grid of `NavigationCard`s to every other page.

### Current visual problems
- `NavigationCard`/`.pcgo-command-card` radius is 10px (a bespoke value, not even on the old 8/12/16 scale) — needs to land on the new binary system.
- `.pcgo-command-card__icon` well radius is 8px.
- `SessionSidebar`'s outer rail radius is `radius.lg` (16px, via inline `borderRadius: radius.lg`).
- `ActiveAlerts` strip radius is `radius.sm` (8px).
- The active `SessionCard` currently has **no visual distinction** from how it would look if it weren't the most important object on the page — border is a flat 1.5px `colors.accentGreen`/`colors.border`, no lift, no ink-weight edge. This directly contradicts §7's "a session should visually outrank everything else on Home while it's running."

### Target visual hierarchy
Unchanged top-to-bottom order (alerts → hero → command index), but the **active session card becomes the featured object on the page** per §6.3/§7/§12's "Home" row ("active session card gets the featured-card treatment").

### Target layout/composition
KEEP the two-column hero grid and the 4-up/3-up/2-up/1-up responsive command index exactly as implemented — this is already the correct "balanced: flagship moment top, dense index below" composition per §12.

### Target density
Low → medium, top to bottom (per §12) — unchanged; this page already does this correctly, it just needs geometry values updated.

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** grid structure, breakpoint behavior, `eyebrowStyle`/`headlineStyle` typography (already migrated to `typeScale.meta`/`typeScale.heading`), `pcgo-home-signal` live-dot device, command-index anatomy (icon well → label/description → badge/arrow tail).
- **EVOLVE:**
  - `.pcgo-command-card` radius 10px → `radius.none` (it's a structural rectangle/module per §5.8, not small chrome).
  - `.pcgo-command-card__icon` radius 8px → `radius.tight` (4px — a small icon swatch, the sanctioned exception).
  - `.pcgo-command-card` hover: replace `translateY(-1px)`-only with `shadow.lift` (§6.3/§6.14 — this is explicitly named as "the component that most benefits from the new hard-shadow treatment, since it's the highest-traffic interactive surface in the product").
  - `SessionSidebar` outer rail radius `radius.lg` (16) → `radius.none`.
  - `ActiveAlerts` strip radius `radius.sm` (8) → stays as an accent-edge alert box; migrate to `radius.none` with its existing `border-left` (already effectively an accent-edge per §5.8, just currently drawn with a full border + background wash rather than the cleaner left-edge-only pattern — narrow the treatment to a clean 3px `colors.danger` left edge on a `surface.l1` (not tinted-background) card, matching `Toast.jsx`'s reference pattern).
  - **Active `SessionCard` gets the featured-card treatment** (§6.3): `borderInk` edge (not the current flat `colors.accentGreen`/1.5px), optional `shadow.lift` on hover only (not resting — a live session card isn't "interactive" in the click-to-navigate sense, so no resting shadow, but hover/focus should still lift if the card becomes clickable in the future). See SessionCard's own entry (§12 below) for the full detail — Home only needs to know the active card now visually outranks the rest of the page.
- **REPLACE:** nothing.
- **ADD:** nothing structural — the page's bones are correct, this is a geometry-values pass plus the one featured-card promotion.

### Components to reuse/refactor/create
Reuse: `SessionCard`, `StartSessionForm`, `ActiveAlerts`, `SessionSidebar`, `NavigationCard`, `EmptyState`, `LoadingState` — all existing, all get their radius/shadow values updated at the component level (see their own sections below), Home.jsx itself needs no prop/logic changes.

### Typography treatment
KEEP: `typeScale.meta` eyebrow, `typeScale.heading` `<h1>` (deliberately *not* `hero` — Home is a frequently-revisited console, not a one-time gate, per the file's own P3-T01 comment; do not "upgrade" this to hero scale). Command section kicker/heading stay on `typeScale.meta`/`subheading` respectively.

### Surface/panel treatment
KEEP: hero primary column has no card wrapper (content sits directly on page background); rail is a `surface.l3` card; command cards are `surface.l1` (a level below cards, correctly reads as "index," not "content").

### Borders, radius and shadows
See EVOLVE list. New: active `SessionCard` reaches for `borderInk` per §5.4's "load-bearing panel" guidance — the running session literally is the most load-bearing thing on this screen while it exists.

### Accent/semantic color usage
KEEP: `colors.brand` for the live-pulse dot and command-card icon wells; `colors.success`/`colors.danger` for the sidebar's Active/WebSocket stat tiles (already correctly semantic); `colors.danger` for `ActiveAlerts`. No new color assignments needed on this page.

### Data and metric presentation
`SessionSidebar`'s three `DashboardStats` tiles (Active count, Total count, WebSocket status) are exactly the kind of "standalone number whose job is to be read at a glance" §5.2 defines — promote their numeric values to `typeScale.metric` (currently ad hoc sizing inside `DashboardStats.jsx`, not inspected line-by-line in this pass but flagged here as an instance of the metric-step gap `DESIGN.md` names generally).

### Primary/secondary actions
Primary: `StartSessionForm`'s launch button (when idle) — this is the page's single most important CTA and should carry `shadow.press`. Secondary: command-index cards (navigation, not action, but still interactive) — `shadow.lift` on hover, no press-shadow (per §6.1's "hard shadow reserved for the single primary action per view").

### Hover/focus/active states
Command cards: `shadow.lift` + `borderStrong` on hover/focus-visible (replacing translateY-only). Session cards: no hover state needed unless made clickable later.

### Motion requirements
Page entrance: KEEP `motion.entrance` (`cgo-fade-up`, already global via `.pcgo-page-enter`). Command-card hover: `motion.hover` (160ms) for the new shadow.lift transition, matching the existing border/background transition timing already in place.

### Loading states
KEEP `LoadingState` (pulsing-dot pattern) shown in place of the launch console/session stack while `loading` is true. No visual change beyond the app-wide skeleton radius note in §6.10 (icon well → `radius.tight`, not applicable here since `LoadingState` has no icon well).

### Empty states
KEEP `EmptyState` for the "no nav cards" edge case (effectively unreachable today since `HOME_NAV_CARDS` is always non-empty, but the code path exists — no change needed beyond the shared `EmptyState` component's own radius update, §6.10).

### Error states
Handled via `ActiveAlerts` (see above) — no page-local error state beyond that.

### Responsive behavior
KEEP exactly: 1180px → hero columns narrow, command index 4→3 up; 900px → hero stacks to one column (rail moves below, `order: 2`), command index 3→2 up; 520px → command index → 1 up, command heading stacks. No breakpoint values change in this pass.

### Page-specific design rules
- The active-session featured-card promotion is the **one net-new visual rule** this page needs beyond token migration — implement it as part of `SessionCard.jsx`'s own update (§12), not as Home-specific CSS, so any future page that renders an active `SessionCard` inherits the same treatment automatically.

---

## 4. Host Monitor — `dashboard/pages/HostMonitorPage.jsx` + `components/HostStatusPanel.jsx` + `.pcgo-host-*` CSS block

### Page purpose
The host's own "instrument panel": is it ready to serve a session, what are its live resource numbers, and what are the two external dependencies (Sunshine streaming, Tailscale networking) doing. Also carries the session-lock force-unlock recovery control.

### Current structure
`PageHeader` → `HostStatusPanel` (a 2-column CSS grid of: header row, a full-width readiness-summary strip, then four/five `SectionCard`s — System, Session & Recovery, Sunshine Dependency, Tailscale Dependency, Diagnostics & Performance — each holding `StatRow` label/value pairs or `ProgressStat` meters) → an optional "Session Health" `SectionCard` (aggregate telemetry) → an optional Force-Unlock danger button.

### Current visual problems
- `.pcgo-host-readiness-summary` radius is 14px; `.pcgo-host-section-card` radius is 12px `!important`; `.pcgo-host-readiness-summary__state` pill radius is 8px; `.pcgo-host-revalidate` button radius is 7px `!important`; `.pcgo-host-force-unlock` box radius is 10px, its button 8px `!important` — five different bespoke radius values on one page, all needing to collapse onto the binary system.
- `.pcgo-host-readiness-summary strong` (the "Ready to serve sessions" inline stat) is 22px `Space Grotesk` — exactly the ad hoc "big number that doesn't land on typeScale" gap `DESIGN.md` §3/§5.2 names by name, and this file's own P5-T10 comment block documents the mismatch explicitly.
- `ProgressStat`'s value text (CPU/RAM/GPU%) is a similarly ad hoc mono size, not on `typeScale`.
- Sunshine/Tailscale/Readiness cards each use a 2px colored top border (`success`/`info`/`brand`) as their state indicator — a *top* edge, not the left edge §5.8 formalizes as the standard accent-emphasis device elsewhere in the app (Toast, Home's alert strip, readiness summary's own left edge one level up). This is an inconsistency worth resolving.

### Target visual hierarchy
Readiness summary leads (it answers "can I even use this host right now") → System/Session&Recovery/Sunshine/Tailscale section cards (peer-level dependency status) → Diagnostics/Performance meters (the numeric detail) → Session Health telemetry → Force Unlock (only when relevant, and visually the most alarming thing on the page when present).

### Target layout/composition
KEEP the 2-column CSS grid exactly (`.pcgo-host-status-panel { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); }`, collapsing to 1 column ≤780px) — this is already the correct "dense, technical, tight grids" composition per §12's Host Control Panel row.

### Target density
High (per §12) — this page should feel like the densest "normal" page in the product (Logs is denser still, but Logs is pure evidence; Host Monitor is dense *and* structured into named sections, which is the right register for "command center").

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** 2-column grid, section-card grouping (System / Session & Recovery / Sunshine / Tailscale / Diagnostics), `StatRow` label-left/value-right/dotted-fill anatomy, `ProgressStat`'s label/value/bar-below anatomy and its existing semantic-threshold coloring logic (confirm CPU/RAM/GPU-load/GPU-temp/VRAM all correctly flip to `warning`/`danger` at threshold — this logic already exists per §6.11, just verify it's applied to all five meters consistently during implementation), the readiness-summary's left-edge state-color pattern (already correct, just needs radius + typography updates), `Badge` tone system.
- **EVOLVE:**
  - All five bespoke radius values above → `radius.none` for the readiness summary, section cards, and force-unlock box (structural panels); `radius.tight` for the readiness-state pill and the revalidate/force-unlock buttons (small chrome-scale controls).
  - `.pcgo-host-readiness-summary strong` (22px stat) → `typeScale.metric` (§6.12 explicitly calls this out: "promote its inline stat to `typeScale.metric` for consistency with §6.11").
  - `ProgressStat`'s value text → `typeScale.metric` (§6.11: "change the value's typography to `typeScale.metric`").
  - Sunshine/Tailscale/Readiness-card top borders (2px, top edge) → migrate to **left edge**, 3px, same colors (`success`/`info`/`brand` respectively) — unifies with §5.8's accent-edge standard used everywhere else in the app rather than leaving a page-local top-border variant.
  - `.pcgo-host-section-card` background stays `surface.l3` for the four dependency cards; System/Diagnostics cards' `surface.l1` (a level recessed, already correct — these two are read-only "spec sheet" cards, not action-bearing ones, so the extra recess is the right signal).
- **REPLACE:** nothing.
- **ADD:** nothing structural — this page's information architecture is already right; it needs the metric-typography and accent-edge-direction fixes plus token migration.

### Components to reuse/refactor/create
Reuse `HostStatusPanel` (internal `SectionCard`, `StatGrid`, `StatRow`, `Badge`, `ProgressStat` sub-components — all local to this file, update in place, no extraction needed), `PageHeader`, `SectionCard` (the shared `dashboard/components/SectionCard.jsx`, used only for the standalone "Session Health" block), `Button` (Force Unlock, Revalidate).

### Typography treatment
`typeScale.meta` for section-card headers/eyebrows (already close per the file's own audit — confirm exact alignment during implementation rather than leaving as a documented near-miss, since this page is being touched anyway). `typeScale.metric` for the readiness stat and all `ProgressStat` values (new, per above). Everything else (StatRow labels/values, the two dependency-card diagnostic messages) stays mono/literal as today — these are genuinely below `typeScale.meta`'s 10px floor in places and forcing them up would hurt this page's intentionally dense character.

### Surface/panel treatment
KEEP the `surface.l3` (readiness/dependency cards) vs `surface.l1` (System/Diagnostics spec-sheet cards) distinction — this two-tier elevation already correctly separates "status you should read" from "reference data you might scan."

### Borders, radius and shadows
Radius: see EVOLVE. Shadow: `shadow.flat` throughout (no lift, no press) — per §12's Host Control Panel density, this is a dense technical surface, not an interactive-card gallery; nothing here should feel "clickable" except the two real buttons (Revalidate, Force Unlock), which get `shadow.press` as primary/danger actions.

### Accent/semantic color usage
- Readiness left edge: `success`/`warning`/`danger`/`info`/brand-neutral by `readinessTone` (already correct logic, just verify it now drives a left edge everywhere, matching the migration above).
- Sunshine card edge: always `success` (a stopped Sunshine is still "the dependency exists and is healthy as a concept," per the file's existing comment "the existing top border's success-colored instinct — keep it" from `DESIGN.md` §7; if Sunshine is actually *failed*, that should show as a `danger` `Badge` inside the card, not by recoloring the edge, to avoid the edge color meaning two different things across page states).
- Tailscale card edge: always `info`/blue (network semantic, §5.1/§7 — unchanged).
- Session lock `Badge`: `warning` when locked, `success`/neutral "FREE" tone when not — unchanged.
- Force Unlock box: `danger` throughout (border, background wash, button) — this is correctly the most alarming element on the page when present.

### Data and metric presentation
This is the page `typeScale.metric` was designed for. Every percentage/temperature meter (CPU, RAM, GPU Load, GPU Temp, VRAM) and the readiness inline stat get the new step. Bars stay plain label+track+fill — no gauges, no dials, no gradients, confirming §12/§7's "plain, honest percentage bar" rule.

### Primary/secondary actions
Primary-ish: Revalidate Host (`secondary` button variant today — correct, this is a diagnostic action, not the page's single most important action, so it should stay flat/`secondary`, not gain a press-shadow). Force Unlock: `danger` variant button, full-width — this is the one place on this page where a hard, alarming visual weight is appropriate; consider it the page's de facto "primary" action *when visible*, and it may reasonably gain `shadow.press` as the danger-filled equivalent per §6.1's `dangerFilled` variant treatment if the implementer judges the button should read as more forceful (optional, not required — flagged as a legitimate implementation choice, not a mandate).

### Hover/focus/active states
Revalidate/Force-Unlock buttons: standard `Button` states (already handled by the shared primitive once its own radius/shadow update lands). No card-level hover states on this page — dependency/section cards are not clickable.

### Motion requirements
State transitions (readiness tone changing, a dependency card's Badge changing tone, Session Lock flipping) are exactly what `motion.transition`'s new controlled-overshoot token (§5.6/§8) is for — apply it to `Badge`'s color/background transition and the readiness-summary's left-edge color transition, replacing whatever implicit/no transition exists today. Loading state: KEEP the existing "Syncing host data" spinner + `hsp-spin` keyframe (documented as non-convertible in the file's own P6-T10 comment — correct call, do not force it onto a `motion` token that doesn't model keyframe animations).

### Loading states
KEEP `HostStatusLoadingState`'s skeleton-card mechanism (`pcgo-host-loading-section`, `pcgo-pulse` keyframe) — only radius values migrate (12px section-card skeletons → `radius.none`, matching their loaded-state counterparts).

### Empty states
N/A — this page always has *some* content once `status` exists; the `error && !status` branch is effectively the empty/error state (see below).

### Error states
`error && !status` renders a compact inline danger message ("Host status unavailable") — KEEP the pattern, but this is a good candidate to upgrade to the shared `EmptyState` primitive with a danger-toned icon well for consistency with how Users/Settings render their unavailable states (`.pcgo-users__error`, `.pcgo-settings__unavailable`, both cited in §12's Errors/Recovery row as reference patterns) — currently Host Monitor's version is a bespoke one-off `<div>`, not the shared pattern. This is a genuine (small) ADD: reuse `EmptyState` here instead of the inline message, passing a `danger`-toned icon.

### Responsive behavior
KEEP the existing 780px collapse (grid → 1 column, readiness summary → column layout) verbatim.

### Page-specific design rules
- This page is the primary proving ground for `typeScale.metric` — if the step's clamp values (`22–34px`) feel wrong anywhere, this is the page to tune them against, since it has the highest density of metric instances in the product.
- Do not add gauges/dials/circular progress rings here even though "GPU Temp" might tempt one — §7/§12 explicitly reject decorative chart chrome in favor of the plain bar, and this page is the named example in that rule.

---

## 5. Recovery — `dashboard/pages/RecoveryPage.jsx` + `components/RecoveryStats.jsx` + `components/RecoveryEvents.jsx`

### Page purpose
Shows what the automated recovery system has done and is doing: aggregate stats (success/failure counts per recovery channel — session lock, Tailscale, etc.) and a chronological event log of recovery actions.

### Current structure
`PageHeader` → `.pcgo-recovery-layout` two-column grid (`1.12fr`/`0.88fr`, ≥ tablet width): `RecoveryStats` (left, wider) — a `.pcgo-recovery-stats-panel` with a summary strip (`.pcgo-recovery-summary`, a big `15px` inline stat) and a `.pcgo-recovery-channel-grid` of per-channel tiles, each expandable for Tailscale detail; `RecoveryEvents` (right) — a scrollable, filterable list of individual recovery events.

### Current visual problems
- No radius values were found as bespoke inline overrides in the grep pass for this block beyond the shared `.pcgo-section-card`/`.pcgo-stat-cell` defaults it likely inherits — this page mostly needs the *global* token migration (radius/shadow) rather than page-specific geometry fixes, since its own CSS block is layout-only (grid-template-columns, gap) with typography left intentionally literal per its own audit comment.
- `.pcgo-recovery-summary strong` (15px inline stat, the "how many recoveries total" number) is another instance of the ad-hoc-metric gap `DESIGN.md` names — a second, page-local case of the same problem Host Monitor has.

### Target visual hierarchy
Stats lead (the aggregate answer: "is recovery working") → per-channel breakdown → event list (the evidence trail, most detailed/most scrollable element on the page).

### Target layout/composition
KEEP the two-column layout exactly — already correct per §12's implied structure (this page isn't explicitly named in §12's table, but its "stats lead, events stay adjacent" composition matches the Host Control Panel/Errors-Recovery register described in §7's "Errors are unmistakable" and §12's Errors/Recovery row).

### Target density
Medium — denser than Home, less dense than Logs. This is operational evidence, but summarized/categorized rather than raw.

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** two-column grid, channel-tile anatomy, event-list filtering/expand-for-detail mechanism (Tailscale recovery/failure detail toggles), all data-fetching and prop wiring.
- **EVOLVE:**
  - `.pcgo-recovery-summary strong` (15px stat) → `typeScale.metric`, matching the same treatment applied to Host Monitor's readiness stat and `ProgressStat` values — these three should visually read as "the same kind of number" across the whole app.
  - Any `.pcgo-recovery-stat-tile`/`.pcgo-recovery-channel` radius currently inherited from the shared `.pcgo-stat-cell`/`.pcgo-section-card` defaults migrates automatically once those shared classes update (see §8 below, "cross-cutting shared classes") — no Recovery-specific override needed.
  - Recovery event entries that represent a *failure* should use the accent-edge-left-3px-danger pattern (§5.8) if they don't already — confirm during implementation whether `RecoveryEvents.jsx` currently distinguishes failed vs. successful recovery attempts visually; if it currently relies on color-only text, this is a real gap against principle #8 ("status is never color-only") and should be closed by pairing the color with a small icon (e.g. `CheckCircle2`/`XCircle`) plus the accent-edge, not by inventing a new device.
- **REPLACE:** nothing.
- **ADD:** nothing structural.

### Components to reuse/refactor/create
Reuse `RecoveryStats`, `RecoveryEvents` as-is (internal structure only needs token-value updates, not restructuring).

### Typography treatment
`typeScale.metric` for the summary stat (new). Everything else stays as documented literals per the file's own audit — this page's mono-heavy, small-size vocabulary is intentional density, not an oversight, and should not be forced onto `typeScale` steps that don't fit.

### Surface/panel treatment
KEEP existing `surface.l1`/`l3` usage (not independently re-verified line-by-line in this pass, but no evidence of a problem — the file's own comment block confirms zero `--color-bg-*` literal references in the layout-only CSS block inspected, meaning per-element backgrounds are set in the `.jsx` files' own inline styles, which follow the app-wide `surface.l*` convention already).

### Borders, radius and shadows
Structural cards (stat panel, channel tiles, event-list container) → `radius.none` once the shared classes migrate. No lift/press shadows anywhere on this page — nothing here is a primary action or featured card; it's read-only telemetry.

### Accent/semantic color usage
Success (`colors.success`) for healthy-channel tiles, `danger` for failed/failing channels, `info`/blue reserved for Tailscale-specific rows (network semantic, consistent with Host Monitor). Confirm event entries pair color with icon+text per principle #8, as noted above.

### Data and metric presentation
Summary stat → `typeScale.metric`. Per-channel tiles stay as compact label+count pairs (not full metric-scale — these are secondary/summary numbers, not the page's single hero stat, so `typeScale.metric` should be reserved for the one summary figure, not applied to every tile — over-applying the metric step everywhere would dilute its "hero of the page" job per §5.2's usage rule).

### Primary/secondary actions
No primary CTA on this page (it's read-only) beyond the two detail-toggle buttons (Tailscale recovery/failure details) and an implicit "show all events" expander — these are all `ghost`/`secondary`-weight actions, correctly flat, no press-shadow.

### Hover/focus/active states
Toggle buttons: standard shared `Button` states. Channel tiles: no hover state needed (not clickable, purely informational) unless a future "drill into this channel" interaction is added.

### Motion requirements
`motion.transition` (state-landed overshoot) is appropriate for a channel tile flipping from "healthy" to "recovering" to "recovered" if that live-update path exists — otherwise standard `motion.hover` for the detail-toggle expand/collapse.

### Loading states
KEEP `.pcgo-recovery-loading-state`/`.pcgo-recovery-events-loading` skeleton patterns — radius values migrate with their loaded-state counterparts, no other change.

### Empty states
"No recovery events yet" should use the shared `EmptyState` primitive (confirm `RecoveryEvents.jsx` already does this or migrate it to do so — this is the standard pattern per §6.10, not a page-specific invention).

### Error states
If recovery data itself fails to load, follow the same `EmptyState`-with-danger-icon pattern recommended for Host Monitor above, for consistency.

### Responsive behavior
Two-column layout stacks to one column at the app's standard 700–780px breakpoint per §9's table — confirm this page's own media query matches that range (its CSS block's opening comment doesn't specify one directly; verify against the actual `@media` rule during implementation and align to the canonical breakpoint if it currently differs).

### Page-specific design rules
- Recovery is one of the two pages (with Errors more broadly) where `danger`'s accent edge should be at its most visible weight per §12's Errors/Recovery row — don't soften failed-recovery styling to match the calmer Home/Settings register.

---

## 6. Sunshine — `dashboard/pages/SunshinePage.jsx` + `components/SunshineClientManager.jsx` + `components/SunshineStreamHistory.jsx` + `components/SunshineStreamCard.jsx`

### Page purpose
Everything about the streaming pipeline: current Sunshine host status, paired client management, and historical stream records.

### Current structure
`PageHeader` → `.pcgo-sunshine-layout` two-column grid (`1.12fr`/`0.88fr`): `SunshineClientManager` (left — `.pcgo-sunshine-status-card` status summary + client-pairing UI) and `SunshineStreamHistory` (right — a list of `SunshineStreamCard` entries).

### Current visual problems
- The file's own audit comments confirm this block has essentially zero bespoke background/radius overrides beyond layout — meaning this page mostly inherits from `.pcgo-section-card`/`.pcgo-stat-cell`/etc., so it will migrate cleanly once those shared classes update, with limited Sunshine-specific work needed.
- `.pcgo-sunshine-status-card`'s only bespoke rule is a `border-color: var(--color-border-strong) !important` — no radius or shadow override to fix.

### Target visual hierarchy
Status/pairing (the "is streaming healthy and who's connected" question) leads; stream history (the record) follows, at lower visual weight.

### Target layout/composition
KEEP the two-column grid exactly — matches §7's "Streaming feels like a live pipeline" framing (status + connection-line vocabulary between host and client) at the top, historical record below.

### Target density
Medium — a live-status console (denser register) paired with a historical list (Session-History-like density) side by side. This is one of the pages where two different density registers legitimately coexist in one view; keep them visually distinct via surface/spacing rather than trying to unify them.

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** two-column layout, client-manager status/pairing UI structure, stream-history list/card structure, all data wiring.
- **EVOLVE:** radius/shadow values inherited from shared classes migrate automatically (see §8 cross-cutting note). No page-specific bespoke radius/shadow overrides were found that need independent correction.
- **REPLACE:** nothing.
- **ADD:** **Connection-line vocabulary** (§5.8/§7: "Streaming... feels like a live pipeline: status badge + connection-line vocabulary between host and client, not a generic settings toggle"). This is currently only half-realized — `SunshineClientManager`'s status card has "the right instinct" per `DESIGN.md`'s own note (its success-colored accent, already KEEP-worthy), but there is no genuine host↔client connection-line device anywhere in the UI today. This is a real, if optional, gap: if/when implementation time allows, add a simple visual connector (a thin `border`/`borderSubtle` line or a small connected-dots device, per §5.8's "thin horizontal/vertical line = a connection" and "filled circle = live state" vocabulary) between the host status and each paired client row, rather than rendering clients as a plain list. This is flagged as a genuine design-language gap, not a mandate to redesign the whole client list — implementers should treat it as a nice-to-have that closes a named gap, not a blocking requirement for this pass.

### Components to reuse/refactor/create
Reuse `SunshineClientManager`, `SunshineStreamHistory`, `SunshineStreamCard` — internal token updates only, no restructuring required for the baseline pass; the connection-line addition above is additive, not a rebuild.

### Typography treatment
Follow whatever `typeScale` alignment already exists in these files (not independently re-audited line-by-line here) — no page-specific typography change beyond what the shared component/class migration already delivers.

### Surface/panel treatment
KEEP existing elevation choices — status card at `surface.l3`-equivalent weight (a primary status panel), stream history cards at a calmer, lower-elevation register (historical record, matches Session History's tone).

### Borders, radius and shadows
Migrate via shared classes; `.pcgo-sunshine-status-card`'s `borderStrong` override is already using the correct "emphasis" border weight per §5.4 and needs no change.

### Accent/semantic color usage
`success` for a healthy/running stream state (KEEP — "the existing top border's success-colored instinct" is explicitly named as correct in `DESIGN.md` §7). If a stream is disconnected/failed, that state should use `danger` with the same left-edge-3px pattern used elsewhere, not a different device.

### Data and metric presentation
Any live stream stat (bitrate, latency, resolution, if displayed) should use `typeScale.metric` per the same rule applied everywhere else a standalone at-a-glance number appears.

### Primary/secondary actions
Start/Restart Sunshine actions (surfaced on Host Monitor, not necessarily duplicated here — confirm during implementation whether this page has its own action buttons or is purely observational) follow the same primary/`shadow.press` vs secondary/flat split as everywhere else.

### Hover/focus/active states
Standard shared `Button`/`Card` states — no page-specific device needed.

### Motion requirements
`motion.transition` for stream/client state changes (connecting → connected, client paired/unpaired) — this is exactly the "state landed" use case §8 defines the token for.

### Loading states
KEEP `.pcgo-sunshine-client-loading`/`.pcgo-sunshine-client-loading-grid`/`.pcgo-sunshine-history-loading` skeleton patterns, radius migrating with their loaded counterparts.

### Empty states
"No paired clients" / "No stream history" → shared `EmptyState` primitive, consistent with the rest of the app.

### Error states
Sunshine-unreachable/failed states → `danger` accent-edge + icon + plain text, consistent with the app-wide error vocabulary (§7).

### Responsive behavior
Two-column layout stacks per the app's standard tablet breakpoint — verify the actual `@media` value against §9's canonical 700–780px range during implementation.

### Page-specific design rules
- This is the page where the connection-line vocabulary gap is most relevant — see the ADD note above. Do not invent a *different* visual metaphor (e.g. a literal pipe/tube illustration) — stay within §5.8's existing shape vocabulary (dot = live, line = connection).

---

## 7. Game Manager — `dashboard/pages/GameManagerPage.jsx` + `components/GameManager.jsx` (+ `GameLibrary.jsx`, `SaveBrowser.jsx` as supporting pieces used elsewhere)

### Page purpose
CRUD interface for configured launch targets (games): add, edit, delete, and validate game configuration entries (executable path, save path, save filters).

### Current structure
`PageHeader` → `.pcgo-game-manager-config-panel`: a header bar (icon badge + title/count + add/reload icon buttons) followed by either the game list or an inline add/edit form (`showForm` toggles between list and form view within the same panel, not a separate route/modal).

### Current visual problems
- Not independently re-audited line-by-line for every radius value in this pass (file is 1262 lines), but the header bar's icon buttons (`iconAddButton`, `iconGhostButton`) are almost certainly on the old `radius.sm`/`radius.full` pattern common to icon buttons elsewhere in the app — confirm and migrate `iconAddButton` (a circular add button per its hover-color treatment, `rgba(110,231,176,0.22)`) to `radius.full`, and any square/rectangular chrome to `radius.tight`/`radius.none` per the standard split.
- The add-button's hover-color logic (`colors.accentGreenDim` → a harder-coded `rgba(110,231,176,0.22)`) is a raw rgba value not traced to a token, which §5.1's "never introduce a raw hex/rgba color" rule flags generally — this specific instance should migrate to a proper `*Dim`-family token or a defined hover variant, not be left as a magic value, during any pass that touches this file.

### Target visual hierarchy
Header (what is this page, how many games, primary add action) → list or form (mutually exclusive within the same panel) → per-field validation feedback.

### Target layout/composition
KEEP the single-panel, toggle-between-list-and-form structure — this is a reasonable, already-functional pattern and does not need to become a separate route or modal.

### Target density
Medium — a configuration/CRUD surface, denser than Settings' calm tone but not as dense as Logs; comparable to Users' identity-directory density.

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** list/form toggle mechanism, validation flow, save-filter sub-form, all data/handler logic.
- **EVOLVE:** icon button radii → `radius.full` (circular add button) / `radius.tight` (any square icon chrome); migrate the raw rgba hover color to a proper token; any card/row radius on the game list itself → `radius.none` (list rows are structural rectangles per §5.8).
- **REPLACE:** nothing.
- **ADD:** nothing structural.

### Components to reuse/refactor/create
Reuse `GameManager` in place; `GameLibrary.jsx` and `SaveBrowser.jsx` are used by `StartSessionForm` (Home's launch console) rather than this page directly — confirmed via inspection that `GameManagerPage.jsx` only imports `GameManager`, not `GameLibrary`/`SaveBrowser`. No cross-page component change needed here.

### Typography treatment
`FieldLabel`-style form labels already documented in this file as aligning to `typeScale.meta` per its own P5-T08 audit note — no further change needed on that front; other literal sizes stay as-is unless a specific instance is found to genuinely match a step during implementation.

### Surface/panel treatment
KEEP existing `surface.l3` panel background; form fields at `surface.l1`/inset, matching the app-wide input convention.

### Borders, radius and shadows
Structural: `radius.none`. Icon buttons: `radius.full`/`radius.tight` split as above. No lift/press shadow on list rows (dense data, not featured cards, per §6.3's "dense data card... stays flat" rule) — the Add button (primary creation action) is the one candidate for `shadow.press` if it's treated as this page's primary CTA.

### Accent/semantic color usage
`success`/green for the add action (already using `accentGreenDim`, consistent with "creation" reading as a positive/success-adjacent action elsewhere in the app — KEEP this choice, just fix the raw-rgba hover value). `danger` for delete actions. No other semantic colors expected on this page.

### Data and metric presentation
The "N configured launch targets" count in the header is a small inline count, not a hero metric — it can stay as a compact `typeScale.meta`-adjacent label rather than being promoted to `typeScale.metric`; this number's job is context, not "the thing this page most wants you to read."

### Primary/secondary actions
Primary: Add game (circular icon button in the header — consider whether this should read more clearly as the page's primary action via `shadow.press`, or whether its current compact icon-only treatment is intentional for this dense a page; either is defensible, flag for implementer judgment). Secondary: Reload games (ghost icon button, stays flat). Within the form: Save (primary) / Cancel (ghost) / Delete (danger, when editing an existing game).

### Hover/focus/active states
Standard shared `Button` primitive states once icon buttons are migrated to reuse it (confirm whether `iconAddButton`/`iconGhostButton` are currently raw `<button>` elements with inline styles rather than the shared `Button` component — if so, and if time allows, migrating them to `Button` would automatically pick up the app-wide press/hover mechanics rather than needing bespoke `onMouseEnter`/`onMouseLeave` handlers to be individually corrected).

### Motion requirements
Standard `motion.press`/`motion.hover` for buttons; `motion.transition` if any inline validation state genuinely "lands" (e.g. a save succeeding) rather than just appearing/disappearing.

### Loading states
KEEP `.pcgo-game-manager-config-loading`/`__dot` pulse pattern (already respects reduced-motion per the file's existing `@media (prefers-reduced-motion: reduce)` block in `feature-page.css`).

### Empty states
"No games configured yet" → shared `EmptyState`, with the Add-game action surfaced as the `EmptyState`'s `actionLabel`/`onAction` (the primitive already supports this — use it here rather than a bespoke empty message).

### Error states
Validation errors: inline, per-field, next to the offending input — KEEP this pattern (already correctly localized rather than a single top-of-form banner). Save/delete failures: toast (already the app's convention via `useToast`).

### Responsive behavior
No page-specific breakpoint behavior was identified as broken in this pass; confirm the form's field layout collapses to single-column on narrow viewports consistent with the app-wide 480–560px "forms drop to single-column" rule (§9).

### Page-specific design rules
- Keep the list↔form toggle as an in-panel state change (`motion.transition` or a simple crossfade), not a route change — this preserves scroll position and avoids the page-level `pcgo-page-enter` animation firing on every add/edit, which would feel like a full navigation for what is actually a local view change.

---

## 8. User Management — `dashboard/pages/UserManagementPage.jsx` + `components/UserPanel.jsx`

### Page purpose
Admin-only identity and access administration: view the user directory, create new accounts, delete existing ones (bulk action supported).

### Current structure
`PageHeader` → `.pcgo-users` grid: toolbar (`.pcgo-users__toolbar`, icon mark + heading + description) → directory list (`.pcgo-users__directory`, column-header row + data rows with per-cell `data-label` responsive fallback) → create-user form section → bulk-action row.

### Current visual problems
- `.pcgo-users__toolbar` radius is 14px; `.pcgo-users__heading-mark` (icon badge) radius is 9px — both need to land on the binary system (`radius.none` for the toolbar panel, `radius.tight` for the small icon badge).
- `.pcgo-users__refresh`/`__delete`/`__stale-note button` all use 8px radius — small action-chip scale, correctly maps to `radius.tight`, not `radius.none`.
- The file's own audit comment confirms extensive literal typography (11 distinct font sizes) that intentionally does not map to `typeScale` — this is correctly left alone per D-005's "refine, don't flatten"; no typography change needed here beyond what's already documented as a deliberate non-conversion.

### Target visual hierarchy
Toolbar (identity + primary context) → directory (the actual data, most space) → create-user form → bulk actions (secondary, lower on the page, appropriately less prominent than viewing/managing existing users).

### Target layout/composition
KEEP the existing grid/toolbar/directory/form/bulk-action stack — this is already a sensible, working CRUD layout.

### Target density
Medium-high — an identity directory is inherently a dense-list surface (comparable to Session History), denser than Settings, less raw than Logs.

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** toolbar/directory/form/bulk-action structure, `data-label` responsive-row pattern (already a sophisticated, correct solution for dense tabular data on narrow viewports — explicitly called out as already-implemented in `DESIGN.md` §9's responsive table), column-header + row anatomy.
- **EVOLVE:** toolbar radius 14px → `radius.none`; heading-mark radius 9px → `radius.tight`; refresh/delete/stale-note-button radius 8px → `radius.tight`; directory row radius (wherever it currently sits, likely inheriting `.pcgo-data-row`'s shared 9px) → `radius.none` once the shared class migrates.
- **REPLACE:** nothing.
- **ADD:** if a bulk-selection "selected row" state doesn't yet exist visually beyond a checkbox, this is the exact use case `DESIGN.md` §6.5 flags as "not yet implemented anywhere — add when bulk actions are built": `border-left: 3px solid brand` + `surface.l4` background on a selected row. Confirm during implementation whether `UserPanel.jsx`'s bulk-selection state already has this treatment; if not, this is the one genuine ADD for this page, and it should follow §6.5's exact spec rather than inventing a new selected-state device.

### Components to reuse/refactor/create
Reuse `UserPanel` in place — internal token updates only.

### Typography treatment
KEEP all literal values per the file's own documented audit — do not force any of the 11 distinct sizes onto `typeScale` steps; they are intentionally denser than the scale's floor in several cases.

### Surface/panel treatment
KEEP existing `surface.l1`–`l4` usage (already migrated per the file's own D-009 background-aliasing audit).

### Borders, radius and shadows
See EVOLVE. No lift/press shadow on directory rows (dense data, flat per §6.3). Create-user form's submit button gets standard primary-button `shadow.press` once the shared `Button` primitive updates.

### Accent/semantic color usage
`brand` for the create-account primary action and (per the ADD note) the selected-row left edge. `danger` for delete actions/confirmations (paired with `ConfirmDialog`'s destructive styling, already KEEP per `DESIGN.md` §6.7). No other semantic colors expected.

### Data and metric presentation
User count (`.pcgo-users__count`) is a small contextual number, not a hero metric — same reasoning as Game Manager's count, stays compact rather than promoted to `typeScale.metric`.

### Primary/secondary actions
Primary: Create user (form submit). Secondary: Refresh directory, per-row delete. Destructive: bulk delete (routed through `ConfirmDialog`, already KEEP).

### Hover/focus/active states
KEEP existing hover states on refresh/delete/stale-note buttons (already correctly implemented with `:hover`/`:active`/`:focus-visible` in the CSS, using `motion.base`/`motion.fast`-equivalent literal timings per the file's own P6-T15 audit note — these literal values already match token durations and are fine to leave as-is or formally convert once a CSS-side `--motion-*` custom property exists, per that same audit's stated blocker).

### Motion requirements
Standard button micro-interactions; `motion.transition` if row-selection state changes should feel like they "land" (optional, matches the ADD note above).

### Loading states
Confirm `UserPanel.jsx` has a directory-loading skeleton consistent with the rest of the app's pulse pattern; if present, only radius values migrate.

### Empty states
"No users yet" (unlikely in practice, since an admin account must exist to view this page, but the empty directory-after-filtering case is real) → shared `EmptyState`.

### Error states
KEEP `.pcgo-users__error` (already explicitly cited in `DESIGN.md` §12 as a reference pattern for the Errors/Recovery surface register) — only its radius migrates (`radius.none`), its dashed-border-plus-icon device stays exactly as-is.

### Responsive behavior
KEEP the `data-label` pseudo-element pattern verbatim — `DESIGN.md` §9 explicitly protects this as already-correct, tuned behavior.

### Page-specific design rules
- This page is one of two canonical references for how PCGO should handle dense tabular data without a literal `<table>` element (§6.5) — any future dense-list page should copy this page's row/column-header pattern, not invent a new one.

---

## 9. Analytics — `dashboard/pages/AnalyticsPage.jsx` + `components/SessionAnalytics.jsx`

### Page purpose
Aggregate, backend-computed patterns across session history — usage trends, breakdowns by game/user, not raw individual records (that's Session History's job).

### Current structure
`PageHeader` → `.pcgo-analytics` block: header/description → `.pcgo-analytics__metrics` (a stat-grid of aggregate numbers) → `.pcgo-analytics__breakdowns` (ranked lists, e.g. most-played games/users, each row showing identity + metrics).

### Current visual problems
- The file's own audit comment confirms no radius overrides beyond the shared `.pcgo-stat-cell`/`.pcgo-section-card` inheritance — this page is almost entirely a token-migration-only pass, no bespoke geometry fixes needed.
- Every metric value on this page is currently sized via literal `font-size` values in the 9–11px range for *labels*, but the actual big numbers (the metrics themselves) were not shown in the grepped snippet in this pass — flag for implementation-time confirmation: any standalone aggregate number (total sessions, total playtime, etc.) should land on `typeScale.metric`, matching the same rule applied everywhere else. This is the same category of gap as Host Monitor/Recovery, just not independently line-verified here given the file's size (523 lines).

### Target visual hierarchy
Aggregate metrics lead (the "big picture" numbers) → ranked breakdown lists (the detail behind those numbers).

### Target layout/composition
KEEP the existing metrics-grid-then-breakdown-list structure — appropriate for "backend aggregates and ranked patterns, without invented charts" per the page's own subtitle in `AnalyticsPage.jsx`.

### Target density
Medium — summary-oriented, not raw-evidence-oriented (contrast with Logs).

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** metrics-grid + breakdown-list structure, "no invented charts" philosophy (matches §7's "plain, honest percentage bar... never decorative gauges/dials/gradients" rule generalized to this page's numbers).
- **EVOLVE:** confirm and promote any standalone aggregate metric to `typeScale.metric` (flagged above); shared-class radius/shadow migration handles the rest automatically.
- **REPLACE:** nothing.
- **ADD:** nothing structural.

### Components to reuse/refactor/create
Reuse `SessionAnalytics` in place.

### Typography treatment
Per the file's own audit, most typography here is intentionally literal and below `typeScale`'s floor (8.5–10.5px mono labels) — KEEP as documented, this is deliberate density for a summary page's supporting labels. The exception is the metric-promotion flagged above, which applies specifically to the *numbers*, not the labels around them.

### Surface/panel treatment
KEEP existing `surface.l1` usage for scope-note/refresh-note/loading-panel backgrounds (already migrated per the file's own D-009 audit).

### Borders, radius and shadows
Structural cards → `radius.none` via shared-class migration. No lift/press shadow — this is a read-only reporting surface.

### Accent/semantic color usage
No specific semantic-color requirements beyond whatever identity/rank coloring already exists in the breakdown list (e.g. a top-ranked game/user might reasonably get a `brand`-colored accent if the design already does this — not identified as broken in this pass, so no change mandated unless implementation reveals a raw/undocumented color value, in which case migrate it to a token per §5.1's "never a raw hex" rule).

### Data and metric presentation
The primary target of this section: promote aggregate numbers to `typeScale.metric`. Breakdown-list per-row metrics (e.g. "42 sessions" next to a game name) can stay at a smaller, `bodySmall`-adjacent literal size — these are supporting detail, not the page's hero numbers.

### Primary/secondary actions
This page is read-only (Refresh is likely the only action, if present) — no primary/press-shadow CTA expected.

### Hover/focus/active states
Breakdown rows: no interactive state needed unless they're meant to link elsewhere (e.g. clicking a game jumps to its Session History filtered view) — not identified as existing functionality in this pass; if added later, follow `.pcgo-data-row`'s standard hover pattern.

### Motion requirements
Standard `motion.entrance` on page load; no other page-specific motion needed for a static reporting surface.

### Loading states
KEEP `.pcgo-analytics-loading__panel`/`__metrics`/`__breakdowns` skeleton patterns, radius migrating with loaded counterparts.

### Empty states
KEEP `.pcgo-analytics__empty` — migrate its radius if it currently uses a bespoke value; the message content/icon pattern is unchanged.

### Error states
Follow the app-wide danger-accent-edge + icon + text pattern if this page has a distinct error state beyond the empty state (not independently confirmed in this pass — flag for implementation-time verification).

### Responsive behavior
Confirm the metrics grid collapses per the app-wide `.pcgo-stat-grid` responsive rules (2-up ≤700px, 1-up ≤480px, per the shared `feature-page.css` base rules already inspected) rather than a bespoke override.

### Page-specific design rules
- This page is the strongest test of the "no invented charts" rule — resist any temptation to add a bar/line chart component here even though "analytics" often implies one; PCGO's chosen register is ranked lists + plain metric numbers, not chart chrome, per §7/§12.

---

## 10. Session History — `dashboard/pages/SessionHistoryPage.jsx` + `components/SessionHistory.jsx`

### Page purpose
The authoritative, individual-record list of every completed/failed/stopped session — the detailed counterpart to Analytics' aggregates.

### Current structure
`PageHeader` → `.pcgo-session-history` block: header/description → `.pcgo-session-history__list` of `.pcgo-session-history__record` entries, each expandable to show `.pcgo-session-history__details-grid` (duration, events, etc.) and an `.pcgo-session-history__events-list` of individual event messages (including error-tagged ones via `.is-error`).

### Current visual problems
- The file's own audit comment confirms this block already migrated its 5 `--color-bg-*` references to `surface.l*` — no outstanding background-token work.
- No bespoke radius overrides were identified in the grep pass beyond what the shared classes provide — again, primarily a token-migration pass.
- Record entries use a `13px/700 Space Grotesk` title and a `9px/700 mono` status label at `.07em` letter-spacing — this status label is very close to, but deliberately smaller than, `typeScale.meta`'s 10px — per the file's own comment, correctly left as an intentional density choice, not a bug.

### Target visual hierarchy
Record list leads (scannable, one row per session) → expanded detail (duration/events) on demand, per record.

### Target layout/composition
KEEP the existing list/expand-for-detail structure — already the correct "authoritative record" register per `DESIGN.md`'s own characterization of this page ("Session History = records") in §3's KEEP list.

### Target density
High — denser than Home/Settings, comparable to Users, slightly less raw than Logs (this page has structured fields, not raw log lines).

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** list/record/expand-detail structure, event-message error-tagging (`.is-error` class), all data wiring.
- **EVOLVE:** shared-class radius migration handles record-row and details-grid backgrounds; no page-specific bespoke geometry fix identified.
- **REPLACE:** nothing.
- **ADD:** confirm each record's status label (STARTING/RUNNING/COMPLETED/FAILED/STOPPED) is the shared `StatusBadge` component or an equivalent dot+pill+mono-label device — if `SessionHistory.jsx` currently renders status as bare colored mono text rather than reusing `StatusBadge`, that is a principle-#8 violation (color-only status) and should be closed by adopting `StatusBadge` here rather than maintaining a second, parallel status-rendering implementation. This is worth flagging explicitly since the record-status CSS class (`.pcgo-session-history__record` status styling) suggests a bespoke treatment rather than the shared component — verify during implementation.

### Components to reuse/refactor/create
Reuse `SessionHistory` in place; **verify/migrate to `StatusBadge`** per the ADD note above if not already in use.

### Typography treatment
KEEP documented literals (record title at 13px/700/display, status at 9px/700/mono, meta labels at 8px/700/mono) — intentional density, not a gap, per the file's own audit reasoning.

### Surface/panel treatment
KEEP existing `surface.l1`–`l3` usage (already migrated).

### Borders, radius and shadows
`radius.none` on record rows/detail panels via shared-class migration. No lift/press shadow — dense record list, not a card gallery.

### Accent/semantic color usage
Status-dependent coloring (success/danger/neutral by outcome) — ensure this is driven through `StatusBadge`'s existing `STATUS_CONFIG` map (already correct, semantic, and consistent app-wide) rather than a page-local color decision, per the ADD note.

### Data and metric presentation
Duration (`.pcgo-session-history__duration`) is a good candidate for `typeScale.metric` if it's rendered as a standalone at-a-glance figure per record — confirm during implementation whether it's inline with other text (in which case it should stay at the record's body size) or a distinct, prominent figure (in which case promote it).

### Primary/secondary actions
This page is read-only aside from expand/collapse interactions and possibly a refresh action — no primary press-shadow CTA expected.

### Hover/focus/active states
Record rows: standard `.pcgo-data-row`-style hover (background shift on hover) is appropriate if not already present, consistent with the app-wide dense-list hover pattern.

### Motion requirements
Expand/collapse detail: `motion.hover`(160ms)-scale transition is sufficient; this is not a "state landed" event in the `motion.transition` sense (it's a user-triggered disclosure, not a system state change).

### Loading states
KEEP `.pcgo-session-history-loading__row`/`__game`/`__meta`/`__status` skeleton pattern, radius migrating with loaded counterparts.

### Empty states
"No session history yet" → shared `EmptyState`.

### Error states
Individual failed-session records already carry `.is-error` event-message styling — KEEP, migrate radius only if applicable.

### Responsive behavior
Confirm this page's record rows collapse to a stacked/labeled layout on narrow viewports consistent with the app-wide dense-row pattern (similar to Users' `data-label` approach) rather than a bespoke solution — not independently line-verified in this pass; flag for implementation-time confirmation.

### Page-specific design rules
- Session History and Analytics are a deliberate pair (detail vs. aggregate) — keep their visual registers close enough that a user recognizes them as "the same data, two views," but Session History should read as the denser, more literal of the two.

---

## 11. Logs — `dashboard/pages/LogsPage.jsx` + `components/LogPanel.jsx`

### Page purpose
Raw operational evidence: the least-abstracted, most-literal view of what the system has done, for debugging.

### Current structure
`PageHeader` → `.pcgo-logs` block: eyebrow → filter controls (`.pcgo-logs__filters`) → stats (`.pcgo-logs__stats`) → a scrollable list of log entries, each with a severity badge, message, and metadata (timestamp/source) → scope/refresh notes and an error state.

### Current visual problems
- None requiring geometry fixes beyond the one shared `.pcgo-logs__scope-note`/`__refresh-note`/`__error` background, already migrated to `surface.l1` per the file's own audit.
- This page's typography is, by design, the densest/smallest in the app (down to 8px) and is explicitly protected by its own audit comment as "this page's tighter, denser mono scale is intentional per D-008's 'operational evidence' character for Logs specifically, not a gap to close" — **do not** attempt to bring this page's type sizes up to `typeScale` floor values; that would actively work against this page's job.

### Target visual hierarchy
Filters/controls (how to narrow the view) → stats (how much is here) → the log stream itself (the actual content, occupying the most space and scroll length).

### Target layout/composition
KEEP entirely — this is explicitly named in `DESIGN.md` §3/§6.13/§12 as already-correct "operational evidence" character and should not be softened toward Home/Login's spacious register.

### Target density
**Highest in the product** (§12) — pure mono, zero decoration, maximum information per pixel.

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** entire dense mono vocabulary, filter/stats/stream structure, severity-badge-per-entry pattern, `role="alert"` error handling.
- **EVOLVE:** `radius.none` throughout — per §6.13, this page was "already close to 0 on most elements here," so this should be close to a no-op visual change, just a formal confirmation/cleanup pass rather than a redesign.
- **REPLACE:** nothing.
- **ADD:** nothing. This is the page `DESIGN.md` most explicitly protects from over-design.

### Components to reuse/refactor/create
Reuse `LogPanel` entirely as-is structurally.

### Typography treatment
**KEEP every literal value exactly as implemented** — this is a hard exception to the general "migrate toward typeScale" instinct elsewhere in this document. Logs' job requires density typeScale's floor doesn't reach.

### Surface/panel treatment
KEEP `surface.l1` for note/error backgrounds; log entries themselves likely sit on `surface.l0`/`l1` for maximum contrast with severity-colored text — not independently re-verified line-by-line, but no evidence of a problem.

### Borders, radius and shadows
`radius.none` (near-no-op per above). `shadow.flat` throughout — absolutely no lift/press anywhere on this page; §6.13/§11 both explicitly ban hard shadows and lift effects here ("no texture, no hard shadows, no lift effects — legibility above all").

### Accent/semantic color usage
Severity badges use the standard semantic palette (`danger` for errors, `warning` for warnings, `info`/neutral for info-level entries) — confirm this already exists (near-certain given the "explicit severity" framing in the page's own subtitle) and is token-driven, not raw hex.

### Data and metric presentation
`.pcgo-logs__stats` — if this includes any standalone count (e.g. "142 entries"), it's a borderline case: Logs' whole ethos is "no decoration," so even `typeScale.metric`'s bold mono treatment might read as too showy here. **Recommendation: do not promote Logs' stat counts to `typeScale.metric`** — leave them at the page's existing small-mono scale, consistent with the rest of the page's deliberately unshowy character. This is a deliberate exception to the metric-promotion pattern applied everywhere else in this document.

### Primary/secondary actions
Refresh/filter controls only — flat, no press-shadow, consistent with this page having no "primary CTA" in the featured-action sense.

### Hover/focus/active states
Log entries: minimal/no hover treatment needed (not typically clickable); filter controls get standard flat-button states.

### Motion requirements
Minimal — new entries streaming in (if live-updating) should not animate in a showy way; a plain append with `motion.fast` opacity-in at most, per the general "motion is earned by a state change" principle applied at its most conservative on this page.

### Loading states
KEEP `.pcgo-logs__loading`/`__loading-row`/`__loading-line`/`__loading-severity` skeleton pattern unchanged.

### Empty states
"No log entries" → the existing `.pcgo-logs__empty` pattern, radius unchanged (near-0 already).

### Error states
KEEP `.pcgo-logs__error` exactly — already the correct pattern.

### Responsive behavior
No page-specific breakpoint concerns identified — dense mono content generally reflows acceptably; confirm no horizontal-scroll traps exist on narrow viewports during implementation, but no design-language change is implied here.

### Page-specific design rules
- **This is the litmus-test page for the whole anti-pattern list (§11).** If an implementer is ever unsure whether a decorative treatment belongs somewhere in PCGO, "would this belong on the Logs page" is a useful gut-check — if not, it probably doesn't belong on other operational pages either, and if it would look absurd here, it's decoration, not structure.

---

## 12. Settings — `dashboard/pages/SettingsPage.jsx` + `components/SettingsPanel.jsx`

### Page purpose
Configuration workspace: account-access shortcuts, operational-evidence shortcut (Logs), host configuration (draft + explicit Save), appearance/theme picker, and About info.

### Current structure
`PageHeader` → `.pcgo-settings-overview` (accent-left-edge intro banner, gradient wash) → `SectionCard "Account access"` (link row to Change Password) → `SectionCard "Operational evidence"` (link row to Logs) → `SettingsPanel` (the actual host-config form, local draft + Save) → `SectionCard "Appearance"` (theme swatch grid, including a custom-color picker) → `SectionCard "About"` (product/version key-value pairs).

### Current visual problems
- `.pcgo-settings-overview` already uses the accent-left-edge pattern (`border-left: 2px solid var(--color-brand)`) — correct device, but at **2px**, not §5.8's standard **2–3px** (technically within range, but should be checked/normalized to 3px for consistency with Toast/Host-Monitor/Home's alert-strip, which all use 3px).
- `ThemeSwatchCard`/`CustomThemeSwatchCard` are built on the shared `Card` primitive with `hoverable` — once `Card`'s radius updates globally (`radius.lg` → `radius.none`), these swatch cards need a check: a `radius.none` swatch card holding a `radius.full` circular color swatch inside it is visually fine and consistent with the binary system (rectangle container, circular object inside — exactly §5.8's vocabulary), so no special-case override should be needed here, but confirm during implementation that the 12px padding doesn't make a hard-cornered swatch card feel cramped next to its round swatch.
- `LinkRow` (settings-page link rows to Change Password / Logs) — radius not independently verified in this pass; likely inherits from a shared list-row pattern, migrates automatically.

### Target visual hierarchy
Overview banner (orienting copy) → account/evidence shortcuts (quick links, low visual weight) → host configuration (the actual, real controls — highest-weight interactive content on the page) → appearance (a lower-stakes, immediate-effect preference) → about (lowest-weight, static reference info).

### Target layout/composition
KEEP the existing vertical stack of `SectionCard`s exactly — this is already the correct "configuration workspace" register per §12's Settings row.

### Target density
Low–medium (per §12) — the calmest surface in the application proper (Login is calmer, but Login isn't "in" the app). KEEP this tone; do not densify Settings to match Host Monitor or Logs.

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** overview banner device, section-card stack, `LinkRow` pattern, `SettingsPanel`'s local-draft-plus-explicit-Save model (this is a real, good UX decision independent of visual language — "host settings use a local draft and one explicit Save action" is stated in the page's own overview copy and should not be touched), appearance swatch-grid mechanism.
- **EVOLVE:** overview banner left-edge width 2px → 3px (normalize to §5.8's standard); all `SectionCard`/`Card` radius values → `radius.none` via the shared-primitive migration; theme-swatch card padding/proportions get a quick visual check post-migration (see above) but no structural change expected.
- **REPLACE:** nothing.
- **ADD:** nothing structural.

### Components to reuse/refactor/create
Reuse `SettingsPanel`, `SectionCard`, `Card` (for theme swatches), `LinkRow` (local to this file) — all token-migration-only.

### Typography treatment
Per the file's own audit, ~13 distinct literal sizes are intentionally left un-migrated ("forcing alignment here would mean genuinely resizing/reweighting ~15 rules across Settings' own density-tuned hierarchy") — KEEP as documented. This page's calm-but-detailed typographic register is correct as-is.

### Surface/panel treatment
KEEP existing `surface.l0`–`l4` usage (already fully migrated per the file's own D-009 audit — "every var(--color-bg-inset|-elevated|-card|-card-hover|(bare)) in this block was swapped").

### Borders, radius and shadows
`radius.none` on all section cards; `radius.tight` on the theme-swatch cards' small chrome if any exists at that scale (the swatches themselves stay `radius.full` as circular color objects, unchanged). No lift/press shadow needed on this page except the Save button in `SettingsPanel` (primary action → `shadow.press`) and, arguably, the selected theme-swatch card could gain a `borderInk` edge (not a shadow) to signal "this is the active choice" more clearly than the current brand-colored border alone — this is a reasonable, optional EVOLVE if implementation time allows, using the same "selected state" device recommended for Users' bulk-selection rows (§6.5's "not yet implemented anywhere" pattern), applied here to theme selection instead.

### Accent/semantic color usage
`brand` for the overview banner's left edge and the selected theme swatch's border — both already correct, semantic, single-signal usages. No new colors needed.

### Data and metric presentation
No standalone metrics on this page — About's Product/Version fields are static labels, not measurements, and should stay as simple key/value text, not `typeScale.metric`.

### Primary/secondary actions
Primary: `SettingsPanel`'s Save action (only when the local draft is dirty — confirm this button is disabled/hidden when there's nothing to save, which is implied by "local draft and one explicit Save action" but not independently re-verified line-by-line in `SettingsPanel.jsx` in this pass). Secondary: the two `LinkRow` shortcuts (Change Password, Logs) — these are navigation, not action, and should stay flat/chevron-affordance only, never gaining a press-shadow.

### Hover/focus/active states
`LinkRow`: standard row-hover (background shift). Theme swatches: `Card`'s existing `hoverable` lift mechanism, now paired with `shadow.lift` once `Card` migrates (§6.3) — reasonable here since theme swatches are genuinely clickable "choose one" cards, not dense data.

### Motion requirements
Theme selection: `motion.transition` is a strong candidate here — picking a new theme changes the *entire app's* color scheme instantly, and a small state-landed overshoot on the newly-selected swatch's border color would reinforce that the choice registered. Save action: standard `motion.press`.

### Loading states
KEEP `.pcgo-settings-loading__group`/`__toolbar` skeleton pattern, radius migrating with loaded counterparts.

### Empty states
N/A in the traditional sense (Settings always has content) — if host config genuinely fails to load, use the same `EmptyState`-with-danger-icon pattern as elsewhere.

### Error states
KEEP `.pcgo-settings__unavailable`/`.pcgo-settings__action-help` patterns — already cited in `DESIGN.md` §12 as a reference pattern for the app-wide error register. Radius migrates only.

### Responsive behavior
Confirm the theme-swatch grid and settings rows collapse to single-column per the app-wide `.pcgo-stat-grid`/form breakpoints (700px / 480–560px) rather than a bespoke override.

### Page-specific design rules
- Settings is the page most likely to tempt "just make it prettier" scope creep because it's low-stakes — resist that; per §12's own framing, its job is to feel calm and legible, not decorative. Any visual flourish added here should be justified by "this makes a control clearer," never "this looks nice."

---

## 13. Change Password — `dashboard/pages/ChangePasswordPage.jsx`

### Page purpose
Focused, single-task security workflow: change the signed-in account's password, with real-time validation.

### Current structure
`PageHeader` → `.pcgo-change-password-shell` → `.pcgo-change-password-card` (header with `ShieldCheck` icon mark + eyebrow + `<h2>` + description, a context note, then a form of three `PasswordField`s, error/success banners, and a submit button).

### Current visual problems
- The file's own audit comment confirms one genuine clean `typeScale.bodySmall` match already in place (input text) and documents every other literal value as intentionally non-matching (eyebrow, `<h2>`, body copy, field labels, required-badge, description/error/success text) — this page's geometry (radius) is the primary target here, not typography.
- Card/field radius values not independently re-grepped line-by-line in this pass beyond the shared pattern context, but given this page's structural similarity to Login's form panel (bordered card, icon mark, eyebrow, heading, fields, submit), the same radius migration applies: card → `radius.none`, inputs → `radius.none`, small chrome (icon mark, required-badge) → `radius.tight`.

### Target visual hierarchy
Card header (what this is, why it matters) → context note (session-persistence reassurance) → three password fields in strict order (current → new → confirm) → validation/error/success feedback → submit.

### Target layout/composition
KEEP the single-card, centered-shell layout exactly — appropriately narrow/focused for a single-task security form, distinct from Settings' full-width section-stack.

### Target density
Low–medium — this page is explicitly framed in its own CSS header comment as "a focused security workflow, not a secondary Settings dashboard," meaning it should feel closer to Login's calm, singular-focus register than to Settings' denser configuration-workspace register, despite living inside the dashboard shell.

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** card structure, `PasswordField` sub-component (label/icon/required-badge/input/description/error anatomy), inline real-time validation logic (`newPasswordError`/`confirmationError` computed live from state, not just on submit), success/error banner pattern.
- **EVOLVE:** card radius → `radius.none`; icon mark (`ShieldCheck` badge) radius → `radius.tight`; input radius → `radius.none` (matching Login's own input treatment exactly, since this page is explicitly the app's other "security form" and should feel like a sibling of Login's form panel); required-badge radius (if any) → `radius.tight`.
- **REPLACE:** nothing.
- **ADD:** nothing structural.

### Components to reuse/refactor/create
`PasswordField` is local to this file — no extraction needed, token updates only. Reuse shared `Button` (primary submit, inherits `shadow.press` automatically post-migration).

### Typography treatment
KEEP all documented literals per the file's own audit — the one already-clean match (`bodySmall` on input text) needs no change; everything else stays as intentional, page-specific values.

### Surface/panel treatment
KEEP existing `surface.l1`/`l3`/`l4` usage (card background, input background, input focus background — already migrated per the file's own audit).

### Borders, radius and shadows
See EVOLVE. Card gets `shadow.overlay` if it should read as a genuinely elevated panel within the dashboard shell (consistent with Login's form panel getting `shadow.overlay` against its hero pane) — reasonable here since this card is the sole content on the page, analogous to Login's form panel. If implementation finds the dashboard shell's own background elevation makes a second overlay shadow feel redundant, `shadow.flat` + a `borderInk` edge is an acceptable alternative per §6.3's "featured/flagship card" guidance ("optionally `shadow.overlay` if it's a genuinely elevated panel").

### Accent/semantic color usage
`danger` for the error banner and any field-level error state (KEEP, already using `dangerDim`-recolored `shadow.focusRing` per the page's own `[aria-invalid="true"]:focus` rule, explicitly cited in `DESIGN.md` §6.2 as "already implemented... promote to the shared token"). `success` for the success banner (KEEP).

### Data and metric presentation
N/A — no metrics on this page.

### Primary/secondary actions
Primary: Change password submit (full-width-equivalent, primary variant, `shadow.press` once migrated). No secondary action — correctly a single-purpose form, matching Login's single-CTA discipline.

### Hover/focus/active states
Inputs: focus → `colors.brand` border + `shadow.focusRing` (error state → `dangerDim`-recolored ring, already implemented per above — just needs promotion to the named token, not a new behavior).

### Motion requirements
`motion.base` on input border/background transitions, matching Login's own input treatment exactly (these two pages should feel like siblings). `motion.transition` on the success banner's appearance if it currently has no entrance treatment (a small "this landed" moment is appropriate for a successful security-sensitive action).

### Loading states
KEEP: submit button label swaps to "Updating password…" during `submitting`, matching Login's "Signing in…" pattern.

### Empty states
N/A.

### Error states
KEEP the existing `role="alert"` error banner (submit-level) and per-field inline errors (`PasswordField`'s `fieldError` rendering with `TriangleAlert`) — both already correct, icon+color+text per principle #8.

### Responsive behavior
Confirm the card's max-width/padding collapse gracefully at the app's standard mobile breakpoints — per `DESIGN.md` §9's note, "Change Password card padding" is specifically named among the final type-size/padding reductions tuned at 420/380px, so this should already be handled; no change expected here beyond radius values.

### Page-specific design rules
- Treat this page as Login's sibling, not Settings' child, when making any visual judgment call not explicitly covered above — its narrow, focused, single-card register should stay closer to Login's calm precision than to Settings' denser workspace tone, even though it's reached via Settings' navigation.

---

## 14. Not Found — `dashboard/pages/NotFoundPage.jsx`

### Page purpose
Fallback for any route the signed-in role doesn't recognize — explicit, not a silent redirect to Home.

### Current structure
`PageHeader` (title "Page Not Found") → a centered `Card` containing a warning-toned icon well, a large "404" figure, a "Nothing lives at `/path`" message with the attempted path in an inline `<code>` tag, and a "Go To Home" secondary button.

### Current visual problems
- Icon well radius is `radius.md` (12px, via `${radius.md}px`) — needs migration.
- Inline `<code>` tag radius is `radius.sm` (8px) — small chrome, correctly maps to `radius.tight`.
- The "404" figure (34px, `fonts.display`, weight 700) is exactly another instance of the ad-hoc "big number that doesn't land on typeScale" pattern named throughout this document — a strong candidate for `typeScale.metric`, though note this is a stylized *display* numeral (part of "404" as a recognizable idiom) rather than an operational measurement, so treating it as `typeScale.metric` is a judgment call, not a mechanical requirement — see recommendation below.

### Target visual hierarchy
Icon (orienting, low-key warning signal) → "404" (the recognizable idiom) → path message (specific, actionable context) → Go Home action (the way out).

### Target layout/composition
KEEP the centered, single-card composition exactly — appropriately minimal for an edge-case page nobody should spend time on.

### Target density
Low — this page should feel calm and brief, not alarming (a 404 in an authenticated single-host tool is a mis-navigation, not a system failure, and should not borrow Recovery/Errors' high-alarm register).

### KEEP / EVOLVE / REPLACE / ADD
- **KEEP:** centered-card composition, icon-well + figure + message + action anatomy, `warning` (not `danger`) tone — correctly signals "you went somewhere that doesn't exist," not "something broke."
- **EVOLVE:** icon-well radius `radius.md`(12) → `radius.tight` (it's a 56px icon container — still small-chrome-scale per §5.3's exception, not a structural panel); inline `<code>` radius `radius.sm`(8) → `radius.tight`; outer `Card` radius → `radius.none` once the shared `Card` primitive migrates.
- **REPLACE:** nothing.
- **ADD:** nothing.

### Components to reuse/refactor/create
Reuse shared `Card`, `Button` (secondary variant) — token updates only.

### Typography treatment
**Recommendation:** promote the "404" figure to `typeScale.metric` for consistency with every other "big standalone number" on the app (Host Monitor's readiness stat, Recovery's summary stat, `ProgressStat` values) — even though it's stylistically a numeral-as-idiom rather than a live measurement, using the same type step keeps the app's "how do we render an important number" vocabulary singular, which is itself a `DESIGN.md` principle (#5/#9: "one coherent system... same tokens, same geometry rules"). This is the one place in this document where a metric-promotion is a stylistic-consistency judgment call rather than a semantic-correctness one — implementers may reasonably decide the existing 34px/700/display treatment is close enough to `typeScale.metric`'s clamp range to just alias it directly.

### Surface/panel treatment
KEEP existing `Card` background (inherits `colors.bgCard`/`surface.l3`).

### Borders, radius and shadows
See EVOLVE. No lift/press shadow — this card is not interactive/featured in the §6.3 sense, it's an informational end-state.

### Accent/semantic color usage
KEEP `warning` (yellow family, `accentYellowDim` background on the icon well) — correct semantic choice, not `danger`.

### Data and metric presentation
The "404" figure, per the typography recommendation above.

### Primary/secondary actions
Single action: "Go To Home" — `secondary` variant is the correct weight here (this is a recovery/redirect action, not the page's "main task," since the page has no main task beyond getting the user back on track) — do not upgrade it to `primary`/`shadow.press`, that would overstate this page's importance.

### Hover/focus/active states
Standard shared `Button` secondary-variant states — no page-specific treatment.

### Motion requirements
Standard `motion.entrance` on page load; nothing else — this page should feel quiet, not eventful.

### Loading states
N/A — this page renders synchronously from route-matching failure, no data fetch involved.

### Empty states
N/A — this page *is* effectively PCGO's "empty state" for bad routes.

### Error states
This page is itself the app's soft-error/edge-case state — no further nested error state applies.

### Responsive behavior
Confirm the centered card and its padding collapse reasonably on narrow viewports — not independently identified as broken, likely inherits standard `Card`/page padding behavior with no bespoke breakpoint needed.

### Page-specific design rules
- Keep this page boring on purpose. It is the one place in the product where *not* drawing attention to itself is correct — a user hitting a 404 should get oriented and leave in two seconds, not be presented with a moment.

---

## 15. Cross-cutting shared components (used by multiple pages above — updated once, inherited everywhere)

This section exists so implementers don't duplicate the same token change across every page section that references these files. Each of the following already has its target treatment fully specified in `DESIGN.md` §6 (component language) — this section only maps *which pages above depend on each one*, so the implementation order can start here.

| Shared file | `DESIGN.md` reference | Pages that depend on it |
|---|---|---|
| `components/ui/primitives.jsx` (`Button`, `Card`, `Chip`, `Spinner`, `EmptyState`) | §6.1–§6.3, §6.10 | Every page in this document, directly or via a page-local component |
| `components/StatusBadge.jsx` | §6.4 (KEEP exactly) | Home (`SessionCard`), Session History (pending the ADD note in §10 above), Host Monitor (`Badge`, a **local, similar-but-distinct** component — verify during implementation whether `HostStatusPanel.jsx`'s own `Badge` function should be consolidated with `StatusBadge` or is intentionally a separate, simpler tone-only variant; not identified as broken, just flagged for implementer awareness since two similarly-named status-pill components exist in the codebase) |
| `components/ui/Toast.jsx` | §6.8 (KEEP as reference implementation) | App-wide (via `useToast()`), no page-specific work |
| `components/ui/ConfirmDialog.jsx` | §6.7 (KEEP interaction logic, EVOLVE radius/shadow) | User Management (bulk delete), Host Monitor (Force Unlock), Game Manager (delete game) |
| `dashboard/components/PageHeader.jsx` | Not separately named in `DESIGN.md` §6, but every page's `<h1>`/back-button | Every routed page except Login (which has its own hero, not `PageHeader`) |
| `dashboard/components/SectionCard.jsx` | Implicit in §6.3's "Card" family | Host Monitor (Session Health), Sunshine indirectly, Settings, and any page using the shared component (not the page-local `HostStatusPanel.jsx` `SectionCard`, which is a **separate, local** function of the same name — flagged for the same reason as the `Badge`/`StatusBadge` overlap above) |
| `dashboard/components/EmptyState.jsx` / `LoadingState.jsx` | §6.10 | Home, and (by convention, per each page's own Empty/Loading subsection above) every data-bearing page |
| `dashboard/components/NavigationCard.jsx` | §6.14 | Home only |

**Implementation note (not a design decision, a sequencing one):** because so many pages inherit their radius/shadow correctness from `primitives.jsx`, `theme.js`'s token migration (§5 of `DESIGN.md`) plus a `primitives.jsx` pass should happen **first**, before any individual page section above is touched — most of the "EVOLVE" items in this document that reference "shared class" or "once the shared primitive updates" will resolve automatically at that point, and the remaining per-page work shrinks to genuinely page-specific items (metric-typography promotions, accent-edge-direction fixes, the two local-vs-shared naming overlaps flagged in the table above, and the handful of named ADD items).

---

## 16. Cross-page consistency checklist (for review, not a new rule set)

Use this after implementing each page to confirm it didn't drift from the pages already done:

- [ ] Radius is one of `none`/`tight`/`full` — no lingering 6/7/8/9/10/12/14/16px value anywhere touched.
- [ ] Any standalone "read at a glance" number uses `typeScale.metric`, **except** Logs (deliberately excluded, §11) and page-context counts like Game Manager's/Users' item counts (deliberately kept small, §7/§8).
- [ ] Every accent-edge instance is **left**, 2–3px, one semantic color — no top-edge holdouts (Host Monitor's Sunshine/Tailscale/Readiness cards are the one confirmed instance to fix, §4).
- [ ] Every status indicator pairs color with shape (dot/badge) and text — never color-only (principle #8; Session History's status rendering is the one flagged item to verify, §10).
- [ ] No raw hex/rgba values introduced or left uncorrected where flagged (Game Manager's add-button hover color, §7; Host Monitor's pre-existing `.pcgo-host-force-unlock` rgba, noted in `DESIGN.md` §5.1 itself).
- [ ] `shadow.lift`/`shadow.press` appear only on genuinely interactive/featured elements (command cards, primary buttons, the active session card) — never on dense list rows or read-only panels.
- [ ] Login and Change Password read as visual siblings (both are "security form" surfaces); Home and Host Monitor read as visual siblings at the top of their respective density registers within their own pages; Session History and Analytics read as a deliberate detail/aggregate pair.

---

## 17. Open uncertainties (flagging honestly, per the same discipline `DESIGN.md` §16 used)

1. **`Badge` (local to `HostStatusPanel.jsx`) vs. `StatusBadge` (shared)** — these appear to be two separate, similarly-purposed components. This document does not mandate consolidating them (that's a code-architecture decision, not a visual-language one), but flags it so the implementer doesn't assume they're the same component when applying `DESIGN.md` §6.4's "KEEP exactly" instruction — confirm which one each instance actually is before deciding whether it needs a change.
2. **`SectionCard` (local to `HostStatusPanel.jsx`) vs. `SectionCard` (shared, `dashboard/components/SectionCard.jsx`)** — same naming-overlap flag as above, different files, different (if similar) implementations.
3. **Session History's status rendering** — not fully line-verified in this pass (641-line file) whether it already reuses `StatusBadge` or has a parallel bespoke implementation; §10's ADD note above should be resolved by a quick read of the file before implementation begins there.
4. **Analytics' aggregate-metric typography** — not fully line-verified (523-line file) which specific values are the "big numbers" that should receive `typeScale.metric`; §9 flags the general rule but implementation should confirm exact element(s).
5. **Sunshine's connection-line vocabulary** — flagged in §6 as a genuine but optional gap; not a blocking requirement for this pass, but should not be forgotten if a later pass specifically targets "domain expression" polish per `DESIGN.md` §7.
6. **Recovery/Sunshine/Session-History's exact tablet-breakpoint values** — this document assumes they already match `DESIGN.md` §9's canonical 700–780px range based on file-level comments, but none were independently confirmed against their actual `@media` rules line-by-line; low-risk, quick to verify during implementation.

These six items are implementation-time verification tasks, not design decisions requiring further discussion before work starts — none of them block beginning implementation on any page in this document.