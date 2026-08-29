# DECISIONS.md — Durable Decisions Log

Each entry: DECISION / REASON / ALTERNATIVES / STATUS / PHASE.
Never silently reverse an APPROVED decision — supersede it explicitly.

---

## D-001: Treat `assets/screenshots/` as stale, not representative

**DECISION:** The screenshots in `assets/screenshots/admin_dashboard/`
and `assets/screenshots/user_dashboard/` are NOT used as evidence of the
current visual baseline. They will remain in the repo as historical
record only.

**REASON:** Direct code inspection (theme.js, App.jsx GLOBAL_CSS,
Sidebar.jsx, feature-page.css) and a real Playwright render of the live
Vite dev server both show a materially different, more refined visual
language (warm amber editorial theme, dim-brand-tinted nav active state,
per-page CSS vocabulary) than what the screenshots depict (near-
monochrome, solid-white pill nav, generic dashboard feel). The user
confirmed directly in this session: the screenshots predate "the last,
second-to-last frontend refactor."

**ALTERNATIVES:** Trust screenshots as baseline and design against them
— rejected, would mean redesigning against a target that no longer
exists and wasting Worker effort re-solving already-solved problems.

**STATUS:** APPROVED
**PHASE:** P0

**CORRECTION (this session, new Main Claude):** `frontend/qa/` (a
committed, reusable version of the mock-route harness described in D-002)
now exists in the repository, referencing decisions D-006 and D-007 that
were never written to this file. `.ai/STATE.md`, `.ai/PLAN.md`, and
`.ai/CHANGELOG.md` still described P1 as "NOT STARTED" despite this. Per
RULES.md's source-of-truth hierarchy (repo > `.ai/`), the repo wins:
D-006 and D-007 are reconstructed below from code comments, and
STATE/PLAN/CHANGELOG have been corrected to match. This is exactly the
handoff failure `.ai/HANDOFF.md` `How To Continue` warns about — a prior
session's real work was not durably recorded before it ended.

---

## D-002: Mock-backend Playwright harness for browser QA

**DECISION:** For rendering pages beyond Login (which needs no backend
data), intercept `http://127.0.0.1:8100/**` requests in Playwright and
fulfill with representative mock JSON per endpoint, rather than standing
up the real FastAPI `host-agent`.

**REASON:** No real backend is running in the Main Claude sandbox
environment. A working mock-route script (`render2.js`, not committed to
the repo — sandbox scratch file) was built during P0-T01 covering host
status/metrics, games, sessions (active/history/events/analytics),
recovery, users, config, tailscale, logs, sunshine. This is faster and
more controllable than a full backend for visual QA purposes, though it
cannot substitute for real integration testing.

**ALTERNATIVES:**
- Run the real `host-agent` FastAPI backend — more accurate but heavier
  to set up per-session; worth doing for P8 (Full Visual QA) but
  overkill for P0-P1.
- Rely only on static code reading without any render — rejected, the
  meta-prompt explicitly requires rendered evidence for visual review,
  and this session's real render caught a genuine bug that pure code
  reading might have missed noticing as high-priority.

**STATUS:** APPROVED (for P0-P7 visual QA); revisit for P8 (recommend
real backend for final regression pass).
**PHASE:** P0

**Note for future Workers/Main Claude sessions:** the mock script is not
saved in the repo (it was sandbox scratch). Whoever does P1+ visual work
should write and commit a small, reusable mock-API fixture (e.g.
`frontend/scripts/mock-api-fixtures.json` + a short Playwright helper)
under `frontend/` so this doesn't have to be reinvented each session.
This itself should be a small, explicit task, not silently added inside
an unrelated visual task.

---

## D-003: Tailwind is dead weight — resolve before P2

**DECISION:** Flag (do not yet fix) that `tailwind.config.js` and
`postcss.config.js` are present and Tailwind is a `package.json`
dependency, but a repo-wide grep found **zero** Tailwind utility-class
usage anywhere in `src/`. All component styling uses BEM-style custom
class names (e.g. `pcgo-host-status-panel__header`) driven by hand-written
CSS files, plus inline style objects referencing `theme.js` tokens.

**REASON:** Verified via `grep -o 'className="[^"]*"'` sampling across
multiple files — no `flex`, `p-4`, `text-sm`-style utility classes found,
only project-prefixed BEM classes. This is either legacy scaffolding
from an earlier Vite template, or an abandoned plan to adopt Tailwind
that never happened.

**ALTERNATIVES:**
1. Remove Tailwind entirely (uninstall, delete configs) — reduces
   confusion and bundle/build tooling surface, keeps the existing BEM +
   inline-style approach as the one true system.
2. Actually adopt Tailwind going forward for new premium components —
   would mean a real migration decision, larger scope, and touches the
   "no unnecessary dependencies" and "no giant unjustified rewrites"
   rules; not recommended unless there's a strong reason.

**STATUS:** RESOLVED (P1-T03) — Tailwind removed entirely. Alternative
1 was chosen. Fresh repo-wide grep re-run immediately before deletion
(`@tailwind`/`@apply`/utility-class-shaped `className` patterns) found
zero usage, confirming the original P0 finding still held. Removed
`tailwind.config.js`, `postcss.config.js`, and the `tailwindcss`
devDependency. Also removed `postcss` and `autoprefixer`:
`postcss.config.js`'s only two plugins were `tailwindcss` and
`autoprefixer`, and grep found no other PostCSS usage anywhere in the
repo (no other `.postcssrc`, no other config referencing `postcss`) —
both were installed as part of the same unused Tailwind scaffold, so
both are dead weight, not a separate build-tooling decision. The
existing BEM + inline-style approach (already the one true system per
the original P0 finding) is now the only styling approach, matching
Structural Proposal in ARCHITECTURE.md.
**PHASE:** P1 (decision), P0 (flagged)

---

## D-004: `EventLog.jsx` crash is a functionality bug, not a design task

**DECISION:** The reproducible crash (`latest.session_id` unguarded in a
`useEffect` dependency array at `EventLog.jsx:74`, throwing when the
event feed is empty) is logged as a known bug in STATE.md and RULES.md,
but is explicitly OUT OF SCOPE for P1+ visual redesign Workers unless a
task is created specifically to fix it.

**REASON:** Per the meta-prompt's "no scope creep" rule — visual Workers
must not silently fix unrelated functional bugs. This bug also predates
this project's redesign effort entirely (it's a genuine first-load edge
case, unrelated to visual work), so fixing it is a product decision for
the user, not an automatic inclusion.

**ALTERNATIVES:** Fix it immediately as part of P0 — rejected, P0-T01 is
explicitly documentation-only ("ONLY `.ai/` documentation may be changed").
Silently fix it inside a later Worker task that happens to touch that
file — rejected as scope creep unless explicitly noted in that Worker's
report per RULES.md guidance.

**STATUS:** APPROVED (flagged, not fixed)
**PHASE:** P0

---

## D-005: Existing per-page CSS vocabulary is a foundation, not a blank slate

**DECISION:** `feature-page.css` (~1,200 lines) already implements
distinct visual treatment per page (Home = flagship/hero, Host Monitor =
operational/diagnostic, etc.), matching the spirit of the meta-prompt's
"page personality" concept. P1+ work should audit and refine this
existing system rather than assume it needs to be built from scratch.

**REASON:** Verified by reading the file directly — this is real,
already-implemented work, not aspirational documentation.

**ALTERNATIVES:** Rebuild page-specific styling from zero — rejected,
would throw away working, reasonably sophisticated code for no reason,
violating the "audit critically, don't automatically discard" principle.

**STATUS:** APPROVED
**PHASE:** P0

**CORRECTION (this session):** there are actually two `feature-page.css`
files in the repo: `frontend/src/components/feature-page.css` (26KB) and
`frontend/src/dashboard/components/feature-page.css` (72KB). Only the
`dashboard/components/` one is imported (by `PageHeader.jsx` and
`SectionCard.jsx`). The `components/feature-page.css` copy is dead code.
Low priority, but a Worker should delete it during whichever task next
touches that directory, to avoid confusion about which file is live.

**RESOLUTION (P1-T03):** deleted. Fresh grep for any import of
`components/feature-page.css` (as opposed to `dashboard/components/
feature-page.css`) confirmed zero references immediately before
deletion.

---

## D-006: Playwright is a QA-only tool, not a committed devDependency

**DECISION:** `frontend/qa/render.mjs` requires `playwright` (with the
Chromium browser) to run, but `playwright` is intentionally **not**
added to `frontend/package.json`. It must be installed ephemerally
(`npm install --no-save playwright` or similar) by whoever runs the
harness.

**REASON:** Reconstructed from `frontend/qa/render.mjs` header comment
(this decision existed in the repo but was never written to this file —
see the correction note on D-001). Avoids silently expanding production
dependency surface for a validation-only tool. `frontend/qa/README.md`
frames making it a permanent devDependency as "a real decision, not a
default."

**ALTERNATIVES:** Add `playwright` as a devDependency now — deferred;
revisit if the harness becomes a permanent, always-available part of the
workflow (e.g. once it's run every P5 task).

**STATUS:** APPROVED (reconstructed, now durably recorded)
**PHASE:** P1 (untracked — see STATE.md correction)

---

## D-007: `hostStatus`/`recoveryStats` fixture shape corrections

**DECISION:** QA fixtures for `/host/status` must be a **flat** object
(not nested under `sunshine`/`tailscale`/`system` sub-objects), and the
`recoveryStats` field is `sunshine_restarts` (not `sunshine_recoveries`).

**REASON:** Reconstructed from `frontend/qa/fixtures/mock-data.js`
comments (same provenance issue as D-006). An earlier draft of these
fixtures used a nested `hostStatus` shape and the wrong recovery-stats
field name, which produced false "Sunshine Offline"/"Tailscale Offline"
alerts in early QA renders — caught by cross-checking against
`host-agent/api/routes/host.py` and every `status.<field>` /
`recoveryStats?.<field>` accessor actually used in
`HostStatusPanel.jsx`, `dashboard/utils/alerts.js`, and
`RecoveryStats.jsx`.

**ALTERNATIVES:** None recorded — this reads as a bug found and fixed
during fixture-writing, not a real design choice with trade-offs.

**STATUS:** APPROVED (reconstructed, now durably recorded)
**PHASE:** P1 (untracked — see STATE.md correction)

---

## D-008: Design direction approved — "Calm Editorial + Layered Depth"

**DECISION:** The P0 design-direction gate (see original HANDOFF.md
"hard gate," PLAN.md P0 acceptance criterion) is resolved. The approved
direction, as specified directly by the product owner, is a single
unified direction combining:

- **Calm Editorial** — strong typography, intentional whitespace,
  confident composition, restrained presentation, premium hero design.
- **Layered Depth** — sophisticated dark-mode surface hierarchy (L0–L4
  levels), tonal separation, restrained elevation, structural borders,
  component layering.

Explicitly NOT: cyberpunk, neon/RGB gaming, generic SaaS, generic admin
dashboard, glassmorphism-heavy, gradient-heavy, or "AI/vibe-coded."
Each page keeps a distinct personality (Home = flagship/editorial, Host
Monitor = operational/diagnostic, Recovery = reliability/incident,
Sunshine = service console, Game Manager = configuration/launch, Session
History = records, Analytics = analysis, Logs = operational evidence,
User Management = identity administration, Settings = configuration
workspace, Change Password = focused security workflow) within one
shared design language.

**REASON:** Supplied directly by the product owner this session, as a
concrete unified spec rather than a pick among the three previously
proposed directions (A/B/C, never recorded outside conversation — see
D-001 correction and HANDOFF.md gap). This supersedes the open A/B/C
question; those directions are no longer relevant.

**IMPORTANT — verified gap:** No L0–L4 surface-level tokens currently
exist in `frontend/src/dashboard/theme.js` (grepped for
`surface|L0|L1|L2|L3|L4|elevation` — no matches beyond a comment).
`theme.js` today defines a single flat surface color plus the existing
6-theme system (amber default, etc.) referenced in D-001, but no
elevation/layering scale. This is a real foundation gap, not yet built,
despite the product-owner-supplied context in this session's prompt
describing "theme/token infrastructure" as already established. Treat
that claim as **aspirational / unverified** until a Worker builds it —
see STATE.md correction for the full discrepancy.

**ALTERNATIVES:** Re-litigate A/B/C — rejected, the owner gave a
concrete spec instead, which is a stronger and more specific input.

**STATUS:** APPROVED
**PHASE:** P1

**RESOLUTION (P1-T03):** the verified gap above is closed. See D-009
for the concrete token work.

---

## D-009: P1-T03 concrete token foundation

**DECISION:** `theme.js` now exports `typeScale` (a 6-step typography
scale: `hero`, `heading`, `subheading`, `body`, `bodySmall`, `meta`)
and `surface` (an L0–L4 elevation scale). Both are additive — no
existing export was renamed or removed.

`typeScale` was derived from the de facto sizes already in use
(grepped `font-size`/`fontSize` across `src`), not invented:
- `hero` = `clamp(42px, 6vw, 82px)` / 0.98 / 600 / `-0.055em` — reuses
  Login's existing flagship treatment verbatim, for P3's Home hero.
- `heading` = 28px / 1.15 / 650 / `-0.03em` — PageHeader.jsx's existing
  `<h1>`, the current de facto section-heading size.
- `subheading` = 17px / 1.4 / 600 / `-0.01em` — the size used
  repeatedly (with `!important`) in `feature-page.css` for
  sub-headings.
- `body` = 13.5px / 1.5 / 500 — Login's form-input size, matching the
  13–14px cluster used for body copy generally.
- `bodySmall` = 12px / 1.45 / 500 — the 12–12.5px cluster.
- `meta` = 10px / 1.3 / 700 / `0.12em` / uppercase / mono — the ~30+
  occurrence uppercase mono-label pattern, identical to the existing
  `monoLabel` export's values (kept as a separate, untouched export for
  zero behavioral risk; documented as equivalent).
No new font families — every step reuses `fonts.display`/`body`/`mono`
per D-008.

`surface.l0`–`l4` are aliases of the 5 pre-existing background tokens,
not new colors. Verified by computing relative luminance for all 6
themes: `--color-bg` < `--color-bg-inset` < `--color-bg-elevated` <
`--color-bg-card` < `--color-bg-card-hover` holds in every theme (e.g.
default: 10.9 < 14.9 < 17.9 < 23.7 < 31.4). So:

    L0 = --color-bg           (deepest / page base)
    L1 = --color-bg-inset     (recessed)
    L2 = --color-bg-elevated
    L3 = --color-bg-card
    L4 = --color-bg-card-hover (highest)

New `--surface-l0`…`--surface-l4` custom properties were added to all
6 theme blocks in `App.jsx`, each with the exact same literal hex value
as that theme's corresponding legacy token (copy, not computed
reference) — zero value drift, zero visual change, spot-checked via
WCAG contrast: L0/L4 against `ink`/`inkDim` are all ≥8.2:1 in the
default/oled/ember themes (well above the 4.5:1 AA floor).

`theme-derive.js` (custom user-picked-color theme) was intentionally
**not** modified — it wasn't in this task's allowed-files list. Since
`--surface-l*` are aliases of the shared CSS custom properties (not a
separate value derivation), a user's custom theme automatically gets a
working L0–L4 ladder with no code changes there. Flagged as a known
limitation: if a future task changes `theme-derive.js`'s derivation
algorithm independently of the literal `App.jsx` blocks, the two could
drift — not a risk today since both currently encode the same 5-value
ladder.

**REASON:** Foundation-only task (P1-T03) — build tokens without
touching any component consumer, so P2+ has a real, documented,
non-ad-hoc system to build on, per D-008.

**ALTERNATIVES:** Introduce new color values for L0–L4 instead of
aliasing — rejected, would either (a) require re-tuning all 6 themes'
character (violates D-001's "already-refined, must not be flattened")
or (b) duplicate values that already exist, creating two sources of
truth for the same visual step.

**STATUS:** APPROVED
**PHASE:** P1

---

## D-010: Worker delivery switched from changed-files-only to full-repo

**CONTEXT:** RULES.md originally required Workers to deliver only
changed/created files plus `.ai/*`, explicitly excluding full repo
copies. In practice, every acceptance review from P2-T01 through
P5-T01 required Main Claude to reconstruct a full buildable candidate
by copying each delivered file onto the last accepted full-repo
baseline before `npm install`/`lint`/`build`/`test` could even run —
an extra manual step, repeated every single task, that added no real
verification value of its own (the actual verification is the diff and
the build, not the act of reconstructing one).

Two related incidents made the cost of this concrete rather than
theoretical:
- P4-T01 arrived as raw recovered files (a Worker session hit its
  token limit before packaging) with no `.ai/` folder at all — Main
  Claude still had to reconstruct a candidate from scratch to verify
  anything.
- A separately-packaged formal P4-T01 delivery ZIP turned out to be
  missing its `.ai/` folder entirely, discovered only via `unzip -l`.
  A full-repo delivery makes this exact category of gap easier to
  catch immediately (the delivered tree either matches the expected
  full structure or it visibly doesn't) rather than only surfacing once
  Main Claude tries to use the `.ai/` files that should have been
  there.

**DECISION:** Workers now deliver the complete `frontend/` directory
(minus `node_modules`/`.git`/`dist/`) exactly as they were given it,
with their task's changes applied in place, plus the complete updated
`.ai/` folder — not a changed-files-only subset. This lets Main Claude
run `diff -rq` directly between the delivered tree and the last
accepted full-repo baseline to confirm scope, with no reconstruction
step, and removes an entire category of "did I overlay this
correctly" risk from every acceptance review.

This does **not** change what Workers are allowed to edit — the
FILES/AREAS ALLOWED TO CHANGE list in each task's CURRENT_TASK.md is
still the actual scope contract, enforced the same way (diffed against
the baseline). It only changes what gets zipped up for delivery.

**REASON:** Removes a repeated, error-prone manual reconstruction step
from every acceptance review without weakening scope enforcement (the
diff-based scope check works the same or better against a full tree),
and makes packaging gaps (like P4-T01's missing `.ai/` folder)
self-evident from the delivered structure rather than something Main
Claude has to think to check for.

**ALTERNATIVES:** Keep changed-files-only but add a stricter
pre-delivery checklist — rejected, this treats the symptom (packaging
mistakes) rather than the actual repeated cost (reconstruction effort
on every review, whether or not that particular delivery had a
packaging mistake).

**STATUS:** APPROVED
**PHASE:** P5 (applies to all tasks going forward, retroactive to none)

## D-011: CSS-file `motion` audit approach — document-only, no new CSS custom-property infrastructure this phase

**CONTEXT:** P6-T02 through P6-T13 have audited every feature
component's inline JS style objects (`.jsx` files) against `theme.js`'s
`motion` export. That surface is now fully covered. Two CSS files
remain with `transition`/`animation` values: `src/styles/Login.css`
(2 values, both `0.15s ease`) and
`src/dashboard/components/feature-page.css` (30 values, several of
which are literally `160ms ease` — an exact duration-and-easing match
to `motion.base: "160ms ease"`).

Unlike `colors`/`surface` (which are backed by real CSS custom
properties — `--color-bg`, `--surface-l1`, etc. — that `theme.js`'s JS
exports merely wrap via `var(--color-bg)` strings, so a CSS file can
already reference the same source of truth `theme.js` does), `motion`
has **no corresponding CSS custom property**. `theme.js`'s `motion`
export is pure JS-literal timing strings with no `--motion-*` variable
backing it anywhere in the codebase. Confirmed via a repo-wide grep
for `--motion` and for `:root` blocks defining motion-related custom
properties — none exist.

**DECISION:** For this phase, CSS-file `transition`/`animation` values
are audited and **documented only**, using the same
comment-explaining-the-non-match convention established for every
JS-file audit so far (P6-T02 through P6-T13) — including cases like
`feature-page.css`'s `160ms ease` values that are a literal,
semantic match to `motion.base`. A literal-value match in a CSS file
is **not** treated as a convertible match this phase, because no
mechanism exists to reference `motion` from CSS without first adding
new `--motion-*` custom properties to the root theme CSS file — which
is new token infrastructure, not an audit of existing tokens, and
falls outside this phase's stated scope (aligning existing
already-JS-side inline-style usages to the already-existing `motion`
export). Document these cases explicitly as "would match `motion.base`
in value, but no CSS-side token exists to convert to" rather than
silently treating them the same as a genuine non-match — the
distinction is real and future-relevant even though the immediate
action (leave the literal, add a comment) is identical.

**REASON:** Keeps this audit phase's actual code-risk surface
unchanged (comment-only edits to already-reviewed files, the same
low-risk pattern every P6 task so far has used) rather than expanding
into root theme CSS changes — which would affect every consumer of
`--color-*`/`--surface-*` custom properties simultaneously and
deserves its own dedicated, carefully-scoped task with its own
validation plan, not a byproduct of an unrelated single-file audit.
Also keeps the phase consistent: every P6 task from T02 onward has
been "convert only on a genuine same-mechanism exact match, else
document," and CSS-vs-JS is a mechanism difference, not a values
difference — treating it as a non-match (with the caveat documented)
is the correct application of that same rule, not an exception to it.

**ALTERNATIVES:**
- Add `--motion-fast`/`--motion-base`/`--motion-cardIn`/`--motion-pill`
  custom properties to the root theme CSS now, as part of this task —
  rejected as scope creep into shared theme infrastructure without its
  own dedicated review, and unnecessary to satisfy this phase's actual
  goal (auditing existing usages against existing tokens).
- Skip CSS files entirely, treat the phase as JS-only — rejected,
  since `feature-page.css`'s literal 160ms/ease matches are exactly
  the kind of alignment-worth-surfacing case this phase exists to
  find, even if the current answer is "can't convert yet, but here's
  why."

**STATUS:** APPROVED
**PHASE:** P6 (applies to `Login.css`, `feature-page.css`, and any
other CSS file with `transition:`/`animation:` values audited under
this phase; a future phase could revisit adding `--motion-*` custom
properties as its own dedicated task)

---

## D-012: Vercel-inspired typography/spacing/depth refinement — principles only, dark theme retained; scheduled as a new phase (P7.5)

**CONTEXT:** The product owner supplied three external design-system
references this session (`Notion_Design.md`, `Vercel_Design.md`,
`Apple_Design.md` — full text preserved as `.ai/NOTION_DESIGN_REFERENCE.md`,
`.ai/VERCEL_DESIGN_REFERENCE.md`, `.ai/APPLE_DESIGN_REFERENCE.md` for
durable reference) and asked to document Vercel's system specifically
for possible implementation, since they like its look.

All three references are **light-first marketing-site systems**
(Vercel: near-white `#fafafa` canvas, near-black ink, hairline borders,
mesh-gradient as the only color flourish; Notion: warm paper-soft
off-white canvas with one dark hero exception; Apple: alternating
light/near-black full-bleed product tiles) — a fundamentally different
color foundation than PCGO's current, already-built system: 6 **dark**
themes (amber/verdant/ember/classic/mono/oled) with an L0–L4 dark-
surface elevation ladder (D-009), built and applied across every page
in P1–P6.

**DECISION:** Main Claude presented the tradeoff directly rather than
deciding unilaterally (consistent with D-008 being an explicit
product-owner call, not a Main Claude design decision). The product
owner chose: **borrow specific Vercel principles only, keep the
existing dark theme system** — explicitly ruled out flipping PCGO to
a light/white canvas. The adopted principles, to be applied *within*
the existing dark surface/color foundation (no `--color-*`/`--surface-*`
value changes):

1. **Tighter display-type tracking** — Vercel's negative letter-spacing
   scales with heading size (-2.4px at 48px hero scale, -1.28px at
   32px section scale). PCGO's `typeScale.hero` (D-009) already uses
   `-0.055em` tracking; audit whether the tighter, size-scaled Vercel
   relationship is worth adopting for `heading`/`subheading` too, not
   just `hero`.
2. **Vercel's 4px-base spacing scale** (4/8/12/16/24/32/40/64/96/128px)
   as a reference ladder to check PCGO's existing spacing values
   against for consistency — not a forced replacement, since PCGO
   doesn't currently have a formalized spacing-token system the way it
   has `typeScale`/`surface`.
3. **Hairline-first depth model** — Vercel's default is a 1px border
   with no shadow (`{rounded... }`-independent "Level 0 — Flat"), only
   using a whisper-soft layered shadow when a surface genuinely floats
   (menus/modals/tooltips). PCGO's existing `surface.l0`–`l4` ladder is
   background-lightness-driven, not hairline-driven — this principle
   is about *when* to add shadow/border emphasis on top of the
   existing surface steps, not a replacement for them.
4. **Disciplined grey-text ladder** — Vercel's `ink → body → mute →
   faint` 4-step text-color hierarchy, deliberately stepped rather than
   ad hoc. PCGO already has an analogous `ink`/`inkDim`/`inkFaint`/
   `inkGhost` ladder (the same tokens P7-T05 just fixed for contrast) —
   worth checking whether PCGO's is applied as consistently/
   deliberately as Vercel's, not introducing a new ladder.

**Explicitly NOT adopted:** the near-white canvas, near-black-on-white
ink relationship, the mesh gradient, pill-shaped marketing CTAs (PCGO
is an internal ops dashboard, not a marketing site — this component
vocabulary doesn't apply), Geist Sans/Mono as replacement font
families (PCGO's existing `fonts.display`/`body`/`mono` per D-008
stay).

**PHASING:** Neither planned future phase fits this work as-is — P8
("Full Visual QA") is an end-to-end render/regression pass over
already-built work, not new design work; P9 ("Regression + Final
Freeze") is explicitly a freeze phase. The product owner delegated the
exact placement to Main Claude. **Decision: a new phase, P7.5
("Typography, Spacing & Depth Refinement — Vercel-Inspired
Principles"), inserted between P7 and P8** — after P7 finishes (a
small number of items remain: CC-5, CC-6, CC-8, CC-10; pausing P7
mid-flight for unrelated design work isn't warranted) and before P8,
so the Full Visual QA pass verifies the final, fully-refined state
rather than something that gets touched again afterward. See
PLAN.md's new "P7.5" section for the phase definition. **Not yet
scoped into Worker tasks** — P7.5 tasks will be written once P7
actually closes.

**ALTERNATIVES:**
- Flip to a light canvas — explicitly rejected by the product owner;
  would also be a foundational rewrite invalidating P1–P6's
  already-accepted dark-theme/surface-token work, in tension with
  RULES.md's "no giant unjustified rewrites."
- Start P7.5 immediately, interleaved with remaining P7 tasks —
  rejected; P7 is nearly done and mixing an accessibility-fix task
  queue with a typography-refinement task queue in the same phase
  window adds confusion for no real benefit given P7's small
  remaining scope.
- Place P7.5 after P8/P9 instead of before — rejected; doing visual
  refinement after the "Full Visual QA" pass would mean re-doing that
  QA pass, and doing it after P9 ("Final Freeze") contradicts the
  concept of a freeze.

**STATUS:** APPROVED
**PHASE:** P7 (decision), scoped to apply in the new P7.5

---

## D-013: CC-8 left undispatched — P7 closes without a dedicated task for it

**CONTEXT:** After P7-T09 (CC-10) closed, CC-8 was the only remaining
open item in `P7_AUDIT_FINDINGS.md`. Its own text already says
**"this is solid — not a finding"**: `DashboardLayout.jsx`/
`MobileHeader.jsx` correctly handle Escape-to-close, focus return, and
a click-to-close backdrop; the only gap is that the underlying page
content isn't marked `inert` while the drawer is open (only the
drawer's own controls are `inert`-gated when *closed* — confirmed
directly via `grep -rn "inert" dashboard/`), so a keyboard user could
in principle tab past the drawer into the visually-obscured page
behind the backdrop.

**DECISION:** Do not dispatch a dedicated Worker task for CC-8. Close
P7 without it. Reasoning:
- The audit itself frames this as a low-priority polish note, not a
  bug — an easy, working exit already exists (Escape and backdrop-
  click both work).
- Fixing it means touching `DashboardLayout.jsx`'s main content
  wrapper — the app's shell/layout component — for a marginal,
  edge-case keyboard-navigation improvement. That's a higher blast-
  radius change than the other 5 P7 fixes (all single-component,
  single-property/attribute changes) for proportionally low benefit.
- P7's other 5 findings (CC-3/4/5/6/9/10) all had genuine user-facing
  or QA-integrity impact; this one doesn't rise to the same bar.

**STATUS:** APPROVED. If this becomes worth revisiting later (e.g.
during P7.5 or a future accessibility pass), the fix is well-understood
and small: mark the main `<main>`/content wrapper `inert` (or
`aria-hidden` + a focus trap) while the drawer is open, mirroring
`ConfirmDialog.jsx`'s existing pattern for dialogs.

**PHASE:** P7 (closing decision)

---

## D-014: P8 adapted from screenshot QA to API-contract QA; real `host-agent` backend confirmed running (with one locally-patched, unreported bug)

**CONTEXT:** P8's original objective (written before this sandbox's
constraints were tested against it) was an end-to-end render pass
against the real backend. This session got the real `host-agent`
backend running for the first time (previously only the `qa/` mock
harness had been used, across all of P7). Doing so surfaced two
things:

1. **The backend can't boot as-delivered on a non-Windows host.**
   `host_agent/host_monitor.py` calls `sys.getwindowsversion()`
   unconditionally — this crashes FastAPI's startup lifespan
   immediately on Linux/macOS. Confirmed this is very likely a genuine
   oversight, not intentional platform-gating: `api/routes/system.py`'s
   DPI-awareness call two files over already correctly wraps its own
   Windows-only `ctypes.windll` calls in `try`/`except`. Applied a
   local, environment-only patch (guard with
   `hasattr(sys, "getwindowsversion")`, same pattern as the DPI call)
   purely to allow this session to run and QA against the real
   backend — **this was explicitly not delivered as a fix to the real
   `host-agent` project**, since this project's Worker-orchestration
   relationship (per RULES.md) covers `frontend/`+`.ai/` only, not
   `host-agent/`. The bug is real and worth reporting to whoever
   maintains that codebase, but doing so is outside this project's
   scope.
2. **True screenshot/visual QA remains impossible in this sandbox**
   regardless of backend choice — `cdn.playwright.dev` (needed to
   download a Chromium binary for Playwright) is outside the sandbox's
   network egress allowlist. This has been confirmed repeatedly across
   P7-T05/T06/T07/T08/T09 and P7.5-T03, always with the identical `403`
   result — it's an environment-level constraint, not something a
   different backend or more retries would change.

**DECISION:** Presented this tradeoff to the product owner rather than
silently picking a fallback. **Product owner chose: proceed with the
real backend (not the mock harness) for API-contract QA specifically**
— verifying every frontend component's real field reads against the
real backend's real response shapes via direct HTTP requests, since
pixel-level visual verification isn't achievable here either way.

**STATUS:** APPROVED. P8-T01 dispatched under this adapted
methodology. `PLAN.md`'s P8 section retitled "Full Visual QA (adapted
to API-Contract QA)" to keep the historical objective visible while
reflecting reality.

**ALTERNATIVES CONSIDERED:**
- Keep using the mock QA harness for P8, skip real-backend
  integration entirely — rejected per explicit product-owner choice;
  the mock harness (even now that P7-T08 fixed its fixture shapes) is
  still hand-authored and can't reveal contract drift the way a real
  backend can.
- Skip P8 rigor entirely, move straight to P9 — considered and offered
  as an option, not chosen.

**PHASE:** P8
