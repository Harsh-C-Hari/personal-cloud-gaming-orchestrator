# PCGO Frontend: UI Fix Checklist

> **Branch:** `ui/overhaul`  
> **Scope:** `frontend/` (React 18 + Vite, plain JSX, hand-written CSS + inline styles, vitest)  
> **Theme:** single monochrome theme only — no theme switching, no alternate themes  
> **Progress log:** `frontend/PROGRESS.md`  
> **Commit discipline:** one commit per phase; tick boxes as work lands

**Confirmed deps (from `package.json`):** `gsap ^3.15.0`, `lenis ^1.3.26`, `react-icons ^5.6.0`, `lucide-react ^1.26.0` — all present and all targeted for partial/full removal per the decisions below.

Legend: **[BUG]** real defect · **[SYS]** system/foundation · **[PAGE]** page layout · **[COPY]** wording · **[A11Y]** accessibility · **[CLEAN]** removal

---

## 0. Decisions (already made — do not re-open without asking the owner)

| ID | Decision | Why |
|---|---|---|
| D1 | One monochrome theme: black base, white primary, colour only for status. | Owner's call. |
| D2 | Type: **IBM Plex Sans** (all UI text and headings) + **IBM Plex Mono** (machine data only), self-hosted via `@fontsource`. Drop Space Grotesk, Inter, JetBrains Mono. *Isolated to the tokens file, so it can be reverted in one commit.* | Space Grotesk + Inter + JetBrains Mono is the default trio of generated dashboards. Self-hosting also removes the runtime Google Fonts dependency on a LAN/Tailscale tool. |
| D3 | Status tones: `running`, `restarted`, `completed`, `ready` = **success**; `starting`, `restarting`, `cleaning` = **info**; `stopping`, health warning = **warning**; `failed`, offline = **danger**; `stopped`, unknown = **neutral**. One map, used everywhere. | Fixes "Completed is blue on Home, green in History". |
| D4 | **Remove GSAP, ScrollTrigger and Lenis entirely.** Motion left: hover/press transitions, dialog/toast enter/exit, disclosure expand, in-progress status pulse, spinner, one fade on Login. | Count-ups, per-row scroll reveals, magnetic buttons and idle logo animation are decorative, not cause-and-effect. |
| D5 | "Back" shows only when the page was opened from an in-page link (e.g. Settings → Logs), not from the sidebar. | `useRoute` already keeps a came-from stack; the audit overstated this one. |
| D6 | Success/info toasts auto-dismiss at 4 s. **Error toasts persist until dismissed.** Both pause on hover/focus. | Deliberate exception to the 3–5 s guideline: errors need a recovery path and timing must be adjustable. |
| D7 | Product name: **PCGO** in header/title; "Personal Cloud Gaming Orchestrator" only in the Login description and README. | Header, login, mobile header and package name currently disagree. |
| D8 | The one memorable element is **host state** (Ready / In session / Needs attention) as a large readout on Home, reused on Host Monitor. Everything else stays quiet. | Spend boldness in one place. |
| D9 | Login becomes a single centred form card with a one-line description. No hero, pill row, eyebrow or staggered entrance. | Template hero removed. |

---

## 0.1 Where this checklist corrects the earlier audit (checked against the UI skills)

| Topic | Earlier audit | Corrected rule |
|---|---|---|
| Hit area | 32 px minimum on desktop | **Hit area ≥ 40 px, 44 px on coarse pointers.** Visual size may be 32 px if a `::after` expands the hit area. ≥ 8 px gap between adjacent targets. |
| Type scale | 12 / 13 / 14 / 16 / 20 / 28 | **12 / 14 / 16 / 20 / 28 + display.** 13 is a half-step. Body 14, labels 12, floor 12. Inputs 16 px at ≤ 768 px (avoids iOS zoom). |
| Disabled | "about 3:1 text" | Opacity **0.5** (guideline range 0.38–0.5), **neutral tone** (a red button at 0.45 measures 2.37:1), `disabled` attribute, plus visible reason text where the cause isn't obvious. |
| Muted text | "passes AA with no margin" | `#7e7e7e` on the hover surface `#171717` is **4.42:1, a fail.** New muted `#949494` is 5.37:1 on `#202020`. |
| Control borders | not mentioned | Card edges can stay subtle (decorative). **Input/select/toggle boundaries need ≥ 3:1.** Current 13 % white is 1.4:1. New control border is 40 % white = 3.41:1 minimum. |
| Press feedback | translateY(1px) + hard offset shadow | `transform: scale(0.97)` in CSS `:active`, no hard shadow, no layout shift. |
| Nested radius | 4 / 8 / 12 | Same tokens, plus: inner radius = outer − padding (min 4). If padding ≥ 16, treat as separate surfaces. Prefer removing the nested box. |
| Identity | "keep the identity" | Keep the monochrome palette (owner's brief). **Remove the template chrome** (caps eyebrows, mono micro-labels, middle-dot meta, `→`/`↗` decorations). |
| Back button | "no meaningful target" | See D5. |

---

## Phase 0: Baseline and safety net

- [x] **0.1** Create branch `ui/overhaul`. Run `npm ci`, `npm run lint`, `npm test`, `npm run build`. Record results (including pre-existing failures) at the top of `frontend/PROGRESS.md`. ✅ All green, no pre-existing failures.
- [ ] **0.2** Run the visual harness for "before" images: `npm run dev`, then `node qa/render.mjs` (needs `npx playwright install chromium`; do not add playwright to `package.json`). Move output to `qa/output-before/`. Note any route that crashes the mock (Host Monitor and Settings did in the audit).
- [x] **0.3** Save baseline counts to `PROGRESS.md`. ✅ Recorded: `style={{` 407 · `!important` 142 · `uppercase` 157 · `rgba(` 73 · `<label` 5 · `<table` 0 · `transition: all` 0 · 16 distinct radius values · 8 distinct z-index values. Full table in `PROGRESS.md §Phase 0`.
- [x] **0.4** List the strings pinned by tests. ✅ 5 test files audited; frozen strings catalogued in `PROGRESS.md §0.4`. Key frozen names: `Sign in`, `Signing in…`, `Register admin`, `Launch session`, `Stop session`, `Stopping…`, `Running` (EventLog), and both placeholders.

**Done when:** build and tests are green (or failures are documented as pre-existing), before-screenshots exist, baseline numbers are recorded.

---

## Phase 1: Correctness bugs (no visual redesign)

- [x] **1.1 [BUG]** `@keyframes badge-pulse` and `card-in` are used but never defined. Define once in the global stylesheet. *Done when:* in-progress status dots visibly pulse (`StatusBadge.jsx`, `HostStatusPanel.jsx`, `RecoveryStats.jsx`, `RecoveryEvents.jsx`).
- [x] **1.2 [CLEAN]** Collapse duplicate keyframes into one `spin` and one `pulse`:
  - Spins to merge: `cgo-spin`, `gm-spin`, `hsp-spin`, `sa-spin`, `sh-spin`, `scm-spin`, `lp-spin`, `pcgo-users-spin`, `pcgo-settings-spin`
  - Pulses to merge: `cgo-pulse`, `pcgo-pulse`, `ssh-pulse`, `scm-pulse`, `pcgo-log-pulse`, `log-blink`, `dashboard-loading-pulse`
  - Delete inline `<style>` tags that held only these keyframes.
  - *Done when:* `grep -rn "@keyframes"` shows one definition per animation, all in the global stylesheet.
- [x] **1.3 [BUG][COPY]** Add `pluralize(n, singular, plural?)` utility. Fix `"{n} sessions"` at `SessionAnalytics.jsx:207`; grep for the same pattern on sessions, games, users, clients, events.
- [x] **1.4 [A11Y]** Remove nested-interactive in Game Manager (`GameManager.jsx:508`, `role="button"` wrapping focusable children). Card becomes a non-interactive container with real buttons ("Edit", "Delete") inside.
- [x] **1.5 [A11Y]** One `<main>` only, in `MainContent.jsx`. Change the inner `<main>` in `Home.jsx:87` and `ChangePasswordPage.jsx:81` to `<div>`/`<section>`. (Login keeps its own `<main>`; it is a separate route.)
- [x] **1.6 [A11Y]** Real `<label htmlFor>` for every input: Login (`FieldLabel` is a `<span>`), `ChangePasswordPage.jsx`, `StartSessionForm.jsx`, `GameManager.jsx` form, `UserPanel.jsx`, `SettingsPanel.jsx`, `SunshineClientManager.jsx`. Keep existing placeholders and element roles (tests rely on them). Remove redundant `aria-label` where a visible label now exists.
- [x] **1.7 [A11Y]** Toasts (`src/components/ui/Toast.jsx`): error toasts use `role="alert"`, others `role="status"`; never steal focus; pause timers on hover and focus; success/info 4 s; errors persist with a close button (D6).
- [x] **1.8 [BUG]** Home "Live system pulse" truncates values ("Onl…", "WEBS…"). Let labels and values wrap or stack; never ellipsis a status value.
- [x] **1.9 [BUG][A11Y]** Disabled controls: neutral tone, opacity 0.5, `cursor: not-allowed`, `disabled` attribute. "Force close stream" (Sunshine) shows why it is disabled ("No active stream") as text beside it.
- [x] **1.10 [CLEAN]** Remove the single `transition: all` (`LogPanel.jsx:528`); list explicit properties.
- [x] **1.11 [BUG]** `index.html`: `<link rel="icon">` sits in `<body>` with invalid `type="svg"`. Move to `<head>`, use `type="image/svg+xml"`. Title → `"PCGO"` (D7).
- [x] **1.12 [CLEAN]** Remove unused `react-icons` (`npm uninstall react-icons`; confirm zero imports first). Remove `Squiggle` component and its one use.

**Done when:** lint, tests, build green; axe shows no `nested-interactive`, `landmark-*` or `label` violations on Home, Game Manager, Login, Change Password.

---

## Phase 2: Tokens and foundation

- [ ] **2.1 [SYS]** Move `GLOBAL_CSS` out of `App.jsx` into `src/styles/tokens.css` + `src/styles/base.css`, imported from `main.jsx`. Keep `theme.js` export names (`colors`, `fonts`, `typeScale`, `radius`, `spacing`, `shadow`, `motion`, `surface`) so call sites keep working, but make every value point at a CSS variable. Delete stale comments (six themes, TCB phases, "binary radius", `DESIGN.md §` references).

- [x] **2.2 [SYS] Colour tokens** (all values contrast-measured): Updated `App.jsx` CSS vars — inkFaint `#949494`, surfaces L1-L4 brightened, `--color-border-control: rgba(255,255,255,.40)` added.

- [ ] **2.3 [SYS] Type tokens.** Sizes: `12 / 14 / 16 / 20 / 28`, plus display `clamp(36px, 5vw, 64px)` (Login only) and metric `clamp(28px, 3vw, 40px)` with `tabular-nums`. Body 14 px/1.5, weight 400. Labels 12 px, weight 500, sentence case, `--color-ink-faint`. Headings weight 600. Letter-spacing 0, except −0.02 em on ≥ 28 px. **No `text-transform: uppercase` anywhere.** Replace `typeScale.meta` and `monoLabel` with `typeScale.label`; delete the `Eyebrow` component (`src/components/ui/Eyebrow.jsx`) and `.pcgo-eyebrow` class (only keep a visible group heading where content is a real category, e.g. sidebar groups). Mono (12 px) is for IDs, timestamps, durations, paths, log lines only.
  *Done when:* no computed font size below 12 px on any route; `grep -rn uppercase src` returns nothing.

- [x] **2.4 [SYS] Typefaces (D2).** `npm i @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono`; import weights 400/500/600 (mono 400/500) in `main.jsx`; `font-display: swap`; remove the Google Fonts `@import`. Fallbacks: sans `system-ui, "Segoe UI", sans-serif`; mono `ui-monospace, "Cascadia Mono", Consolas, monospace`. Replace every hardcoded `'JetBrains Mono'`, `'Space Grotesk'`, `'Inter'` (e.g. in `StatusBadge.jsx`, `dashboard/components/feature-page.css`). Body `font-weight: 400` (currently 500 globally).

- [x] **2.5 [SYS] Text rules in base CSS.**
  - `text-wrap: balance` on h1–h3 and short titles ✅
  - `text-wrap: pretty` on descriptions, banners, empty-state text ✅
  - `font-variant-numeric: tabular-nums` on every number that updates ✅
  - `overflow-wrap: anywhere` on IDs, paths and user content ✅ (via stat tile fix)
  - `touch-action: manipulation` on interactive controls ✅

- [ ] **2.6 [SYS] Radius tokens:** `4` (badges, chips, inline code) · `8` (buttons, inputs, selects, small panels) · `12` (cards, dialogs, toasts) · `999` (pills, dots, toggles). Migrate: buttons 0 → 8, cards 16 → 12, controls at 4 → 8, 2 px → 4, 10 px → 8 or 12 by context. Remove legacy `radius.md/sm/lg` aliases after migration.

- [ ] **2.7 [SYS] Spacing tokens:** `4 / 8 / 12 / 16 / 24 / 32 / 48`. Apply to every component touched in later phases; **do not** blanket-regex the codebase. Record remaining off-grid values (3, 5, 7, 9, 10, 11, …) in `PROGRESS.md`.

- [ ] **2.8 [SYS] z-index scale:** `0 / 10 (raised) / 20 (sticky header, sidebar) / 40 (mobile drawer + scrim) / 100 (dialog) / 1000 (toast)`. Map the existing values (19, 20, 40, 45, 50, 300, 9998, 9999) to this scale.

- [ ] **2.9 [SYS] Motion tokens:** fast 100 ms (press/hover), base 160 ms, enter 220 ms, exit 150 ms. One easing for entering (`cubic-bezier(0.22, 1, 0.36, 1)`), `ease-in` for leaving. **Remove the overshoot curve** `cubic-bezier(0.34, 1.15, 0.64, 1)` (used in `motion.transition`, Sidebar, Login). Interactive state changes use CSS transitions with explicit properties; keyframes only for spinner, pulse, enter. Keep the global `prefers-reduced-motion` block.

- [ ] **2.10 [SYS] Elevation:** two levels only: `flat` and `overlay` (dialogs, toasts, menus). Delete `shadow.press`, `shadow.lift`, `shadow.small` (hard-offset/legacy). Cards separate with borders and surface steps, not shadows.

- [x] **2.11 [A11Y]** Base focus ring: 2 px solid white, offset 2 px, on every focusable element; add `scroll-padding-top` equal to the sticky header height so focus is never hidden behind it; `:focus-visible` only.

**Done when:** tokens file is the single source; the app renders with the new palette/fonts; lint, tests, build green; contrast script (6.5) passes.

---

## Phase 3: Shared components

- [ ] **3.1 [SYS] `Button` (`src/components/ui/primitives.jsx` or new `Button.jsx`).** Keep the existing props (`variant`, `style`, `disabled`, `onClick`, `type`, `...rest`) so call sites don't break. Rebuild with CSS classes:
  - Variants: `primary` (white fill, black text), `secondary` (outline), `ghost`, `danger` (quiet: neutral until hover, then danger tint), `danger-solid` (only for the confirm button in `ConfirmDialog`)
  - Sizes: `md` (40 px) and `sm` (32 px visual, 40 px hit area via `::after`)
  - States in CSS only: hover inside `@media (hover: hover)`, `:active { transform: scale(0.97) }`, `:focus-visible`, `:disabled` (D1/1.9)
  - `transition-property: background-color, border-color, color, transform`
  - Font: sans 14 px/500, sentence case
  - Add `loading` (`aria-busy`, spinner, ignores clicks)
  - **Delete** the magnetic GSAP hover, `onMouseEnter/Leave/Down/Up` style mutation, and hard-offset shadows. One primary per screen.

- [ ] **3.2 [SYS][A11Y] `IconButton`:** requires `aria-label` (dev-time `console.warn` if missing), 40 px hit area, icon 16 or 20. Replace all unlabeled icon buttons (Game Manager add/reload/delete at 30×30, Sunshine unpair, log toolbar).

- [ ] **3.3 [SYS][A11Y] Form controls.** Shared `.field` styles:
  - Visible label above, optional helper text
  - Error text linked with `aria-describedby` + `aria-invalid`
  - `--color-border-control` border, focus via CSS
  - **Remove JS `onFocus/onBlur` style mutation** (`grep -rn "onFocus={(e"` — Login inputs and others)
  - Number inputs: hide native spinners, keep `min/max`, add `inputMode="numeric"`
  - Inputs 16 px at ≤ 768 px
  - Mark required fields
  - Password fields get a show/hide toggle (Login, Create user, Change password); never block paste; keep `autoComplete` values

- [ ] **3.4 [SYS][A11Y] Toggle:** `role="switch"` + `aria-checked`; off state clearly visible (control border + dim thumb), on state white track + black thumb; label in sans (not mono); whole row is the hit area (≥ 44 px on touch).

- [ ] **3.5 [SYS] Status map + `StatusBadge`/`Chip` (D3).** New `src/dashboard/status.js` mapping state → tone + label. Badges: 12 px, sentence case ("Completed"), dot + text, tinted fill, **non-interactive look** (no button-like outlined box, `cursor: default`). Pulse only for in-progress states, via the global keyframe. Use this map in Home event stream, History, Analytics, Host Monitor, Recovery, Sunshine, Logs.

- [ ] **3.6 [SYS] `Card` / `SectionCard` (`src/dashboard/components/SectionCard.jsx`).** Radius 12; border on the outermost container only; inner groups use L1/L2 fill + spacing, no extra borders. Remove hover lift (`translateY(-1px)`) except on genuinely clickable cards. Header title 20 px/600, no eyebrow, no duplicated page title.

- [ ] **3.7 [SYS] `StatCard`** replaces the three stat-tile variants (Analytics/History/Logs, Users, Home rail): label (12 px faint) above value (28 px, tabular, sans), optional unit/sub-line. No boxed icon wells.

- [ ] **3.8 [SYS] `KeyValueRow`** for label/value rows (Host Monitor, Recovery, Sunshine, Game card metadata). Consistent row height; actions right-aligned.

- [ ] **3.9 [SYS][A11Y] `DataTable`:** real `<table>`, `<th scope="col">`, right-aligned numerics with tabular-nums, optional expandable rows (`aria-expanded`), wrapped in an `overflow-x: auto` container with `tabIndex={0}` and `aria-label` so the page itself never scrolls sideways. Replaces the div grids in Users, History, Analytics, Sunshine stream history. Add `aria-sort` only if sorting is actually added (not required now).

- [ ] **3.10 [SYS] `PageHeader` (`src/dashboard/components/PageHeader.jsx`).** No `Eyebrow`; title 28 px/600; subtitle 14 px faint; Back per D5. Expose how the page was reached from `useRoute` (`navigate(route, { via: "link" })`).

- [ ] **3.11 [SYS] Icons:** lucide-react only, one stroke width (1.75), sizes 16 inline / 20 nav and headers. Decorative icons beside text get `aria-hidden="true"`. Remove decorative boxed icon wells in card headers (keep `EmptyState` icon, unboxed).

- [ ] **3.12 [SYS] `ConfirmDialog`, `Toast`, `EmptyState`, `LoadingState`** (`src/components/ui/ConfirmDialog.jsx`, `Toast.jsx`, `src/dashboard/components/EmptyState.jsx`, `LoadingState.jsx`). Tokens only (radius 12, type, colours, exit 150 ms). **Do not change `ConfirmDialog` focus-trap logic.** Empty states say what to do next. Loading states longer than 1 s use a skeleton or labelled spinner, not a bare spinner.

**Done when:** no page still defines its own button/stat-tile/badge/table styling; axe `button-name`, `label`, `scope-attr-valid`, `th-has-data-cells` clean; hit-area check (6.4) passes.

---

## Phase 4: Shell and pages

### Shell

- [ ] **4.1 [PAGE][COPY] Header** (`src/dashboard/layout/DashboardHeader.jsx`, `MobileHeader.jsx`). "PCGO" wordmark + sentence-case subtitle ("Host console" / "Player console"). Show Live/Offline only (announced politely when it changes). Drop the per-tick `SYNC hh:mm:ss`. Show username once; show the role as a small badge only when it adds information (never `ADMIN · ADMIN`). Mobile header uses the same name.

- [ ] **4.2 [PAGE][A11Y] Sidebar** (`src/dashboard/layout/Sidebar.jsx`). Group headings:
  - *Operate* (Home, Host monitor, Recovery, Sunshine)
  - *Configure* (Game manager, User management, Settings)
  - *Records* (Analytics, Session history, Logs)

  Rows ≥ 44 px on touch. **One** active signal (fill or left bar), `aria-current="page"`. Replace the GSAP floating pill with a CSS `transform` transition or drop it. Remove the caps "CONTROL PLANE" label. Icons same size and stroke.

- [ ] **4.3 [A11Y] Route changes.** Add a skip link ("Skip to main content"); on route change move focus to the page `<h1>` (`tabIndex={-1}`) without scroll jump.

### Pages

- [ ] **4.4 Login** (`src/pages/Login.jsx`) (D9). Centred card; wordmark; one-line description; real labels; show/hide password; no eyebrow, hero, pills, footer arrow, GSAP timeline or `main {…!important}` global selector. One CSS fade-in (opacity only, ≤ 220 ms). Keep placeholders, button names and error text (tests).

- [ ] **4.5 Home** (`src/dashboard/pages/Home.jsx`) (D8). One heading = host-state readout (`HostStateReadout` component: large state word, live dot, one-line reason). Remove the triple "Start a new session / Ready to launch / Launch a Session". Pulse rail → three `StatCard`s that wrap, no 3-colour top rule. Alerts in a contained banner aligned to the content edge, with a link to Host monitor. Event stream grouped by session: ID shown once, relative time with full timestamp in `title`, `white-space: nowrap` for times. "Browse game library" → `ghost`/`sm`, not a full-width outline button. Remove tile stagger.

- [ ] **4.6 Host Monitor** (`src/dashboard/pages/HostMonitorPage.jsx`). Reuse `HostStateReadout`; say "Ready" once (currently ×4). If health is "Warning", show **which check** is warning, using the field the API actually returns; if none exists, link to Recovery and do not invent a reason. Status badge must not look like a button. Consistent `KeyValueRow` rhythm. Dates via one `formatDateTime()` helper. Accent edge only on state banners (one rule), remove random white top/left strokes.

- [ ] **4.7 Recovery** (`src/dashboard/pages/RecoveryPage.jsx`). Max two nesting levels; largest numbers are the headline stats; remove pills that repeat the title; "Show details" becomes a small disclosure button with `aria-expanded`; equal-height channel cards; relative time or count when timestamps are identical.

- [ ] **4.8 Sunshine** (`src/dashboard/pages/SunshinePage.jsx`). "Unpair all" and other destructive actions use quiet `danger` + `ConfirmDialog`; paired client shows name + short ID with a labelled Unpair button (or tooltip + `aria-label`); operational status stated once; stream history as `DataTable` (repeated "Desktop" collapses into a column); duration is plain text, not button-styled.

- [ ] **4.9 Game Manager** (`src/dashboard/pages/GameManagerPage.jsx`). Labelled "Add game" button; Delete as `IconButton` with `aria-label` in danger-quiet style; one Back control in the form; flatten form nesting; placeholder is clearly different from a value; ID/EXE/process as `KeyValueRow` at 12 px mono.

- [ ] **4.10 User management** (`src/dashboard/pages/UserManagementPage.jsx`). `StatCard`s; `DataTable`; Remove is quiet `danger` + confirm; role options "Standard user" / "Admin" (no em-dash labels); labels + show/hide password in Create user.

- [ ] **4.11 Analytics** (`src/dashboard/pages/AnalyticsPage.jsx`). Lead with success rate and total play time, remaining metrics as a `KeyValueRow` list; breakdowns as `DataTable` with right-aligned `formatDuration`; plural fix; explain the "Reliability: Warning" rule using the logic that computes it; rename nav item "Usage trends" to match the page (or add a trend visual, only with the owner's OK); remove count-up animation.

- [ ] **4.12 Session history** (`src/dashboard/pages/SessionHistoryPage.jsx`). Remove the repeated title/eyebrow; `DataTable` (game, user, started, duration, status) with expandable details; show "Save integrity" only when not verified, and in expanded details.

- [ ] **4.13 Logs** (`src/dashboard/pages/LogsPage.jsx`). Level shown once; toolbar buttons labelled by outcome (read the handlers; say what "Download" and "Export" each produce); filters sentence case ("All levels"); hit areas ≥ 40 px.

- [ ] **4.14 Settings** (`src/dashboard/pages/SettingsPage.jsx`). Merge "Account access" and "Operational evidence" into one short links list; plain banner ("Host settings"); keep "Applies on save" hints.

- [ ] **4.15 Change password** (`src/dashboard/pages/ChangePasswordPage.jsx`). Real labels, show/hide, live requirement list (`aria-live="polite"`), single `<main>`.

- [ ] **4.16 404** (`src/dashboard/pages/NotFoundPage.jsx`). "Page not found", the requested path, and a "Go to Home" button.

- [ ] **4.17 User dashboard** (`src/dashboard/UserDashboard.jsx`). Confirm the same components apply on the user routes (Home, History, Analytics, Logs, Change password); no admin-only styling leaks.

**Done when:** every page uses only shared components; `Eyebrow`, `monoLabel`, `typeScale.meta` have zero references.

---

## Phase 5: Motion, copy, cleanup

- [ ] **5.1 [CLEAN] Remove Lenis:** `src/lib/motion/lenisSetup.js`, its use in `MainContent.jsx` and `Login.jsx`, and the dependency. Native scroll; keep the main-content scroll container.

- [ ] **5.2 [CLEAN] Remove GSAP + ScrollTrigger (D4):**
  - Button magnetic hover
  - `BrandMark.jsx` idle bars (make static, or animate only while a session is running via CSS)
  - Count-ups in `DashboardStats.jsx` and `SessionAnalytics.jsx`
  - `ScrollTrigger.batch` row reveals in `SessionHistory.jsx` / `SessionAnalytics.jsx`
  - Home tile stagger
  - Sidebar pill (`Sidebar.jsx`)
  - Login timeline (`Login.jsx`)
  - `ScrollTrigger.refresh()` calls in `AdminDashboard.jsx` / `UserDashboard.jsx`
  - Delete unused files under `src/lib/motion/` (`gsapSetup.js`, `scrollContainerContext.jsx` if unused post-Lenis)
  - `npm uninstall gsap lenis`
  - Update tests and stubs that referenced them

- [ ] **5.3** Route-change transition: opacity only, ≤ 160 ms, or none. No slide-up entrances on sections or cards.

- [ ] **5.4 [COPY] Copy pass.** Rules: user's point of view, plain verbs, sentence case, one name per action across button, toast and history. Errors state cause and fix, without apology. Empty states name the next action.

  Strings to rewrite:
  - "Interpretation layer"
  - "Authoritative record"
  - "Operational evidence"
  - "returned by the history service"
  - "matching current client validation"
  - "existing server contract"
  - "Live System Pulse"
  - "Control Plane"
  - "Configure the host. Know what changes."

  Page subtitles (verify each against the page's real behaviour before using):

  | Page | Subtitle |
  |---|---|
  | Host monitor | Check that the host is ready to serve sessions. |
  | Recovery | What the host fixed on its own, and what it couldn't. |
  | Sunshine | Streaming status, paired devices, and past streams. |
  | Game manager | Add, edit, and remove the games players can launch. |
  | User management | Create accounts and control who can sign in. |
  | Analytics | How sessions are going: success rate, play time, top games. |
  | Session history | Every finished session and how it ended. |
  | Logs | Host activity and errors. |
  | Settings | Host and app settings. |
  | Change password | Choose a new password for your account. |

- [ ] **5.5 [CLEAN] Dead code and comments:** delete unused exports (`Squiggle`, `Eyebrow`, `monoLabel`, `typeScale.meta`, legacy `radius` aliases, `colors.accentLilac/Pink` leftovers), unused CSS classes in `feature-page.css` (grep each class before deleting), and comments that narrate change history ("P4-T01", "zero-visual-change substitution", "TCB-P3", "per DESIGN.md §…"). Targets: `!important` ≤ 10 (reduced-motion and utilities only), `transition: all` = 0, `uppercase` = 0.

**Done when:** `package.json` no longer lists `gsap`, `lenis`, `react-icons`; app has no scroll-hijacking; copy table applied.

---

## Phase 6: Verification and docs

- [ ] **6.1** `npm run lint`, `npm test`, `npm run build` all green. Update tests only where a change was intentional and documented.

- [ ] **6.2 axe:** run axe-core (WCAG 2.0/2.1/2.2 A + AA + best-practice) on all 12 routes at 1440 px and 390 px. **0 serious/critical violations.** (Use Playwright with `npx`; do not add dependencies without asking.)

- [ ] **6.3 Visual:** re-run `qa/render.mjs` into `qa/output-after/` at 1440, 1024, 768, 390, 360 and landscape 844×390. No horizontal page scroll. Check normal, empty, error, long-content and loading states. Compare with `qa/output-before/`.

- [ ] **6.4 Interaction:** keyboard-only pass (tab order matches visual order, focus ring always visible and never under the sticky header, Esc closes dialogs and the mobile drawer, skip link works, focus lands on `<h1>` after navigation). Programmatically assert every interactive element has a ≥ 40×40 hit area (≥ 44 on `pointer: coarse`) and ≥ 8 px gap to neighbours. Verify with `prefers-reduced-motion: reduce` and 200 % browser zoom.

- [ ] **6.5 Contrast script** (committed under `qa/`): checks every text/surface token pair incl. hover (L4) ≥ 4.5:1, control borders ≥ 3:1, status colours ≥ 4.5:1 on L3, disabled label legible.

- [ ] **6.6 Metrics** (compare with Phase 0.3):
  - Font sizes < 12 = 0
  - `uppercase` = 0
  - References to Space Grotesk / Inter / JetBrains Mono = 0
  - Distinct radius values ⊆ {4, 8, 12, 50%, 999}
  - Distinct z-index values ⊆ scale
  - `<table>` ≥ 4
  - Every `<input>` has a label
  - `!important` ≤ 10

- [ ] **6.7** Rewrite `.ai/design/DESIGN.md` as the single source of truth for what actually shipped (≤ 150 lines: tokens, type roles, status map, component list, rules). Remove "Tactical Console Brutalism", the six-theme material and the superseded decision log references.

- [ ] **6.8** Regenerate `assets/screenshots/` from the harness (the README screenshots are stale).

- [ ] **6.9** Final report in `frontend/PROGRESS.md` in this form, listing only things that changed:

  | Principle | Before | After | Files |
  |---|---|---|---|

---

## Pre-delivery checks (from the UI/UX rules)

- [ ] Tested at 375 px and landscape; large text and reduced motion verified
- [ ] No emoji as icons; one icon family (lucide-react), one stroke width (1.75)
- [ ] Pressed state does not shift layout
- [ ] Every interactive element has a pressed/hover/focus/disabled state in CSS
- [ ] Status never relies on colour alone (label text always present)
- [ ] Decorative icons `aria-hidden`; icon controls have accessible names
- [ ] Forms: visible labels, inline errors tied to fields, helper text, paste allowed
- [ ] No sticky UI hides keyboard focus
- [ ] Muted/secondary text ≥ 4.5:1 on its real surface (including hover)
- [ ] One primary action per screen

---

## File map (quick reference)

| Area | Key files |
|---|---|
| Entry | `frontend/index.html`, `src/main.jsx`, `src/App.jsx` |
| Tokens | `src/dashboard/theme.js` → `src/styles/tokens.css` + `src/styles/base.css` |
| Global style | `src/styles/base.css` (target); currently scattered in `App.jsx` |
| Shell | `src/dashboard/layout/DashboardHeader.jsx`, `Sidebar.jsx`, `MainContent.jsx`, `MobileHeader.jsx` |
| UI primitives | `src/components/ui/primitives.jsx`, `ConfirmDialog.jsx`, `Toast.jsx`, `BrandMark.jsx`, `Eyebrow.jsx` (→ delete) |
| Shared dashboard | `src/dashboard/components/SectionCard.jsx`, `PageHeader.jsx`, `EmptyState.jsx`, `LoadingState.jsx`, `DashboardStats.jsx`, `feature-page.css` |
| Status | `src/components/StatusBadge.jsx` → new `src/dashboard/status.js` |
| Motion (to remove) | `src/lib/motion/gsapSetup.js`, `lenisSetup.js`, `scrollContainerContext.jsx` |
| Pages | `src/dashboard/pages/*.jsx`, `src/pages/Login.jsx` |
| Components | `src/components/*.jsx` |
| Tests | `src/**/*.test.jsx`, `src/test/` |
| QA harness | `frontend/qa/render.mjs`, `qa/output-before/`, `qa/output-after/` |
| Deps to remove | `gsap`, `lenis`, `react-icons` |
| Deps to add | `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono` |
