import { forwardRef, useState } from "react";
import { Inbox } from "lucide-react";
import { colors, fonts, radius, shadow, motion } from "../../dashboard/theme.js";

// Per DESIGN.md §6.1: the hard offset-shadow is reserved for the
// SINGLE primary action per view (primary + dangerFilled variants).
// secondary/ghost/danger stay flat (shadow.flat) so the press signal
// reads as a hierarchy cue, not ambient chrome on every button.
const BUTTON_VARIANTS = {
  primary: { background: colors.brand, color: colors.bg, border: "1px solid transparent", restingShadow: shadow.press },
  secondary: { background: colors.bgElevated, color: colors.ink, border: `1px solid ${colors.borderStrong}`, restingShadow: shadow.flat },
  ghost: { background: "transparent", color: colors.inkDim, border: "1px solid transparent", restingShadow: shadow.flat },
  danger: { background: "transparent", color: colors.danger, border: `1px solid ${colors.danger}`, restingShadow: shadow.flat },
  dangerFilled: { background: colors.danger, color: colors.bg, border: "1px solid transparent", restingShadow: shadow.press },
};

const BUTTON_HOVER_BG = {
  secondary: colors.bgCardHover,
  ghost: "rgba(241,240,236,0.06)",
  danger: "rgba(240,127,131,0.11)",
};

export const Button = forwardRef(function Button(
  { variant = "primary", disabled = false, children, style, onClick, type = "button", ...rest },
  ref,
) {
  const base = BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary;
  const hoverBg = BUTTON_HOVER_BG[variant];
  // Allow the consumer to override the resting shadow via style
  // (e.g. a "flat" override for a button embedded inside a card that
  // already has a press shadow). `restingShadow` lives on the variant
  // config so it round-trips through the same `resting*` capture
  // pattern as `restingBackground`/`restingFilter` below.
  const restingShadow = style?.boxShadow ?? base.restingShadow;
  const restingBackground = style?.background ?? base.background;
  const restingFilter = style?.filter ?? "none";

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary" || variant === "dangerFilled") e.currentTarget.style.filter = "brightness(1.08)";
        else if (hoverBg) e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.filter = restingFilter;
        e.currentTarget.style.background = restingBackground;
        e.currentTarget.style.boxShadow = restingShadow;
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(1px)";
        // Collapse the press shadow while pressed — the visible offset
        // is what reads as "this button has been pushed down" per §6.1.
        e.currentTarget.style.boxShadow = shadow.flat;
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = restingShadow;
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.currentTarget.style.transform = "translateY(1px)";
          e.currentTarget.style.boxShadow = shadow.flat;
        }
      }}
      onKeyUp={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = restingShadow;
        }
      }}
      onFocus={(e) => {
        // shadow.focusRing stacks on top of the variant's resting shadow
        // via box-shadow's comma-separated multi-shadow syntax. Stays in
        // addition to the existing native focus outline, not replacing
        // it (per §6.1's explicit instruction).
        const baseShadow = e.currentTarget.style.boxShadow || restingShadow;
        e.currentTarget.style.boxShadow = baseShadow === shadow.flat || baseShadow === "none"
          ? shadow.focusRing
          : `${baseShadow}, ${shadow.focusRing}`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = restingShadow;
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "40px",
        padding: "10px 15px",
        // Per §6.1: primary Button shape is `radius.none` (structural
        // rectangle, not chip). Was `radius.sm` (8px).
        borderRadius: `${radius.none}px`,
        fontFamily: fonts.body,
        fontSize: "13px",
        fontWeight: 650,
        lineHeight: 1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        boxShadow: restingShadow,
        // Per §5.6: motion.press on the transform release, motion.hover
        // on background/border-color/filter. The remaining transition
        // slot is for the box-shadow release (no dedicated token, kept
        // literal at motion.hover for consistency with the existing
        // 160ms ease used for background/filter).
        transition: `filter ${motion.hover}, background ${motion.hover}, transform ${motion.press}, border-color ${motion.hover}, box-shadow ${motion.hover}`,
        userSelect: "none",
        whiteSpace: "nowrap",
        ...base,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
});

export function Card({ children, hoverable = false, style, ...rest }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => hoverable && setHover(true)}
      onMouseLeave={() => hoverable && setHover(false)}
      style={{
        background: hoverable && hover ? colors.bgCardHover : colors.bgCard,
        border: `1px solid ${hover ? colors.borderStrong : colors.border}`,
        // TCB-P3 followup: softened from `radius.none` (0px) back to
        // `radius.lg` (16px) to match the StartSessionForm container
        // edge (StartSessionForm.jsx line 599). The pure-binary
        // rectangle read as too sharp at the page-level card scale —
        // the 16px curve gives the card the same "soft framed tile"
        // character as the start-session form, and the structural
        // brutalist signal is now carried by the 1px `colors.border`
        // stroke + the hard-offset `shadow.lift` on hoverable cards
        // (when present) instead of a hard 0px rectangle. Consumers
        // that want a non-zero radius override via the `style` prop —
        // see ThemeSwatchCard in SettingsPage for the swatch-card case.
        borderRadius: `${radius.lg}px`,
        // Per §6.3: base Card primitive stays flat. `shadow.lift` is
        // reserved for the "interactive/command card" sub-treatment and
        // is layered on per-consumer (NavigationCard) rather than baked
        // into the primitive — see §3.2.
        boxShadow: shadow.flat,
        padding: "20px",
        transition: `background ${motion.hover}, border-color ${motion.hover}, transform ${motion.hover}, box-shadow ${motion.hover}`,
        transform: hoverable && hover ? "translateY(-1px)" : "translateY(0)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

const CHIP_TONES = {
  neutral: { color: colors.inkDim, bg: "rgba(241,240,236,0.08)" },
  lilac: { color: colors.accentLilac, bg: colors.accentLilacDim },
  pink: { color: colors.accentPink, bg: colors.accentPinkDim },
  blue: { color: colors.accentBlue, bg: colors.accentBlueDim },
  green: { color: colors.accentGreen, bg: colors.accentGreenDim },
  yellow: { color: colors.accentYellow, bg: colors.accentYellowDim },
  success: { color: colors.success, bg: "rgba(123,215,167,0.13)" },
  warning: { color: colors.warning, bg: "rgba(235,203,115,0.13)" },
  danger: { color: colors.danger, bg: "rgba(240,127,131,0.13)" },
  info: { color: colors.info, bg: "rgba(140,196,232,0.13)" },
};

export function Chip({ children, tone = "neutral", icon, style, ...rest }) {
  const t = CHIP_TONES[tone] ?? CHIP_TONES.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 8px",
        // Per §6.4: Chip is a `<span>`-scale element, not a structural
        // panel — sanctioned `radius.tight` (4px) exception to the
        // binary system. Was `radius.sm` (8px).
        borderRadius: `${radius.tight}px`,
        background: t.bg,
        color: t.color,
        fontFamily: fonts.body,
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        userSelect: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

export function Squiggle({ width = 120, style }) {
  return <div aria-hidden="true" style={{ width, height: 1, background: colors.border, ...style }} />;
}

export function Spinner({ size = 20, style }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        // "Round object" per §5.8's vocabulary — stays a literal 50%
        // (functionally equivalent to radius.full on a square element).
        // Not a violation, not a migration target.
        borderRadius: "50%",
        border: `2px solid ${colors.border}`,
        borderTopColor: colors.brand,
        animation: "cgo-spin 0.7s linear infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function EmptyState({ icon: Icon = Inbox, message, subtext, actionLabel, onAction, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "44px 20px", gap: "12px", ...style }}>
      <div style={{ width: 48, height: 48, borderRadius: `${radius.tight}px`, display: "flex", alignItems: "center", justifyContent: "center", background: colors.bgElevated, border: `1px solid ${colors.border}`, color: colors.inkDim }}>
        <Icon size={21} strokeWidth={1.6} />
      </div>
      <div style={{ fontFamily: fonts.display, fontWeight: 650, fontSize: "15px", color: colors.ink }}>{message}</div>
      {subtext && <div style={{ fontFamily: fonts.body, fontWeight: 500, fontSize: "12px", color: colors.inkFaint, maxWidth: "340px", lineHeight: 1.55 }}>{subtext}</div>}
      {actionLabel && onAction && <Button variant="secondary" onClick={onAction} style={{ marginTop: "4px" }}>{actionLabel}</Button>}
    </div>
  );
}
