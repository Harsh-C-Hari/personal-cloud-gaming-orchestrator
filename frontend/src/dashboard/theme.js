/**
 * dashboard/theme.js
 *
 * Shared design tokens for the whole app — "Chalkboard Neo-Brutalist"
 * (see DESIGN_SYSTEM.md). Dark paper, chalk-white ink, flat pastel accents,
 * borders instead of shadows, no glow/gradient/blur.
 *
 * Back-compat note: the original token names (colors, fonts, nav, cardStyle,
 * monoLabel) are kept as exports so every existing import in the app keeps
 * working untouched through this phase. Their *values* now point at the new
 * palette below. New token groups (spacing, radius, shadow, motion) are
 * additive. A handful of legacy `colors.*` keys (text, textDim, textFaint,
 * textMuted, textGhost, accent, accentDim, dangerDim) are aliases onto the
 * new ink/accent scale — later phases should migrate call sites to the
 * canonical names (ink, inkDim, inkFaint, accentBlue, etc.) and these
 * aliases can then be removed.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  // Base surfaces (chalkboard) — theme-controlled, see App.jsx's :root /
  // [data-theme] blocks. All 5 themes use the same lightness ladder (only
  // hue lean differs, verified to preserve WCAG contrast identically).
  bg: "var(--color-bg)",
  bgElevated: "var(--color-bg-elevated)",
  bgCard: "var(--color-bg-card)",
  bgCardHover: "var(--color-bg-card-hover)",
  bgInset: "var(--color-bg-inset)",

  // Ink (chalk-white text scale) — theme-controlled
  ink: "var(--color-ink)",
  inkDim: "var(--color-ink-dim)",
  inkFaint: "var(--color-ink-faint)",
  inkGhost: "var(--color-ink-ghost)",

  // Borders (all derived from that theme's own ink at varying opacity) — theme-controlled
  border: "var(--color-border)",
  borderSubtle: "var(--color-border-subtle)",
  borderStrong: "var(--color-border-strong)",
  borderInk: "var(--color-border-ink)",

  // Flat pastel accents (tags/status/small UI only — never large fills)
  accentLilac: "#B9A6FF",
  accentLilacDim: "rgba(185,166,255,0.14)",
  accentPink: "#FF9ED5",
  accentPinkDim: "rgba(255,158,213,0.14)",
  accentBlue: "#7EC8F2",
  accentBlueDim: "rgba(126,200,242,0.14)",
  accentGreen: "#6EE7B0",
  accentGreenDim: "rgba(110,231,176,0.14)",
  accentYellow: "#F5D76E",
  accentYellowDim: "rgba(245,215,110,0.14)",

  // Brand accent — the ONE signature/identity color (wordmark, primary
  // icon badges used purely for visual identity, hero CTAs). Not semantic —
  // see DESIGN_SYSTEM.md §1a. accentBlue/info stays reserved for genuine
  // "informational" meaning.
  //
  // Multi-theme support (DESIGN_SYSTEM.md §8): these two tokens are the
  // ONLY ones that vary by theme, so — unlike every other token in this
  // file — they're CSS custom-property references, not literal hex. The
  // actual per-theme values are defined once in App.jsx's injected
  // stylesheet (`:root` + `[data-theme="X"]` blocks) and swapped by
  // setting `document.documentElement.dataset.theme`. Every call site that
  // does `colors.brand` keeps working unchanged, since it's still just a
  // string constant — it just now resolves via CSS instead of JS.
  brand: "var(--color-brand)",
  brandDim: "var(--color-brand-dim)",

  // Semantic (flat, no glow)
  success: "#6EE7B0",
  warning: "#F5D76E",
  danger: "#FF6B6B",
  info: "#7EC8F2",
  neutral: "#B9B7AE",

  // --- Legacy aliases (pre-redesign names, kept so existing imports don't
  // break). Map onto the new scale above; collapse where the old palette
  // had more steps than the new one. Prefer the canonical names above in
  // any new or rewritten code. ---
  text: "var(--color-ink)", // -> ink
  textDim: "var(--color-ink-dim)", // -> inkDim
  textFaint: "var(--color-ink-faint)", // -> inkFaint
  textMuted: "var(--color-ink-faint)", // -> inkFaint (old 5-step scale collapsed to new 4-step)
  textGhost: "var(--color-ink-ghost)", // -> inkGhost
  accent: "#7EC8F2", // -> accentBlue (closest role to the old cyan `accent`)
  accentDim: "rgba(126,200,242,0.14)", // -> accentBlueDim
  dangerDim: "rgba(255,107,107,0.14)", // wash for `danger`, same pattern as the accent washes
};

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fonts = {
  display: "'Space Grotesk', sans-serif", // headings — was Rajdhani
  body: "'Inter', sans-serif", // body/UI text, labels, buttons (new)
  mono: "'JetBrains Mono', monospace", // logs, ids, timestamps — unchanged
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const nav = {
  headerHeight: 52,
  sidebarWidth: 236,
  mobileHeaderHeight: 52,
};

// ---------------------------------------------------------------------------
// Spacing & radius (new — DESIGN_SYSTEM.md §3)
// ---------------------------------------------------------------------------

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
  sm: 8, // inputs, small icon chips
  md: 12, // larger inputs, sub-cards
  lg: 16, // cards, panels, modals
  full: 999, // buttons, pills, chips, badges, avatars
};

// One allowed shadow — true overlays only (modals/toasts). Never colored,
// never a glow.
export const shadow = {
  overlay: "0 8px 24px rgba(0,0,0,0.45)",
};

// Shared motion timings (DESIGN_SYSTEM.md §6)
export const motion = {
  fast: "100ms ease", // button press
  base: "150ms ease", // hover/focus transitions
  cardIn: "180ms ease", // card mount
  pill: "180ms cubic-bezier(0.4,0,0.2,1)", // nav active pill
};

// ---------------------------------------------------------------------------
// Derived shared styles
// ---------------------------------------------------------------------------

export const cardStyle = {
  background: colors.bgCard,
  border: `1.5px solid ${colors.border}`,
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
