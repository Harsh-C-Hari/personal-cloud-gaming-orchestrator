import { forwardRef, useState } from "react";
import { Inbox } from "lucide-react";
import { colors, fonts, radius, motion } from "../../dashboard/theme.js";

const BUTTON_VARIANTS = {
  primary: { background: colors.brand, color: colors.bg, border: "1px solid transparent" },
  secondary: { background: colors.bgElevated, color: colors.ink, border: `1px solid ${colors.borderStrong}` },
  ghost: { background: "transparent", color: colors.inkDim, border: "1px solid transparent" },
  danger: { background: "transparent", color: colors.danger, border: `1px solid ${colors.danger}` },
  dangerFilled: { background: colors.danger, color: colors.bg, border: "1px solid transparent" },
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
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "translateY(1px)"; }}
      onMouseUp={(e) => { if (!disabled) e.currentTarget.style.transform = "translateY(0)"; }}
      onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) e.currentTarget.style.transform = "translateY(1px)"; }}
      onKeyUp={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) e.currentTarget.style.transform = "translateY(0)"; }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "40px",
        padding: "10px 15px",
        borderRadius: `${radius.sm}px`,
        fontFamily: fonts.body,
        fontSize: "13px",
        fontWeight: 650,
        lineHeight: 1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: `filter ${motion.base}, background ${motion.base}, transform ${motion.fast}, border-color ${motion.base}`,
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
        borderRadius: `${radius.lg}px`,
        padding: "20px",
        transition: `background ${motion.base}, border-color ${motion.base}, transform ${motion.base}`,
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
        borderRadius: `${radius.sm}px`,
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
      <div style={{ width: 48, height: 48, borderRadius: `${radius.md}px`, display: "flex", alignItems: "center", justifyContent: "center", background: colors.bgElevated, border: `1px solid ${colors.border}`, color: colors.inkDim }}>
        <Icon size={21} strokeWidth={1.6} />
      </div>
      <div style={{ fontFamily: fonts.display, fontWeight: 650, fontSize: "15px", color: colors.ink }}>{message}</div>
      {subtext && <div style={{ fontFamily: fonts.body, fontWeight: 500, fontSize: "12px", color: colors.inkFaint, maxWidth: "340px", lineHeight: 1.55 }}>{subtext}</div>}
      {actionLabel && onAction && <Button variant="secondary" onClick={onAction} style={{ marginTop: "4px" }}>{actionLabel}</Button>}
    </div>
  );
}
