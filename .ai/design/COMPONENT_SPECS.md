# PCGO Component Specifications
### Companion to `.ai/design/DESIGN.md` ("Tactical Console Brutalism") and `.ai/design/PAGE_SPECS.md`

> Status: implementation-ready component contracts. `DESIGN.md` is the design language (tokens, principles, geometric vocabulary). `PAGE_SPECS.md` is the page-by-page translation. This document is the third layer: for every shared, reusable, or notably duplicated component, exactly what its implementation contract is — props, variants, states, tokens, anti-patterns — verified against the actual files in this repository, not assumed from either upstream document.
>
> No code has been written or changed to produce this document. No component or page has been modified. This is documentation only.

---

## 0. How to read this document

- **KEEP / EVOLVE / REPLACE / ADD** carry the exact meanings defined in `DESIGN.md` §0, applied here at component scope.
- **Classification tags** (§2) are new to this document: every component is tagged `KEEP SHARED`, `EVOLVE SHARED`, `PAGE-LOCAL`, `CANDIDATE FOR EXTRACTION`, or `DUPLICATE / CONSOLIDATION CANDIDATE`, per the task brief's Phase 6.
- Every file path, prop name, and current pixel value below was read directly from the repository during this pass (`frontend/src/**`), not inferred from `PAGE_SPECS.md`'s descriptions. Where this pass's direct inspection **corrects or sharpens** something `PAGE_SPECS.md` guessed at or left unverified, that is called out explicitly in §4 under "Corrections to `PAGE_SPECS.md`."
- This document does not repeat `DESIGN.md`'s token *values* (radius/shadow/motion/color tables) — it cites them by name (`radius.none`, `shadow.press`, etc.) and states which component surfaces they apply to.

---

## 1. Component inventory

Grouped by function. "Local" = defined and used only inside one file. "Shared" = imported by 2+ files.

### Design primitives (shared)
| Component | File | Shared? |
|---|---|---|
| `Button` | `components/ui/primitives.jsx` | Shared — highest blast radius in the app |
| `Card` | `components/ui/primitives.jsx` | Shared |
| `Chip` | `components/ui/primitives.jsx` | Shared |
| `Spinner` | `components/ui/primitives.jsx` | Shared |
| `EmptyState` (primitive) | `components/ui/primitives.jsx` | Shared, wrapped by `dashboard/components/EmptyState.jsx` |
| `Squiggle` | `components/ui/primitives.jsx` | Defined, exported — **zero call sites found** in this pass (grepped `Squiggle` across `frontend/src`, no imports beyond its own definition) |

### Status / semantic indicators
| Component | File | Notes |
|---|---|---|
| `StatusBadge` | `components/StatusBadge.jsx` | The canonical shared status pill (dot + pill + mono label). Session-lifecycle statuses only (`STATUS_CONFIG` keys are session states). |
| `Badge` (local #1) | `components/HostStatusPanel.jsx` (line 457) | Local, tone-only pill (`ok`/`warning`/`bad`/`info`/`neutral`). No dot. |
| `Badge` (local #2) | `components/SunshineStreamCard.jsx` (line 54) | **Not previously named in `PAGE_SPECS.md`.** A second, independently-implemented local `Badge`, same tone vocabulary (`ok`/`warning`/`bad`/`neutral`), same visual idea, different file, different literal values (`borderRadius: "10px"` — a raw literal, not even aliased to `radius.sm`). See §4.1. |
| Session History status renderer | `components/SessionHistory.jsx`, `getStatusBadge()` (line 39) | **Confirmed NOT `StatusBadge`.** A bespoke, local function returning `{ color, icon, text }`, rendered inline (icon + text colored to match, 2px left border on the record card). See §4.2 — this resolves `PAGE_SPECS.md` §17 open uncertainty #3. |

### Buttons / interactive controls
| Component | File |
|---|---|
| `Button` | `components/ui/primitives.jsx` |
| Sidebar nav row (unnamed, inline) | `dashboard/layout/Sidebar.jsx` |
| Mobile drawer nav row / close button (unnamed, inline) | `dashboard/layout/MobileHeader.jsx` |
| Header mobile-menu / logout buttons (unnamed, inline) | `dashboard/layout/DashboardHeader.jsx` |
| `NavigationCard` | `dashboard/components/NavigationCard.jsx` (button element) |
| `iconAddButton` / `iconGhostButton` (unnamed, inline) | `components/GameManager.jsx` |
| ConfirmDialog cancel/confirm buttons (unnamed, inline) | `components/ui/ConfirmDialog.jsx` |
| ErrorBoundary "Try Again" / "Reload Page" buttons (unnamed, inline) | `components/ui/ErrorBoundary.jsx` |

### Cards / panels
| Component | File |
|---|---|
| `Card` | `components/ui/primitives.jsx` |
| `SectionCard` (shared) | `dashboard/components/SectionCard.jsx` |
| `SectionCard` (local, distinct) | `components/HostStatusPanel.jsx` (line 482) |
| `.pcgo-command-card` (via `NavigationCard`) | `dashboard/components/NavigationCard.jsx` + `feature-page.css` |
| `.pcgo-stat-cell` / `.pcgo-data-row` / `.pcgo-form-section` (shared CSS classes, not components) | `dashboard/components/feature-page.css` |

### Forms / inputs
| Component | File |
|---|---|
| Login `inputStyle` (shared literal object, not a component) | `pages/Login.jsx` |
| `PasswordField` (local) | `dashboard/pages/ChangePasswordPage.jsx` |
| Settings row controls (unnamed, inline) | `components/SettingsPanel.jsx` |
| User-create form fields (CSS-class driven) | `components/UserPanel.jsx` |
| Game Manager form fields (CSS-class + inline, `FieldLabel`) | `components/GameManager.jsx` |

### Navigation
| Component | File |
|---|---|
| `Sidebar` | `dashboard/layout/Sidebar.jsx` |
| `MobileHeader` | `dashboard/layout/MobileHeader.jsx` |
| `DashboardHeader` | `dashboard/layout/DashboardHeader.jsx` |
| `DashboardLayout` / `MainContent` | `dashboard/layout/DashboardLayout.jsx`, `MainContent.jsx` |
| `NavigationCard` | `dashboard/components/NavigationCard.jsx` |

### Feedback
| Component | File |
|---|---|
| `ToastProvider` / `useToast` | `components/ui/Toast.jsx` |
| `ConfirmDialogProvider` / `useConfirm` | `components/ui/ConfirmDialog.jsx` |
| `ErrorBoundary` | `components/ui/ErrorBoundary.jsx` — **not covered by `DESIGN.md` §6 or `PAGE_SPECS.md` at all**, only listed as a file location in `DESIGN.md` §14. See §4.3. |

### Data display
| Component | File |
|---|---|
| `StatRow` (local #1) | `components/HostStatusPanel.jsx` (line 502) |
| `StatRow` (local #2) | `components/SunshineStreamCard.jsx` (line 77) — near-identical label/value anatomy to #1, independently implemented. See §4.1. |
| `ProgressStat` | `components/HostStatusPanel.jsx` (line 541) |
| `StatTile` (Recovery) | `components/RecoveryStats.jsx` |
| `StatTile` (Analytics) | `components/SessionAnalytics.jsx` — **different component, same name**, same "icon badge + big mono value + label" anatomy as Recovery's `StatTile`. Not previously flagged. See §4.1. |
| `DashboardStats` | `dashboard/components/DashboardStats.jsx` |

### Loading / empty states
| Component | File |
|---|---|
| `EmptyState` (wrapper) | `dashboard/components/EmptyState.jsx` — thin, faithful wrapper around the primitive; **not a duplicate** |
| `LoadingState` | `dashboard/components/LoadingState.jsx` |
| Page-local skeleton blocks (`HostStatusLoadingState`, `RecoveryStatsLoadingState`, `RecoveryEventsLoadingState`, etc.) | one per data-bearing page/component file |

### Dialogs
| Component | File |
|---|---|
| `ConfirmDialogProvider` | `components/ui/ConfirmDialog.jsx` |
| `MobileHeader` drawer (not a modal dialog, but the app's other focus-managed overlay) | `dashboard/layout/MobileHeader.jsx` |

### Page-level shared components
| Component | File |
|---|---|
| `PageHeader` | `dashboard/components/PageHeader.jsx` |
| `ActiveAlerts` | `dashboard/components/ActiveAlerts.jsx` |
| `SessionSidebar` | `dashboard/components/SessionSidebar.jsx` |

### Domain-specific reusable components
| Component | File |
|---|---|
| `SessionCard` | `components/SessionCard.jsx` |
| `SunshineStreamCard` | `components/SunshineStreamCard.jsx` |
| `LiveCountdown` | `components/LiveCountdown.jsx` |
| `EventLog` | `components/EventLog.jsx` |

---

## 2. Classification summary

Per Phase 6's requirement to explicitly separate shared, page-local, and duplicate components:

| Component | Classification | Reasoning |
|---|---|---|
| `Button`, `Card`, `Chip`, `Spinner`, `EmptyState` primitive | **KEEP SHARED** (interaction/API), **EVOLVE SHARED** (token values) | Correct abstraction, correct API; only radius/shadow values change (§3). |
| `StatusBadge` | **KEEP SHARED** | `DESIGN.md` §6.4 names this "KEEP exactly." Correct geometry+color+text pattern already. |
| `SectionCard` (shared, `dashboard/components/SectionCard.jsx`) | **EVOLVE SHARED** | Correct abstraction (title/count/refresh header + children); radius/token values migrate. |
| `SectionCard` (local, `HostStatusPanel.jsx`) | **PAGE-LOCAL — do not consolidate this pass** | See §4.4. Genuinely different API (icon+heading only, no count/refresh) and a different elevation (`surface.l2`/12px vs shared's `surface.l3`/16px). Consolidating now would be a code-architecture change, which this document does not mandate per the task brief. Flagged for future awareness, not action. |
| `Badge` (local, `HostStatusPanel.jsx`) | **PAGE-LOCAL, DUPLICATE-ADJACENT** | See §4.1. Distinct from `StatusBadge` (no dot, different tone vocabulary, used for host/dependency states not session states) — a legitimately different job, not a broken duplicate. |
| `Badge` (local, `SunshineStreamCard.jsx`) | **DUPLICATE / CONSOLIDATION CANDIDATE** | Same tone vocabulary and near-identical visual idea as `HostStatusPanel.jsx`'s local `Badge`, independently implemented a second time with a raw, non-tokenized radius. This is the closer thing to a "problem" duplicate in the codebase — two components doing the identical job with drifted literal values. Not mandated for consolidation in this pass, but should not be treated as two intentionally-different things the way `StatusBadge` vs. host `Badge` are. |
| `StatRow` (local, `HostStatusPanel.jsx`) | **PAGE-LOCAL** | Anatomy (label / dotted fill / value) is specific to spec-sheet-style dense stat rows. |
| `StatRow` (local, `SunshineStreamCard.jsx`) | **DUPLICATE / CONSOLIDATION CANDIDATE** | Near-identical anatomy to `HostStatusPanel.jsx`'s `StatRow`, independently reimplemented in the file whose own header comment says it was "reworked to match the StatRow/Badge 'spec sheet' look already used everywhere else inside its parent, `HostStatusPanel.jsx`" — i.e., the intent was always to match, not to diverge, which makes this the strongest extraction candidate in the app. |
| `StatTile` (`RecoveryStats.jsx`) | **PAGE-LOCAL** | |
| `StatTile` (`SessionAnalytics.jsx`) | **DUPLICATE / CONSOLIDATION CANDIDATE** | Same name, same icon-badge + big-mono-value + label anatomy, independently implemented. Weaker case than `StatRow`'s (no shared "look-alike" intent documented in either file's comments), but still a real pattern-repeat worth a future extraction pass. |
| ConfirmDialog / ErrorBoundary local action buttons | **CANDIDATE FOR EXTRACTION** | See §4.5. Both independently implement a pill-shaped (`radius.full`) two-button action row with near-identical styling. Not the shared `Button` primitive. A shared `DialogActions`/`PillButton` component is a reasonable future extraction, but out of scope to build in this pass. |
| `Toast.jsx`, `ConfirmDialog.jsx` (interaction logic) | **KEEP SHARED** | `DESIGN.md` §6.7/§6.8 name both as reference implementations. |
| `PageHeader`, `ActiveAlerts`, `SessionSidebar`, `DashboardStats`, `NavigationCard` | **EVOLVE SHARED** | Correct abstractions; token values migrate per §3. |
| `SessionCard`, `SunshineStreamCard` | **EVOLVE SHARED** (domain components, each used on 1 page today but built as reusable) | |
| `ErrorBoundary` | **EVOLVE SHARED — currently undocumented** | See §4.3. Needs the same token migration as `ConfirmDialog`/`Card`, but neither `DESIGN.md` nor `PAGE_SPECS.md` gives it a component-language entry. This document adds one (§3.10). |
| Page-local skeleton/loading blocks | **PAGE-LOCAL, intentionally** | Each mirrors its own page's loaded-state radius; no extraction warranted — `DESIGN.md` itself treats these as "radius migrates with loaded counterparts," not shared components. |
| `Squiggle` | **PAGE-LOCAL / UNUSED** | Exported from `primitives.jsx` but has no call sites anywhere in `frontend/src` as of this pass. Not a component to write a contract for; flagged so an implementer doesn't assume it's load-bearing. Not a deletion recommendation — that's a code-architecture decision outside this document's scope — just a factual note. |

---

## 3. Component contracts

### 3.1 `Button`
**File:** `components/ui/primitives.jsx`

**Role:** The single shared interactive-action primitive for the entire app.

**Reuse:** Every page in the product, directly or via a page-local component (`SessionCard`, `EmptyState`, Login, Change Password, Settings, Users, Game Manager forms, Host Monitor's Revalidate/Force-Unlock).

**Design intent:** A physical switch — presses down, sits on a visible offset when at rest (primary/danger-filled), releases flush.

**Variants (KEEP names/semantics — `DESIGN.md` §6.1):** `primary`, `secondary`, `ghost`, `danger`, `dangerFilled`.

**Anatomy:** icon(s) + label, `display:inline-flex`, centered, `gap:8px`.

**Typography:** `fonts.body`, 13px, weight 650, `lineHeight:1`.

**Surface / color per variant (current, verified):**
- `primary`: `background: colors.brand`, `color: colors.bg`.
- `secondary`: `background: colors.bgElevated`, `border: 1px solid colors.borderStrong`.
- `ghost`: transparent, `color: colors.inkDim`.
- `danger`: transparent, `border: 1px solid colors.danger`, `color: colors.danger`.
- `dangerFilled`: `background: colors.danger`, `color: colors.bg`.

**Border / Radius:** current `radius.sm` (8px) → **`radius.none`** (§5.3/§6.1). This is the single highest-blast-radius radius change in the app — every page's primary/secondary/danger buttons inherit it automatically.

**Shadow:**
- `primary`, `dangerFilled` → **`shadow.press`** at rest, compressing to `0 0 0 0` on `:active` (pairs with the existing `onMouseDown` → `translateY(1px)`, which is KEEP, unchanged).
- `secondary`, `ghost`, `danger` (outlined/transparent variants) → **`shadow.flat`** (none). Per §6.1: the hard shadow is reserved for the single primary action per view, not every button.

**States:**
- `disabled`: KEEP — 0.45 opacity, `not-allowed` cursor, unchanged.
- `loading`: KEEP existing icon+label-swap pattern used at call sites (e.g. Login's "Signing in…") — the `Button` component itself has no dedicated `loading` prop; loading is expressed by the caller swapping `children` and setting `disabled`. Do not add a new `loading` prop in this pass — no page-spec section requests one, and doing so would be scope creep beyond token migration.
- `focus-visible`: **ADD `shadow.focusRing`** in addition to the existing native outline, for consistency with inputs (§6.1's explicit instruction).

**Icon buttons (circular variants, e.g. FABs/dismiss buttons):** `radius.full`, no press-shadow — small circular controls stay flat + `translateY` only (§6.1: "a hard shadow at that size reads as clutter"). Note: **no icon-only circular `Button` variant currently exists in the codebase** — every icon-only control found in this pass (mobile-menu button, drawer close button, `iconAddButton`/`iconGhostButton`) is a raw `<button>`, not the shared `Button` component styled as circular. This is a real (if minor) gap: applying this rule requires either (a) treating each of those raw buttons individually per their own page section, or (b) extracting a shared icon-button variant. This document does not mandate (b) — flagged as an option, not a requirement.

**Motion:** `motion.press` (button press/release, alias of `motion.fast`), `motion.hover` (color/background/border-color, alias of `motion.base`) — both already implemented as literal durations in the component; only the *names* are new (§5.6), not the values.

**Do not:**
- Do not give `secondary`/`ghost`/`danger` a resting `shadow.press` — this would violate the "one signal" principle (§4.2) by making every button look equally urgent.
- Do not round the corners between `radius.none` and `radius.full` — no intermediate value.

**Dependencies / tokens:** `colors`, `fonts`, `radius.none`, `shadow.press`/`shadow.flat`/`shadow.focusRing`, `motion.press`/`motion.hover`.

**Pages using it:** all.

---

### 3.2 `Card`
**File:** `components/ui/primitives.jsx`

**Role:** Generic bordered container with an optional hover-lift behavior.

**Reuse:** `SessionCard`, `ErrorBoundary`, Settings' `ThemeSwatchCard`/`CustomThemeSwatchCard`, any other consumer importing `Card` directly.

**Design intent:** A rectangular module — Bauhaus's "shape is a rectangle or a circle" applied to the base container primitive.

**Variants:** `hoverable` (boolean prop) — toggles the hover background/border/lift behavior.

**Anatomy:** single `<div>`, `padding:20px`, children passed through.

**Border / Radius:** current `radius.lg` (16px) → **`radius.none`** (§6.3 default). This is the second-highest-blast-radius change after `Button` — `SessionCard`, theme swatches, and any future `Card` consumer inherit it.

**Surface:** `background: colors.bgCard` (`surface.l3`), `hoverable && hover → colors.bgCardHover` (`surface.l4`) — KEEP, unchanged mechanism.

**Border weight:** `border: colors.border`, `hover → colors.borderStrong` — KEEP, unchanged mechanism (§6.3: "was `borderStrong`-on-hover only — keep that hover EVOLVE").

**Shadow:** `shadow.flat` at rest for the base primitive. `Card` itself does not own `shadow.lift`/`shadow.overlay`/`borderInk` — those are per-consumer decisions layered on via the `style` prop, documented at each consumer's own entry (`SessionCard` §3.6, `ThemeSwatchCard` in Settings). The base `Card` primitive should not bake in a hover shadow, because not every `Card` consumer wants the "interactive/command card" treatment (§6.3 names four distinct `Card` sub-treatments — default, featured, interactive, dense-data — and only one, "interactive/command card," gets `shadow.lift`).

**States:** `hover` (only when `hoverable`) — background/border swap + `translateY(-1px)`, both KEEP mechanism, unchanged.

**Motion:** `motion.hover` (background, border-color, transform transitions) — KEEP mechanism.

**Do not:**
- Do not add `shadow.lift` inside the base `Card` component itself — it must stay opt-in per consumer, or every dense/static `Card` usage (e.g. a non-hoverable info card) would inherit hover behavior meant only for interactive cards.

**Dependencies / tokens:** `colors`, `radius.none`, `motion.hover`.

**Pages using it:** `SessionCard` (Home), Settings' theme swatches, any future consumer.

---

### 3.3 `Chip`
**File:** `components/ui/primitives.jsx`

**Role:** Small inline tone-colored label — used today for `NavigationCard`'s badge slot (e.g. a count) and available generically.

**Reuse:** `NavigationCard` (`tone="blue"`).

**Tones:** `neutral`, `lilac`, `pink`, `blue`, `green`, `yellow`, `success`, `warning`, `danger`, `info` — ten tones currently defined via `CHIP_TONES`.

**Border / Radius:** current `radius.sm` (8px) → **`radius.tight`** (4px). This is the sanctioned small-chrome exception (§5.3, §6.4): `Chip` is a `<span>`-scale element, not a structural panel.

**Typography:** `fonts.body`, 10px, weight 700, `0.09em` letter-spacing, uppercase.

**Semantic-meaning note (§6.4, real gap to flag):** `DESIGN.md` §6.4 instructs "assign fixed semantic meaning to tones per §5.1 rather than leaving `lilac`/`pink`/`blue`/etc. as decorative-only choices a page author picks freely." As of this pass, `Chip`'s ten tones are still purely decorative/caller-chosen — nothing in `Chip`'s own implementation enforces "lilac = orchestration/automation" (§5.1's new `accentLilac` assignment) or "pink = decorative-only, never a status." This is a real, unresolved gap: the token *values* exist (`accentLilac`, `accentPink` are correctly defined in `theme.js`), but `Chip`'s API does nothing to steer callers toward the correct semantic usage. **This document does not propose enforcing this in code** (that would be a component-API redesign, out of scope for a token-values pass) — flagging it as a genuine open item for whoever next touches `Chip`, consistent with `DESIGN.md`'s own "flag gaps rather than inventing a fix" discipline.

**Dependencies / tokens:** `colors` (via `CHIP_TONES`), `fonts`, `radius.tight`.

**Pages using it:** `NavigationCard` (Home's command index).

---

### 3.4 `Spinner`
**File:** `components/ui/primitives.jsx`

**Role:** Circular loading indicator.

**Border / Radius:** `50%` (a true circle, not a `radius` token — this is correct as-is; `radius.full` (999px) and `border-radius:50%` are visually equivalent for a square element, and the existing literal is not a violation worth migrating, since it's already achieving the "round object" geometry the binary system calls for).

**Motion:** `animation: cgo-spin 0.7s linear infinite` — keyframe-based, **non-convertible to a `motion` token** (the same category `HostStatusPanel.jsx`'s own audit comments already document for `hsp-spin`, `badge-pulse`, etc. — `motion`'s four/five named tokens are transition-timing strings, not `@keyframes` names). Leave as the literal.

**Do not:** do not attempt to force this onto a `motion.*` token — there is no equivalent.

**Pages using it:** `EmptyState`'s implicit consumers via `Button`'s `disabled` state is not a spinner use — actual direct `Spinner` usages are scattered inline (e.g. `UserPanel.jsx`'s per-row delete spinner).

---

### 3.5 `EmptyState` (primitive) + `dashboard/components/EmptyState.jsx` (wrapper)
**File:** `components/ui/primitives.jsx` (primitive), `dashboard/components/EmptyState.jsx` (thin wrapper)

**Role:** Shared "nothing here" surface with icon well, message, optional subtext, optional action button.

**Reuse:** Confirmed as the target pattern for: Home (unreachable today), Session History, Recovery, Sunshine, Game Manager, Users, Analytics, and the recommended upgrade target for Host Monitor's currently-bespoke error message (§6 of `PAGE_SPECS.md`, "Host Monitor" section).

**Relationship between the two files:** `dashboard/components/EmptyState.jsx` is **not a duplicate** — it is a documented, intentional wrapper (`label`/`hint` props mapped onto the primitive's `message`/`subtext`) that exists purely so call sites written against the older `dashboard`-local API keep working while all of them share one real implementation. **No consolidation needed or possible beyond what already exists** — this is the correct pattern, not a gap.

**Anatomy:** icon well (48×48px) → message (15px/650/display) → optional subtext (12px/500/body, max-width 340px) → optional `Button variant="secondary"` action.

**Border / Radius:** icon well currently `radius.md` (12px) → **`radius.tight`** (4px, §6.10: "Change icon well radius to `radius.tight`, not `radius.md`").

**Action button:** inherits `Button`'s own migration automatically (secondary variant, flat shadow) — no `EmptyState`-specific change needed beyond the icon well.

**Do not:** do not add a spinner or animation to the icon well — `EmptyState` is a static, calm surface by design (contrast with `LoadingState`, which owns the pulsing-dot pattern).

**Dependencies / tokens:** `colors`, `fonts`, `radius.tight`, `Button` (indirectly, for the action).

**Pages using it:** see Reuse above; effectively every data-bearing page per `DESIGN.md` §6.10 convention.

---

### 3.6 `SessionCard`
**File:** `components/SessionCard.jsx`

**Role:** Renders one enriched, live session — the primary object of the Home page while a session is active.

**Reuse:** Home only, today (built as a reusable domain component; no other current consumer).

**Design intent:** While active, this is the single most important object on the page (§7: "a session should visually outrank everything else on Home while it's running").

**Anatomy:** title row (game name + `StatusBadge`) → countdown block (label/value/played-time/error/warning) → session-ID footer → conditional restart/stop button row.

**Variants:** implicit `isActive` state (derived from `ACTIVE_STATUSES` set: `starting`/`running`/`stopping`/`cleaning`), not an explicit prop.

**Border / Radius:** built on `Card`, so inherits `radius.none` once `Card` migrates. **Active-state border currently:** `1.5px solid colors.accentGreen` (flat, no weight distinction from any other border in the app) → **EVOLVE to `borderInk`** per §6.12/§7: "for the *active* session specifically — the `shadow.lift`/`borderInk` 'featured card' treatment from §6.3, since an active session is the single most important object on the Home page while it exists." Non-active state stays `colors.border` (default).

**Shadow:** currently none. **ADD `shadow.lift` on hover/focus only, not resting** (§6.6 of `PAGE_SPECS.md`: "not resting — a live session card isn't 'interactive' in the click-to-navigate sense... but hover/focus should still lift if the card becomes clickable in the future"). As of this pass, `SessionCard` has no `onClick`/navigation behavior — it is not currently clickable — so the practical near-term effect of this rule is: no resting or hover shadow is strictly required today, but the *component contract* should not preclude adding one later. Do not add a hover shadow to a non-interactive card only to satisfy an unused affordance; implement it when/if the card becomes clickable.

**Typography:** title → `typeScale.subheading` (fontWeight overridden to 700, an intentional small elevation from the prior 15px literal, not a pure alias — documented in the file's own comments as deliberate). Countdown label (`microLabel`) → `typeScale.meta`. Everything else (`user_id`, session ID, played-time, error/warning captions) stays literal per the file's own extensive judgment-call documentation — these are dynamic, arbitrary-case backend strings or intentionally non-bold inline status text, and forcing `typeScale.meta`'s uppercase/700-weight would corrupt content, not just restyle it. **KEEP all of these literal, do not force onto `typeScale` in this pass.**

**Status indicator:** `StatusBadge` — already correctly reused (KEEP, §6.4).

**Countdown block surface:** `surface.l1`, border `1.5px solid colors.border`, radius currently `radius.md` (12px) → **`radius.none`** once the block is treated as a structural inset panel, consistent with the binary system (this is a genuine, if minor, ADD not previously named in `PAGE_SPECS.md` — the countdown block's own radius was not called out in `PAGE_SPECS.md`'s Home section, which only discussed `SessionCard`'s outer border).

**Buttons:** Restart (`secondary`, recolors to `warning` tone when active) and Stop (`danger`) — both raw `Button` usages, inherit the shared primitive's migration automatically. Their `fontSize:10px`/mono styling is an intentional override to match the card's dense internal register and should stay as documented literals (per the file's own judgment-call comments) rather than being forced onto `Button`'s default 13px label size.

**Motion:** entrance `animation: card-in 180ms ease forwards` — keyframe-based, non-convertible (same category as `Spinner`). Border-color transition `150ms ease` — close to but not exactly `motion.base` (160ms); leave as documented literal per the file's existing audit reasoning, do not force an exact-value change.

**Do not:** do not promote `PLAYED: {time}` or the session-ID footer to `typeScale.metric` — these are inline supporting text, not the card's hero number (the card has no single "hero number" the way Host Monitor's readiness stat or `ProgressStat` values do; the countdown value itself, rendered by `LiveCountdown`, is the closer candidate — see §3.11).

**Dependencies / tokens:** `Card`, `Button`, `StatusBadge`, `colors`, `fonts`, `radius.none`, `surface.l1`, `typeScale.subheading`/`meta`, `borderInk` (active state), `shadow.lift` (hover/focus, contingent on future clickability).

**Pages using it:** Home.

---

### 3.7 `StatusBadge`
**File:** `components/StatusBadge.jsx`

**Role:** The canonical shared status indicator for session-lifecycle states.

**Reuse (confirmed, corrected):** `SessionCard` (Home) — confirmed direct import and usage. **Session History does NOT use this component** (see §4.2 — this corrects/resolves `PAGE_SPECS.md`'s own flagged uncertainty).

**Design intent:** Principle #8's canonical implementation — dot + pill + mono label, together, never color alone.

**Anatomy:** pulsing/static dot (6×6px circle) + mono label (9.5px/700/`0.13em`), inline-flex, `radius.full` pill wash background.

**Status vocabulary (`STATUS_CONFIG`, verified exhaustive):** `starting`, `running`, `restarting`, `restarted`, `stopping`, `cleaning`, `completed`, `failed`, `stopped`, plus a `FALLBACK` ("UNKNOWN") for any unrecognized status string. **This is a session-lifecycle vocabulary specifically** — it is not a generic "any status in the app" component, which is the correct scoping distinction from `HostStatusPanel.jsx`'s local `Badge` (host/dependency readiness states, a different vocabulary entirely) — see §4.1.

**Border / Radius:** `radius.full` — **KEEP, already correct** (this is a "round object," per §5.8's vocabulary table: pill-shaped status indicators belong at `radius.full`, not the binary system's `radius.none`).

**Color / semantic behavior:** each status maps to exactly one of `warning`/`success`/`info`/`neutral`/`danger`/`inkDim` — already semantically correct and consistent with §5.1's fixed-meaning table.

**Pulse:** `pulse: true` for `starting`/`running`/`restarting`/`restarted` (active-ish states), `false` for terminal/paused states — correct mapping, no change needed. Animation is keyframe-based (`badge-pulse`), non-convertible to a `motion` token (documented in the file's own comment, correctly).

**States:** stateless functionally — re-renders per `status` prop change. **ADD `motion.transition`** on the color/background swap when `status` changes (§8's "State transition" row explicitly names "a status badge changing tone" as the token's intended use case) — this is not yet implemented; currently a status change re-renders with no transition at all.

**Do not:**
- Do not change `radius.full` to `radius.none` — this is a legitimate, sanctioned exception per the geometric vocabulary, not a migration target.
- Do not add new status keys without also deciding their `pulse`/color mapping explicitly — never let a new status silently fall through to `FALLBACK`.

**Dependencies / tokens:** `colors`, `radius.full`.

**Pages using it:** Home (`SessionCard`). **Not yet used by:** Session History (see §4.2 for the recommendation).

---

### 3.8 `Badge` (local, `HostStatusPanel.jsx`)
**File:** `components/HostStatusPanel.jsx`, line 457

**Role:** Tone-only status pill for host/dependency-level states (readiness, session lock, Sunshine/Tailscale health) — **not** session-lifecycle states.

**Reuse:** Internal to `HostStatusPanel.jsx` only.

**Anatomy:** pill (no dot), mono label, tone-colored border/background/text — structurally similar to `StatusBadge` minus the dot indicator.

**Tone vocabulary:** `ok`, `warning`, `bad`, `info`, `neutral` (via `TONE_COLORS`) — a **different vocabulary from `StatusBadge`'s** session-lifecycle strings, reflecting a genuinely different domain (host/dependency readiness vs. session state).

**Border / Radius:** `radius.full` — already correct (pill/round-object rule), no change.

**Relationship to `StatusBadge` — resolved:** This is a legitimately distinct component serving a distinct domain, **not** a broken duplicate needing consolidation this pass, per `PAGE_SPECS.md` §17's own honest framing ("this document does not mandate consolidating them... flags it so the implementer doesn't assume they're the same component"). This document affirms that framing: the two components have different tone vocabularies, different data domains (session vs. host/dependency), and no dot indicator on the local `Badge` — a real anatomical difference, not just a naming coincidence. **Recommendation: KEEP both, PAGE-LOCAL classification for this one.** If a future pass wants to formally unify the *visual* system (e.g. give the local `Badge` a dot too, for full principle-#8 parity with `StatusBadge`), that is a legitimate future EVOLVE, but is not required by `DESIGN.md`'s "KEEP `StatusBadge` exactly" instruction, since that instruction is scoped to `StatusBadge` itself, not to every tone-pill in the app.

**Missing dot — a real, if minor, gap:** unlike `StatusBadge`, this `Badge` has no dot indicator — text + color only. Per principle #8 ("status is never color-only"), a dot is not strictly required as long as the label text itself is unambiguous prose (e.g. "READY," "LOCKED") rather than relying on color to distinguish otherwise-identical labels — and a spot-check of this file's usage (Session Lock: "LOCKED"/"FREE"; readiness state pills) confirms the labels are always distinct text, not color-coded repeats of the same word. **This is compliant with principle #8 as implemented**, just via a different mechanism (distinct text) than `StatusBadge`'s (dot + text). No change required.

**Dependencies / tokens:** `colors`, `radius.full`, `fonts.mono`.

**Pages using it:** Host Monitor only.

---

### 3.9 `SectionCard` (shared, `dashboard/components/SectionCard.jsx`) vs. `SectionCard` (local, `HostStatusPanel.jsx`)
**Files:** `dashboard/components/SectionCard.jsx` (shared) / `components/HostStatusPanel.jsx` line 482 (local)

#### Shared `SectionCard`
**Role:** General-purpose titled section container with an optional count badge and refresh action.

**Reuse:** Host Monitor's standalone "Session Health" block, Settings (all its section stack), any future page needing a titled section.

**Anatomy:** `<section>` → optional header (`<h2>` title + optional count badge + optional refresh button) → children. Supports `bare` mode (no background/border/padding — used for grouping without visual framing).

**Border / Radius:** background `surface.l3`, border `colors.border`, current radius `16px` (via `.pcgo-section-card` CSS class) → **`radius.none`**.

**Count badge:** `typeScale.meta` (weight/line-height overridden to preserve the tight numeric look), border `colors.borderSubtle`, radius currently `radius.sm` (8px, via the CSS class's own literal, confirmed `border-radius: 8px` is not present — actually the JSX inline style sets `borderRadius: radius.sm`) → **`radius.tight`** (small-chrome scale, a numeral badge).

**Refresh button:** inline `<button>`, `surface.l2` background, `colors.border`, radius `radius.sm` → **`radius.tight`** (small icon-adjacent chrome).

**Typography:** title → `typeScale.subheading` (weight/letter-spacing overridden, documented zero-visual-change alias). Count → `typeScale.meta` (weight/line-height overridden, same pattern).

**Do not:** do not give this `SectionCard` a resting shadow — it is a dense/structural container, not a featured or interactive card (§6.3's "dense data card... stays flat" applies by extension).

**Dependencies / tokens:** `colors`, `motion.base`, `radius.none`/`radius.tight`, `surface.l2`, `typeScale.subheading`/`meta`.

**Pages using it:** Host Monitor (Session Health block), Settings, any future consumer.

#### Local `SectionCard` (`HostStatusPanel.jsx`)
**Role:** Titled sub-section specifically for Host Monitor's dependency/spec-sheet grid (System, Session & Recovery, Sunshine, Tailscale, Diagnostics).

**Reuse:** Internal to `HostStatusPanel.jsx` only.

**Anatomy:** `<div className="pcgo-host-section-card">` → header row (icon + heading, `typeScale.meta`-aligned) → children. **No count badge, no refresh button** — genuinely simpler API than the shared component.

**Border / Radius:** background `surface.l3` (dependency cards) or `surface.l1` (System/Diagnostics "spec sheet" cards, a deliberate one-level recess per `PAGE_SPECS.md` §4), border `colors.borderSubtle`, current radius `12px !important` → **`radius.none`**.

**Relationship to shared `SectionCard` — resolved:** Genuinely different component, confirmed by direct inspection: no count/refresh API, a two-tier elevation choice (`l1`/`l3`) the shared component doesn't have, and an icon-in-header anatomy the shared one lacks. **Recommendation: KEEP both, PAGE-LOCAL classification for the local one, no consolidation this pass** — same reasoning as `Badge`/`StatusBadge` above. `PAGE_SPECS.md` §17's uncertainty #2 is resolved: these are not accidentally-duplicated identical components, they are two different, purpose-built section-container patterns that happen to share a name. A future consolidation is *possible* (a shared `SectionCard` with an optional `icon` prop and optional `surface` override could absorb both), but that is a code-architecture decision this document explicitly does not mandate, per the task brief's Phase 4 instruction ("Do not perform the consolidation now").

**Dependencies / tokens:** `colors`, `surface.l1`/`l3`, `radius.none`, `typeScale.meta`.

**Pages using it:** Host Monitor only.

---

### 3.10 `ErrorBoundary`
**File:** `components/ui/ErrorBoundary.jsx`

**Role:** App-wide React error boundary — catches uncaught render errors and shows a recoverable full-screen card instead of a blank page. Mounted once, high in the tree (`App.jsx`).

**Coverage gap (flagging honestly, per this document's own discipline):** Neither `DESIGN.md` §6 (component language) nor `PAGE_SPECS.md` gives this component a dedicated entry — `DESIGN.md` §14 only lists it as a file location alongside `primitives.jsx`/`Toast.jsx`/`ConfirmDialog.jsx`, with no stated token rules. This document adds the missing entry below, derived from `DESIGN.md`'s general principles (§6.3's "featured/flagship card" rule and §12's "Errors/Recovery" row — "high contrast, strong hierarchy, immediate action"), since this component is functionally PCGO's most serious error-recovery surface (an uncaught render crash) and should follow that register.

**Anatomy:** full-viewport centered container → card (icon well + title + description + optional error-message box + two-button action row + optional collapsible technical-details `<pre>`).

**Border / Radius:**
- Outer card: currently `radius.lg` (16px) → **`radius.none`** (§6.3 default card radius — this card is the featured/flagship element of the only thing on screen, analogous to Login's form panel or Change Password's card).
- Icon well: currently `radius.sm` (8px) → **`radius.tight`** (small icon-scale chrome, same 44×44px category as `ConfirmDialog`'s icon well).
- Error-message box: currently `radius.sm` (8px) → **`radius.tight`** (small inline banner, same category as Login's error banner).
- Technical-details `<pre>`: currently `radius.sm` (8px) → **`radius.tight`**.
- **Action buttons ("Try Again" / "Reload Page"): currently `radius.full` (pill).** See the cross-cutting discrepancy note in §4.5 below — this document does **not** resolve whether these should move to `radius.none` (matching the shared `Button` primitive's shape) or stay pill-shaped as a documented, intentional exception. Flagged as an open item, not silently migrated either direction.

**Shadow:** outer card currently `shadow.overlay` — **KEEP**, this is a genuinely floating/full-viewport-overlay surface (the only content on screen), consistent with §5.5's "reserved for things genuinely floating above content" rule extended to a full-screen recovery state.

**Typography:** title 17px/700/display (a `typeScale.subheading`-adjacent value — not identical, since `subheading` is 17px/600, this is 17px/700 — a small, likely-intentional weight bump for an error headline; leave as documented literal rather than forcing the exact `subheading` weight, since the boldness difference plausibly reflects an intentional "this is more serious" signal). Body copy 12.5px/500/body (close to but not identical to `typeScale.bodySmall`'s 12px — leave literal, same near-miss reasoning used throughout the codebase's own audit comments elsewhere).

**Accent/semantic color:** `danger` throughout (icon well, error-message box) — correct, matches `DESIGN.md` §12's "Errors/Recovery... the one place `danger`'s accent edge should be at its most visible weight" and §7's "errors are unmistakable via shape + border + icon + text together."

**Primary/secondary actions:** "Try Again" (outlined/ghost-weight, `borderInk`) and "Reload Page" (filled, `colors.ink` background) — both currently raw `<button>`s, not the shared `Button` primitive. See §4.5.

**Do not:** do not add `shadow.lift`/hover-lift to the outer card — it is not an interactive/clickable card, it is the only content on the page.

**Dependencies / tokens:** `colors`, `fonts`, `radius.none`/`radius.tight`, `shadow.overlay`.

**Pages using it:** app-wide (wraps the entire `Dashboard`/`AdminDashboard`/`UserDashboard` tree via `App.jsx`), not page-specific.

---

### 3.11 Resource meters (`ProgressStat`, `components/HostStatusPanel.jsx`)
**File:** `components/HostStatusPanel.jsx`, line 541

**Role:** Label + value + horizontal bar meter for CPU/RAM/GPU-load/GPU-temp/VRAM.

**Reuse:** Internal to `HostStatusPanel.jsx` (Diagnostics & Performance section).

**Anatomy:** label (10px/mono) + value (10.5px/mono/700, tone-colored) on one row, track+fill bar below.

**Threshold logic (verified, confirmed correct):** `pct >= 90 → danger`, `pct >= 70 → warning`, else `success`; `!hasValue → inkFaint`. This single threshold function is shared by all five meter instances (CPU, RAM, GPU Load, GPU Temp, VRAM all call the same `ProgressStat` component) — **confirming `PAGE_SPECS.md` §4's request to "verify it's applied to all five meters consistently."** It is: there is only one `ProgressStat` implementation, so the mapping is structurally guaranteed to be consistent across all five call sites, not something that could drift per-meter.

**Typography — value:** currently 10.5px/mono/700 (ad hoc, not on `typeScale`) → **`typeScale.metric`** (§6.11/§5.2's core motivating case for the new step — this is the canonical "standalone number whose entire job is to be read at a glance"). This is a real, visible size increase (10.5px → `clamp(22px, 3vw, 34px)`), not a value alias — implementers should expect this to meaningfully change the Diagnostics & Performance section's visual density, which is the intended effect per `DESIGN.md` §3's stated gap.

**Track / fill:** track `surface.l1`, radius `3px` (a small literal, below `radius.tight`'s 4px) — **leave as-is**; this is a thin meter bar, not a chip or panel, and forcing it to `radius.tight` would be a cosmetic-only, non-token-motivated change with no basis in either design document. Fill: `border-radius: 3px`, `transition: width 0.4s ease` (400ms, non-exact match to any `motion` step — leave literal per the file's own documented audit).

**Do not:** do not switch to a gauge/dial/gradient visualization — §7/§12 explicitly and repeatedly reject this for this exact meter (§4's "Page-specific design rules": "Do not add gauges/dials/circular progress rings here even though 'GPU Temp' might tempt one").

**Dependencies / tokens:** `colors`, `fonts.mono`, `surface.l1`, `typeScale.metric`.

**Pages using it:** Host Monitor only (five instances: CPU, RAM, GPU Load, GPU Temp, VRAM).

---

### 3.12 `NavigationCard` (Home's command index)
**File:** `dashboard/components/NavigationCard.jsx` + `.pcgo-command-card*` in `feature-page.css`

**Role:** Icon + label + description + optional badge + arrow — one tile in Home's 4-up/3-up/2-up/1-up command index.

**Reuse:** Home only.

**Border / Radius:**
- Card: currently `10px` (a bespoke value not even on the old 8/12/16 scale) → **`radius.none`** (§6.14: structural rectangle/module).
- Icon well: currently `8px` → **`radius.tight`** (4px, small icon swatch).

**Shadow:** currently `translateY(-1px)`-only hover → **ADD `shadow.lift` on `:hover`/`:focus-visible`**, replacing the translate-only lift. §6.14: "the component that most benefits from the new hard-shadow treatment, since it's the highest-traffic interactive surface in the product." KEEP the existing `:focus-visible` outline unchanged alongside the new shadow.

**Anatomy (KEEP):** `grid-template-columns: 28px minmax(0,1fr) auto` — icon | label+description | badge+arrow. Arrow (`↗`) shifts color to `colors.brand` and translates `(1px, -1px)` on hover — KEEP, unchanged, this is the canonical example of §5.8's "diagonal arrow = navigation/flow" vocabulary entry.

**Typography:** label (12px/650/display) and description (10px/500/body sans-serif) both stay literal per the file's own documented near-miss reasoning (neither cleanly matches `typeScale.subheading` or `typeScale.meta` without changing font-family/case/weight) — **KEEP, do not force onto `typeScale`.**

**Badge slot:** renders a `Chip` (`tone="blue"`) when a `badge` prop is passed — inherits `Chip`'s own migration (§3.3) automatically.

**Motion:** `motion.hover` (160ms, background/border-color/transform) — already the correct literal value, just needs the named-token association per §5.6.

**Do not:** do not add a resting `shadow.press` — this is a navigation affordance, not the page's primary action (§6.1: hard shadow reserved for one primary action per view; Home's primary action is the launch-session button in `StartSessionForm`, not the command index).

**Dependencies / tokens:** `Chip`, `radius.none`/`radius.tight`, `shadow.lift`, `motion.hover`.

**Pages using it:** Home.

---

### 3.13 `ConfirmDialog` (`ConfirmDialogProvider`)
**File:** `components/ui/ConfirmDialog.jsx`

**Role:** App-wide confirmation modal, replacing native `window.confirm()`.

**Reuse:** User Management (bulk delete), Host Monitor (Force Unlock — not independently verified this pass whether `Force Unlock` currently routes through `useConfirm()`; flagged for implementation-time confirmation, consistent with `PAGE_SPECS.md`'s own conservative flagging style), Game Manager (delete game).

**Accessibility (KEEP entirely, unchanged — `DESIGN.md` §6.7 names this the reference implementation):** focus trap, `inert` on background content, restore-focus-to-opener with a 20-attempt fallback-target search, `Escape`-to-close, `Tab`-cycling within the dialog. **Do not touch any of this logic.**

**Backdrop:** `rgba(0,0,0,0.6)`, keyframe fade-in (`confirm-backdrop-in`, non-convertible to a `motion` token — leave literal).

**Dialog card:**
- Border/Radius: currently `radius.lg` (16px), border `1.5px solid colors.border` → **`radius.none`**, **ADD `borderInk`** edge per §6.7 ("Visual: `radius.none`, `borderInk` edge, `shadow.overlay`").
- Shadow: `shadow.overlay` — **KEEP**, textbook genuinely-floating-overlay use.
- Danger confirmations: **ADD** a `borderInk`-weight top-or-left edge in `danger` color (§6.7: "Danger confirmations get a `borderInk`-weight top or left edge in `danger` color, consistent with the accent-edge vocabulary") — not currently implemented; the only current danger-specific difference is the icon-well tint and the confirm button's background color, no edge treatment. **This is a real ADD**, not yet present.

**Icon well:** 34×34px, radius currently `radius.sm` (8px) → **`radius.tight`**.

**Title/message typography:** 14.5px/700/display (title), 12.5px/500/body (message) — both literal, no `typeScale` step matches cleanly (leave as-is, not previously flagged as needing change by either upstream document, and this pass found no basis to change that).

**Action buttons — flagged discrepancy (not silently resolved):** the cancel/confirm buttons are raw `<button>`s, **not** the shared `Button` primitive, styled with `borderRadius: radius.full` (a pill shape), `minHeight:44px`. Neither `DESIGN.md` §6.7 nor `PAGE_SPECS.md` addresses these buttons' shape specifically — §6.7 only discusses the dialog *card's* radius/border/shadow. Per §5.3's binary system, "the primary Button shape" is explicitly named as a `radius.none` surface, which sits in tension with these buttons' current pill shape. Two readings are both defensible and this document does not pick one:
  1. **Read `radius.full` here as a sanctioned "round object" exception** — a two-button pill row is a distinct micro-pattern (also used identically in `ErrorBoundary`, see §4.5), possibly an intentional "these are the app's calm, low-density confirm/cancel moments" register, closer in spirit to §12's Marketing/Login "expressive edge" allowance than to a dense operational surface.
  2. **Treat this as a REPLACE-candidate**: migrate these buttons to the shared `Button` primitive (`variant="secondary"` for cancel, `variant="dangerFilled"`/`"primary"` for confirm), which would automatically pick up `radius.none` and the correct press-shadow behavior, and would also reduce this to one fewer independently-styled button implementation in the codebase.

  **This document's recommendation:** flag for implementer/design-owner decision before touching this file — do not silently pick either option. Given `DESIGN.md`'s own explicit statement that "there is no component in this codebase that needs to be deleted and rebuilt" (§3, REPLACE section: "Nothing wholesale"), option 1 (documented exception) is the lower-risk, more conservative reading, but option 2 (consolidate onto `Button`) better serves this document's own anti-pattern list (§11's "creating visually similar duplicate components"). **Recorded as an open uncertainty, see §5.**

**Do not:** do not touch the focus-trap/`inert`/restore-focus logic under any circumstances — it is explicitly, repeatedly named as correct and hard-won in both `DESIGN.md` §3 and §6.7.

**Dependencies / tokens:** `colors`, `fonts`, `radius.none`/`radius.tight`, `shadow.overlay`, `borderInk`, `danger`.

**Pages using it:** User Management, Game Manager, Host Monitor (unconfirmed — flag for verification).

---

### 3.14 `Toast` (`ToastProvider`)
**File:** `components/ui/Toast.jsx`

**Role:** App-wide non-blocking notification stack, replacing native `alert()`.

**Status:** **KEEP entirely as the reference implementation of the accent-edge pattern** (`DESIGN.md` §6.8) — `borderLeft: 3px solid tone.color` is already exactly the standard this document and `DESIGN.md` want every other accent-edge instance to converge on.

**Border / Radius:** currently `radius.md` (12px) → **`radius.none`** (the only change this component needs, per §6.8).

**Shadow:** `shadow.overlay` — KEEP, correct floating-layer use.

**Tones:** `success`, `error`, `warning`, `info` — each maps to one semantic color + one lucide icon, correctly pairing color+icon+text per principle #8.

**Motion:** `animation: toast-in 0.18s ease forwards` — keyframe entrance, non-convertible, leave literal (already documented in the file's own comment as a near-miss to `motion.pill`'s 180ms duration but a different easing curve — a coincidental duration match, not a genuine token alias).

**Do not:** do not change the `borderLeft` accent-edge mechanism — it is the canonical example this document and `DESIGN.md` cite for every other accent-edge instance in the app (Host Monitor's dependency-card edges, Home's `ActiveAlerts`, Settings' overview banner) to converge toward.

**Dependencies / tokens:** `colors`, `fonts`, `radius.none`, `shadow.overlay`.

**Pages using it:** app-wide via `useToast()`.

---

### 3.15 `PageHeader`
**File:** `dashboard/components/PageHeader.jsx`

**Role:** Every routed page's `<h1>` + optional back button + optional subtitle + optional actions slot.

**Reuse:** Every routed page except Login (which has its own hero, not `PageHeader`) — highest blast radius of any file after `Button`/`Card`, per the file's own header comment.

**Border / Radius:** back button (`.pcgo-feature-back` CSS class) currently `6px !important` → **`radius.tight`** (this is small icon-adjacent chrome, a back-arrow button, correctly in the sanctioned-exception category — not previously explicitly named in either `DESIGN.md` or `PAGE_SPECS.md`, a minor ADD this document surfaces).

**Typography:** `<h1>` → `typeScale.heading` — already an exact, pre-existing match (the file's own comment confirms this is literally where `typeScale.heading`'s 28px/650/-0.03em was derived from). Subtitle stays literal 12.5px/500/body (documented near-miss to `bodySmall`'s 12px, left alone due to this component's high blast radius — a ~4% size change across every page's subtitle was judged not "close enough" to alias in the file's own prior audit, and this document affirms that judgment call rather than revisiting it).

**Back button:** `typeScale.meta`-aligned (weight/letter-spacing kept at pre-existing values for zero-visual-change), hover → `surface.l2` background + `colors.border`.

**Do not:** do not change the subtitle's font size — this was already a deliberate, documented non-conversion by a prior audit pass, not an oversight.

**Dependencies / tokens:** `colors`, `fonts`, `motion.base`, `surface.l2`, `typeScale.heading`/`meta`, `radius.tight` (back button).

**Pages using it:** every routed page except Login.

---

### 3.16 `ActiveAlerts`
**File:** `dashboard/components/ActiveAlerts.jsx`

**Role:** Home's conditional danger strip, shown when `alerts.length > 0`.

**Border / Radius:** currently `radius.sm` (8px) → **`radius.none`**, per §6's Home EVOLVE note: "migrate to `radius.none` with its existing `border-left` (already effectively an accent-edge per §5.8, just currently drawn with a full border + background wash rather than the cleaner left-edge-only pattern — narrow the treatment to a clean 3px `colors.danger` left edge on a `surface.l1` (not tinted-background) card, matching `Toast.jsx`'s reference pattern)."

**Current implementation (verified):** the component's own inline style sets a full `1px solid rgba(255,107,107,0.3)` border + `rgba(255,107,107,0.10)` tinted background, but the file's own comment notes this is "fully overridden by the `.pcgo-home-alert-strip` CSS rule (background: transparent !important, border: 0 !important / border-left instead)" — meaning **the actual rendered result today already is a left-edge-only treatment**, driven by the CSS class, not the inline style object shown in the JSX. This is a useful clarification for an implementer: **do not assume the inline `style` prop reflects the rendered output** for this component — the CSS class wins. Confirm the actual left-edge width in `.pcgo-home-alert-strip` (not independently re-verified in this pass) and normalize it to 3px if it currently differs, per §5.8's standard.

**Typography:** header label 11px/700/`0.1em`/body-sans (a documented near-miss to `typeScale.meta` — different font family, left literal). Alert rows → `typeScale.bodySmall` (already an exact match, KEEP).

**Do not:** do not add a tinted background wash back in if the CSS override is ever touched — the target state is a clean `surface.l1` card with only a left-edge accent, matching `Toast.jsx`.

**Dependencies / tokens:** `colors.danger`, `fonts.body`, `radius.none`, `typeScale.bodySmall`.

**Pages using it:** Home.

---

### 3.17 `DashboardStats`
**File:** `dashboard/components/DashboardStats.jsx`

**Role:** Row of stat tiles (Active/Total/WebSocket on Home; reusable for the user dashboard too, per its own header comment).

**Reuse:** `SessionSidebar` (Home).

**Border / Radius:** outer container currently `radius.lg` (16px) → **`radius.none`**. Icon badge currently `radius.sm` (8px) → **`radius.tight`**.

**Typography — value:** currently 18px/700/mono (ad hoc, explicitly flagged in the file's own comment as "a large tabular-numeral stat value, a different content category than any typeScale step... left as a literal value") → **`typeScale.metric`**, per §6's Home section: "promote their numeric values to `typeScale.metric` (currently ad hoc sizing inside `DashboardStats.jsx`... flagged here as an instance of the metric-step gap `DESIGN.md` names generally)." This resolves the file's own prior "no step fits" conclusion — `typeScale.metric` did not exist when that comment was written; it now does, and this is exactly the standalone-number use case it was built for.

**Typography — label:** 9px/700/`0.12em`/uppercase/body-sans — documented near-miss to `typeScale.meta` (font-family mismatch, sans vs. mono) — **leave literal**, do not force the font-family change.

**Top accent line:** 2px, tone-colored, 0.7 opacity — this is a distinct micro-pattern from the standard 3px left-edge accent (§5.8) and is not itself named as needing migration by either upstream document. **Leave as-is** — it is a per-tile top accent, not a whole-card left-edge alert, and changing its position/width without a specific instruction from either design document would be an unrequested redesign.

**Dependencies / tokens:** `colors`, `fonts`, `radius.none`/`radius.tight`, `typeScale.metric`.

**Pages using it:** Home (via `SessionSidebar`).

---

### 3.18 `SessionSidebar`
**File:** `dashboard/components/SessionSidebar.jsx`

**Role:** Home's "Live Activity" rail — wraps `DashboardStats` + a bordered `EventLog` feed.

**Border / Radius:** outer rail currently `radius.lg` (16px) → **`radius.none`** (§6's Home EVOLVE note, explicit). Icon badge (ListTree) currently `radius.sm` (8px) → **`radius.tight`**. Event-feed inset container currently `radius.md` (12px) → **`radius.none`** (this is a structural inset panel, not small chrome — not previously explicitly named by either upstream document; a minor ADD this document surfaces, consistent with the binary system's treatment of every other inset content panel in the app).

**Typography:** "Live Activity" caption is documented as a genuine judgment call (13px, sits between `bodySmall` and `subheading`, no clean match) — **leave literal**. Subcaption ("Session & host events") similarly documented as a near-miss — **leave literal**.

**Do not:** do not force either caption onto a `typeScale` step — both are pre-existing, deliberate, documented non-conversions from a prior audit pass, not oversights.

**Dependencies / tokens:** `colors`, `fonts`, `radius.none`/`radius.tight`, `surface.l1`/`l3`, `DashboardStats`, `EventLog`.

**Pages using it:** Home.

---

### 3.19 `SunshineStreamCard` (and its local `Badge`/`StatRow`)
**File:** `components/SunshineStreamCard.jsx`

**Role:** Renders current stream status (streaming vs. idle) inside `SunshineClientManager`'s status card.

**Local `Badge` (line 54) — see §4.1 for full detail:** tone-pill, same `ok`/`warning`/`bad`/`neutral` vocabulary as `HostStatusPanel.jsx`'s local `Badge`, independently reimplemented with a raw, non-tokenized `borderRadius: "10px"` literal (not `radius.sm`, not `radius.full`, not any named token at all). **This is the one raw-radius-literal instance found in this pass that isn't already flagged by `PAGE_SPECS.md`** (which only flagged Game Manager's raw rgba color and Host Monitor's pre-existing rgba, both color literals, not a radius literal). **ADD to the migration list:** this `Badge`'s radius should move to `radius.full` (999px) to match its sibling pill patterns (`StatusBadge`, `HostStatusPanel`'s `Badge`) rather than keeping its own bespoke `10px` value, which sits inside the explicitly-forbidden "medium rounded" gap (§11: "Rounded-corner values between `radius.tight`(4px) and `radius.full`(999px) on structural surfaces — the whole point of §5.3's binary system is that there is no 'medium rounded' default to fall back on"). Although this `Badge` reads more as small chrome than a structural surface, 10px sits in exactly the forbidden middle zone the anti-pattern list names, so the safer target is `radius.full` (matching its two sibling pill components) rather than `radius.tight`.

**Local `StatRow` (line 77):** near-identical label/value anatomy to `HostStatusPanel.jsx`'s `StatRow` — see §4.1's consolidation-candidate framing. No radius of its own (a flex row, not a bordered box) — no migration needed for this sub-component specifically, only the consolidation question (deferred, not actioned).

**Typography:** all four inline font groups in this file are documented literals with no clean `typeScale` match (per the file's own extensive audit comments) — **leave all literal**, consistent with D-005's "refine, don't flatten."

**Reuse:** `SunshineClientManager` (Sunshine page) only.

**Dependencies / tokens:** `colors`, `fonts`, `radius.full` (recommended for `Badge`, see above).

**Pages using it:** Sunshine.

---

### 3.20 Settings' `ThemeSwatchCard` / `CustomThemeSwatchCard` / `LinkRow`
**File:** `dashboard/pages/SettingsPage.jsx`

**Role:** `ThemeSwatchCard`/`CustomThemeSwatchCard` — clickable theme-selection tiles built on the shared `Card` primitive with `hoverable`. `LinkRow` — navigation shortcut row (Change Password, Logs).

**`ThemeSwatchCard`/`CustomThemeSwatchCard`:**
- Built directly on `Card` (`hoverable`), so inherits `Card`'s `radius.none` migration automatically — **no swatch-card-specific radius override needed.**
- The circular color swatch inside (`borderRadius: "50%"`, 25×25px) is already correctly a "round object" per §5.8's vocabulary (a rectangle container holding a circular object) — **no change needed, this is exactly the pattern the binary system endorses**, confirming `PAGE_SPECS.md` §12's own note that "a `radius.none` swatch card holding a `radius.full` circular color swatch inside it is visually fine and consistent with the binary system."
- Selected state: currently a colored border only (`selected ? theme.brand : colors.border`) — `PAGE_SPECS.md` §12 flags an optional `borderInk` edge as a stronger "this is the active choice" signal; **this document does not mandate it**, consistent with `PAGE_SPECS.md`'s own "reasonable, optional EVOLVE if implementation time allows" framing. Recorded as available, not required.
- Typography (theme label, 12px/650/display/lineHeight-1; custom-hex label, 8.5px/500/mono) — both documented literals, no `typeScale` match, **leave as-is**.

**`LinkRow`:**
- CSS-class-driven (`.pcgo-settings-link-row`), currently `radius: 9px` → **`radius.none`** (a structural row, not small chrome — it spans the section's full width and functions like a list row, not a chip).
- Icon well (`.pcgo-settings-link-row__icon`) currently `radius: 8px` → **`radius.tight`**.
- Typography: label 12px/650/display (a near-miss to no step — leave literal), description 9px/500/mono (leave literal).

**Do not:** do not add `shadow.lift` to `LinkRow` — it is a navigation row, not a featured/interactive card in the §6.3 sense; its existing background-shift hover is the correct, sufficient affordance (consistent with §6.14's distinction between command cards, which get lift, and plain navigation links, which don't).

**Dependencies / tokens:** `Card` (swatches), `colors`, `fonts`, `radius.none`/`radius.tight`.

**Pages using it:** Settings only.

---

## 4. Overlaps, discrepancies, and corrections — investigated in detail

### 4.1 Consolidated duplicate-pattern findings (`Badge`, `StatRow`, `StatTile`)

Beyond the two overlaps `PAGE_SPECS.md` §17 already named (`Badge`/`StatusBadge`, `SectionCard` local/shared), direct inspection of the full component set in this pass surfaced **three more near-identical, independently-implemented local patterns** not previously written down anywhere in `DESIGN.md` or `PAGE_SPECS.md`:

| Pattern | Instance A | Instance B | Verdict |
|---|---|---|---|
| Tone-pill "Badge" | `HostStatusPanel.jsx` (`ok`/`warning`/`bad`/`info`/`neutral`, `radius.full`) | `SunshineStreamCard.jsx` (`ok`/`warning`/`bad`/`neutral`, raw `10px` radius) | **DUPLICATE / CONSOLIDATION CANDIDATE.** Same job, same tone vocabulary (minus `info`), drifted literal values. The `SunshineStreamCard.jsx` file's own header comment even says it was "reworked to match the StatRow/Badge 'spec sheet' look already used everywhere else inside its parent, `HostStatusPanel.jsx`" — i.e., visual parity was the explicit intent, making the current implementation drift (raw `10px` vs. `radius.full`) a bug relative to that stated intent, not a deliberate variation. |
| Label/value "StatRow" | `HostStatusPanel.jsx` | `SunshineStreamCard.jsx` | **DUPLICATE / CONSOLIDATION CANDIDATE**, same reasoning as above — same file, same "match the parent's look" stated intent. |
| Icon-badge + big-mono-value "StatTile" | `RecoveryStats.jsx` | `SessionAnalytics.jsx` | **DUPLICATE / CONSOLIDATION CANDIDATE**, weaker case (no cross-referencing comment tying the two together), but the same anatomy independently built twice. |

**Recommendation (consistent with the task brief's Phase 4 instruction not to perform consolidation now):** these three pairs are better consolidation candidates than either of the two `PAGE_SPECS.md` already named, precisely because the `SunshineStreamCard.jsx`/`StatRow`/`Badge` pair has documented, in its own source comments, an *intent* to match rather than diverge — meaning the current duplication is closer to an implementation gap than an intentional design choice. **This document does not perform the consolidation.** It records the finding so a future extraction pass (e.g. a shared `dashboard/components/StatusPill.jsx` and `dashboard/components/SpecRow.jsx`) has a concrete, evidence-based starting point instead of guessing at candidates.

### 4.2 Session History's status rendering — `PAGE_SPECS.md` §17 uncertainty #3, resolved

Direct inspection of `components/SessionHistory.jsx` confirms: **it does not use `StatusBadge`.** It has its own local `getStatusBadge(item)` function (line 39) returning `{ key, text, color, icon }`, rendered inline as `<icon> <span>{text}</span>` colored to match, alongside a 2px `borderLeft` on the record card.

**This is not a principle-#8 violation** — color, icon, and text are all present together, exactly satisfying "status is never color-only." **It is, however, a different visual device from `StatusBadge`** (no pill/wash background, no dot, a plain colored icon+text pair instead) and a different left-edge width (2px vs. the app-wide 3px standard).

**Recommendation, consistent with `PAGE_SPECS.md` §10's own ADD note:** two paths are available, and this document does not mandate one over the other, since — like the `ConfirmDialog` button-shape question in §4.5 below — this is a genuine design-register decision, not a pure token-migration fact:
1. **Migrate to `StatusBadge`** for full visual consistency with Home's session cards (Session History and Home both describe session states, so using the identical component would make the "same data, different view" relationship `PAGE_SPECS.md` §10 describes even more legible).
2. **Keep the bespoke icon+text device**, on the theory that Session History's denser, more literal register (already established by `PAGE_SPECS.md` §10 as "High... comparable to Users, slightly less raw than Logs") is better served by a flatter, less decorative status indicator than `StatusBadge`'s pill/wash treatment — and normalize only the left-edge width to 3px for consistency with the app-wide accent-edge standard.

**This document's lean, stated as a recommendation, not a mandate:** option 2, on density grounds — but flags this explicitly as a judgment call for whoever implements Session History, not a settled fact.

### 4.3 `ErrorBoundary` — an uncovered shared component

See §3.10 for the full contract. **Summary of the gap:** `DESIGN.md` names this file only as a storage location (§14), giving it zero component-language treatment in §6, and `PAGE_SPECS.md` never mentions it at all (it is not a routed page). This document adds the missing entry, derived from adjacent, analogous rules already established for `ConfirmDialog` (§6.7) and the app's general Errors/Recovery register (§12).

### 4.4 Corrections to `PAGE_SPECS.md`

Direct inspection in this pass surfaced a small number of factual corrections to guesses `PAGE_SPECS.md` itself flagged as unverified ("confirm during implementation," "not independently line-verified"):

1. **Game Manager's `iconAddButton` is not circular.** `PAGE_SPECS.md` §7 guessed it is "almost certainly... a circular add button per its hover-color treatment" and recommended migrating it to `radius.full`. Direct inspection shows it is a 30×30px square button with `borderRadius: radius.sm` (8px) — **not circular**. Corrected target: `radius.tight` (4px, small square icon-chrome), not `radius.full`. `iconGhostButton` (same file) is identically shaped and gets the same corrected target.

2. **Recovery's "ad-hoc metric" stat is not the sentence headline.** `PAGE_SPECS.md` §5 describes "`.pcgo-recovery-summary strong` (15px inline stat...)" as the ad-hoc-metric-gap instance needing `typeScale.metric`. Direct inspection shows this CSS selector's `<strong>` actually renders the *prose* headline ("Recovery is stable" / "Recovery needs attention") — a sentence, not a number, and a poor fit for `typeScale.metric` regardless of size. The genuine standalone numbers on this page are the **RECOVERIES / FAILURES counts**, rendered via a *different* selector (`.pcgo-recovery-summary > div:last-child strong`, 16px/700/mono) that `PAGE_SPECS.md` did not separately name. **Corrected target:** apply `typeScale.metric` to the RECOVERIES/FAILURES count numbers, not the prose headline; leave the prose headline's 15px/650/display styling as a literal (it is a sentence-length status message, not a metric).

3. **Users' "selected row" ADD item does not currently apply.** `PAGE_SPECS.md` §8 flags a bulk-selection "selected row" state as a possible ADD, contingent on confirming whether `UserPanel.jsx` has checkbox-based multi-select. Direct inspection shows **no such mechanism exists** — "Bulk account cleanup" is a single, criteria-based danger button ("Remove excess accounts," which removes every account except the oldest administrator), not a per-row checkbox selection UI. **There is currently nothing to decorate with a selected-row treatment on this page** — the ADD item is moot until/unless a genuine multi-select UI is built, at which point §6.5's spec (already correctly written) should be applied.

4. **Analytics' aggregate metric, located.** `PAGE_SPECS.md` §9 flags that "the actual big numbers... were not shown in the grepped snippet in this pass" and asks for implementation-time confirmation. Direct inspection locates it: `SessionAnalytics.jsx`'s local `StatTile` component (distinct from Recovery's `StatTile` of the same name, see §4.1) renders its value at 17px/700/mono. **This is the aggregate-metric-promotion target** for Analytics. Note this is a larger jump (17px → `typeScale.metric`'s 22–34px clamp) than most other metric-promotion instances in the app, which are mostly 10–19px literals — flag this specific instance as worth a visual sanity-check during implementation, per `DESIGN.md` §4's own note that Host Monitor is "the page to tune [`typeScale.metric`'s clamp values] against... if the step's clamp values feel wrong anywhere" — Analytics' larger jump is a second, independent data point for that same tuning question.

### 4.5 ConfirmDialog / ErrorBoundary action-button shape — a genuine, unresolved discrepancy

Both `ConfirmDialog.jsx` and `ErrorBoundary.jsx` independently implement a two-button, pill-shaped (`radius.full`) action row, styled with raw `<button>` elements rather than the shared `Button` primitive. Neither `DESIGN.md` nor `PAGE_SPECS.md` addresses this pattern — both documents discuss each dialog's *card* geometry only. Per the critical documentation rule to investigate and explicitly document discrepancies rather than silently resolving them: **this document does not pick a direction.** See §3.13 and §3.10 for the two-reading framing (sanctioned pill exception vs. consolidate onto shared `Button`). Recorded as an open uncertainty for a design-owner decision — see §5.

---

## 5. Unresolved uncertainties (flagging honestly, per the same discipline `DESIGN.md` §16 and `PAGE_SPECS.md` §17 used)

1. **ConfirmDialog/ErrorBoundary pill-shaped action buttons** (§3.13, §3.10, §4.5) — keep as a sanctioned `radius.full` exception, or migrate both to the shared `Button` primitive (`radius.none`)? Not resolved by either upstream document; this document frames both readings but does not choose.
2. **Session History's status device** (§4.2) — migrate to `StatusBadge` for full cross-page consistency with Home, or keep the current bespoke icon+text device (normalizing only the left-edge width to 3px) to preserve this page's denser register? This document leans toward keeping the bespoke device on density grounds, but states this as a recommendation, not a settled fact.
3. **Chip's semantic-tone enforcement** (§3.3) — `DESIGN.md` §6.4 asks for `Chip`'s ten tones to carry fixed semantic meaning rather than being freely caller-chosen, but implementing that is an API-level change this document does not attempt to design. Flagged as an open gap between the stated design intent and the component's current, purely-decorative API.
4. **`StatRow`/`Badge`/`StatTile` consolidation candidates** (§4.1) — three genuine near-duplicate pairs identified, none consolidated. A future extraction pass has concrete, evidence-based targets (`HostStatusPanel`↔`SunshineStreamCard`'s `Badge`/`StatRow`; `RecoveryStats`↔`SessionAnalytics`'s `StatTile`) but this document does not perform the extraction, per the task brief's explicit "do not create unnecessary abstractions" / "do not perform the consolidation now" instructions.
5. **`SunshineStreamCard.jsx`'s local `Badge` raw `10px` radius** (§3.19) — recommended target is `radius.full` (matching its two sibling pill components), but this is this document's own inference from the anti-pattern list's "no medium-rounded default" rule, not an explicit instruction from either upstream document — flag for confirmation before treating it as settled.
6. **Host Monitor's Force Unlock — does it route through `useConfirm()`?** (§3.13) — not independently verified in this pass; `PAGE_SPECS.md` also does not confirm this. Low-risk, quick to check during implementation.
7. **Squiggle** (`primitives.jsx`) — exported, zero call sites found in this pass. Not necessarily dead code (could be intended for near-future use), but flagged so an implementer doesn't assume it needs a token migration pass of its own before confirming it's actually rendered anywhere.

---

## 6. Implementation dependency order

Determined from actual dependencies verified in this pass (which files `import` which), not copied from a generic template:

1. **`theme.js` token additions** (`radius.none/tight/full` aliases, `shadow.press/lift/focusRing`, `typeScale.metric`, `motion.press/hover/transition/entrance`) — `DESIGN.md` §5's prerequisite migration. Nothing below can be meaningfully implemented before this lands, since every component contract in §3 above cites these token names.
2. **`components/ui/primitives.jsx`** (`Button`, `Card`, `Chip`, `Spinner`, `EmptyState`) — the highest-blast-radius file in the app; `SessionCard`, `ErrorBoundary`'s (potential) future `Button` migration, Settings' theme swatches, and effectively every page's buttons inherit from this file. Do this immediately after step 1.
3. **`components/StatusBadge.jsx`** — small, isolated, no dependents inside this pass's scope beyond `SessionCard` (already correct per KEEP) — low-risk, can happen in parallel with step 2.
4. **`dashboard/components/SectionCard.jsx`, `PageHeader.jsx`, `NavigationCard.jsx`, `DashboardStats.jsx`, `ActiveAlerts.jsx`, `SessionSidebar.jsx`, `EmptyState.jsx`/`LoadingState.jsx`** — the shared `dashboard/components` layer. All depend on step 1's tokens and (for `NavigationCard`'s badge slot) step 2's `Chip`. Do these together, since they collectively cover every routed page's header/navigation/empty-state chrome.
5. **`components/ui/Toast.jsx`, `ConfirmDialog.jsx`, `ErrorBoundary.jsx`** — the feedback/dialog layer. Each is a near-no-op radius change (`radius.md`→`none` for Toast; `radius.lg`→`none` plus a `borderInk` ADD for ConfirmDialog; the new §3.10 contract for ErrorBoundary) — but **ConfirmDialog's/ErrorBoundary's button-shape question (§5, item 1) should be decided before this step**, since it changes whether this step also touches the shared `Button` primitive's call sites inside these two files.
6. **`dashboard/layout/Sidebar.jsx`, `DashboardHeader.jsx`, `MobileHeader.jsx`** — the shell frame. Depends only on step 1's tokens; independent of steps 2–5, can happen any time after step 1.
7. **Page-local components with their own bespoke geometry** (`HostStatusPanel.jsx`'s `Badge`/`SectionCard`/`StatRow`/`ProgressStat`, `SunshineStreamCard.jsx`, `RecoveryStats.jsx`/`RecoveryEvents.jsx`, `SessionAnalytics.jsx`, `SessionCard.jsx`, `SessionHistory.jsx`, `GameManager.jsx`, `UserPanel.jsx`, `SettingsPage.jsx`/`SettingsPanel.jsx`, `ChangePasswordPage.jsx`, `NotFoundPage.jsx`) — each depends on steps 1–2 (tokens + primitives) and, where applicable, step 3 (`StatusBadge`, for the Session History decision in §5 item 2). These can proceed in any order relative to each other once steps 1–4 land, since none of them import from one another. Recommended order within this group, by page-navigation position (matching `PAGE_SPECS.md`'s own ordering): Home → Host Monitor → Recovery → Sunshine → Game Manager → Users → Analytics → Session History → Logs (near-no-op) → Settings → Change Password → Not Found.
8. **Login** — last, by design: it is already the closest-to-correct page in the app (`DESIGN.md` §12/§14's standing reference implementation) and needs only the four small radius changes named in `PAGE_SPECS.md` §2. Doing it last means every other page's migration can be visually checked against an unchanging reference point throughout the rest of the implementation pass.

---

## 7. Final verification

- `DESIGN.md` read completely (all 464 lines, including the previously-truncated §5.2–§6.3 and §3 KEEP/EVOLVE tables) — confirmed.
- `PAGE_SPECS.md` read completely (all 1055 lines, including every page section 1–14, the cross-cutting shared-components table in §15, the consistency checklist in §16, and the open-uncertainties list in §17) — confirmed.
- Component files actually inspected (not assumed from either upstream document): `theme.js`, `primitives.jsx`, `StatusBadge.jsx`, `Toast.jsx`, `ConfirmDialog.jsx`, `ErrorBoundary.jsx`, `HostStatusPanel.jsx` (including its local `Badge`/`SectionCard`/`StatGrid`/`StatRow`/`ProgressStat`), `SectionCard.jsx` (shared), `SessionCard.jsx`, `SessionHistory.jsx`, `SunshineStreamCard.jsx`, `SunshineStreamHistory.jsx`, `SunshineClientManager.jsx` (grep-level), `RecoveryStats.jsx`, `RecoveryEvents.jsx` (partial), `GameManager.jsx` (targeted sections), `SessionAnalytics.jsx` (targeted sections), `UserPanel.jsx` (targeted sections), `SettingsPage.jsx`, `Sidebar.jsx`, `PageHeader.jsx`, `DashboardHeader.jsx`, `MobileHeader.jsx`, `NavigationCard.jsx`, `DashboardStats.jsx`, `ActiveAlerts.jsx`, `SessionSidebar.jsx`, `EmptyState.jsx` (dashboard wrapper), `Login.jsx`, plus the relevant `feature-page.css` blocks for each of the above.
- Duplicate/overlapping components investigated: the two `PAGE_SPECS.md` already named (`Badge`/`StatusBadge`, `SectionCard` local/shared — both affirmed as legitimately-distinct, PAGE-LOCAL, no consolidation this pass) plus three newly-surfaced pairs (`Badge` in `SunshineStreamCard.jsx`, `StatRow` in `SunshineStreamCard.jsx`, `StatTile` in `SessionAnalytics.jsx` — all three flagged as stronger consolidation candidates than the two already-named pairs, none consolidated).
- Intentional page-specific exceptions preserved: Logs' dense literal typography (untouched, §3.19 of `PAGE_SPECS.md` deliberately not revisited here since this document doesn't re-litigate page-level typography decisions already settled there), Login/Change-Password's sibling framing, Session History/Analytics' detail/aggregate pairing, Settings' calm register, Sidebar's `radius.tight` (not `radius.none`) exception for its nav rows.
- Token names cross-checked against `theme.js`'s actual current exports and `DESIGN.md` §5's proposed new ones — no invented token names used anywhere in this document; the one deviation (`SunshineStreamCard.jsx`'s `Badge` recommended target of `radius.full`) is explicitly flagged as this document's own inference, not presented as an existing instruction.
- No application code was modified. No files outside `.ai/design/` were created or changed.
- `.ai/design/COMPONENT_SPECS.md` exists (this file).
- This document was read once after writing, and one internal inconsistency was corrected during that pass: an earlier draft of §3.6 stated the `SessionCard` countdown block's radius as already `radius.none`; corrected to reflect its actual current value (`radius.md`/12px) before finalizing.

---

## Summary (for a reader who wants the short version)

- **Two overlaps `PAGE_SPECS.md` already flagged** (`Badge`/`StatusBadge`, `SectionCard` local/shared) are **confirmed as legitimately distinct components**, not accidental duplicates — both classified `PAGE-LOCAL`, no consolidation recommended this pass.
- **Three new overlaps found**, not previously written down: a second local `Badge` and a second local `StatRow` (both in `SunshineStreamCard.jsx`, mirroring `HostStatusPanel.jsx`'s originals) and a second `StatTile` (in `SessionAnalytics.jsx`, mirroring `RecoveryStats.jsx`'s). All three classified `DUPLICATE / CONSOLIDATION CANDIDATE` — stronger candidates for a future extraction than the two `PAGE_SPECS.md` already named, since at least one pair's own source comments document an *intent* to match rather than diverge.
- **One component entirely missing from both upstream documents** (`ErrorBoundary.jsx`) now has a full contract (§3.10), derived from adjacent, already-established rules rather than invented from scratch.
- **One genuine, unresolved design-register question** (`ConfirmDialog`/`ErrorBoundary`'s pill-shaped action buttons vs. the binary radius system) is recorded, not silently resolved either direction.
- **Four small factual corrections to `PAGE_SPECS.md`'s own flagged guesses** are recorded in §4.4 (Game Manager's button shape, Recovery's actual metric target, Users' moot selected-row ADD, Analytics' located metric value).
- **No code was written or changed.** This is a documentation artifact only.