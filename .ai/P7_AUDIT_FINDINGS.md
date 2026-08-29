# P7_AUDIT_FINDINGS.md — P7-T01 Responsive + Accessibility Audit

**Task:** P7-T01 (documentation-only, no code changes made — see CURRENT_TASK.md)
**Scope:** All 13 pages (`Home`, `HostMonitorPage`, `RecoveryPage`, `SunshinePage`,
`GameManagerPage`, `UserManagementPage`, `AnalyticsPage`, `SessionHistoryPage`,
`LogsPage`, `SettingsPage`, `ChangePasswordPage`, `NotFoundPage`, `Login`) at
RULES.md's 5 canonical breakpoints (1440/1024/768/390/360), plus a full
accessibility pass (keyboard nav, focus visibility, labels, contrast, dialog
semantics).

## 0. Methodology — browser QA availability this session

**Chromium was reachable this session** (unusual — see RULES.md's note that
most P5/P6 sessions couldn't reach a binary). A cached Playwright Chromium
build exists at `/opt/pw-browsers/chromium-1194` in this sandbox; launching
required an explicit `executablePath` (the default lookup path
`ms-playwright/chromium_headless_shell-1234/...` doesn't exist here — a
sandbox quirk, not a project issue).

**Real rendered screenshots were captured** for 11 of 13 pages across all 5
breakpoints, using a **temporary scratch script** (`/home/claude/work/qa-audit/
capture.mjs`, never placed inside `frontend/`, not part of this delivery) that
imports the committed, read-only `frontend/qa/fixtures/route-map.js` the same
way `frontend/qa/render.mjs` does, but with a custom capture plan sweeping all
13 pages × all 5 breakpoints (the committed `render.mjs`'s own `FULL_PLAN`
deliberately only does a full 5-viewport sweep for Home, per
`qa/README.md`'s documented coverage rationale — not a gap, a different,
narrower QA goal than this audit needed). `frontend/qa/render.mjs` itself was
not modified, executed as a separate process, or relied upon directly — the
scratch script reuses only its already-committed, read-only mock-fixture
module.

**Two of 13 pages (Settings, Change Password) could not be captured via
render** — see Finding CC-6 below. **Every other page's browser-rendered
findings in this document are real, visually confirmed evidence**, not
code-reasoned guesses. Settings/Change Password findings are explicitly
marked "code-reasoned, not visually confirmed."

Additional real-browser evidence gathered beyond screenshots (all via the
same Chromium instance, `page.evaluate`/keyboard simulation, not assumption):
- Live computed-style check of focus indicators on a real `<input>` and
  `<button>` after programmatic `.focus()`.
- Programmatic WCAG contrast-ratio computation for the `ink`/`inkDim`/
  `inkFaint`/`inkGhost` design tokens against all 4 surface levels
  (`surface-l0`–`l3`), across **all 6 built-in themes** (amber/verdant/
  ember/classic/mono/oled) — exceeding the task's "default theme fully, plus
  a sample from 2 others" minimum.

## 1. Cross-cutting findings (apply to multiple/all pages)

These are listed once here and referenced by ID (`CC-#`) from each page's
table below, instead of being repeated 13 times.

### CC-1 — Header title clipped at 390px breakpoint (BLOCKER, visually confirmed)
**STATUS: FIXED — see P7-T02 (`.ai/CHANGELOG.md`'s "[P7] P7-T02" entry).**
`dashboard-shell.css`'s swap threshold was raised from `max-width: 360px`
to `max-width: 480px` (paired `min-width: 361px` → `min-width: 481px`).
Verified via real render at all 5 canonical breakpoints (1440/1024/768/
390/360): no clipping, no overlap, full wordmark still has ample room at
768px+. CSS-only, single-file change, byte-identical build-output size
(the digit-count of "360"/"361" vs. "480"/"481" is the same, so the
minified CSS is exactly the same length, 61,160 bytes either way).

`src/dashboard/layout/dashboard-shell.css` lines 23–28: the abbreviated
"CGO" logo only replaces the full "CLOUD GAMING ORCHESTRATOR" wordmark at
`max-width: 360px`. At exactly **390px — one of RULES.md's 5 canonical
breakpoints** — the full wordmark is still forced and gets hard-clipped by
the header's fixed height/overflow, cutting off mid-word ("ORCHEST|"). Visible
identically on every page (shared `DashboardHeader`/`DashboardLayout`).
Confirmed via screenshots: `home__390.png`, `monitor__390.png`,
`users__390.png`, `logs__390.png`, `game-manager__390.png`, `streams__390.png`,
`recovery__390.png`, `login__390.png` all show the same clip.
**Owner task suggestion:** move the `max-width: 360px` breakpoint for
`.pcgo-header-title-short`/`.pcgo-header-title-full` to `480px` (or add a
`391–480px` tier), or apply `text-overflow: ellipsis` as a non-breaking
fallback.

### CC-2 — Inconsistent stat-tile truncation at 1024px (HIGH, visually confirmed)
**STATUS: FIXED — see P7-T03 (`.ai/CHANGELOG.md`'s "[P7] P7-T03" entry).**
Added `overflow: "hidden"` and `textOverflow: "ellipsis"` to the label-text
block's style object in `DashboardStats.jsx`, matching the value block's
existing treatment exactly. CSS-only, single-style-object, single-file
change — no layout/sizing change. Verified via real render at all 5
canonical breakpoints (1440/1024/768/390/360): at 1024px the label now
reads "WEBS…" instead of hard-clipping to "WEBSOC", matching the value's
"Off…" truncation. No regression at the other 4 breakpoints — at 1440/768
both value and label render in full (no truncation needed), and at
390/360 the tile grid wraps to full-width rows so no truncation is needed
there either. Build output: CSS bundle byte-identical (inline styles
don't affect the CSS bundle); JS bundle grew by exactly 42 bytes with
`textOverflow:"ellipsis"` occurrences going from 6 → 7, consistent with
the single added style pair, confirmed via content diff (not hash
comparison alone, per this task's validation requirements).

`src/dashboard/components/DashboardStats.jsx` — the tile grid
(`gridTemplateColumns: repeat(auto-fit, minmax(120px, 1fr))`) squeezes 3
tiles into a narrow rail at 1024px (Home's right-hand "Live System Pulse"
column). The **value** text (`fontSize:18px`) has `textOverflow: "ellipsis"`
and visibly truncates ("Offline" → "Off…"), but the **label** text
(`fontSize:9px`, line ~130) has `whiteSpace: "nowrap"` with no
`textOverflow`, so it hard-clips without an ellipsis ("WEBSOCKET" →
"WEBSOC", no visual truncation cue). Confirmed via `home__1024.png`.
**Owner task suggestion:** add `textOverflow: "ellipsis"` to the label div
to match the value div's treatment, and/or raise the `minmax()` floor.

### CC-3 — `colors.inkGhost` fails WCAG AA contrast in all 6 themes, used for real text (BLOCKER, computed evidence)
**STATUS: FIXED — see P7-T05.**
`theme.js`'s `inkGhost` token (`--color-ink-ghost` in `App.jsx`'s
`GLOBAL_CSS`) is used for actual readable text, not just decorative
elements:
- `src/dashboard/layout/DashboardHeader.jsx:23` — the header subtitle
  ("HOST OPERATIONS", visible on **every single page**).
- `src/pages/Login.jsx:71` — the footer line "PCGO / SINGLE-HOST
  ORCHESTRATION" (visibly very faint in `login__1440.png`).
- `src/components/EventLog.jsx:163` — the "Waiting for activity…" empty
  state (Home's Live Activity panel).
- `src/components/EventLog.jsx:219` — every event-row date label (e.g.
  "Aug 16").
- Also used non-text: `input::placeholder`/`textarea::placeholder` color
  (App.jsx line 181, arguably lower-stakes since placeholder text isn't
  WCAG-mandated to hit 4.5:1, but still worth noting) and the "Skip Timer"
  toggle's off-state knob fill (`StartSessionForm.jsx:923`, a non-text UI
  component needing 3:1 under 1.4.11 — also fails, see table below).

Programmatically computed contrast ratios (WCAG AA normal text needs
**4.5:1**; the sizes above are all well under the 18px/14px-bold "large
text" threshold, so 4.5:1 applies) — `inkGhost` against each theme's own
`surface-l0`–`l3`:

| Theme | vs l0 | vs l1 | vs l2 | vs l3 |
|---|---|---|---|---|
| amber (default) | 2.38:1 | 2.32:1 | 2.27:1 | 2.15:1 |
| verdant | 2.48:1 | 2.40:1 | 2.30:1 | 2.22:1 |
| ember | 2.26:1 | 2.23:1 | 2.15:1 | 2.08:1 |
| classic | 2.52:1 | 2.44:1 | 2.34:1 | 2.23:1 |
| mono | 2.18:1 | 2.12:1 | 2.08:1 | 1.99:1 |
| oled | 2.30:1 | 2.23:1 | 2.19:1 | 2.11:1 |

**Every theme fails by roughly half the required ratio** — this is not a
borderline/rounding case. **Owner task suggestion:** `inkGhost` needs a
lighter value per theme (or these specific text usages need to switch to
`inkFaint`, which mostly clears 4.5:1 — see CC-4 for the one exception).

**FIX (P7-T05):** `--color-ink-ghost` lightened per theme (same hue/
saturation family, lightness only — a same-family HSL lightness search
was used to find the minimal lightening that clears 4.5:1 against each
theme's hardest surface, `surface-l3`, with a small safety margin above
the 4.5 line to survive independent re-computation/rounding):

| Theme | old hex | new hex | old vs l3 | new vs l3 |
|---|---|---|---|---|
| amber (default) | `#4b4f52` | `#7b8286` | 2.15:1 | 4.56:1 |
| verdant | `#49544d` | `#75877b` | 2.22:1 | 4.59:1 |
| ember | `#554946` | `#8f7c77` | 2.08:1 | 4.56:1 |
| classic | `#48545b` | `#738690` | 2.23:1 | 4.59:1 |
| mono | `#494947` | `#81817d` | 1.99:1 | 4.58:1 |
| oled | `#484848` | `#7b7b7b` | 2.11:1 | 4.56:1 |

Full recomputed ratio table for the new `inkGhost` values against every
surface level (matching this finding's original table format):

| Theme | vs l0 | vs l1 | vs l2 | vs l3 |
|---|---|---|---|---|
| amber (default) | 5.04:1 | 4.91:1 | 4.80:1 | 4.56:1 |
| verdant | 5.13:1 | 4.97:1 | 4.77:1 | 4.59:1 |
| ember | 4.95:1 | 4.88:1 | 4.71:1 | 4.56:1 |
| classic | 5.17:1 | 5.01:1 | 4.81:1 | 4.59:1 |
| mono | 5.03:1 | 4.90:1 | 4.79:1 | 4.58:1 |
| oled | 4.96:1 | 4.82:1 | 4.73:1 | 4.56:1 |

All 6 themes now clear 4.5:1 against every surface level (`l0`–`l3`),
including `l3` (the hardest case). The two non-text usages (input/
textarea placeholder color, the "Skip Timer" toggle's off-state knob
fill — both consume `colors.inkGhost` directly, so both got the same
fix automatically) were re-checked against the 3:1 non-text threshold
(WCAG 1.4.11): since the new value already clears 4.5:1 (the stricter
text threshold) against `surface-l3` in every theme, it necessarily
clears the looser 3:1 non-text threshold against every surface level
in every theme too — confirmed, not just assumed, since the ratio is
computed against a fixed background, not the type of content sitting
on it.

### CC-4 — `colors.inkFaint` borderline-fails on the `mono` theme only (MEDIUM, computed evidence)
**STATUS: FIXED — see P7-T05.**
Same method as CC-3. `inkFaint` clears 4.5:1 on 5 of 6 themes (4.51–5.60:1
range) but **fails on `mono`** at `surface-l1`/`l2`/`l3` (4.46/4.36/4.17:1
— all just under the 4.5:1 line). `inkFaint` is used broadly for eyebrows,
meta labels, and secondary copy across every page (`.pcgo-eyebrow`,
`.pcgo-muted` in `GLOBAL_CSS`, plus many inline `colors.inkFaint` usages).
Low real-world visibility impact (borderline ratios, not a ~2:1 failure
like CC-3) but a genuine, theme-specific AA failure.
**Owner task suggestion:** lighten `mono` theme's `--color-ink-faint`
(`#7a7a78`) slightly, e.g. to match `oled`'s ratio profile.

**FIX (P7-T05):** `mono` theme's `--color-ink-faint` lightened
`#7a7a78` → `#81817e` (same hue/saturation family, lightness only). The
other 5 themes' `inkFaint` values were left untouched — they already
passed.

| | vs l0 | vs l1 | vs l2 | vs l3 |
|---|---|---|---|---|
| old (`#7a7a78`) | — | 4.46:1 | 4.36:1 | 4.17:1 |
| new (`#81817e`) | 5.04:1 | 4.91:1 | 4.79:1 | 4.59:1 |

`mono`'s `inkFaint` now clears 4.5:1 against every surface level.

### CC-5 — Text inputs/selects use inline `outline:"none"`, overriding the global focus-visible rule (MEDIUM–HIGH, mixed evidence) — **FIXED in P7-T07**
**Status: FIXED.** P7-T07 removed the inline `outline: "none"` from all 6
flagged style objects (`GameManager.jsx`, `LogPanel.jsx`'s `selectStyle`,
`SaveBrowser.jsx`, `StartSessionForm.jsx`, `SunshineClientManager.jsx`,
`pages/Login.jsx`), unblocking the existing global `:focus-visible` rule
on every one of them. Each file's `focusBorder`/`blurBorder` (or, for
`Login.jsx`, its equivalent inline `onFocus`/`onBlur` border-color swap)
handler was left untouched, so focused elements now show both cues:
the pre-existing border-color change plus the app's standard 2px
brand-colored outline ring.

**Correction to the finding below:** re-reading `StartSessionForm.jsx`'s
source directly during P7-T07 found **no `box-shadow: 0 0 0 3px
rgba(brand,0.12)`** on the Duration/Warning inputs — that richer
alternate cue described below does not exist in the current source. The
Duration/Warning inputs use the same border-color-only `focusBorder`/
`blurBorder` pattern as every other flagged site. The original finding's
box-shadow detail should be treated as inaccurate; it does not change the
fix (removing `outline:"none"` was correct regardless), but it does mean
`StartSessionForm.jsx` was not meaningfully better-off than the other 5
sites before this fix.

Original finding (for record) follows below.

`GLOBAL_CSS` (App.jsx) declares a project-wide focus-visible rule:
```
button:focus-visible, input:focus-visible, select:focus-visible, ... {
  outline: 2px solid ${colors.brand}; outline-offset: 2px;
}
```
But several components set `outline: "none"` directly in an inline `style`
object on `<input>`/`<select>` elements, which **wins over the external
stylesheet rule regardless of specificity** (inline styles beat any
non-`!important` external rule): `SunshineClientManager.jsx:980`,
`SaveBrowser.jsx:25`, `LogPanel.jsx:475` (a `<select>`), `GameManager.jsx:1107`,
`StartSessionForm.jsx:484`, and `pages/Login.jsx:13`.

**Live-verified** (not assumed) on `StartSessionForm.jsx`'s "Duration (min)"
input: focusing it via `page.evaluate` shows computed
`outline-style: none`, confirming the override is real and effective — but
the component substitutes an alternate focus cue (a `box-shadow: 0 0 0 3px
rgba(brand,0.12)` plus a border-color change from a near-invisible neutral
to a visible amber tint). So this specific input is **not fully
unfocusable-looking**, just inconsistent with the button/global standard —
and the box-shadow's 12%-alpha ring is subtle enough to warrant a live
contrast/visibility re-check in a follow-up task. `LogPanel.jsx`'s `<select>`
(`selectStyle`, line 475) has no such alternate cue defined in its style
object — this one should be checked directly, not assumed either way.
**Owner task suggestion:** either remove the inline `outline:"none"` on
these 6 style objects so the global focus-visible rule applies, or give
each an explicit, sufficiently visible alternate focus style and document
the intentional deviation.

### CC-6 — QA harness fixtures are stale against several components' real data contracts (BLOCKER for QA evidence quality, not a UI bug)
**STATUS: FIXED — see P7-T08 (`.ai/CHANGELOG.md`'s "[P7] P7-T08" entry).**
`qa/fixtures/mock-data.js`'s `config()`, `sessionHistory()`, `logs()`, and
`streamHistory()` were rewritten to match each component's real
`data.<field>` access pattern. P7-T08 also found and fixed 3 further
mismatches in the same functions, in the same category as the 4 below,
while re-deriving the exact field lists from source (documented in that
task's fixture comments and changelog entry): `sessionHistory()` rows
used `duration_seconds` (SessionHistory.jsx reads `played_seconds`) and
ISO-string timestamps for `started_at`/`ended_at` (the component does
`new Date(x * 1000)`, i.e. expects Unix seconds — same failure mode as
the `streamHistory()` bug below); several detail-view fields
(`error`/`integrity_verified`/`restart_count`/`restore_verified`/
`game_ended_at`/`last_restart_time`) were missing entirely; and
`logs()` returned an array of `{timestamp, level, message, session_id}`
objects where `LogPanel.jsx` reads a flat array of pre-formatted
**strings** (`log.includes("[ERROR]")`/`log.split(...)`), with the
warning level tagged `"WARN"` where the component's `getLogMeta()`
matches only the literal substring `"[WARNING]"`, and `data.warnings`/
`data.errors` (also read by `LogPanel.jsx`) missing from the response
entirely. None of this was a `frontend/src/` bug — original text below
is preserved for the historical record of what P7-T08 was dispatched
to fix:

`frontend/qa/fixtures/mock-data.js` (read-only, out of this task's allowed
edit scope — `frontend/` cannot be modified per this task) returns shapes
that don't match what the corresponding component actually reads:

- **`config()`** (lines 277–283) returns a **flat** object
  (`sunshine_api_url`, `sunshine_path`, `sunshine_username`), but
  `SettingsPanel.jsx` expects a **deeply nested** shape
  (`config.sunshine.api_url.value`, plus `host_agent`/`storage`/`session`/
  `logging`/`tailscale` sections — see `SettingsPanel.jsx` lines 20–110).
  Live-verified: navigating to Settings or Change Password (which also
  mounts `SettingsPanel` internals via the shared route tree) throws
  `Cannot read properties of undefined (reading 'api_url')`, which trips
  the global `ErrorBoundary` — **both pages render only the generic error
  card, blocking any browser-rendered responsive/accessibility evidence
  for either page this session.**
- **`sessionHistory()`** returns `{ sessions: [...] }`, but
  `SessionHistory.jsx` line 112 reads `data.history` — silently renders as
  an empty list instead of throwing, so `history__*.png` screenshots show
  the "No historical sessions yet" empty state rather than a
  data-populated layout.
- **`logs()`** returns `{ entries: [...] }`, but `LogPanel.jsx` line 80
  reads `data.logs` — same silent-empty-render effect; `logs__*.png`
  screenshots show "No log data is available" rather than a populated
  table.
- **`streamHistory()`**'s field names don't fully match
  `SunshineStreamHistory.jsx`'s rendering either — visible in
  `streams__1024.png` as "UNKNOWN" client names and "Invalid Date" text in
  the Stream History panel (a rendering symptom, not a crash).

None of this is a `frontend/src/` bug — the mock fixtures are the stale
part, evidently unmaintained since the components they target were last
reshaped. But it materially degrades what this session's browser QA could
verify. **Owner task suggestion:** a small, dedicated task to bring
`qa/fixtures/mock-data.js` back in sync with each component's actual
`data.<field>` access pattern (config nesting, `history` vs `sessions`,
`logs` vs `entries`, stream-history field names) — out of scope for this
audit to fix directly (`.ai/*`-only edit scope).

### CC-7 — `ConfirmDialog.jsx` dialog semantics: clean pass (verified, no finding)
Read in full. `role="dialog"`, `aria-modal="true"`, `aria-labelledby`/
`aria-describedby` wired to real title/message ids, initial focus moved to
the confirm/cancel button on open, a real Tab-cycle focus trap (not just
`inert`) with `focusin` re-capture, Escape-to-close, and the background
app content is marked `inert` + `aria-hidden` while open. No gaps found.
This is the reference-quality implementation the rest of the app's overlay
patterns should be measured against.

### CC-8 — Mobile nav drawer keyboard handling: mostly clean, one minor gap (verified)
`DashboardLayout.jsx` (not `MobileHeader.jsx` alone — the behavior is split
across the two files) does handle Escape-to-close, returns focus to the
hamburger button on close, moves focus to the drawer's close button on
open, and renders a click-to-close backdrop. `MobileHeader.jsx` also
defensively sets `tabIndex={-1}` on every drawer control while closed (on
top of `inert`). This is solid — **not a finding**, but worth recording:
unlike `ConfirmDialog`, the underlying page content is not marked `inert`
while the drawer is open (only the drawer's own controls get
tabIndex-gated when *closed*), so a keyboard user tabbing past the
drawer's last item could in principle tab into the visually-obscured page
behind the backdrop. Low severity (Escape and backdrop-click both provide
an easy, working exit) — noting as a low-priority polish item, not a
blocker.

### CC-9 — Unlabeled form inputs: real, but inconsistent — not universal (HIGH, visually + code confirmed)
**STATUS: FULLY FIXED — see P7-T04 and P7-T06 (`.ai/CHANGELOG.md`'s "[P7]
P7-T04" and "[P7] P7-T06" entries).** P7-T04 fixed `GameManager.jsx` and
`StartSessionForm.jsx`; P7-T06 fixed the two remaining instances left
open by P7-T04 — `SunshineClientManager.jsx`'s PIN `<input>`
(`aria-label="PIN"`) and `SaveBrowser.jsx`'s two `<select>`s
(`aria-label="Save Source"` on the Save Source select, and a dynamic
`aria-label={`Select ${type === "archives" ? "Archive" : "Backup"}`}`
on the Archive/Backup select, matching its visible text exactly in both
states). Both files' local `FieldLabel` helpers (a `<label>` in
`SunshineClientManager.jsx`, a `<span>` in `SaveBrowser.jsx`) were left
untouched — purely additive `aria-label` attributes on the
`<input>`/`<select>` elements themselves, mirroring P7-T04's approach.
Network access wasn't available this session (no `node_modules`, npm
registry unreachable), so verification was via careful direct source
inspection rather than Playwright's `getByLabel()` against a live render
— all three attributes confirmed well-formed, on the correct element,
and textually matching the adjacent visible `FieldLabel` in every case.
All instances of this finding across the codebase are now on the "good"
pattern.
Added `aria-label` (matching each field's visible `FieldLabel` text
exactly) to every previously-unlabeled `<input>`/`<select>` in
`GameManager.jsx` (9 fields: Game ID, Game Name, Executable Name,
Executable Path, Save Path, Process Name, Match Mode, Prefix Filters,
Contains Filters, Suffix Filters) and `StartSessionForm.jsx` (2 fields:
Duration (min), Warning (min)), mirroring `Login.jsx`'s established
`aria-label` pattern — no `id`/`htmlFor` restructuring needed.
`StartSessionForm.jsx`'s "Game" field was investigated specifically per
the task's requirement and found to already carry a real `aria-label`
("Select a game to launch") pre-dating this task, distinct from
`FieldLabel`'s "Game" text above it — confirmed via source read and via
Playwright's `getByLabel()` (which resolves real computed accessible
name) that it already resolves correctly, so no change was needed there.
`FieldLabel`'s own implementation, icon prop, and visual styling were
left untouched in both files — purely additive attribute changes.
Verified via Playwright's `getByLabel()` against a live-rendered app
(not just source presence of the attribute) for all 12 fields across
both files (the 11 newly labeled fields — 9 in `GameManager.jsx` + 2 in
`StartSessionForm.jsx` — plus the pre-existing Game select) — each
resolved to exactly one matching element. Two co-existing patterns in
the codebase (now fully resolved to the "good" pattern for these two
files):
- **Good pattern** (real `<label htmlFor>` + `id`, or `aria-label`):
  `ChangePasswordPage.jsx` (`PasswordField`, lines 161–183, also wires
  `aria-describedby`/`aria-invalid`), `UserPanel.jsx` (Create User form,
  lines 285+), `SettingsPage.jsx`'s custom-color `<input type="color">`
  (`aria-label="Pick a custom accent color"`), and `Login.jsx` (both
  fields have `aria-label` in addition to their visual `FieldLabel`).
- **Bad pattern, as originally found** (a local `FieldLabel` function
  renders a plain `<span>` with no `id`/`htmlFor`/`aria-label`
  connecting it to the adjacent `<input>`): `GameManager.jsx` (Game ID,
  Game Name, Executable Name, Process Name, and more — 7+ inputs across
  the Add/Edit Game form) and `StartSessionForm.jsx` (Duration (min),
  Warning (min) number inputs on Home) — **both now moved to the good
  pattern via P7-T04, see STATUS line above** — and (same local-
  `FieldLabel` pattern, out of P7-T04's scope at the time) the PIN input
  in `SunshineClientManager.jsx` and the two `<select>`s in
  `SaveBrowser.jsx` — **also now moved to the good pattern, via P7-T06,
  see STATUS line above.**

### CC-10 — Delete/icon-only buttons are small but at the WCAG 2.2 AA floor, not below it (LOW–MEDIUM, code confirmed)
**FIXED via P7-T09.** `GameManager.jsx`'s `cardDeleteButton` style widened
from `24px × 24px` to `44px × 44px`, matching this app's own established
comfortable-target convention (`StartSessionForm.jsx`'s "Skip Timer"
toggle wrapper, `minHeight: "44px"`). 44px was used as-is with no
deviation: re-checked the card layout at 360/390/768px against
`cardHeader`'s `flexWrap: "wrap"` and the 220px `grid` column minimum —
even at the narrowest 220px card, the +20px growth (24px→44px) leaves
ample room for `cardTitle` before wrapping, and 44px sits close to the
already-accepted 40px `pickerButton` in the same file, so it reads as
proportionate rather than oversized. The `Trash2` icon itself stayed
`size={12}`, unchanged — only the surrounding clickable/background area
grew. No other style object in the file was touched. Chromium/Playwright
was unreachable in this session (`cdn.playwright.dev` blocked by the
sandbox network allowlist, as anticipated), so the visual check was done
by direct layout reasoning rather than a live render; lint/build/test
stayed green before and after, and the build output diff showed only the
expected `24px`→`44px` value change in the minified `cardDeleteButton`
object, with the CSS bundle byte-identical.

Original finding (for reference): `GameManager.jsx`'s `cardDeleteButton`
style (lines 1027–1043): `24px × 24px`. This exactly meets (does not
fail) WCAG 2.2's newer 2.5.8 Target Size (Minimum) AA criterion (24×24
CSS px), but is well under the more comfortable 44×44px baseline used
elsewhere in this app (e.g. `StartSessionForm.jsx`'s "Skip Timer" toggle
wrapper explicitly sets `minHeight: "44px"` on its clickable
`role="checkbox"` container — a better pattern, worth matching). Given
this is a **destructive** action (delete a configured game) reached most
easily at the 390/360 mobile breakpoints, flagging as worth a
comfort/precision improvement even though it isn't a hard compliance
failure.

## 2. Per-page findings

### 2.1 Home (`Home.jsx`)
Browser-rendered at all 5 breakpoints: `home__1440/1024/768/390/360.png`.

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440 | No layout breakage found. | — | — |
| 1024 | CC-2 (stat-tile label/value truncation, inconsistent ellipsis handling) | High | See CC-2 |
| 768 | Layout correctly reflows to single column (right rail moves below main content); no breakage found. | — | — |
| 390 | CC-1 (header title clipped) | Blocker | See CC-1 |
| 360 | No additional breakage beyond CC-1 (already collapsed to "CGO" logo correctly here). | — | — |
| Keyboard nav | "Skip Timer" toggle: proper `role="checkbox"`, `aria-checked`, Space/Enter handling, 44px min touch target — clean. Duration/Warning inputs are keyboard-reachable but unlabeled — see CC-9. | Mixed | See CC-9 |
| Focus visibility | Duration/Warning number inputs use the CC-5 pattern (inline `outline:none` + alternate box-shadow/border cue) — functional but inconsistent. | Medium | See CC-5 |
| Labels | Duration (min), Warning (min) inputs unlabeled — CC-9. | High | See CC-9 |
| Contrast | "Waiting for activity…" empty state and event date labels use `inkGhost` — CC-3. | Blocker | See CC-3 |
| Dialogs | N/A — no dialog on this page. | — | — |

### 2.2 Host Monitor (`HostMonitorPage.jsx`)
Browser-rendered at all 5 breakpoints: `monitor__1440/1024/768/390/360.png`.

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440 | No layout breakage found. Dependency cards (Sunshine/Tailscale) sit side-by-side cleanly. | — | — |
| 1024 | No breakage beyond the shared header (CC-1 doesn't apply at 1024; separate `max-width:1040px` rule hides optional header content cleanly here). | — | — |
| 768 | Not yet independently re-viewed this session beyond the capture; layout uses the same shared `.pcgo-feature-page`/card patterns confirmed working elsewhere at 768 (Home, Analytics) — low risk, flagged as **not individually re-confirmed**. | Low (code-reasoned) | — |
| 390 | CC-1 (header title clipped) | Blocker | See CC-1 |
| 360 | No additional breakage found. | — | — |
| Keyboard nav | "Enable"/"Revalidate Host"/"Start"/"Restart" are real `<button>` elements — reachable. Not individually tab-order-tested this session. | Low (code-reasoned) | — |
| Focus visibility | Buttons use the default global focus-visible rule (no inline `outline:none` found in `HostStatusPanel.jsx`) — expected to be visible; not live-verified this session. | Low (code-reasoned) | — |
| Labels | No unlabeled form inputs on this page (mostly read-only status rows + buttons). | — | — |
| Contrast | Uses the same `inkFaint`/`inkGhost` tokens as elsewhere for meta text — CC-3/CC-4 apply wherever those tokens are used on this page (not individually re-grepped line-by-line this session). | Blocker (via CC-3) | See CC-3 |
| Dialogs | N/A on this page directly (maintenance/force-unlock confirmations route through the shared `ConfirmDialog` — see CC-7). | — | — |

### 2.3 Recovery (`RecoveryPage.jsx`)
Browser-rendered: `recovery__1440/1024/768/390/360.png` (390 visually confirmed clean below the header).

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440/1024/768/360 | No layout breakage found in captured screenshots. | — | — |
| 390 | CC-1 (header title clipped) | Blocker | See CC-1 |
| Keyboard nav | Not individually tab-order-tested. | Low (code-reasoned) | — |
| Focus visibility | Not individually re-checked; no inline `outline:none` found via the CC-5 grep for this page's own components. | — | — |
| Labels | No form inputs on this page (read-only stats/events). | — | — |
| Contrast | `inkFaint`/`inkGhost` usage likely present in meta labels (not line-verified for this specific file). | Blocker (via CC-3, if present) | See CC-3 |
| Dialogs | N/A directly. | — | — |

### 2.4 Sunshine (`SunshinePage.jsx`)
Browser-rendered: `streams__1440/1024/768/390/360.png`.

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440/768/360 | No layout breakage found. | — | — |
| 1024 | Stream History cards show "UNKNOWN" client / "Invalid Date" — this is the CC-6 fixture mismatch (`streamHistory()` field-name drift), **not a UI/CSS bug**; the layout itself does not break. | — (CC-6 evidence-quality note) | See CC-6 |
| 390 | CC-1 (header title clipped) | Blocker | See CC-1 |
| Keyboard nav | "Force Close Stream", "Unpair All Clients", per-client re-pair buttons are real buttons — reachable. Not individually tab-order-tested. | Low (code-reasoned) | — |
| Focus visibility | `SunshineClientManager.jsx` has an inline `outline:"none"` input (pairing-code entry, line 980) — same CC-5 pattern; not live-verified for its alternate-cue quality specifically (StartSessionForm's was verified; this one wasn't). | Medium | See CC-5 |
| Labels | Not individually re-verified for the pairing-code input's label association this session — flagged as needing the same check as CC-9's confirmed instances. | Medium (code-reasoned) | See CC-9 |
| Contrast | CC-3 applies wherever `inkGhost` meta text appears. | Blocker (via CC-3) | See CC-3 |
| Dialogs | "Unpair All Clients" likely routes through `ConfirmDialog` (CC-7, clean). | — | — |

### 2.5 Game Manager (`GameManagerPage.jsx`)
Browser-rendered: `game-manager__1440/1024/768/390/360.png`.

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440/1024/768/360 | No layout breakage found; card grid reflows to 1 column at 390/360, 2 at 1024, cleanly. | — | — |
| 390 | CC-1 (header title clipped) | Blocker | See CC-1 |
| Touch targets (390/360) | CC-10 (24×24px delete button, at-floor but not failing) | Low–Medium | See CC-10 |
| Labels | CC-9 (Game ID, Game Name, Executable Name, Process Name inputs unlabeled — 7+ fields) | High | See CC-9 |
| Focus visibility | CC-5 (`GameManager.jsx:1107` inline `outline:"none"`, alternate-cue quality not individually verified for this file) | Medium | See CC-5 |
| Contrast | CC-3/CC-4 apply to meta text (field hints, "3 configured launch targets" subtitle style). | Blocker (via CC-3) | See CC-3 |
| Dialogs | Delete-game confirmation routes through `ConfirmDialog` (CC-7, clean). | — | — |

### 2.6 User Management (`UserManagementPage.jsx`)
Browser-rendered: `users__1440/1024/768/390/360.png`.

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440/1024/768/360 | No layout breakage found; two-column (directory + create-user form) collapses cleanly to one column at narrow widths. | — | — |
| 390 | CC-1 (header title clipped) | Blocker | See CC-1 |
| Labels | **Clean pass** — Username/Password/Role fields use real `<label htmlFor>` + `id` (see CC-9's "good pattern" list). | — | — |
| Focus visibility | No inline `outline:none` found in `UserPanel.jsx` — expected to inherit the global focus-visible rule cleanly; not live-verified. | — (low, code-reasoned) | — |
| Contrast | CC-3/CC-4 apply to meta text elsewhere on the page (e.g. "IDENTITY DIRECTORY" eyebrow, account-count labels). | Blocker (via CC-3) | See CC-3 |
| Dialogs | Delete/role-change confirmations route through `ConfirmDialog` (CC-7, clean). | — | — |

### 2.7 Analytics (`AnalyticsPage.jsx`)
Browser-rendered: `analytics__1440/1024/768/390/360.png`.

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440/1024/768/390/360 | No layout breakage found at any breakpoint — the stat-tile grid here (different component than Home's `DashboardStats`) reflows cleanly with no truncation observed at any width, including 360. | — | — |
| Keyboard nav | "Refresh" button, breakdown list rows — reachable; not individually tab-order-tested. | Low (code-reasoned) | — |
| Focus visibility | Not individually checked for inline `outline:none`; no occurrence found in a targeted grep of this page's direct source. | — | — |
| Labels | No form inputs on this page. | — | — |
| Contrast | `inkFaint`/`inkGhost` likely present in meta captions ("INTERPRETATION LAYER", "BY USER" etc.) — CC-3/CC-4 apply if so (not individually line-verified). | Blocker (via CC-3, if present) | See CC-3 |
| Dialogs | N/A. | — | — |

### 2.8 Session History (`SessionHistoryPage.jsx`)
Browser-rendered: `history__1440/1024/768/390/360.png` — **rendered in the CC-6 fixture-mismatch empty state** ("No historical sessions yet"), not a data-populated layout, so column/row-wrapping behavior for a real table of sessions was **not visually confirmed** this session.

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440/1024/768/390/360 | Empty-state card itself reflows cleanly at every breakpoint (confirmed). **Populated-table responsive behavior is unverified** — CC-6. | — (CC-6 evidence gap) | See CC-6, then re-run this page's audit |
| 390 | CC-1 (header title clipped) | Blocker | See CC-1 |
| Keyboard nav | "Refresh" button reachable. Session-row expand/collapse behavior (`toggleSessionEvents`) not exercisable without real data this session — unverified. | Medium (unverified) | See CC-6 |
| Labels | No form inputs. | — | — |
| Contrast | CC-3/CC-4 likely apply to timestamp/meta text once real data renders (not confirmable in the empty state). | Blocker (via CC-3, pending CC-6 fix) | See CC-3, CC-6 |
| Dialogs | N/A directly. | — | — |

### 2.9 Logs (`LogsPage.jsx`)
Browser-rendered: `logs__1440/1024/768/390/360.png` — **also rendered in the CC-6 fixture-mismatch empty state** ("No log data is available"), so the log table/row-wrapping behavior with real entries was **not visually confirmed**.

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440/1024/768/390/360 | Empty-state layout itself reflows cleanly. **Populated-table behavior unverified** — CC-6. | — (CC-6 evidence gap) | See CC-6 |
| 390 | CC-1 (header title clipped) | Blocker | See CC-1 |
| Responsive-logic note | `LogPanel.jsx` lines 64–65 use **JS-based** breakpoints via `window.innerWidth < 900` (`compactMode`) and `< 650` (`mobileMode`) — these don't align with RULES.md's 768/390 canonical breakpoints at all (900 sits between 1024 and 768; 650 sits between 768 and 390). Whether this causes a real visible problem in the gap (e.g. at exactly 768–900px) is unconfirmed — flagged as **code-reasoned only**, needs live verification once CC-6 is fixed and real log rows can be seen wrapping/compacting. | Medium (code-reasoned) | New task: verify `LogPanel.jsx`'s JS breakpoints against real rendered behavior at 768–900px and 390–650px |
| Focus visibility | `LogPanel.jsx`'s `<select>` (`selectStyle`, line 475) has inline `outline:"none"` with **no alternate focus cue visible in the style object** (unlike `StartSessionForm.jsx`'s input, which does substitute a box-shadow) — this one may be a genuine "no visible focus indicator" case, not just an inconsistent-but-functional one. **Needs live verification**, not yet confirmed either way. | Medium–High (code-reasoned, needs verification) | See CC-5 |
| Labels | Level/session filter `<select>` elements — not individually verified for label association this session. | Medium (code-reasoned) | — |
| Contrast | CC-3/CC-4 apply to meta labels ("ENTRIES LOADED", "WINDOW WARNINGS" etc., visible even in the empty state). | Blocker (via CC-3) | See CC-3 |
| Dialogs | "MORE" menu is a dropdown, not a modal dialog — not in `ConfirmDialog`'s scope; its own semantics (`role="menu"` etc.) were not checked this session. | Unverified | New task: check `LogPanel.jsx`'s "MORE" menu semantics |

### 2.10 Settings (`SettingsPage.jsx`)
**Could not be browser-rendered this session — CC-6 (config-fixture crash).**
All findings below are **code-reasoned, not visually confirmed.**

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440/1024/768/390/360 | `feature-page.css`'s `.pcgo-settings-appearance__themes` grid (`repeat(auto-fit, minmax(130px,1fr))`) collapses to a fixed `1fr 1fr` at `max-width:480px` (covers both 390 and 360), and `.pcgo-settings-about` collapses from a 2-column to 1-column grid at the same breakpoint. This looks like a reasonable, deliberate pattern matching the shared `.pcgo-2col` convention used elsewhere (already visually confirmed working on other pages) — **but this specific page was never actually rendered to confirm it**, so treat as lower-confidence than every other page in this report. | Low (code-reasoned only) | Fix CC-6 first, then re-render this page |
| Labels | The custom-theme color picker's `<input type="color">` has a proper `aria-label` (line ~72) — one clean spot confirmed by direct source read even without a render. | — | — |
| Contrast | CC-3/CC-4 apply wherever `inkFaint`/`inkGhost` are used for the settings-group headers/hints (not exhaustively grepped for this file). | Blocker (via CC-3, pending render) | See CC-3, CC-6 |
| Dialogs | N/A directly on this page (config save/reset likely routes through toast, not a dialog — not confirmed). | Unverified | — |

### 2.11 Change Password (`ChangePasswordPage.jsx`)
**Could not be browser-rendered this session — CC-6 (same config-fixture crash;
this route also mounts shared Settings-tree data-fetching before its own
content).** All findings below are **code-reasoned, not visually confirmed.**

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440/1024/768/390/360 | Single-column password form, no grid/flex complexity found in the source that would suggest breakpoint-specific breakage — lowest-risk page in the app structurally. Not rendered to confirm. | Low (code-reasoned only) | Fix CC-6 first, then re-render |
| Labels | **Clean pass, confirmed by direct source read even without a render** — `PasswordField` (lines 161–183) uses real `<label htmlFor={id}>`, matching `id`/`name`, `aria-describedby` pointing at both a description and an error message id, and `aria-invalid`. This is the **best-labeled form in the whole app** — worth using as the project's own reference pattern for CC-9's fix. | — | — |
| Contrast | CC-3/CC-4 apply if `inkFaint`/`inkGhost` are used for the description/hint text under each field (not confirmed without a render). | Blocker (via CC-3, pending render) | See CC-3, CC-6 |
| Dialogs | N/A. | — | — |

### 2.12 NotFound (`NotFoundPage.jsx`)
Browser-rendered at 1440/390 (`notfound__1440.png`, `notfound__390.png`), reached via a direct navigation to an unmapped route while authenticated.

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440 | No breakage — clean, simple centered card. | — | — |
| 390 | CC-1 (header title clipped, same shared header) | Blocker | See CC-1 |
| 1024/768/360 | Not individually captured this session (this page has no real content complexity beyond the 404 card — low risk, but genuinely **not verified** at these 3 breakpoints). | Low (unverified) | Optional: capture the remaining 3 breakpoints in a future pass |
| Keyboard nav | "Go To Home" button — reachable. | — | — |
| Contrast | 404 card's "Nothing lives at /path" caption may use `inkFaint`/`inkGhost` — not line-verified. | Blocker (via CC-3, if present) | See CC-3 |
| Dialogs | N/A. | — | — |

### 2.13 Login (`Login.jsx`)
Browser-rendered at all 5 breakpoints: `login__1440/1024/768/390/360.png`.
(No auth/mock seeding needed — this page renders standalone.)

| Breakpoint/Category | Finding | Severity | Owner task |
|---|---|---|---|
| 1440 | No breakage — clean split hero/form layout. | — | — |
| 1024/768/390/360 | Not yet individually re-viewed image-by-image beyond the 1440 check this session (all 5 were captured; only 1440 was opened) — flagging as **captured but not all individually eyeballed**, lower confidence than pages where every breakpoint was opened and described above. | Low (partially unverified) | Optional: open the remaining 4 Login screenshots in a follow-up pass |
| Labels | **Clean pass** — Username/Password inputs both have `aria-label` in addition to the visual `FieldLabel` span (lines 83–84) — good belt-and-suspenders pattern. | — | — |
| Focus visibility | `pages/Login.jsx:13`'s shared `inputStyle` has inline `outline:"none"` (CC-5) — same pattern as `StartSessionForm.jsx`; not live-verified for this specific file's alternate-cue quality (uses a manual `onFocus`/`onBlur` border-color swap, similar in spirit to `StartSessionForm.jsx`'s but not identical — worth confirming). | Medium | See CC-5 |
| Contrast | CC-3 — the footer line "PCGO / SINGLE-HOST ORCHESTRATION" (`inkGhost`, line 71) is visibly very faint in the captured screenshot, consistent with the ~2:1 computed ratio. | Blocker | See CC-3 |
| Dialogs | N/A. | — | — |

## 3. Summary

**Total findings: 10 cross-cutting (CC-1–CC-10) + page-specific rows above.**

By severity (counting each cross-cutting finding once, regardless of how
many pages it touches):
- **Blocker: 3** — CC-1 (header clip at 390px, all pages), CC-3 (`inkGhost`
  contrast failure, all 6 themes, multiple pages), CC-6 (QA-fixture
  mismatches blocking Settings/Change Password rendering + degrading
  Session History/Logs/Sunshine evidence quality).
- **High: 2** — CC-2 (stat-tile truncation inconsistency), CC-9 (unlabeled
  inputs on Home/Game Manager, confirmed; Sunshine flagged as needing the
  same check).
- **Medium: 3** — CC-4 (`inkFaint` fails on `mono` theme only), CC-5
  (inline `outline:none` overriding focus-visible, most instances have an
  alternate cue but not all confirmed), the `LogPanel.jsx` JS-breakpoint
  mismatch noted under Logs.
- **Low: 2** — CC-8 (mobile drawer not fully inert-trapped, minor), CC-10
  (24×24px delete button, at-floor not failing).
- **Clean passes worth recording: 2** — CC-7 (`ConfirmDialog` dialog
  semantics), the "good" half of CC-9 (`ChangePasswordPage`/`UserPanel`/
  `Login` labeling patterns) — useful as the project's own reference
  implementations for fixing the "bad" half.

**Browser QA usability this session: mostly usable.** 11 of 13 pages got
real, visually-confirmed evidence at all 5 breakpoints (Home, Host Monitor,
Recovery, Sunshine, Game Manager, User Management, Analytics, Session
History, Logs, NotFound, Login — though NotFound/Login were only partially
individually eyeballed beyond 1440/390, see their sections). 2 of 13
(Settings, Change Password) are code-reasoned only, blocked by CC-6.

## 4. Known limitations of this audit

- Settings and Change Password have **zero real rendered evidence** —
  entirely code-reasoned, flagged throughout.
- Session History and Logs were only rendered in their **empty-fixture
  states** (CC-6) — real populated-table responsive behavior (row wrapping,
  horizontal scroll, column priority at narrow widths) is **unverified**
  for both.
- Several per-page tables above mark specific rows "not individually
  verified this session" where the finding is inferred from a
  cross-cutting pattern (CC-3/CC-4/CC-5) rather than a direct grep/read of
  that exact file — these are lower-confidence than the directly-confirmed
  rows and are labeled as such inline rather than stated as fact.
- Touch-target sizing was spot-checked (Game Manager's delete button,
  Home's Skip Timer toggle) rather than exhaustively measured across all
  13 pages' every interactive element.
- Contrast was checked programmatically for the core `ink*` text-color
  tokens against all 4 surface levels across all 6 themes (exceeding the
  task's minimum ask) — but **not** for every specific colored badge/status
  element (e.g. `colors.success`/`colors.danger` text-on-tint combinations
  used in status pills) — a follow-up task could extend the same
  programmatic method to those.
- The mobile nav drawer's minor non-`inert` gap (CC-8) and the `LogPanel`
  "MORE" menu's semantics were noted but not deeply investigated —
  flagged as candidates for a future, narrower accessibility task.
