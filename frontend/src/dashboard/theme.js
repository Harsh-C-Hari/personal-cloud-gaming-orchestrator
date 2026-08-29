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

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export const shadow = {
  overlay: "0 18px 50px rgba(0,0,0,0.38)",
  // Tighter blur/spread for small floating elements (e.g. circular FAB
  // buttons) where the large-panel `overlay` shadow reads as oversized.
  small: "0 8px 24px rgba(0,0,0,0.45)",
};

export const motion = {
  fast: "100ms ease",
  base: "160ms ease",
  cardIn: "220ms ease",
  pill: "180ms cubic-bezier(0.4,0,0.2,1)",
};

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
