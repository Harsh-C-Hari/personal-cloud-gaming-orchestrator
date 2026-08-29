# PCGO Frontend Design Language
### Direction: **Tactical Console Brutalism**
*(supersedes `.ai/DECISIONS.md` D-008 "Calm Editorial + Layered Depth"; builds on D-009's token foundation)*

> Status: proposed design language, not yet implemented. No component or page has been changed to produce this document. This is the source of truth the next implementation pass should build against.

---

## 0. How to read this document

This is not a generic design-system template. Every rule below was derived from two things:

1. **A direct audit of `frontend/`** — the actual React/JSX + hand-written CSS + `theme.js` token file that exists today, including the six-theme system, the `typeScale`/`surface` L0–L4 foundation laid down in D-009, and the mature per-page CSS vocabulary in `feature-page.css`.
2. **Eight supplied reference design languages** (Swiss, Newsprint, Neo-Brutalism, Bauhaus, Kinetic Typography, Playful Geometric, Bold Typography, Hand-Drawn) plus Apple/Notion/Vercel reference docs, mined for principles, not copied for skins.

Wherever a rule says **KEEP**, it names something already in the code that is correct and should not be touched for visual reasons. **EVOLVE** means the mechanism is right but the values need to change. **REPLACE** means the current approach actively fights the new direction. **ADD** means a genuine gap. This vocabulary is used throughout so a future engineer (or Claude session) can tell at a glance whether a change is a refinement or a rewrite.

---

## 1. What PCGO is, and what that means for the UI

PCGO is a **personal cloud-gaming orchestrator** — a control plane for one gaming host: sessions, GPU/CPU/RAM, streaming (Sunshine), networking (Tailscale), recovery, logs, users. It is operated by its owner, not sold to strangers. The UI's job is to make a single, powerful machine feel **legible, obedient, and honest about its state** — not to look like a marketing site for a SaaS product that happens to have a dashboard bolted on.

That reframes the whole brief: PCGO is a **physical control panel for a cloud-gaming machine**, not a "gamer" product and not a generic admin template. Every decision below is filtered through that sentence.

---

## 2. Direction: Tactical Console Brutalism

**Definition:** structural clarity and information density (Swiss, Newsprint) expressed through visible, physical, tactile chrome (Neo-Brutalism, Bauhaus) on PCGO's existing OLED-capable dark foundation, with typography carrying system state the way a kinetic poster carries a headline — scaled down from "poster" to "instrument panel." A small, disciplined amount of Playful Geometric energy is permitted, but only at the edges of the product (marketing/login, empty states, success moments) — never inside dense operational surfaces.

**One sentence to keep on the wall:** *structure is drawn, not implied; state is shown in geometry and number, not just in a color; density is earned by the page's job, not applied uniformly.*

### 2.1 Per-reference synthesis — what PCGO inherits, adapts, or rejects

| Reference | KEEP | ADAPT | REJECT |
|---|---|---|---|
| **Swiss / International Typographic** | Grid discipline, objective hierarchy, one accent color doing one job, generous but purposeful negative space in explanatory contexts | The "extreme" headline scale (text-9xl) — PCGO's hero moments (Login, Home) stay large but not billboard-large, since this is a working tool opened dozens of times a day | Pure white canvas — PCGO stays dark |
| **Newsprint** | High-density editorial hierarchy, visible grid lines/dividers as structure, monospace for data/timestamps/metadata, sharp rectangular geometry | Serif display type is not adopted (Space Grotesk stays), but the *idea* of a distinct display face vs. a distinct data face is kept and sharpened | Cream/off-white paper background, editorial illustration ornaments |
| **Neo-Brutalism** | Visible, load-bearing borders; buttons that mechanically "press"; cards that "lift" on hover; confidence — nothing apologizes for existing | Hard offset shadows are adopted but recolored for OLED (ink/brand-tinted offset, not pure-black blocks, which vanish on a black canvas) and used **only** on high-emphasis interactive surfaces, not everywhere | Rotated "sticker" elements, halftone/noise textures as default background, cream canvas, rainbow multi-hue palette, `border-4` maximalism everywhere |
| **Bauhaus** | Binary geometry philosophy ("a shape is a rectangle or a circle, nothing in between"), primary-shape vocabulary (circle/square/line/arrow) mapped to meaning, one color per section doing a job | Primary-color blocking is adapted into PCGO's existing single-accent-per-theme system rather than introducing red/blue/yellow simultaneously | Light off-white canvas, literal primary-color sections |
| **Kinetic Typography** | Numbers and state as the visual hero; type-as-structure; snappy, direct, non-floaty motion timing | Scale contrast between a metric and its label is adopted (already present in `ProgressStat`/host-readiness patterns) at PCGO's working scale, not poster scale | Marquees, oversized decorative background numbers, constant motion, uppercase-everything |
| **Playful Geometric** | "Stable grid, wild decoration" as a philosophy — content areas stay calm; a small amount of geometric personality lives in chrome (accent shapes, brand mark), not in data | Rounded-pill buttons/badges are kept for exactly the elements Bauhaus's binary rule allows (pills, dots, toggles) | Pastel palette, floating decorative blobs/rings, illustration-led hero sections |
| **Bold Typography** | Type as hero, restrained palette discipline ("black, white, one accent — maybe two"), underlines as an interactive affordance for text-only actions | — | Extreme 8–12rem display sizes; PCGO's "hero" is a stat or a session name, not a magazine headline |
| **Hand-Drawn / Sketch** | Nothing structural | The *spirit* of imperfection is rejected outright for an infrastructure tool — but is worth naming so nobody accidentally reaches for it | Wobbly borders, irregular radii, sketch textures — 0% adoption. A control plane that looks hand-drawn reads as untrustworthy, not charming |

### 2.2 What this is not

Explicitly not: cyberpunk, neon/RGB gaming aesthetics, glassmorphism, generic SaaS dashboard, generic admin template, gradient-heavy hero sections, childish cartoon UI, chaotic uncontrolled brutalism, a literal skin of any single reference above.

---

## 3. Codebase audit summary

**Stack (verified by direct inspection, not assumed):**
- React 18 + Vite, plain `.jsx` (no TypeScript), no Next.js.
- **No Tailwind** — removed on purpose (`.ai/DECISIONS.md` D-003). Styling is 100% hand-written CSS (BEM-style classes, e.g. `pcgo-host-status-panel__header`) plus inline style objects that reference `dashboard/theme.js` tokens.
- No component library, no shadcn/ui, no Radix. All primitives (`Button`, `Card`, `Chip`, `Spinner`, `EmptyState`) are hand-rolled in `src/components/ui/primitives.jsx`.
- Icons: `lucide-react` (primary) and `react-icons` (secondary/legacy).
- No animation library — motion is CSS transitions/keyframes only.
- Theming: a single `[data-theme="…"]` attribute on the root swaps ~15 CSS custom properties per theme, defined once in `App.jsx`'s injected `GLOBAL_CSS` string. Six themes exist today: default (amber), `verdant`, `ember`, `classic`, `mono`, `oled`. A seventh "custom" theme is derived at runtime (`theme-derive.js`) from a user-picked color.
- `theme.js` re-exports those CSS variables as a JS object (`colors`) plus genuinely new tokens: `surface.l0`–`l4` (elevation ladder, D-009), `typeScale` (six-step type scale, D-009), `spacing`, `radius`, `shadow`, `motion`.

**KEEP (already correct, do not touch for visual reasons):**
- The CSS-variable + `theme.js`-mirror architecture. It already supports six dark themes cleanly; nothing about Tactical Console Brutalism requires changing *how* theming works, only *what values* live in it.
- The `surface.l0`–`l4` elevation ladder. This is the right mechanism for OLED depth (contrast, not blur) and is exactly what section 10's "shadows and depth" goal asks for. Extend it; don't replace it.
- `typeScale`'s existence and its derivation method (real de-facto sizes promoted to tokens, not invented). Extend the scale; keep the method.
- Per-page CSS "vocabulary" in `feature-page.css` (Home = flagship, Host Monitor = readiness command center, Logs = operational evidence, Session History = records, Settings = configuration workspace, etc.). This is already section 19's "differentiate product surfaces" requirement, half-built. Audit and sharpen it; do not throw it away.
- The accessibility engineering in `ConfirmDialog.jsx` (focus trap, `inert`, restore-focus-to-opener, fallback focus target) and the WCAG-AA contrast pass already done on `inkGhost`/`inkFaint` across all six themes (P7-T05 in the changelog). This is hard-won and correct.
- The geometric vocabulary that already exists organically, even though nobody named it yet: status dots (`StatusBadge`, `.pcgo-home-signal`), left-edge accent bars for alerts and readiness state (`Toast.jsx`'s `borderLeft: 3px solid tone.color`, `.pcgo-host-readiness-summary--ok/warning/bad`, `.pcgo-home-alert-strip`), and hover arrows signaling navigation (`.pcgo-command-card__arrow`). Section 12 below formalizes and extends this instead of inventing a new vocabulary from zero.
- Button's mechanical press (`onMouseDown` → `translateY(1px)`), Card's hover lift (`translateY(-1px)`) — these are already the Neo-Brutalism "physical" interaction pattern, just under-expressed (no shadow to compress). See §7.5.
- Reduced-motion handling (global `prefers-reduced-motion` block in `App.jsx`) and the six-canonical-breakpoint QA discipline (1440/1024/768/390/360) referenced throughout the changelog.

**EVOLVE (mechanism is right, values need to change):**
- `radius` scale: currently 8/12/16/999. Too uniformly soft for a "physical control panel." See §7.3.
- `shadow` scale: currently two blurred halo shadows (`0 18px 50px rgba(0,0,0,.38)` and `0 8px 24px rgba(0,0,0,.45)`). Blurred shadows barely register on OLED black and read as generic-SaaS. See §7.4.
- Border weight/opacity system (`border` / `borderSubtle` / `borderStrong` / `borderInk`): the tokens are right, but `borderInk` (full-opacity) is defined and almost never used. Structural panels should reach for it more.
- `motion.pill`'s cubic-bezier and `motion.cardIn`'s 220ms are fine values; they just need explicit new use-cases (state transitions, data updates) rather than living only in nav pills and toasts.

**REPLACE (fights the new direction):**
- Nothing wholesale. There is no component in this codebase that needs to be deleted and rebuilt. This is a genuinely mature system; Tactical Console Brutalism is a *token and detailing* pass, not a rewrite.

**ADD (real gaps):**
- No dedicated "metric/statistic" typographic step (large bold tabular-mono numbers) — every big number today (host readiness stat, session counts, analytics metrics) uses a slightly different ad-hoc size, as the changelog itself documents repeatedly ("does not land cleanly on typeScale.heading"). §7.2 adds `typeScale.metric`.
- No formalized hard-shadow/"press" token family. §7.4.
- No documented geometric-vocabulary spec — it exists in practice but nowhere in writing, so new pages don't reliably reuse it. §12.
- No marketing/landing surface exists yet (PCGO opens straight to Login). §14 defines the intended personality for if/when one is built, using Login as the closest existing analog.

---

## 4. Design principles

1. **Structure is drawn, not implied.** Panels, cards, and data rows get a real, visible edge (border) before they get anything else. No floating content on gradients.
2. **OLED darkness, one signal color.** The black canvas is the brand. Each theme has exactly one accent; that accent means "this is the primary action or the selected thing," nothing else competes with it.
3. **Depth from contrast, not blur.** Elevation is the `surface.l0`–`l4` ladder and borders. Shadows are reserved for things that are genuinely floating above content (dialogs, toasts, dropdowns) or genuinely being pressed/lifted (buttons, high-emphasis cards) — never decorative.
4. **Geometry carries meaning.** A circle is a live/status signal. A rectangle is a module or machine. A line is a connection. An accent-colored left edge is an alert or a state. This vocabulary (§12) is reused everywhere, not invented per page.
5. **Numbers are the hero of operational surfaces.** CPU/GPU/RAM/uptime/session counts get the boldest, most legible typographic treatment on the page — bigger and more confident than the label next to them.
6. **Density matches the job.** Logs and tables are dense and mono. Home and Login are spacious and editorial. The same design language produces both without contradiction, because density is a per-surface dial (§14), not a global constant.
7. **Motion is mechanical, not floaty.** Things click into place (`ease`, ≤220ms) the way a physical switch does. Nothing drifts, bounces, or glows unless it is confirming a genuine state change.
8. **Status is never color-only.** Every status has a shape (dot/badge), a label, and a color together. Color-blind and monochrome-display users must be able to read state from shape and text alone.
9. **One coherent system, many page personalities.** Host Monitor is allowed to feel denser than Home. Both must still be unmistakably PCGO — same tokens, same geometry rules, different dial settings.
10. **Confidence over apology.** Borders are visible, type is decisive, and empty/error states say plainly what happened and what to do next — never a vague spinner-and-shrug.

---

## 5. Token system

All tokens below live in the codebase's real locations: CSS custom properties per `[data-theme]` block in `frontend/src/App.jsx`'s `GLOBAL_CSS`, mirrored as JS in `frontend/src/dashboard/theme.js`. Nothing here proposes a new file or a new architecture — only new/changed values inside the existing one. See §15 for the exact file-by-file mapping.

### 5.1 Color — structural, semantic, brand, decorative

PCGO's color system is already correctly divided into these four jobs; this section makes the division explicit and closes gaps.

**Structural colors** (surface + text — define the console's "material," carry no meaning of their own):

| Token | Job | Source |
|---|---|---|
| `surface.l0` (`--color-bg`) | Page base, deepest black | KEEP |
| `surface.l1` (`--color-bg-inset`) | Recessed wells: input backgrounds, dense list rows, log lines | KEEP |
| `surface.l2` (`--color-bg-elevated`) | Sidebar, card headers, panel sub-sections | KEEP |
| `surface.l3` (`--color-bg-card`) | Standard card/panel body | KEEP |
| `surface.l4` (`--color-bg-card-hover`) | Hover/highest state, active nav row | KEEP |
| `ink` / `inkDim` / `inkFaint` / `inkGhost` | Text hierarchy, 4 steps, all WCAG-AA verified per theme | KEEP as-is |
| `border` / `borderSubtle` / `borderStrong` / `borderInk` | Structural line weight ladder (see §5.4) | EVOLVE usage, not values |

**Semantic colors** (always mean the same thing, everywhere):

| Token | Meaning | Value family |
|---|---|---|
| `success` | Healthy / running / completed | green (`#7BD7A7` family) |
| `warning` | Attention needed, not broken | yellow (`#EBCB73` family) |
| `danger` | Broken / failed / destructive action | coral-red (`#F07F83` family) |
| `info` / `accentBlue` | Network & connectivity (Tailscale, streaming reachability) | blue (`#8CC4E8` family) |
| `accentLilac` | **NEW assignment**: orchestration/automation events (scheduler actions, recovery automation, background jobs) — currently a decorative-only tone with no fixed job | lilac (`#B8A7FF` family) |
| `accentPink` | Decorative only — reserved for rare, deliberately non-semantic highlights (e.g. a "new" badge). Do not assign it a status meaning. | pink (`#F3A5D0` family) |

**Brand color:** `colors.brand` / `colors.brandDim` — one per theme, used *only* for primary actions, the active-nav indicator, and the single most important number on a page (e.g., the Login hero's second line, the active session's title). If more than one thing on a screen is brand-colored, something is wrong — that's the "one signal" principle (§4.2) failing.

**Decorative colors:** none, by design. Tactical Console Brutalism has no palette slot for color that exists purely to look nice. If a future page wants a decorative accent (e.g. a marketing hero), it must come from an existing semantic or brand token at reduced opacity (`*Dim` variants already exist for this), never a new hex value invented ad hoc.

**Rule:** never introduce a raw hex color into a component. Every color used anywhere must trace back to a token in this table. (The codebase already violates this in a few places with literal `rgba(...)` — e.g. `rgba(255, 107, 107, .32)` in `.pcgo-host-force-unlock` — these should be migrated to `colors.dangerDim`/`colors.danger` during the next pass that touches that file, not fixed reactively.)

### 5.2 Typography

**KEEP the font stack exactly as-is** — it is already correct for this direction and needs no change:
- **Display** — `'Space Grotesk'` (headings, page titles, brand mark, hero copy)
- **Body** — `'Inter'` (paragraphs, form values, descriptions)
- **Mono** — `'JetBrains Mono'` (metadata, timestamps, technical values, labels, and now: metrics)

**Extend `typeScale`** (D-009's six steps stay unchanged — `hero`, `heading`, `subheading`, `body`, `bodySmall`, `meta`) with one new step that closes the gap the changelog repeatedly flags ("this number doesn't land on any typeScale step"):

```js
metric: {
  fontSize: "clamp(22px, 3vw, 34px)",
  lineHeight: 1,
  fontWeight: 700,
  letterSpacing: "-0.01em",
  fontFamily: fonts.mono,
  fontVariantNumeric: "tabular-nums",
}
```

**Usage rule for `typeScale.metric`:** any standalone number whose entire job is to be read at a glance — host readiness stat, CPU/GPU/RAM percentage in a summary tile, session/user counts, uptime — uses this step. Section headings, page titles, and body copy continue to use `heading`/`subheading`/`body` exactly as today. This is the "kinetic typography, calmed down" principle: the number is the hero of *its own tile*, not of the whole viewport.

**Uppercase discipline (KEEP, formalize):** `typeScale.meta`'s uppercase-mono-label pattern (10px/700/`0.12em`/mono) is already used 30+ times across the app for eyebrows, section kickers, and field labels. This is correct and should remain the *only* uppercase treatment in the system — never uppercase a heading, a button label beyond what `Button`'s existing weight already implies, or body copy. Uppercase is reserved for metadata-tier labels exclusively.

### 5.3 Geometry — radius

**REPLACE the current three-step rounded scale with a controlled binary system**, closing the "generic rounded SaaS card" gap the anti-patterns list explicitly names. Bauhaus's "a shape is a rectangle or a circle, nothing in between" is the organizing idea, softened by one narrow, deliberate exception for small chrome:

| New token | Value | Applies to |
|---|---|---|
| `radius.none` | `0px` | Section cards, panels, tables/data rows, dialogs, dropdown menus, host/session cards, log lines, form inputs, the primary Button shape |
| `radius.tight` | `4px` | Small chips/tags, compact icon swatches, inline code/mark highlighting — the one sanctioned exception, used only at small physical scale where a hard corner reads as a visual error rather than a choice |
| `radius.full` | `999px` | Status dots, avatar/identity marks, toggle switches, circular icon buttons, pill-shaped chips/badges — i.e. things that are conceptually round objects, not softened rectangles |

**Migration guidance** (not a mandate to touch every file today, but the target every new/touched component should move toward): today's `radius.sm`(8)/`radius.md`(12)/`radius.lg`(16) collapse into `radius.none` for structural surfaces and `radius.tight` for small interactive chrome. `radius.full`(999) is unchanged. Keep the old export names as deprecated aliases during transition (`radius.sm = radius.tight`, `radius.md = radius.lg = radius.none`) so existing consumers don't silently break — exactly the alias discipline D-009 already used for `surface`.

### 5.4 Geometry — borders

**EVOLVE, don't replace.** The four-step border ladder (`border` .115 alpha / `borderSubtle` .065 / `borderStrong` .25 / `borderInk` full opacity) is well-designed; it is simply under-used at the strong end. New rule:

- **`borderSubtle`** — internal dividers inside a dense list (unchanged, already correct: e.g. `.pcgo-data-row`, table rows).
- **`border`** — default component edge (unchanged default for cards, inputs).
- **`borderStrong`** — hover/focus emphasis (unchanged).
- **`borderInk`** — **EVOLVE toward wider use.** Reach for this on: the outer edge of primary structural panels on flagship pages (Home hero, Login form panel), the header row of a section card, and anywhere a component needs to say "this is load-bearing," per Neo-Brutalism's "if it doesn't have a border, it doesn't exist." Not everywhere — using `borderInk` everywhere would just be a darker version of today's uniform softness. Use it where the content is structurally most important on that screen.
- **Accent-edge borders** (`border-left: 2–3px solid <semantic color>`) — already used correctly in `.pcgo-host-readiness-summary--ok/warning/bad`, `Toast.jsx`, `.pcgo-home-alert-strip`, `.pcgo-settings-overview`. **Formalize this as the standard alert/status-emphasis pattern system-wide** (§12) rather than a per-page invention.

### 5.5 Shadows & depth

**REPLACE the two blurred halo shadows with a small hard-edge family, and narrow blur-shadow usage to true overlays.**

Why: `0 18px 50px rgba(0,0,0,.38)` barely reads against an OLED-black page — the blur has nothing to blend into. It currently exists mostly to separate the Login form panel and small FABs from the page. That job is better done by `surface.l3` contrast + a `borderInk` edge (structural, not atmospheric), freeing "shadow" to mean something specific: physical offset, not haze.

| New/changed token | Value | Use |
|---|---|---|
| `shadow.flat` | `none` | **Default resting state for all panels, cards, and rows.** Depth comes from `surface.l0`–`l4` contrast and borders, per §4.3 — not from a shadow. |
| `shadow.press` *(NEW)* | `2px 2px 0 0 var(--color-border-ink)` (resting), `0 0 0 0` on `:active` | Primary/`dangerFilled` buttons and other single, high-emphasis CTAs. The button visually "sits" on a small hard offset; pressing it (already implemented as `translateY(1px)` in `Button`) now also compresses the offset to zero — completing the "physical switch" interaction the component already half-implements. |
| `shadow.lift` *(NEW)* | `3px 3px 0 0 var(--color-border-strong)` on `:hover`/`:focus-visible` | High-emphasis interactive cards only: command cards (Home), launch console CTA, a selected host/session card. Not applied to dense list rows (Users, Logs, Session History) — those keep their existing subtle background/border hover, which is correct for density (KEEP). |
| `shadow.overlay` | `0 18px 50px rgba(0,0,0,0.38)` — **unchanged value** | **Narrowed usage**: reserved for things genuinely floating above page content — modals/`ConfirmDialog`, toasts, dropdown menus, popovers. This is legitimate atmospheric depth (separating a temporary layer from a busy background), not decoration on a static panel. |
| `shadow.focusRing` *(NEW, formalizes an existing ad hoc pattern)* | `0 0 0 3px <accent>Dim` | Already implemented ad hoc in `.pcgo-settings-row__control:focus` etc. — promote to a named token so every focusable control uses the identical ring. |

### 5.6 Motion

**KEEP the existing four tokens** (`fast` 100ms, `base` 160ms, `cardIn` 220ms, `pill` 180ms cubic-bezier) — they are already "mechanical, not floaty," which is exactly right for this direction. **Add** explicit names for use-cases that today reuse `base`/`cardIn` implicitly, so intent is documented at the call site instead of inferred:

| New token (alias of existing value) | Value | Use |
|---|---|---|
| `motion.press` | `= motion.fast` (100ms ease) | Button/control press-down and release |
| `motion.hover` | `= motion.base` (160ms ease) | Border/background hover transitions |
| `motion.transition` *(NEW meaning)* | `220ms cubic-bezier(0.34, 1.15, 0.64, 1)` — a small, controlled overshoot | **State transitions only**: connecting→connected, starting→running, a status badge changing tone. This is the one place a slight spring is allowed — it should read as "the state landed," not as decoration. Never used for hover/press. |
| `motion.entrance` | `= motion.cardIn` (220ms ease) | Page/section entrance (`cgo-fade-up`, already implemented) |

Reduced-motion handling is unchanged (KEEP the existing global `prefers-reduced-motion` block).

### 5.7 Patterns & texture — used sparingly, on purpose

Textures are permitted, narrowly:

- **Where allowed:** the Login/marketing hero background only, and large empty-state illustrations (`EmptyState`'s icon well). Maximum opacity **3%**, a single subtle dot-grid (`radial-gradient`, ~24px spacing) — evoking Swiss/Newsprint's graph-paper texture, not Neo-Brutalism's halftone maximalism.
- **Where forbidden:** every operational surface — Host Monitor, Logs, Session History, Analytics, Settings, tables, dense lists. Texture behind dense text actively hurts scanability, which directly contradicts principle #6.
- **No noise filters, no halftone dots, no diagonal-line backgrounds** anywhere in the product. These read as decorative maximalism PCGO does not need; the existing OLED surface contrast already provides enough visual interest.

### 5.8 Geometric vocabulary

Formalized from patterns that already exist in the codebase (see §3 KEEP), extended to be used consistently everywhere rather than per-page:

| Shape / device | Means | Existing precedent |
|---|---|---|
| **Filled circle, small, often pulsing** | A live/running state | `StatusBadge`'s dot, `.pcgo-home-signal` |
| **Ring / outline circle** | Idle or available-but-inactive state | (new — apply where "ready but not running" needs a visual distinct from "running") |
| **Rectangle, sharp corners (`radius.none`)** | A module, a machine, a discrete unit of the system (a host, a session, a card of settings) | `Card`, all `.pcgo-*-card` variants |
| **Accent-colored left edge (2–3px)** | This module has a state you should notice — alert, readiness, unsaved change | `Toast`, `.pcgo-host-readiness-summary--*`, `.pcgo-home-alert-strip`, `.pcgo-settings-overview` |
| **Thin horizontal/vertical line (`border`/`borderSubtle`)** | A connection or boundary between related things — column dividers, the Login page's vertical split | Login's `borderRight`, table/list dividers |
| **Diagonal arrow (↗ / →)** | Navigation, flow, "this leads somewhere" | `ArrowUpRight` in Login footer, `.pcgo-command-card__arrow` |
| **Large bold mono number (`typeScale.metric`)** | A measurable system quantity — the thing the page most wants you to read | Host readiness stat, `ProgressStat` values, analytics metrics |
| **Filled block/pill in brand color** | The one primary action or the one selected item | `Button` primary, active sidebar row |

This table is the answer key for "what shape do I reach for" — new pages should consult it before inventing a new visual device.

---

## 6. Component language

Each entry states anatomy/variants/states relative to the **actual existing component**, not a hypothetical one.

### 6.1 Buttons (`components/ui/primitives.jsx` → `Button`)
- **Variants (KEEP names/semantics):** `primary`, `secondary`, `ghost`, `danger`, `dangerFilled`.
- **EVOLVE:** `borderRadius` → `radius.none` (was `radius.sm`/8px). `primary`/`dangerFilled` gain `shadow.press` (resting hard offset, compresses on `:active`) — the mouse-down `translateY(1px)` stays exactly as implemented, now paired with a shadow that visibly compresses, completing the physical-press metaphor. `secondary`/`ghost`/`danger` (outlined/transparent variants) stay flat (`shadow.flat`) — the hard shadow is reserved for the single primary action per view, keeping "one signal" (principle #2) intact at the interaction level, not just the color level.
- **States:** disabled (unchanged: 0.45 opacity, `not-allowed`), loading (icon + label swap, unchanged pattern), focus-visible (adopt `shadow.focusRing` in addition to the existing outline, for consistency with inputs).
- **Icon buttons** (circular, e.g. FABs, dismiss buttons): `radius.full`, no press-shadow (small circular controls stay flat + `translateY` only — a hard shadow at that size reads as clutter).

### 6.2 Inputs
- Structure (`inputStyle` in `Login.jsx`, `.pcgo-*__field input/select` across pages): `radius.none` (was 6–8px across different pages — this also fixes a real inconsistency the codebase currently has, where radius values drift between 6px/7px/8px depending on which page's CSS block wrote them).
- Focus: border → `colors.brand`, background → `surface.l4` (unchanged, already correct), **add** `shadow.focusRing` as a named token replacing the ad hoc `box-shadow: 0 0 0 3px var(--color-brand-dim)` currently duplicated across `.pcgo-users__field`, `.pcgo-settings-row__control`, `.pcgo-change-password-field`.
- Validation error state: border → `danger`, `shadow.focusRing` recolored to `dangerDim` (already implemented in `.pcgo-change-password-field[aria-invalid="true"]:focus` — promote to the shared token).
- Command/search inputs (none exist yet): when built, use `radius.none`, mono placeholder text, and a leading icon exactly like `Login.jsx`'s username/password fields — that pattern is the reference implementation for all future inputs.

### 6.3 Cards / panels (`Card` primitive + `.pcgo-section-card`, `.pcgo-*-card` family)
- Default: `radius.none`, `border` (was `borderStrong`-on-hover only — keep that hover EVOLVE), `surface.l3` background — unchanged mechanism, changed radius.
- **Featured/flagship card** (e.g. `.pcgo-launch-console`, the Login form panel): `borderInk` edge instead of default `border`, optionally `shadow.overlay` if it's a genuinely elevated panel (Login's form *is* — it sits on a different surface than the hero copy). This is the one sanctioned "premium" treatment, reserved for the single most important panel per page.
- **Interactive/command card** (`.pcgo-command-card`): adds `shadow.lift` on hover in place of today's `translateY(-1px)`-only lift — the shadow makes the "physical lift" legible even where a 1px translate is nearly invisible on a static screenshot or a low-motion-sensitivity display.
- **Dense data card** (stat cells, `.pcgo-stat-cell`, `.pcgo-data-row`): stays flat, no lift, no shadow — density and calm scanning matter more than tactility here (KEEP as-is).
- **Status card** (host readiness, recovery summary): keeps its accent-left-edge pattern (§5.8), `radius.none`.

### 6.4 Badges / Chips (`Chip`, `StatusBadge`)
- `StatusBadge` (dot + pill + mono label): **KEEP exactly as implemented** — this is already the correct Tactical Console Brutalism artifact (geometry + color + text together, per principle #8).
- `Chip`: assign fixed semantic meaning to tones per §5.1 rather than leaving `lilac`/`pink`/`blue`/etc. as decorative-only choices a page author picks freely. `radius.tight` (was `radius.sm`).

### 6.5 Tables / dense lists
- No literal `<table>` exists today (data is rendered as `.pcgo-*__row` grids) — keep that approach, it's more responsive-friendly than real tables at these breakpoints.
- Column headers: `typeScale.meta`, `radius.none`, `borderSubtle` bottom rule.
- Rows: `surface.l1`, `radius.none` (was 7–9px depending on page), hover → `surface.l4` (unchanged mechanism).
- Selected row (not yet implemented anywhere — add when bulk actions are built): `border-left: 3px solid brand` + `surface.l4`, consistent with §5.8's accent-edge = "notice me" rule.

### 6.6 Tabs / Navigation / Sidebar
- `Sidebar.jsx`: **KEEP** almost entirely — the active-row treatment (brand-tinted background + left accent bar + brand-colored icon) is already exactly right per §5.8. Only change: `radius.sm`(8) → `radius.tight`(4) on the row itself (a full `radius.none` would feel harsh for a tall list of frequently-clicked targets — this is a deliberate, documented exception, not a slip).
- Header/`DashboardHeader`, `MobileHeader`: unchanged mechanism; wordmark/abbreviation breakpoint logic (`dashboard-shell.css`) stays as-is — it's already been carefully tuned (P7-T02) and is out of scope for a visual-language pass.

### 6.7 Dialogs (`ConfirmDialog.jsx`)
- **KEEP** all interaction/accessibility logic untouched (focus trap, `inert`, restore-focus).
- Visual: `radius.none`, `borderInk` edge, `shadow.overlay` (this is a textbook "genuinely floating overlay" use). Danger confirmations get a `borderInk`-weight top or left edge in `danger` color, consistent with the accent-edge vocabulary.

### 6.8 Toasts (`Toast.jsx`)
- **KEEP** entirely as the reference implementation of the accent-edge pattern (`borderLeft: 3px solid tone.color`) — this component is already doing Tactical Console Brutalism correctly and should be the example cited when explaining the pattern to new contributors. Only change: `radius.md`(12) → `radius.none`.

### 6.9 Tooltips / Dropdowns
- Not yet a shared primitive (native `title`/inline patterns are used today). When built: `radius.none`, `surface.l2`/`l3`, `shadow.overlay` (floating-layer rule), `borderSubtle` edge, `typeScale.bodySmall`.

### 6.10 Empty / Loading / Error states
- `EmptyState` (primitives.jsx) and `LoadingState`/skeleton-pulse patterns (`.pcgo-*-loading*`): **KEEP** the skeleton-pulse mechanism (`pcgo-pulse` keyframe) — it's calm and already respects reduced-motion. Change icon well radius to `radius.tight`, not `radius.md`.
- Error states (`.pcgo-users__error`, `.pcgo-settings__unavailable`): keep the dashed-border-plus-icon pattern; it already reads as distinct from a normal empty state — `radius.none`.

### 6.11 Resource meters (`ProgressStat` in `HostStatusPanel.jsx`)
- **EVOLVE, don't replace.** Keep the label-left/value-right/bar-below anatomy. Change the value's typography to `typeScale.metric` (currently ad hoc per the changelog's own audit notes). Track background stays `surface.l1`; fill stays semantic-colored by threshold (this logic already exists and is correct — a CPU bar at 92% should already read `warning`/`danger`, confirm this mapping is applied consistently across all four meters: CPU, RAM, GPU Load, GPU Temp, VRAM).

### 6.12 Host status / Session status
- Host readiness summary (`.pcgo-host-readiness-summary`): **KEEP** structure and accent-left-edge-by-state pattern exactly. Promote its inline stat (`22px Space Grotesk`) to `typeScale.metric` for consistency with §6.11.
- Session cards (`SessionCard.jsx`): apply `StatusBadge` consistently (already does), `radius.none`, and — for the *active* session specifically — the `shadow.lift`/`borderInk` "featured card" treatment from §6.3, since an active session is the single most important object on the Home page while it exists.

### 6.13 Logs / diagnostics (`LogsPage`, `.pcgo-logs__*`)
- **KEEP** the dense mono vocabulary entirely — this page's existing "operational evidence" character (per its own CSS header comment) is already correct Tactical Console Brutalism and should not be softened toward the more spacious Home/Login treatment. `radius.none` throughout (was already close to 0 on most elements here).

### 6.14 Command controls (Home's command index, launch console)
- **KEEP** icon-plus-label-plus-arrow anatomy. `shadow.lift` on hover per §6.3. This is the component that most benefits from the new hard-shadow treatment, since it's the highest-traffic interactive surface in the product.

---

## 7. Domain expression

- **Hosts** feel like a machine: rectangular cards (`radius.none`), a top or left accent edge colored by readiness state, mono metadata (CPU model, GPU vendor), and the `typeScale.metric` treatment on any single number that summarizes the host's health.
- **Sessions** feel live: the running-state pulse dot, `typeScale.metric` for elapsed time, and the featured-card treatment (§6.3) while active — a session should visually outrank everything else on Home while it's running.
- **GPU/CPU/RAM** feel like measurable resources: always paired label+bar+`typeScale.metric` value, semantic-colored by threshold, never decorative gauges/dials/gradients standing in for a plain, honest percentage bar.
- **Streaming** (Sunshine) feels like a live pipeline: status badge + connection-line vocabulary (§5.8) between "host" and "client," not a generic settings toggle. The existing `.pcgo-host-sunshine-card`'s success-colored top border is the right instinct — keep it.
- **Orchestration/automation** (scheduling, recovery automation) gets the newly-assigned `accentLilac` semantic color (§5.1) so automated actions are visually distinguishable from user-initiated ones and from plain informational (blue) content.
- **Network** (Tailscale) uses `info`/blue consistently — already correct — plus the connection-line vocabulary for anything depicting host↔client reachability.
- **Logs** prioritize density and scanability above all else (§6.13) — this is the one surface where "spacious editorial" would be actively wrong.
- **Errors** are unmistakable via shape + border + icon + text together, never color alone (principle #8) — `danger`-colored left edge, `TriangleAlert`/`XCircle` icon, and plain-language copy, exactly as `Toast`/`ConfirmDialog` already do.
- **Healthy state** stays quiet: a single green dot and a calm `success`-tinted accent edge, no celebratory motion, no oversized checkmark — "healthy" should read as "nothing to look at," which is itself the signal.

---

## 8. Motion system

| Category | When | Token | Notes |
|---|---|---|---|
| **Micro-interaction** | Button/toggle/tab hover, press | `motion.press` / `motion.hover` | Mechanical, ≤160ms, `ease`. Already implemented. |
| **State transition** | connecting→connected, starting→running, badge tone change | `motion.transition` (NEW, slight overshoot) | The one place a small spring is allowed — confirms "the state landed." |
| **Data update** | A metric value changes (CPU% ticks up) | No animated transform — number swap is instant, but the surrounding bar-fill width transitions over `motion.hover` (160ms) so the *rate* of change stays perceptible without flicker | Numbers must never be hard to read mid-animation; only the bar fill eases. |
| **Page entrance** | Route change, initial content paint | `motion.entrance` (`cgo-fade-up`, unchanged) | Already implemented globally via `.pcgo-page-enter`. |
| **Navigation** | Sidebar active-row change, tab switch | `motion.hover` (background/border), no page-level transition — panels swap instantly | Instant panel swaps are correct for a tool used dozens of times a day; a transition here would slow the operator down. |
| **Orchestration** | Visualizing a flow/handoff between host↔session↔stream (if/when built) | `motion.transition` per step, staged, never simultaneous | Each step should visibly "land" in sequence, reinforcing the connection-line vocabulary (§5.8). |
| **Decorative** | Marketing/Login background texture, brand-mark idle state | None by default; if ever added, must be `prefers-reduced-motion`-safe and off by default on operational pages | Decorative motion is the lowest priority and the first thing to cut under any doubt. |

All motion respects the existing global `prefers-reduced-motion: reduce` block (KEEP, unchanged).

---

## 9. Responsive behavior

The codebase's existing breakpoint set is broader and more considered than a generic "3 breakpoints" system — **keep it**, don't consolidate it just for tidiness. Canonical QA viewports (per the changelog's own testing discipline) are **1440 / 1024 / 768 / 390 / 360** — any new component should be checked at all five before being considered done.

| Range | Behavior |
|---|---|
| ≥ 1180px | Full desktop layout: sidebar visible (252px), multi-column grids at their widest (e.g. 4-up command index, 2-column host status grid) |
| 1040–1180px | Optional header elements (`pcgo-header-optional`) start dropping; grids narrow to 3-up |
| 880–1040px | Sidebar still visible; secondary header text (`pcgo-header-subtitle`) drops |
| ≤ 880px | **Sidebar collapses to a mobile menu button** (`pcgo-mobile-menu-btn`); this is the primary structural breakpoint, not a cosmetic one |
| 700–780px | Two-column detail layouts (Recovery, Sunshine, User Management) stack to one column; stat grids drop to 2–3 columns |
| 480–560px | Toolbars stack vertically; action buttons go full-width; forms drop to single-column |
| ≤ 480px | Wordmark abbreviates to "CGO" (already tuned, P7-T02 — do not re-litigate this threshold); stat grids drop to 1–2 columns; dense table rows switch to labeled key/value stacks (`data-label` pseudo-element pattern, already implemented in `.pcgo-users__cell`) |
| ≤ 420px / 380px | Final type-size reductions on hero/flagship copy only (Login's `<h1>`, Change Password card padding) |

**New rule for Tactical Console Brutalism specifically:** `radius.none` and hard borders must not become touch-hazard traps — minimum touch target stays **40×40px** (already the de facto `Button` minimum) regardless of visual sharpness; sharp corners affect appearance, not hit-area sizing.

---

## 10. Accessibility

- **Contrast:** every text/background pairing must clear WCAG AA (4.5:1 body, 3:1 large text) — already verified across all six themes for `ink`/`inkDim`/`inkFaint`/`inkGhost` (P7-T05). Any new color introduced under §5.1's rules must be checked against `surface.l3` before shipping.
- **Focus:** every interactive element gets the shared `shadow.focusRing` (§5.5) plus the existing 2px outline — never rely on border-color change alone for focus, since `borderStrong` vs `border` is a subtle difference for low-vision users.
- **Keyboard:** `ConfirmDialog`'s focus-trap/restore pattern (KEEP) is the reference implementation for any future modal/dropdown/popover.
- **Touch targets:** 40×40px minimum (§9), unchanged from today's `Button` baseline.
- **Reduced motion:** unchanged global handling; `motion.transition`'s overshoot must be included in the `prefers-reduced-motion` override (reduce to a plain, non-spring 1ms cut, matching every other animation).
- **Status is never color-only** (principle #8): every `StatusBadge`/accent-edge usage must pair color with an icon or text label — already true everywhere today; keep enforcing it in review as new statuses are added.
- **Screen readers:** status dots and accent edges are decorative reinforcement, not the only signal — the adjacent text label (`STARTING`, `READY`, etc.) is what a screen reader announces, and must always be present, not implied by color/shape alone.

---

## 11. Anti-patterns — explicitly banned

- Glassmorphism, backdrop-blur panels, frosted-glass effects.
- Blurred/glowing drop shadows on static, non-floating panels (see §5.5 — blur is reserved for genuine overlays only).
- Rainbow/multi-hue palettes; more than one accent hue active in a single view.
- RGB "gamer" aesthetics — no neon glow, no animated rainbow borders, no chroma-cycling anything.
- Rounded-corner values between `radius.tight`(4px) and `radius.full`(999px) on structural surfaces — the whole point of §5.3's binary system is that there is no "medium rounded" default to fall back on.
- Decorative rotation/sticker effects (rotated cards, tilted badges) — rejected wholesale from Neo-Brutalism/Playful Geometric per §2.1.
- Halftone dots, noise-filter textures, diagonal-line backgrounds on any operational surface (§5.7).
- Uppercase text anywhere outside `typeScale.meta`-tier labels (§5.2).
- Color as the sole carrier of status (§10).
- Constant/idle motion (marquees, floating decorative shapes, ambient background animation) — motion is earned by a state change, never ambient.
- Introducing a raw hex/rgba color value outside the token table in §5.1.
- Soft/generic SaaS card shadows (`box-shadow: 0 4px 12px rgba(0,0,0,.1)`-style defaults) — every shadow used must be one of the five named tokens in §5.5.
- Hand-drawn/wobbly borders, sketch textures, irregular border-radius "imperfection" effects — 0% adoption, no exceptions.
- Applying the same visual intensity to Logs and to Login — density and decoration are per-surface dials (§14), not a single global setting.

---

## 12. Product surface differentiation

| Surface | Personality | Density | Notes |
|---|---|---|---|
| **Marketing / Landing** *(doesn't exist yet — Login is the closest analog and the reference for tone if one is built)* | Most expressive surface in the product: large `typeScale.hero` type, the one place a subtle 3%-opacity dot-grid texture is allowed, generous whitespace | Low | Should still feel unmistakably PCGO, not a generic template — reuse Login's split hero/form composition as the base pattern |
| **Login** | Calm-editorial hero + a `borderInk`-edged, `shadow.overlay` form panel — **this page is already close to correct today and is the primary reference implementation** | Low–medium | Only change under this language: `radius` values → `radius.none`/`radius.tight` per §5.3; everything else (type scale, composition, mono eyebrow labels, feature pills) is a KEEP |
| **Main application (Home)** | Balanced: flagship hero moment at top (KEEP), then a dense command index below — this page already correctly mixes both densities | Low → medium, top to bottom | Active session card gets the featured-card treatment (§6.3/§6.12) |
| **Host Control Panel** | Dense, technical, Swiss/Newsprint-leaning: mono metadata, tight grids, accent-edge status | High | `.pcgo-host-*` classes already mostly correct; apply `radius.none` and `typeScale.metric` |
| **Live Session** | High-signal: status + elapsed time + resource meters lead, everything else recedes | Medium–high | Uses `typeScale.metric` more than any other surface |
| **Logs / Diagnostics** | Maximum density, pure mono, zero decoration | Highest | No texture, no hard shadows, no lift effects — legibility above all (§6.13) |
| **Settings** | Calmest surface in the application proper: clear controls, minimal decoration, explicit save/dirty state | Low–medium | KEEP the existing "configuration workspace" tone; only geometry values change |
| **Errors / Recovery** | High contrast, strong hierarchy, immediate action — the one place `danger`'s accent edge should be at its most visible weight | Medium | `ConfirmDialog`'s destructive-action styling and `.pcgo-users__error`/`.pcgo-settings__unavailable` patterns are the reference |

---

## 13. Design decision matrix

| Decision | PCGO rule | Reason |
|---|---|---|
| Radius | Binary: `0px` (structural) or `999px` (round objects), with one `4px` exception for small chrome | Removes the "generic rounded SaaS card" look; matches Bauhaus's geometric-purity principle without going full brutalist-square-only |
| Borders | 4-step ladder (`subtle`/`default`/`strong`/`ink`), reach for `ink` on load-bearing panels | Structure must be visible (Neo-Brutalism), but not every element needs maximum weight (avoids Neo-Brutalism's over-maximalism) |
| Shadows | Hard offset (`press`/`lift`) on interactive/featured elements only; blur (`overlay`) reserved for true floating layers; flat everywhere else | Blur is invisible on OLED black and reads generic; hard offset is legible and physical; reserving both keeps shadow meaningful instead of decorative |
| Color | One brand accent per theme; 6 fixed semantic colors, each with exactly one job; no decorative hex values | "One signal" principle; prevents color meaning from drifting page to page |
| Typography | Keep 3-font stack; add one metric step; uppercase reserved for meta-tier labels only | Foundation is already correct; the gap was a numbers-focused step, not a font change |
| Animation | Mechanical ≤220ms eases; one controlled-overshoot token reserved for state transitions | Matches "physical control panel," avoids floaty/decorative SaaS motion |
| Patterns/texture | ≤3% opacity, marketing/empty-state only, never on operational surfaces | Texture behind dense text actively hurts the tool's primary job: legibility |
| Density | Per-surface dial (§12), not global | Logs and Login have legitimately different jobs; forcing one density everywhere would break one or the other |
| Icons | `lucide-react`, consistent stroke width (1.5–2px), never filled/duotone | Matches the technical/precise register; avoids illustrative playfulness creeping into iconography |
| Data visualization | Bars/meters with `typeScale.metric` values over gauges/dials/gradients | Plain, honest percentage readouts fit "operational trustworthiness" better than decorative chart chrome |
| Responsive | Keep existing breakpoint set; sidebar-collapse at 880px is the primary structural break | Already well-tuned via multiple prior audit passes; no reason to consolidate for its own sake |

---

## 14. Where this lives in the codebase

No new architecture is proposed. Everything maps onto files that already exist:

| System piece | File(s) |
|---|---|
| CSS custom properties per theme (colors, surfaces) | `frontend/src/App.jsx` → `GLOBAL_CSS` template string, one block per `[data-theme="…"]` |
| Custom-derived "user color" theme | `frontend/src/dashboard/theme-derive.js` (must be updated in lockstep with any new CSS variable, per D-009's noted limitation) |
| JS token mirror (`colors`, `surface`, `typeScale`, `spacing`, `radius`, `shadow`, `motion`) | `frontend/src/dashboard/theme.js` — this is where §5's new `typeScale.metric`, the `radius.none/tight/full` rename, the new `shadow.press/lift/focusRing` tokens, and the `motion.transition/entrance` aliases all get added |
| Shared component primitives | `frontend/src/components/ui/primitives.jsx` (`Button`, `Card`, `Chip`, `Spinner`, `EmptyState`), `Toast.jsx`, `ConfirmDialog.jsx`, `ErrorBoundary.jsx` |
| Layout shell | `frontend/src/dashboard/layout/*.jsx` + `dashboard-shell.css` |
| Per-page density/personality CSS | `frontend/src/dashboard/components/feature-page.css` (already ~1,900 lines of page-specific BEM classes — this is where most of §6 and §12's per-surface rules get applied, page block by page block, matching the file's existing organization) |
| Reference implementation for new work | `frontend/src/pages/Login.jsx` + `frontend/src/styles/Login.css` — confirmed by the user as the current best page; treat its composition and token usage as the pattern to extend, not deviate from |

---

## 15. Final self-review

- **Could another engineer implement PCGO's UI from this document without guessing?** Yes for tokens and per-component rules (concrete values throughout); the one area needing a follow-up decision before large-scale implementation is the `radius` migration plan for already-shipped pages (see §16, open question 1).
- **Does it feel like one product, not six references stitched together?** Yes — every reference contributed a principle, not a skin; nothing here is "the Neo-Brutalism page" next to "the Swiss page."
- **Does it preserve OLED/black identity?** Yes, entirely — no color, radius, or shadow change touches the six-theme system's core darkness; `oled` theme remains the flagship expression.
- **Appropriate for cloud-gaming orchestration software?** Yes — every domain-specific rule (§7) ties back to hosts/sessions/resources/network rather than generic dashboard concerns.
- **Works for both expressive and dense surfaces?** Yes — §12 exists specifically to make density a deliberate per-surface choice rather than a one-size-fits-all rule.
- **Are accents semantic, not random?** Yes — §5.1 assigns every accent color a fixed job, including closing the previously-undefined `accentLilac` gap.
- **Is typography distinctive?** Yes — the three-font stack plus the new metric step is already unusual relative to generic SaaS (which typically uses one sans everywhere); this document sharpens rather than dilutes that.
- **Is motion purposeful?** Yes — §8 ties every motion category to a specific trigger; nothing animates "just because."
- **Is the system reusable?** Yes — nothing here requires a new library, build tool, or architecture; it is a values-and-usage-rules pass on an existing, working token pipeline.
- **Does it prevent drift back to generic SaaS?** Yes — §11's anti-pattern list is long and specific for exactly this reason.

---

## Summary

- **Final direction:** *Tactical Console Brutalism* — Swiss/Newsprint structural discipline, expressed through Neo-Brutalism/Bauhaus's visible, physical chrome, with Kinetic Typography's numerical confidence, on PCGO's existing OLED dark foundation. A small, disciplined amount of Playful Geometric warmth is allowed only at the product's edges (Login/marketing, empty states).
- **Most important visual decisions:** binary radius system (`0`/`4`/`999`, replacing the current soft 8/12/16 scale); hard-offset shadow family (`press`/`lift`) reserved for genuinely interactive/featured elements, with blur (`overlay`) narrowed to true floating layers; a new `typeScale.metric` step for the many ad hoc "big number" treatments the codebase's own changelog already flags as inconsistent; formalized accent-edge-as-alert and shape-as-meaning vocabulary (§5.8/§12) generalized from patterns that already exist in `Toast.jsx` and the Host Monitor page.
- **Major reference influences:** Swiss/Newsprint (structure, density, mono data), Neo-Brutalism/Bauhaus (visible borders, physical press/lift, binary geometry), Kinetic Typography (numbers as hero).
- **Major rejected influences:** Hand-Drawn/Sketch (wholesale), Neo-Brutalism's rotation/sticker maximalism and cream canvas, Playful Geometric's pastel/floating-blob decoration, any light-mode default.
- **Where this lives:** `theme.js` + `App.jsx`'s per-theme CSS blocks for tokens; `primitives.jsx`/`Toast.jsx`/`ConfirmDialog.jsx` for shared components; `feature-page.css` for per-surface density rules; `Login.jsx` as the standing reference implementation.
- **Open uncertainties to resolve before implementation** (flagging honestly rather than guessing):
  1. Whether the `radius` rename should ship as backward-compatible aliases (recommended, matches D-009's precedent) or a clean break with a repo-wide find/replace — this is a scope/risk call for whoever plans the implementation phases, not a visual-design question.
  2. Whether `shadow.press`/`shadow.lift`'s exact offset color (`border-ink` vs. a dimmed brand tone) should vary per-theme or stay a single neutral ink offset across all six themes — a neutral offset is recommended for consistency, but it hasn't been visually proofed against the `mono` and `classic` themes specifically.
  3. Whether a real marketing/landing surface is ever planned, or whether Login should simply absorb slightly more of that "expressive" register permanently — §12's Marketing/Landing row is currently aspirational and should be revisited if/when that surface is actually scoped.
