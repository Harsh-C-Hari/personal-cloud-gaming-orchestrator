/**
 * Shared PCGO visual tokens.
 *
 * The token names remain backwards-compatible with existing pages and feature
 * components. The visual language is intentionally restrained: warm graphite
 * surfaces, a single brand accent, semantic status colors, compact type, and
 * depth through spacing and contrast rather than decorative effects.
 */

export const colors = {
  bg: "var(--color-bg)",
  bgElevated: "var(--color-bg-elevated)",
  bgCard: "var(--color-bg-card)",
  bgCardHover: "var(--color-bg-card-hover)",
  bgInset: "var(--color-bg-inset)",
  ink: "var(--color-ink)",
  inkDim: "var(--color-ink-dim)",
  inkFaint: "var(--color-ink-faint)",
  inkGhost: "var(--color-ink-ghost)",
  border: "var(--color-border)",
  borderSubtle: "var(--color-border-subtle)",
  borderStrong: "var(--color-border-strong)",
  borderInk: "var(--color-border-ink)",
  // Per DESIGN.md §5.1's fixed semantic meaning table:
  //   accentLilac = orchestration/automation (decorative accent only)
  //   accentPink  = decorative accent only (NEVER a status)
  //   accentBlue  = network / info (Tailscale dependency, info banners)
  //   accentGreen = positive / live (active session, success states)
  //   accentYellow = caution (warning states)
  // The accent colors above are still caller-pickable from the API
  // perspective (the `Chip` primitive's `tone` prop still accepts all
  // ten tones), but per §6.4 the documented intent is to migrate
  // caller call sites to fixed semantic usage over time. COMPONENT_SPECS
  // §3.3 flags this as an open gap between intent and current API.
  accentLilac: "#B8A7FF",
  accentLilacDim: "rgba(184,167,255,0.13)",
  accentPink: "#F3A5D0",
  accentPinkDim: "rgba(243,165,208,0.13)",
  accentBlue: "#8CC4E8",
  accentBlueDim: "rgba(140,196,232,0.13)",
  accentGreen: "#7BD7A7",
  accentGreenDim: "rgba(123,215,167,0.13)",
  accentYellow: "#EBCB73",
  accentYellowDim: "rgba(235,203,115,0.13)",
  brand: "var(--color-brand)",
  brandDim: "var(--color-brand-dim)",
  success: "#7BD7A7",
  warning: "#EBCB73",
  danger: "#F07F83",
  info: "#8CC4E8",
  neutral: "#B5B5AF",
  text: "var(--color-ink)",
  textDim: "var(--color-ink-dim)",
  textFaint: "var(--color-ink-faint)",
  textMuted: "var(--color-ink-faint)",
  textGhost: "var(--color-ink-ghost)",
  accent: "#8CC4E8",
  accentDim: "rgba(140,196,232,0.13)",
  dangerDim: "rgba(240,127,131,0.13)",
};

export const fonts = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/**
 * L0-L4 surface elevation scale (D-008 "Layered Depth").
 *
 * Formalizes the 5 background steps that already existed per-theme in
 * `App.jsx` (`--color-bg`, `--color-bg-inset`, `--color-bg-elevated`,
 * `--color-bg-card`, `--color-bg-card-hover`) into a real, ordered
 * elevation ladder. Verified across all 6 themes: those 5 custom
 * properties are already monotonically increasing in lightness in that
 * exact order, so L0-L4 below are pure aliases — same CSS custom
 * properties, same values, zero visual change. Existing consumers of
 * `colors.bg`/`bgElevated`/`bgCard`/`bgCardHover`/`bgInset` are
 * untouched and keep working; new work should prefer `surface.l0`-`l4`
 * for anything that's conceptually "which elevation step" rather than
 * "which legacy background slot":
 *
 *   L0 (deepest / page base)   = --color-bg            = colors.bg
 *   L1 (recessed / inset)      = --color-bg-inset       = colors.bgInset
 *   L2 (elevated)              = --color-bg-elevated    = colors.bgElevated
 *   L3 (card)                  = --color-bg-card        = colors.bgCard
 *   L4 (card, hovered/highest) = --color-bg-card-hover  = colors.bgCardHover
 *
 * Note: `theme-derive.js` (the "custom" user-picked-color theme) still
 * only derives the original 5 legacy background keys, not L0-L4
 * directly — since the CSS custom properties are shared, the derived
 * custom theme automatically gets a working L0-L4 ladder too via the
 * aliases below, with no changes needed there.
 */
export const surface = {
  l0: "var(--surface-l0)",
  l1: "var(--surface-l1)",
  l2: "var(--surface-l2)",
  l3: "var(--surface-l3)",
  l4: "var(--surface-l4)",
};

/**
 * Typography scale (D-008 "Calm Editorial" — strong typography,
 * confident composition). Additive/backwards-compatible: `fonts` above
 * is unchanged, this extends it with concrete size/weight/line-height
 * steps. Not invented from scratch — derived from the de facto scale
 * already in use (grepped `font-size`/`fontSize` across `src`):
 *
 *   - `hero`: the existing Login flagship treatment
 *     (`clamp(42px, 6vw, 82px)`), reused verbatim as the scale's hero
 *     step for P3's Home flagship treatment.
 *   - `heading`: PageHeader.jsx's existing `<h1>` (28px/650/-0.03em),
 *     the current de facto section-heading size.
 *   - `subheading`: the 17px size already used repeatedly in
 *     `feature-page.css` for sub-section headings.
 *   - `body`/`bodySmall`: the 13.5px/12px cluster used for form inputs
 *     and body copy across pages.
 *   - `meta`: the 10px uppercase mono label pattern used ~30+ times
 *     across the app (same values as the existing `monoLabel` below).
 *
 * No new font families are introduced — every step reuses `fonts`
 * (Space Grotesk / Inter / JetBrains Mono) per D-008.
 */
export const typeScale = {
  hero: {
    fontSize: "clamp(42px, 6vw, 82px)",
    lineHeight: 0.98,
    fontWeight: 600,
    letterSpacing: "-0.055em",
    fontFamily: fonts.display,
  },
  heading: {
    fontSize: "28px",
    lineHeight: 1.15,
    fontWeight: 650,
    letterSpacing: "-0.03em",
    fontFamily: fonts.display,
  },
  subheading: {
    fontSize: "17px",
    lineHeight: 1.4,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    fontFamily: fonts.display,
  },
  body: {
    fontSize: "13.5px",
    lineHeight: 1.5,
    fontWeight: 500,
    letterSpacing: "0",
    fontFamily: fonts.body,
  },
  bodySmall: {
    fontSize: "12px",
    lineHeight: 1.45,
    fontWeight: 500,
    letterSpacing: "0",
    fontFamily: fonts.body,
  },
  meta: {
    fontSize: "10px",
    lineHeight: 1.3,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontFamily: fonts.mono,
  },
  // `metric` — the standalone-number step (DESIGN.md §5.2 / §6.11).
  // Designed for the "big number that exists to be read at a glance"
  // content category: Host Monitor's readiness stat, ProgressStat
  // values (CPU/RAM/GPU%), SessionSidebar's active-session/total
  // counts, Recovery's RECOVERIES/FAILURES summary, etc. Uses
  // JetBrains Mono + tabular-nums so multi-digit values don't shift
  // horizontally as they tick. Clamp range (22→34px) is intentionally
  // responsive — narrow at small viewports, full at desktop. Host
  // Monitor is the page to tune this against per §6.12.
  metric: {
    fontSize: "clamp(22px, 3vw, 34px)",
    lineHeight: 1.05,
    fontWeight: 700,
    letterSpacing: "-0.025em",
    fontFamily: fonts.mono,
    fontVariantNumeric: "tabular-nums",
  },
};

export const nav = {
  headerHeight: 64,
  sidebarWidth: 252,
  mobileHeaderHeight: 64,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,
};

// Binary radius system (DESIGN.md §5.3 / §6.3). The Tactical Console
// Brutalism language collapses the prior 8/12/16 scale to a strict binary:
// 0px on structural panels, 4px on sanctioned small chrome (chips, icon
// wells, sidebar nav rows, back buttons), and 999px on round objects
// (status pills, circular color swatches, etc.). There is intentionally
// NO middle value — see DESIGN.md §11 anti-patterns.
//
// The legacy `sm`/`md`/`lg` keys remain as deprecated aliases (pointing
// at the closest new equivalent) so this pass can migrate call sites
// incrementally without breaking anything that hasn't been touched yet.
// New code MUST use `radius.none`/`radius.tight`/`radius.full`, not the
// legacy keys — those exist only to keep the rest of the codebase
// rendering correctly during the migration window.
export const radius = {
  // Target values.
  none: 0,
  tight: 4,
  full: 999,
  // `lg` (16px) — reintroduced in TCB-P3 as the "soft framed card"
  // scale. After TCB-P2 made every container a hard `radius.none`
  // rectangle, the Card primitive + the StartSessionForm container
  // read as too sharp at the page-level card scale (Tactical Console
  // Brutalism's structural signal is carried by the 1px ink stroke +
  // hard-offset shadow, not the 0px rectangle). Reintroducing 16px as
  // a sanctioned 4th value gives every page-level "soft framed tile"
  // a uniform curve without breaking the binary system on the small
  // chrome (`tight` 4px) and the true round objects (`full` 999px).
  // Consumers reach for `radius.lg` on container surfaces (cards,
  // forms, modals); reach for `radius.tight` on chips/icon wells;
  // reach for `radius.full` on pills/dots.
  lg: 16,
  // Deprecated legacy aliases. Remove once every call site has been
  // migrated to the binary keys above (tracked in CURRENT_TASK.md).
  sm: 4, // was 8, now collapses into `tight` — kept for one-pass safety
  md: 0, // was 12, now collapses into `none` — kept for one-pass safety
};

// Hard-offset shadow family (DESIGN.md §5.5). Replaces the prior soft-
// blur `overlay`/`small` pair with the brutalist "object sits on a
// visible 2–3px offset" vocabulary: a 2px 2px offset for pressed-in
// primary actions, a 3px 3px offset for lifted interactive cards, an
// unchanged `overlay` reserved for things genuinely floating above
// content (modals, toasts, full-screen recovery), and a `focusRing`
// ring for keyboard focus. The hard offsets paint a 1-channel "ink"
// border-color so they read on every theme, not just the default.
//
// Legacy `overlay`/`small` are kept (unchanged) as deprecated aliases
// since `shadow.overlay` is still in use by the modals/toasts the new
// system explicitly reserves it for, and per the migration plan the
// `overlay` value stays in place. `shadow.small` is unused in the new
// system — kept as a no-op alias so any stale reference still resolves.
export const shadow = {
  flat: "none",
  press: "2px 2px 0 0 var(--color-border-ink)",
  lift: "3px 3px 0 0 var(--color-border-strong)",
  // KEEP — reserved for genuinely-floating overlays (modals, toasts,
  // full-screen error recovery). See `overlay` legacy alias below.
  overlay: "0 18px 50px rgba(0,0,0,0.38)",
  focusRing: "0 0 0 3px rgba(140,196,232,0.55)", // accentDim at 55% — visible on dark surfaces across all 6 themes
  // Deprecated legacy alias — was "small floating element" shadow,
  // unused under the binary system, kept as a no-op for one-pass safety.
  small: "0 8px 24px rgba(0,0,0,0.45)",
};

export const motion = {
  // Existing values — kept literal/unchanged.
  fast: "100ms ease",
  base: "160ms ease",
  cardIn: "220ms ease",
  pill: "180ms cubic-bezier(0.4,0,0.2,1)",
  // New alias tokens (DESIGN.md §5.6 / §8). The new tokens point at
  // existing values rather than introducing new timing curves, so the
  // migration is name-only — no behavioral change. New code should
  // prefer these descriptive names over the raw `fast`/`base`/`cardIn`
  // strings.
  press: "100ms ease",       // alias of `fast` — button press/release
  hover: "160ms ease",       // alias of `base` — hover state changes
  entrance: "220ms ease",    // alias of `cardIn` — page/card mount fade-in
  // State transition — controlled overshoot, reserved for badge/tone
  // flips (DESIGN.md §8). New value, not a re-alias — named explicitly
  // because no existing token models it.
  transition: "220ms cubic-bezier(0.34, 1.15, 0.64, 1)",
};

// Default card geometry — `borderRadius` updated to `radius.lg` (16px,
// the "soft framed card" scale reintroduced in TCB-P3) so every
// `cardStyle` consumer inherits the same smooth card edge as the
// StartSessionForm container + the Card primitive + the Home
// NavigationCard row. Call sites that want a non-zero non-16 radius
// (small chrome at 4px / `radius.tight`, or true round objects at
// `radius.full`) must override inline.
export const cardStyle = {
  background: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: `${radius.lg}px`,
};

// Unchanged (kept literal, not refactored to spread typeScale.meta, to
// guarantee zero behavioral change to this existing export) — but note
// its values are exactly typeScale.meta above; new code should prefer
// typeScale.meta directly.
export const monoLabel = {
  fontSize: "10px",
  color: colors.inkFaint,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontFamily: fonts.mono,
  fontWeight: 700,
};
