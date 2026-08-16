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

export const monoLabel = {
  fontSize: "10px",
  color: colors.inkFaint,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontFamily: fonts.mono,
  fontWeight: 700,
};
