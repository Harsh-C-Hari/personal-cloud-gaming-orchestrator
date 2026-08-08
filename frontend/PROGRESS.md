# UI/UX Audit Progress Log

Working copy: /home/claude/work/frontend-FINAL/frontend
Environment note: no network access / no node_modules in this sandbox, so
`npm install`, `npm run build`, and `npm test` could NOT be executed here.
All fixes were made via careful manual code review. User should run
`npm install && npm run build && npm test` locally before deploying.

## Files completed (audited + fixed)
- dashboard/layout/dashboard-shell.css — 100dvh root height fix, safe-area
  insets, narrow-width (<360px) title truncation, landscape shrink,
  .pcgo-2col / .pcgo-scroll-x shared utility classes
- dashboard/layout/DashboardLayout.jsx, DashboardHeader.jsx, MobileHeader.jsx,
  MainContent.jsx — touch targets, overflow guards, clamp() padding
- components/ui/primitives.jsx (Button) — 44px min touch target
- components/ui/ConfirmDialog.jsx — max-height/scroll, 44px buttons
- components/ui/Toast.jsx — fixed viewport-overflow bug on ~320-355px
  screens, larger dismiss hit-area, safe-area insets
- components/StatusBadge.jsx — reviewed, no changes needed
- dashboard/pages/Home.jsx — reviewed, already responsive (auto-fill grid)
- dashboard/components/DashboardStats.jsx — repeat(N,1fr) -> auto-fit grid
- dashboard/components/SectionCard.jsx — flexWrap on shared header row
  (used by many pages — high leverage)
- components/SettingsPanel.jsx — FieldGroup -> .pcgo-2col; ToggleSwitch
  touch target
- components/HostStatusPanel.jsx — reviewed, already has solid responsive
  handling (hsp-grid media query) from prior pass, no changes needed
- components/RecoveryStats.jsx — 2-col stat grid -> .pcgo-2col
- components/StartSessionForm.jsx — Duration/Warning grid -> .pcgo-2col;
  Skip Timer toggle touch target; reviewed rest of file (launch button
  area, save browser section, header) — already responsive
- components/SunshineClientManager.jsx, UserPanel.jsx, GameManager.jsx —
  shared headerBar/sectionHeadRow/cardHeaderRow/cardHeader style consts
  (copy-pasted across these 3 files) patched with flexWrap consistently
- components/GameLibrary.jsx, RecoveryEvents.jsx, EventLog.jsx,
  SunshineStreamHistory.jsx — flexWrap on header/card rows
- components/SessionHistory.jsx, SessionAnalytics.jsx — title+refresh
  header row flexWrap fix (real overflow risk at 320-375px, confirmed by
  width math), refresh button flexShrink
- components/SessionCard.jsx — Restart/Stop button row: minWidth:0 +
  ellipsis fallback so button text can't visually spill at extreme
  narrow widths; reviewed rest of card, safe. Cross-checked against
  SessionCard.test.jsx selectors (role=button name=/stop session/i etc.)
  — untouched, still valid.
- dashboard/components/NavigationCard.jsx, SessionSidebar.jsx — reviewed,
  already fine / already had flexWrap
- dashboard/pages/SettingsPage.jsx — LinkRow: minWidth:0 + flexShrink:0
  chevron
- dashboard/pages/ChangePasswordPage.jsx, HostMonitorPage.jsx,
  RecoveryPage.jsx — reviewed, already responsive
- dashboard/pages/NotFoundPage.jsx — long-path <code> wordBreak fix
- pages/Login.jsx — 100vh -> minHeight:100vh + overflowY:auto + safe-area
  (mobile-keyboard-open clipping fix); cross-checked Login.test.jsx
  selectors (placeholder/role text) — untouched, still valid
- components/LogPanel.jsx — spot-checked (already has its own
  compactMode/window-resize responsive logic + wrapping log lines from
  prior redesign pass); NOT a full line-by-line audit

## Not yet started / not fully audited
- components/GameManager.jsx, SunshineClientManager.jsx, UserPanel.jsx —
  only the shared header-row consts patched; the large body/card-grid
  content of these 3 big files (36K/28K/28K) not yet fully read
- components/SunshineStreamCard.jsx
- dashboard/hooks/*, dashboard/utils/* (logic only, but worth a quick
  scan for any inline style returns)
- Full keyboard-navigation tab-order pass
- Full color-contrast audit (spec's flat palette was contrast-checked
  during the prior redesign per DESIGN_SYSTEM.md; not independently
  re-verified here)
- App.jsx / global CSS (badge-pulse keyframes etc.) — not reviewed

## Additional review pass (this session)
- App.jsx — global body CSS: added `min-height: 100dvh` alongside the
  100vh fallback (same mobile-chrome issue as the shell)
- pages/Login.jsx — refined the earlier fix: changed to `height: 100vh`
  (fixed, not min-height) + `overflowY: auto` so the page can actually
  scroll internally if content + mobile keyboard don't fit — body has a
  global `overflow: hidden`, so min-height alone would NOT have been
  scrollable; this was corrected
- components/SunshineStreamCard.jsx — reviewed, already has excellent
  built-in responsive handling (label/value stacking under 560px)
- components/GameManager.jsx, SunshineClientManager.jsx, UserPanel.jsx —
  confirmed their main card grids already use
  `repeat(auto-fill, minmax(220-230px, 1fr))` (fully responsive); no
  modals/dialogs in these files to worry about; no other fixed 2-col
  grids found
- components/HostStatusPanel.jsx — double-checked the 2 space-between
  rows not caught by the earlier grep pass; both already covered by the
  file's own `.hsp-header` / `.hsp-header-badges` media query
- components/EventLog.jsx — reviewed rest of file (event row rendering),
  fine as-is

## Not yet started / not fully audited
- Full line-by-line audit of GameManager.jsx / SunshineClientManager.jsx /
  UserPanel.jsx card bodies (1000/820/830 lines) — grids and modals
  checked and clean, but not every inline style read
- dashboard/hooks/*, dashboard/utils/* — logic only, quick scan not done
- Full keyboard tab-order pass
- Full color-contrast re-audit (spec was contrast-checked during the
  prior redesign; not independently re-verified here)
- Landscape-mode and foldable-specific manual testing (can't render a
  browser in this sandbox — all fixes are code-reasoned, not visually
  verified)

NOTE ON SCOPE: this is a ~30-file, 700KB React codebase. A full literal
line-by-line re-audit of every component at all 15 breakpoints in one
sitting is not realistic to do reliably. Working top-down by impact:
shell/nav/dialogs (done), title+action header rows app-wide (done — this
was a real recurring bug, confirmed by width math on several), remaining
large panel bodies (spot-checked and found already solid). See chat for
an honest status of what got full treatment vs. spot-checked.

## Pass 3 (this session) — short targeted list, 6 items

Environment note (unchanged): still no network access / no node_modules
in this sandbox. `npm install`, `npm run build`, `npm test`, `npm run
lint` could NOT be run. All fixes are manual, careful code review —
verify locally with `npm install && npm run build && npm test && npm run
lint` before deploying. Node itself (v22) is present but useless here
without the JSX-aware toolchain (no bundler/babel/vitest installed), so
no meaningful syntax check was possible beyond manual re-reading of
every diff.

1. **components/LogPanel.jsx** — `logContainer` had a fixed `height:
   "600px"`. On a short viewport (landscape phone ~360-420px tall, or a
   small laptop window) that's taller than the whole page, forcing an
   internal-scrollbar-vs-page-scroll fight. Changed to
   `minHeight: "200px"` / `maxHeight: "min(600px, 65dvh)"` — caps at
   600px normally, shrinks proportionally on short viewports, keeps a
   200px floor so it's never unusably small. Matches the `min(85vh,
   85dvh)` pattern already used in ConfirmDialog.jsx.

2. **dashboard/components/SessionSidebar.jsx** — same issue, `height:
   "260px"` list container. Changed to `minHeight: "140px"` / `maxHeight:
   "min(260px, 40dvh)"`. Confirmed the child (`EventLog.jsx`) already
   uses `height: 100%` + its own internal `flex:1 / minHeight:0 /
   overflowY:auto` scroll region, so the fix cascades correctly with no
   further changes needed there.

3. **Grid minmax() edge-case audit at 320px** — did real padding-stack
   math (MainContent responsive horizontal padding + wrapper border +
   body padding + any nested Card padding/border) for each, rather than
   eyeballing it:
   - `SessionAnalytics.jsx` `minmax(260px,...)` — available width at
     320px ≈ 251px → **260px genuinely doesn't fit, single column
     breaks.** Reduced to `220px`.
   - `UserPanel.jsx` `minmax(230px,...)` — nesting is deeper than it
     looks (outerWrap border → body padding 20px → *nested* `Card`
     padding 16px + border) → available width ≈ 216px → **230px doesn't
     fit either.** Reduced to `200px`.
   - `SunshineClientManager.jsx` `minmax(230px,...)` — same structural
     pattern as UserPanel (`cardSection` 16px padding, not the shared
     `Card` primitive, but same net result) → available width ≈ 216px →
     reduced to `200px`.
   - `GameManager.jsx` `minmax(220px,...)` — available width ≈ 251px →
     fits, **no change.**
   - `GameLibrary.jsx` `minmax(220px,...)` (used inside
     StartSessionForm's "Browse Game Library" panel) — available width
     ≈ 251px → fits, **no change.**

4. **Icon-only button audit — full pass, all `<button>` elements in
   `components/` and `dashboard/` (57 total), not just a sample.**
   Cross-checked every one against the icon-vs-text-child rule. Found 4
   with a `title` but no matching `aria-label` (breaking the existing
   title+aria-label convention used everywhere else in the codebase):
   - `SettingsPanel.jsx` — "Select Sunshine executable" file-picker button
   - `SettingsPanel.jsx` — "Select Tailscale IPN executable" file-picker button
   - `GameManager.jsx` — "Select executable" file-picker button
   - `GameManager.jsx` — "Select save folder" file-picker button

   All 4 fixed by adding the matching `aria-label`. Every other
   icon-only button already had a correct aria-label (or renders visible
   text and was correctly left alone).

5. **Full read-through of GameManager.jsx, SunshineClientManager.jsx,
   UserPanel.jsx** (1033 / 821 / 830 lines respectively) — every line,
   not just grids/modals this time:
   - `SunshineClientManager.jsx` and `UserPanel.jsx`: clean. All header
     rows, status rows, and card-header rows already have
     `flexWrap`/`minWidth:0`/`flexShrink:0` from prior passes; the
     pairing/create-user forms are single-column and don't have
     row-overflow risk.
   - `GameManager.jsx`: found one real gap — the Executable Path / Save
     Path rows (`pathRow`) pair a `flex:1` text input against a fixed
     40px picker button, but the input had no `minWidth: 0`. Text
     `<input>` elements have a non-zero default intrinsic minimum width
     in flexbox, so without `minWidth: 0` a flex:1 input can refuse to
     shrink below that floor and push the picker button out of the row
     on narrow screens — this is right at the edge at 320px given the
     card's padding stack (≈216px available for the row). Added
     `minWidth: 0` to both inputs. (Same `...inputStyle, flex: 1`
     pattern exists in SettingsPanel.jsx too, but that file wasn't in
     this pass's scope — flagging for a future pass.)
   - Everything else in all three files (form actions rows, validation
     banners, card grids, delete buttons) already correct from prior
     passes.

6. **dashboard/hooks/*, dashboard/utils/* — scanned as requested.**
   `useHashRoute.js`, `useRoute.js`, `adaptUserHostStatus.js`,
   `logout.js`, `alerts.js` — confirmed pure logic, zero JSX, zero
   inline styles, zero className usage in any of the 5 files. No
   changes made, none needed.

## Not yet started / not fully audited (carried forward, unchanged)
- ~~`components/SettingsPanel.jsx` has the same `flex:1` input without
  `minWidth:0` pattern found and fixed in GameManager.jsx this pass~~ —
  **fixed in a follow-up pass** (both the Sunshine Path and Tailscale IPN
  Path inputs at lines ~645/736 now have `minWidth: 0` added alongside
  `flex: 1`, matching the GameManager fix exactly). Verified with a real
  `npm run build` / `npm run test` (21/21 pass) / `npm run lint` (only the
  same 2 pre-existing warnings) — network access was available for this
  verification pass, unlike prior passes in this file.
- Full keyboard tab-order pass
- Full color-contrast re-audit
- Landscape-mode / foldable manual visual testing (no browser in this
  sandbox — every fix here is code-reasoned and math-checked against
  real padding stacks, not visually verified in an actual viewport)
- npm install/build/test/lint: still not runnable in this sandbox
  (confirmed again this pass — `registry.npmjs.org` not in the egress
  allowlist, and no node_modules present locally either). User must run
  `npm install && npm run build && npm test && npm run lint` locally.

## Pass 4 (this session) — brand accent rebrand (blue → amber)

Per DESIGN_SYSTEM.md §1a: `accentBlue` had quietly become the app's default
"this needs a color" choice everywhere, recreating the exact single-blue-
identity problem the redesign was meant to fix. Added a dedicated `brand`
token (`#E0A458` amber) and reclassified every `accentBlue`/`accentBlueDim`
(and checked for legacy `colors.accent`/`colors.accentDim`) call site
file-by-file: branding/decorative-default uses → `brand`/`brandDim`;
uses that specifically encode "informational status" (as opposed to
success/warning/danger) → left on `accentBlue`/`info`.

Network access was available this pass — ran a real `npm install`,
`npm run build`, `npm test`, and `npm run lint` at the end (see results
below), not just manual review.

### Files changed
- **dashboard/theme.js** — added `brand: "#E0A458"` / `brandDim:
  "rgba(224,164,88,0.14)"` tokens (§1a). No other tokens touched; legacy
  `accent`/`accentDim` aliases still point at `accentBlue` on purpose —
  nothing imports them anymore after this pass, but they're left in place
  as documented back-compat aliases per the file's existing header comment.
- **pages/Login.jsx** — logo bars + "ORCHESTRATOR" wordmark → `brand`.
  Kept the "No admin account detected" bootstrap notice on `accentBlue`
  (genuine informational banner, has an `Info` icon and literally means
  "neutral info").
- **dashboard/layout/DashboardHeader.jsx** — logo bars, full wordmark
  ("ORCHESTRATOR"), and short wordmark ("CGO") → `brand`. No accentBlue
  left in this file.
- **dashboard/components/SessionSidebar.jsx** — "Total" stat tint (a plain
  count, not a status) + "Recent Events" section icon badge → `brand`.
- **dashboard/components/DashboardStats.jsx** — default tile tint fallback
  (used when no caller passes an explicit semantic color) → `brand`.
- **dashboard/components/LoadingState.jsx** — loading pulse dot → `brand`.
- **dashboard/pages/ChangePasswordPage.jsx** — card header icon badge → `brand`.
- **components/ui/ConfirmDialog.jsx** — non-danger confirm icon badge
  (question-mark icon, plain "not a destructive confirm" default, not an
  info status) → `brand`.
- **components/SettingsPanel.jsx** — generic `SectionHeader` icon badge,
  `ToggleSwitch` on-state (track + knob), both file-picker buttons
  (Sunshine path / Tailscale IPN path) + their hover handlers → `brand`.
  No accentBlue left in this file.
- **components/SunshineClientManager.jsx** — header icon badge, ghost
  icon-button color, sub-section icon badge, loading pulse dot, per-client
  avatar badge → `brand`. **Kept** the "Streaming: {app}" `StatusPill`
  tone on `accentBlue` — a genuinely distinct live-state status, not just
  a default color.
- **components/UserPanel.jsx** — reload-button hover background, non-admin
  user avatar badge (admin stays yellow, "user" role recolored — this is a
  role-distinguishing decorative pair, not an info/success/danger signal),
  header icon badge, ghost icon-button, sub-section icon badge → `brand`.
  No accentBlue left.
- **components/HostStatusPanel.jsx** — "Checking host..." loading pulse,
  generic `SectionCard` icon color, header icon badge, "updating" pulse
  text → `brand`. No accentBlue left.
- **components/LogPanel.jsx** — "Entries Loaded" stat tile tone (plain
  count, unlike the semantic WARNINGS tile beside it), log search-match
  highlight, header icon badge, floating scroll-to-bottom button icon →
  `brand`. No accentBlue left.
- **components/SunshineStreamHistory.jsx** — header icon badge, loading
  pulse, per-stream-card left border + film icon + duration/"STREAM" pill,
  "show all" hover color → `brand`. No accentBlue left.
- **components/RecoveryStats.jsx** — loading pulse, header icon badge →
  `brand`. (The actual stat tones — Sunshine/Tailscale Recoveries=success,
  Failures=danger — were already correct and untouched.)
- **components/RecoveryEvents.jsx** — loading pulse, header icon badge →
  `brand`. **Kept** `eventVisual()`'s default case (`Info` icon, used for
  any recovery-event type that isn't success/failed/attempt) on
  `accentBlue` — this is exactly the "genuinely informational, not
  success/warning/danger" case the design doc calls out.
- **components/GameLibrary.jsx** — selected-card background + selected
  checkmark color → `brand` (selection highlight, not a status).
- **components/GameManager.jsx** — header icon badge → `brand`. No
  accentBlue left.
- **components/SessionAnalytics.jsx** — `StatTile` default `tone` prop,
  `getReliabilityColor()`'s "Good" tier (a 4-step rating scale —
  Excellent/Good/Warning/danger-default — where "Good" doesn't specifically
  mean "informational", it's just the 2nd rung of a quality gradient),
  "Total Sessions"/"Total Played Duration"/"Avg Playtime" stat tiles (plain
  counts, unlike the Successful/Failed/Recovered tiles beside them which
  correctly stayed success/danger/warning), header icon badge, leaderboard
  rank badge → `brand`. No accentBlue left.
- **components/StartSessionForm.jsx** — card header icon badge, "Skip
  Timer" toggle switch (track + knob) → `brand`. No accentBlue left.
- **components/SessionHistory.jsx** — per-row game icon color, header icon
  badge, stat-tile icon badge (plain total count) → `brand`. No accentBlue
  left.

### Deliberately left on `accentBlue`/`info` (genuine semantic use)
- `components/ui/Toast.jsx` — the `info` toast tone itself.
- `components/ui/primitives.jsx` — the generic `blue` entry in the shared
  tone-token map (lilac/pink/blue/green/yellow); this is a palette the
  design system explicitly keeps as a full 5-hue set for tags/badges, not
  a branding decision.
- `components/SunshineClientManager.jsx` — "Streaming: {app}" status pill.
- `components/RecoveryEvents.jsx` — `eventVisual()` default/"info" event
  type.
- `pages/Login.jsx` — bootstrap "No admin account detected" info banner.
- `dashboard/theme.js` — the `accentBlue`/`accentBlueDim` token
  definitions themselves, and the legacy `accent`/`accentDim` aliases
  (kept for documented back-compat; nothing new imports them).

No `colors.accent`/`colors.accentDim` (the old bare legacy names) call
sites were found anywhere outside theme.js itself — nothing needed
touching there.

### Verification (network available this pass)
- `npm install` — clean, 320 packages.
- `npm run build` — **passes**, no errors (`vite build`, 1855 modules).
- `npm test` — **21/21 tests pass** across all 4 test files
  (`api/client.test.js`, `pages/Login.test.jsx`,
  `components/StartSessionForm.test.jsx`,
  `components/SessionCard.test.jsx`) — no selectors broke, since only
  color values changed, never text/role/placeholder content.
- `npm run lint` — **0 errors**, same 2 pre-existing `react-refresh/
  only-export-components` warnings as before this pass (ConfirmDialog.jsx,
  Toast.jsx) — unrelated to this change, not introduced by it.

### Not touched (out of scope for this pass)
- No logic, props, state, or test files were changed — this was a pure
  color-token swap.
- No file/folder structure changes.

## Pass 5 (this session) — multi-theme support (DESIGN_SYSTEM.md §8)

Added 4-theme accent switching (amber default / verdant / ember / classic)
per the exact architecture specified in §8: CSS custom properties for
`brand`/`brandDim` only, not a React Context returning different color
objects (that alternative was already audited and rejected in §8's own
text — 42 files import `theme.js`, many building style objects at module
scope where hooks can't run). Every existing `colors.brand` call site
across the app needed zero changes — it's still just reading a string
constant, the constant just now resolves via CSS instead of being a
literal hex value.

Network access was available this pass — ran a real `npm install`,
`npm run build`, `npm test`, and `npm run lint`.

### Files changed/created

- **dashboard/theme.js** — `colors.brand`/`colors.brandDim` exports
  changed from literal hex to `"var(--color-brand)"` /
  `"var(--color-brand-dim)"` string literals. Nothing else in the file
  touched — every other token (backgrounds, ink, borders, semantic
  status, tag accents) stays literal hex exactly as before.
- **App.jsx** — added a `:root` block (amber defaults) plus
  `[data-theme="verdant"]` / `[data-theme="ember"]` / `[data-theme="classic"]`
  attribute-scoped override blocks to `GLOBAL_CSS`, using the exact 4
  value sets from §8. Wrapped the app tree in the new `ThemeProvider`
  (outermost provider, above `ToastProvider`/`ConfirmDialogProvider`, since
  neither of those depend on it and nothing in it depends on them).
- **index.html** — added a small inline `<script>` in `<head>`, before
  the stylesheet/app loads, that reads `localStorage['cgo-theme']` and
  sets `document.documentElement.dataset.theme` synchronously — this is
  what prevents a flash of the default amber theme before React mounts.
  Wrapped in try/catch for private-browsing/localStorage-disabled cases
  (falls back to the amber default, which needs no attribute set since
  it's the `:root` value).
- **dashboard/ThemeContext.jsx (new)** — `ThemeProvider` + `useThemeMode()`
  hook. Exposes `{ themeId, setTheme, themes }` where `themes` is the
  `{id, label, brand, brandDim}` array for all 4 themes (used by the
  Settings swatch picker to render each option's own color without that
  theme needing to be active). On init, reads the *same* `cgo-theme`
  localStorage key the index.html script already used — not re-derived or
  guessed — so the React-side state starts in sync with what's already
  painted on the DOM. On change, updates `document.documentElement.dataset.theme`
  and persists to localStorage (best-effort; wrapped in try/catch, theme
  still applies for the session if storage is unavailable). Deletes the
  `data-theme` attribute entirely for the `"amber"` default rather than
  setting `data-theme="amber"`, since `:root` already covers it and this
  keeps the DOM attribute absent in the common case (matches how
  index.html's script only sets the attribute for non-default themes).
- **dashboard/pages/SettingsPage.jsx** — replaced the inert `Appearance`
  `PlaceholderCard` (which did nothing, per the "Coming soon" search hint)
  with a real theme picker: a `ThemeSwatchCard` grid (one per theme),
  each built on the existing `Card` primitive (per the instructions, not
  hand-rolled) with a colored circular swatch, the theme's label, and a
  checkmark + brand-colored border on whichever is currently active.
  Clicking a card calls `setTheme()` from the new context. Added
  keyboard support (`role="button"`, `tabIndex`, Enter/Space handling)
  since `Card` renders a `<div>`, not a native `<button>`. Updated the
  description text from "Theme and layout options" to "Choose the accent
  color used across the dashboard" — layout options aren't being built in
  this pass. `Notifications` PlaceholderCard left untouched.

### Step 3 — hex-alpha string-concatenation fix (precisely scoped)

Searched every `` `${var}XX` `` (hex + 2-digit-alpha suffix) pattern in
the codebase (regex over all `.jsx`/`.js` under `src/`) and traced each
variable back to its call sites to determine whether `colors.brand`/
`colors.brandDim` could ever reach it — directly, through a default
param, or through a prop like `tone`/`color` that receives it as one of
several possible values depending on state. Fixed **only** those; every
concatenation involving success/warning/danger/info/accentX was
confirmed unreachable by `brand` and left exactly as-is, since those
tokens remain plain hex forever and their existing trick keeps working.

**Fixed (5 files, brand-reachable):**
- **components/SunshineClientManager.jsx** — 3 sites, all direct
  `` `${colors.brand}4d` `` (header icon badge, header title badge,
  per-client avatar badge) → `` `color-mix(in srgb, ${colors.brand} 30%, transparent)` ``.
- **components/LogPanel.jsx** —
  - `iconBadge` (module-scope const): direct `` `${colors.brand}4d` `` →
    30% color-mix, same as above.
  - `statIconWrap(tone)` (module-scope function): `` `${tone}24` `` /
    `` `${tone}66` ``. This function is generic — called from `StatTile`
    with `tone={colors.brand}` (Entries Loaded tile) as well as
    `colors.warning`/`colors.danger` (Warnings/Errors tiles) — so it's
    reachable by brand through the `tone` prop. Switched both to
    `color-mix()` (14%/40%), which works identically whether `tone` is a
    `var(--color-brand)` string or a literal hex value, so the
    warning/danger call sites through the same function keep rendering
    correctly too.
  - Left `activePillButton(tone)`'s `` `${tone}24` `` alone — traced
    every call site (`PillButton`'s `tone` prop) and confirmed it's only
    ever passed `colors.success` (the LIVE/PAUSED toggle), never reachable
    by brand.
- **components/SunshineStreamHistory.jsx** — 2 sites, both direct
  `colors.brand`: header icon badge (`4d`→30%) and the duration/"STREAM"
  pill (`59`→35%).
- **components/SessionAnalytics.jsx** — `StatTile`'s `` `${tone}1a` ``/
  `` `${tone}40` `` icon-wrap. Reachable by brand three ways: the
  function's own default param (`tone = colors.brand`), explicit
  `tone={colors.brand}` on the Total Sessions/Total Played Duration/Avg
  Playtime tiles, and `getReliabilityColor()`'s "Good" case, which also
  returns `colors.brand`. Fixed to `color-mix()` (10%/25%) — generic
  function, same reasoning as LogPanel's `statIconWrap`.
- **dashboard/components/DashboardStats.jsx** — `` `${tint}1a` ``/
  `` `${tint}40` `` icon-wrap, where `tint = s.color || colors.brand` —
  brand is the fallback whenever a caller doesn't pass an explicit
  `color`. Fixed to `color-mix()` (10%/25%).

**Confirmed unreachable by brand, left alone (9 files):**
`components/SunshineStreamCard.jsx` (`TONE_COLORS` map is
ok/warning/bad/neutral only), `components/HostStatusPanel.jsx` (`TONE_COLORS`
map is ok/warning/bad/info/neutral only), `components/UserPanel.jsx`
(the one hex-alpha site is `colors.danger`, unrelated to the several
plain-`colors.brand` sites elsewhere in the file), `components/EventLog.jsx`
(`STATUS_STYLES` map is info/success/warning/danger only),
`components/StatusBadge.jsx` (`STATUS_CONFIG` map is
warning/success/info/neutral/danger/inkDim only — this is the core
session-status badge, deliberately semantic-only per its own doc comment),
`components/RecoveryStats.jsx` (`StatTile` `tone` prop only ever called
with `colors.success`/`colors.danger`), `components/RecoveryEvents.jsx`
(`eventVisual()` returns success/danger/warning/accentBlue only),
`components/GameManager.jsx` (its one hex-alpha site is `colors.danger`;
its several plain `colors.brand` interpolations have no alpha suffix, so
they were never at risk), `components/SessionHistory.jsx`
(`getStatusBadge()` returns warning/success/danger/inkDim only).

Percent mapping used for `color-mix()` (per §8's alpha-suffix →
percent table, extended to cover the two suffixes — `1a` and `40` —
the table didn't list explicitly, computed the same way:
hex/255×100, rounded): `1a`→10%, `24`→14%, `40`→25%, `4d`→30%,
`59`→35%, `66`→40%.

### Verification
- `npm install` — clean, 320 packages.
- `npm run build` — **passes**, no errors (`vite build`, 1856 modules).
- `npm test` — **21/21 tests pass** across all 4 test files — no
  selectors broke (SessionCard/StartSessionForm/Login test files
  untouched, per the working rules).
- `npm run lint` — **0 errors**, 4 warnings total: the same 2
  pre-existing `react-refresh/only-export-components` warnings on
  `ConfirmDialog.jsx`/`Toast.jsx` from before this pass, plus 2 new ones
  on `ThemeContext.jsx` at the exact same kind of line (a hook + a
  non-component export living alongside the provider component) — this
  is the identical, already-accepted pattern this codebase uses for its
  other two Context/Provider files, not a new category of issue.

### Not touched (out of scope for this pass)
- No test files changed.
- No component logic/state/API calls/routing changed outside what §8
  and Step 5 explicitly asked for.
- No file/folder structure changes.
- Every non-brand hex-alpha concatenation site (danger/warning/success/
  info/neutral) left exactly as literal hex, per the explicit scope
  instruction.
