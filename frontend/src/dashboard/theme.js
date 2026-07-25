/**
 * dashboard/theme.js
 *
 * Shared design tokens for the dashboard shell (layout, nav, pages).
 * Existing components (SessionCard, HostStatusPanel, etc.) keep their own
 * inline styles untouched — this file only backs the *new* shell UI so the
 * whole app reads as one coherent, premium dark theme.
 */

export const colors = {
  bg: "#000000a4",
  bgElevated: "#00000000",
  bgCard: "rgb(0, 0, 0)",
  bgCardHover: "rgba(21,24,33,0.75)",
  border: "#111620",
  borderSubtle: "#1c2130",
  borderStrong: "rgba(148,163,184,0.18)",

  text: "#e2e8f0",
  textDim: "#94a3b8",
  textFaint: "#64748b",
  textMuted: "#475569",
  textGhost: "#2d3748",

  accent: "#38bdf8",
  accentDim: "rgba(56,189,248,0.12)",
  success: "#10d98a",
  warning: "#f5a524",
  danger: "#f43f5e",
  dangerDim: "rgba(244,63,94,0.08)",
};

export const fonts = {
  display: "'Rajdhani', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const nav = {
  headerHeight: 52,
  sidebarWidth: 236,
  mobileHeaderHeight: 52,
};

export const cardStyle = {
  background: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: "10px",
};

export const monoLabel = {
  fontSize: "9.5px",
  color: colors.textMuted,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  fontFamily: fonts.mono,
};
