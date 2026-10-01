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
  // Per DESIGN.md §5.1: accent colors with real call sites retained.
  // accentLilac and accentPink removed (no call site ever passed
  // tone="lilac" or tone="pink" — confirmed by grep; safe to delete).
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
  // 2.4: Self-hosted IBM Plex fonts (via @fontsource in main.jsx).
  // display/body both use IBM Plex Sans; mono uses IBM Plex Mono.
  display: "'IBM Plex Sans', system-ui, 'Segoe UI', sans-serif",
  body:    "'IBM Plex Sans', system-ui, 'Segoe UI', sans-serif",
  mono:    "'IBM Plex Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace",
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
  // 2.3: Display — Login only
  hero: {
    fontSize: "clamp(36px, 5vw, 64px)",
    lineHeight: 1.05,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    fontFamily: fonts.display,
  },
  // Page titles, section headings (28px/600)
  heading: {
    fontSize: "28px",
    lineHeight: 1.15,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    fontFamily: fonts.display,
  },
  // Sub-section headings (20px)
  subheading: {
    fontSize: "20px",
    lineHeight: 1.3,
    fontWeight: 600,
    letterSpacing: "0",
    fontFamily: fonts.display,
  },
  // Body copy (14px/400/1.5 per 2.3 spec)
  body: {
    fontSize: "14px",
    lineHeight: 1.5,
    fontWeight: 400,
    letterSpacing: "0",
    fontFamily: fonts.body,
  },
  // Small body / helper text (12px floor)
  bodySmall: {
    fontSize: "12px",
    lineHeight: 1.45,
    fontWeight: 400,
    letterSpacing: "0",
    fontFamily: fonts.body,
  },
  // 2.3: label replaces meta — sentence case, 12px/500, faint color
  // NO textTransform; NO uppercase
  label: {
    fontSize: "12px",
    lineHeight: 1.3,
    fontWeight: 500,
    letterSpacing: "0",
    fontFamily: fonts.body,
  },
  // meta kept as deprecated alias — same as label but without uppercase.
  // Remove once all call sites migrated to typeScale.label.
  meta: {
    fontSize: "12px",
    lineHeight: 1.3,
    fontWeight: 500,
    letterSpacing: "0",
    fontFamily: fonts.mono,
  },
  // metric — large readout numbers (tabular, mono)
  metric: {
    fontSize: "clamp(28px, 3vw, 40px)",
    lineHeight: 1.05,
    fontWeight: 600,
    letterSpacing: "-0.02em",
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

// 2.6: Radius scale — 4/8/12/999.
//   4   → badges, chips, inline code
//   8   → buttons, inputs, selects, small panels
//   12  → cards, dialogs, toasts
//   999 → pills, dots, toggles
export const radius = {
  // Canonical values
  xs:   4,    // badges, chips
  sm:   8,    // buttons, inputs
  md:   12,   // cards, dialogs, toasts
  full: 999,  // pills, dots, toggles
  // Legacy aliases — kept so call sites don’t break during migration.
  // Migrate call sites to xs/sm/md/full and remove these.
  none:  0,   // ⚠️ deprecated — use 0 directly or xs
  tight: 4,   // ⚠️ deprecated — use radius.xs
  lg:    12,  // ⚠️ deprecated — use radius.md
};

// 2.10: Elevation — two levels only: flat (cards/page) and overlay (dialogs, toasts, menus).
// shadow.press, shadow.lift, shadow.small are deprecated (hard-offset/legacy).
// Cards separate surfaces via border + surface step, not shadows.
export const shadow = {
  flat:    "none",
  overlay: "0 18px 50px rgba(0,0,0,0.38)",
  // ⚠️ deprecated — do not use on new components
  press:     "2px 2px 0 0 var(--color-border-ink)",
  lift:      "3px 3px 0 0 var(--color-border-strong)",
  small:     "0 8px 24px rgba(0,0,0,0.45)",
  focusRing: "0 0 0 3px rgba(140,196,232,0.55)",
};

// 2.9: Motion tokens — fast/base/enter/exit with correct easings.
// Entering: cubic-bezier(0.22, 1, 0.36, 1) (decelerate in).
// Exiting:  ease-in (accelerate out).
// Removed: overshoot cubic-bezier(0.34, 1.15, 0.64, 1).
export const motion = {
  fast:     "100ms ease",           // hover/press state changes
  base:     "160ms ease",           // hover transitions
  enter:    "220ms cubic-bezier(0.22, 1, 0.36, 1)",  // page/card mount
  exit:     "150ms ease-in",        // unmount / dismiss
  // Descriptive aliases
  press:    "100ms ease",
  hover:    "160ms ease",
  entrance: "220ms cubic-bezier(0.22, 1, 0.36, 1)",
  // Backwards-compat aliases — remove when all call sites updated
  cardIn:   "220ms cubic-bezier(0.22, 1, 0.36, 1)",
  pill:     "160ms cubic-bezier(0.4,0,0.2,1)",
  // ⚠️ deprecated: overshoot curve removed per 2.9
  transition: "220ms cubic-bezier(0.22, 1, 0.36, 1)",
};

// Default card style — radius.md (12px) per 2.6 spec.
export const cardStyle = {
  background: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: `${radius.md}px`,
};

// ⚠️ deprecated — use typeScale.label for new components.
// monoLabel kept for call-site compatibility. textTransform:uppercase
// is removed from new usage (see 2.3 spec).
export const monoLabel = {
  fontSize: "12px",
  color: colors.inkFaint,
  letterSpacing: "0",
  fontFamily: fonts.mono,
  fontWeight: 500,
};
